"use client"

import { useEffect, useRef } from 'react'
import { useDemoMode } from '@/lib/demo-context'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { 
    Activity, Shield, Zap, AlertTriangle, User, 
    Clock, MapPin, CheckCircle, Heart, Siren,
    ArrowRight, Radio, Signal
} from 'lucide-react'
import { generateDemoPatients } from '@/lib/demo-data'


export default function DemoSimulator() {
    const { isDemoMode } = useDemoMode()
    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const moveIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const [demoState, setDemoState] = useState<{ active: boolean, lat: number, lng: number } | null>(null)

    useEffect(() => {
        if (!isDemoMode) {
            if (intervalRef.current) clearInterval(intervalRef.current)
            
            // === CLEANUP: Remove all simulated records from local DB ===
            const cleanupDemoData = async () => {
                try {
                    // Fetch all patients and filter for simulated ones
                    const res = await fetch('/api/local-db?table=patients')
                    const { data } = await res.json()
                    if (data) {
                        const simPatients = data.filter((p: any) => 
                            p.id && (p.id.match(/^P-0[0-4]\d$/) || p.id === 'P-050')
                        )
                        for (const sp of simPatients) {
                            await fetch('/api/local-db', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ 
                                    table: 'patients', 
                                    action: 'delete', 
                                    eqCol: 'id', 
                                    eqVal: sp.id 
                                })
                            })
                        }
                        if (simPatients.length > 0) {
                            console.log(`[DemoCleanup] Purged ${simPatients.length} simulated patients`)
                        }
                    }
                } catch (err) {
                    console.error('[DemoCleanup] Error:', err)
                }
                // Clear demo cache from localStorage
                localStorage.removeItem('ayulink_demo_data_v3')
            }
            cleanupDemoData()
            return
        }

        const demoPatients = generateDemoPatients()

        const emitRandomVital = async () => {
            // First we need to get actual patients from our local DB, 
            // otherwise the vitals won't link to anyone real on the registry!
            const res = await fetch('/api/local-db?table=patients')
            const dbData = await res.json()
            const activePatients = dbData.data || []

            if (activePatients.length === 0) return

            const patient = activePatients[Math.floor(Math.random() * activePatients.length)]
            // REDUCED PROBABILITY: 5% Critical for Demo purposes
            const isCritical = Math.random() > 0.95

            // WEAR DETECTION LOGIC (90% chance worn)
            const isWorn = Math.random() > 0.1

            const hr = isWorn
                ? (isCritical ? 100 + Math.floor(Math.random() * 40) : 60 + Math.floor(Math.random() * 40))
                : 0

            const spo2 = isWorn
                ? (isCritical ? 85 + Math.floor(Math.random() * 5) : 94 + Math.floor(Math.random() * 6))
                : 0

            const temp = isWorn
                ? 36 + Math.random() * 1.5
                : 0

            const vitalRecord = {
                patient_id: patient.id,
                heart_rate: hr,
                spo2: spo2,
                temperature: parseFloat(temp.toFixed(1)),
                timestamp: new Date().toISOString()
            }

            // Persist the fake vital record to our database for history!
            if (isWorn) {
                fetch('/api/local-db', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        table: 'vitals',
                        action: 'insert',
                        data: vitalRecord
                    })
                })

                // BROADCAST TO HARDWARE GATEWAY via Commands channel
                fetch('/api/local-db', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        table: 'commands',
                        action: 'insert',
                        data: {
                            device_id: 'GATEWAY',
                            cmd: 'update_vitals',
                            hr,
                            oxy: spo2,
                            node: patient.name,
                            status: 'pending'
                        }
                    })
                })

                fetch('/api/local-db', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        table: 'patients',
                        action: 'update',
                        eqCol: 'id',
                        eqVal: patient.id,
                        data: {
                            status: isCritical ? 'critical' : 'normal'
                        }
                    })
                })
            }

            // Emit standard vital event to UI for immediate reactivity
            const event = new CustomEvent('vitals-update', {
                detail: {
                    deviceId: patient.id,
                    patientName: patient.name,
                    village: patient.village || 'Hanamkonda',
                    hr,
                    spo2,
                    temp: vitalRecord.temperature,
                    isWorn,
                    lat: patient.lat || 17.9719,
                    lng: patient.lng || 79.5864,
                    status: isWorn ? (isCritical ? 'critical' : 'normal') : 'offline',
                    isDemo: true
                }
            })
            window.dispatchEvent(event)

            // Emit emergency state UI trigger
            if (isCritical) {
                const emergencyEvent = new CustomEvent('ayulink-emergency-triggered', {
                    detail: {
                        type: 'Cardiac SOS',
                        active: true,
                        deviceId: patient.id,
                        patientName: patient.name,
                        hr: hr,
                        spo2: spo2,
                        lat: patient.village === 'Hanamkonda' ? 17.9719 : 17.96,
                        lng: patient.village === 'Hanamkonda' ? 79.5864 : 79.6,
                        history: [] 
                    }
                })
                window.dispatchEvent(emergencyEvent)
            }
        }

        // Listen for manual triggers from Settings Modal
        const handleJury = () => startJuryDemo()
        const handleSOS = () => {
            window.dispatchEvent(new CustomEvent('ayulink-emergency-triggered', {
                detail: {
                    type: 'Cardiac SOS',
                    active: true,
                    deviceId: 'DEMO-MANUAL',
                    patientName: 'Manual SOS Patient',
                    hr: 125,
                    spo2: 87,
                    lat: 17.9719,
                    lng: 79.5864,
                    history: Array.from({ length: 60 }).map((_, i) => ({
                        timestamp: Date.now() - (59 - i) * 1000,
                        lat: 17.9719 - 0.001 + (i * 0.00002),
                        lng: 79.5864 - 0.001 + (i * 0.00002),
                        hr: 110 + Math.floor(Math.random() * 20),
                        spo2: 88 + Math.floor(Math.random() * 5),
                        status: 'critical'
                    }))
                }
            }))
        }

        const syncAllDemosToHardware = async () => {
            const { generateDemoPatients } = await import('@/lib/demo-data')
            const demoPatients = generateDemoPatients()
            console.log(`[Simulator] Starting discovery burst for ${demoPatients.length} patients...`)
            
            // Staggered emission to prevent serial buffer issues
            demoPatients.forEach((patient, index) => {
                setTimeout(() => {
                    const hr = 70 + Math.floor(Math.random() * 15)
                    const spo2 = 95 + Math.floor(Math.random() * 5)
                    
                    // BROADCAST TO HARDWARE GATEWAY via Commands channel
                    fetch('/api/local-db', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            table: 'commands',
                            action: 'insert',
                            data: {
                                device_id: 'GATEWAY',
                                cmd: 'update_vitals',
                                hr,
                                oxy: spo2,
                                node: patient.name,
                                status: 'pending'
                            }
                        })
                    })

                    // Immediate UI update event
                    window.dispatchEvent(new CustomEvent('vitals-update', {
                        detail: {
                            deviceId: patient.id,
                            patientName: patient.name,
                            village: patient.village || 'Hanamkonda',
                            hr,
                            spo2,
                            temp: 36.5 + (Math.random() * 1.0),
                            isWorn: true,
                            lat: patient.lat,
                            lng: patient.lng,
                            status: 'normal',
                            isDemo: true
                        }
                    }))
                }, index * 50) 
            })
        }

        if (isDemoMode) {
            syncAllDemosToHardware()
            // Emit random vitals every 5 seconds for visual density
            intervalRef.current = setInterval(emitRandomVital, 5000)
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
            window.removeEventListener('trigger-jury-demo', handleJury)
            window.removeEventListener('trigger-manual-sos', handleSOS)
        }
    }, [isDemoMode])

    const startJuryDemo = () => {
        const startLat = 17.9719
        const startLng = 79.5864
        const patientName = "Demo Patient (Jury)"

        // 1. Initial SOS
        const emergencyEvent = new CustomEvent('ayulink-emergency-triggered', {
            detail: {
                type: 'Cardiac SOS',
                active: true,
                deviceId: 'DEMO-JURY-1',
                patientName: patientName,
                hr: 115,
                spo2: 89,
                lat: startLat,
                lng: startLng,
                history: Array.from({ length: 60 }).map((_, i) => ({
                    timestamp: Date.now() - (59 - i) * 1000,
                    lat: startLat - 0.002 + (i * 0.00005), // Simulated path approaching current location
                    lng: startLng - 0.002 + (i * 0.00005),
                    hr: 100 + Math.floor(Math.random() * 20),
                    spo2: 90 + Math.floor(Math.random() * 5),
                    status: 'critical'
                }))
            }
        })
        window.dispatchEvent(emergencyEvent)

        // 2. Start Movement Simulation
        let step = 0
        if (moveIntervalRef.current) clearInterval(moveIntervalRef.current)

        moveIntervalRef.current = setInterval(async () => {
            step++
            const nextLat = startLat + (step * 0.0002)
            const nextLng = startLng + (step * 0.00015)

            // Broadcast to Supabase & Local
            const update = {
                deviceId: 'DEMO-JURY-1',
                patientName,
                lat: nextLat,
                lng: nextLng,
                hr: 115 + Math.floor(Math.random() * 5),
                spo2: 89 + Math.floor(Math.random() * 2)
            }

            // Global Broadcast
            supabase.channel('ayulink_emergency').send({
                type: 'broadcast',
                event: 'location-update',
                payload: update
            })

            // Local Event
            window.dispatchEvent(new CustomEvent('location-update', { detail: update }))

            if (step > 50) {
                if (moveIntervalRef.current) clearInterval(moveIntervalRef.current)
            }
        }, 2000)
    }

    if (!isDemoMode) return null

    return (
        <div className="fixed bottom-6 right-6 z-[9999] group">
            {/* Pulsing Trigger Button */}
            <div className="relative">
                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20 group-hover:hidden" />
                <button className="w-16 h-16 rounded-full bg-gradient-to-tr from-slate-900 to-slate-800 border-2 border-white/10 flex items-center justify-center shadow-2xl hover:scale-110 transition-all hover:border-red-500/50">
                    <Activity className="h-7 w-7 text-red-500 animate-pulse" />
                </button>
            </div>

            {/* Hover Menu */}
            <div className="absolute bottom-20 right-0 w-72 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl opacity-0 translate-y-4 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300">
                <div className="flex items-center gap-3 mb-5 border-b border-white/5 pb-4">
                    <div className="p-2 bg-emerald-500/20 rounded-xl">
                        <Zap className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white italic">EXPO COMMAND</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Stage Manager</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {/* SOS Trigger */}
                    <button
                        onClick={startJuryDemo}
                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 text-white hover:brightness-110 transition-all font-black shadow-lg shadow-red-500/20"
                    >
                        <div className="flex items-center gap-3">
                            <Siren className="h-5 w-5 animate-bounce" />
                            <div className="text-left">
                                <p className="text-[9px] font-bold uppercase opacity-80">Phase 1</p>
                                <p className="text-sm">CARDIAC SOS</p>
                            </div>
                        </div>
                        <ArrowRight className="h-4 w-4" />
                    </button>

                    {/* Mesh Test */}
                    <button
                        onClick={() => {
                            window.dispatchEvent(new CustomEvent('vitals-update', {
                                detail: {
                                    deviceId: 'MB-001',
                                    patientName: 'Local Mesh Test',
                                    hr: 75,
                                    spo2: 98,
                                    temp: 36.6,
                                    isWorn: true,
                                    lat: 17.9719,
                                    lng: 79.5864,
                                    status: 'normal',
                                    isDemo: true
                                }
                            }))
                        }}
                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white transition-all border border-white/10"
                    >
                        <div className="flex items-center gap-3">
                            <Radio className="h-5 w-5 text-teal-400" />
                            <div className="text-left">
                                <p className="text-[9px] font-bold uppercase text-slate-500">Hardware</p>
                                <p className="text-sm">MESH PING</p>
                            </div>
                        </div>
                        <Signal className="h-4 w-4 text-teal-400" />
                    </button>

                    <div className="pt-4 border-t border-white/5">
                        <p className="text-[9px] text-center text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                            Simulates real-time LoRa alerts from wearable nodes.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
