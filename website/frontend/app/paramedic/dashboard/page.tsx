'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'
import {
    Siren, HeartPulse, Activity, Navigation, Radio, Wifi,
    BatteryCharging, Volume2, VolumeX, MapPin, Phone, Clock,
    User, Thermometer, Droplets, AlertTriangle, CheckCircle,
    ArrowRight, ChevronRight, Shield, Bell, X
} from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import { useDemoMode } from '@/lib/demo-context'

// Dynamic Leaflet imports
const DynamicMap = dynamic(
    async () => {
        const L = await import('leaflet')
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        })
        const { MapContainer } = await import('react-leaflet')
        return ({ center, zoom, children, ...props }: any) => (
            <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} {...props}>
                {children}
            </MapContainer>
        )
    },
    { ssr: false, loading: () => <div className="h-full w-full bg-slate-900 animate-pulse rounded-2xl" /> }
)

const DynamicTileLayer = dynamic(async () => (await import('react-leaflet')).TileLayer, { ssr: false })
const DynamicCircleMarker = dynamic(async () => (await import('react-leaflet')).CircleMarker, { ssr: false })
const DynamicPopup = dynamic(async () => (await import('react-leaflet')).Popup, { ssr: false })

/* ─── MOCK DATA ─── */
const recentPatients = [
    { id: 'P-1042', name: 'Ramesh Kumar', age: 72, condition: 'Type 2 Diabetes', village: 'Hanamkonda', lat: 17.9689, lng: 79.5941, lastVitals: { hr: 78, spo2: 96, temp: 36.8 }, status: 'stable', time: '2 hrs ago' },
    { id: 'P-0891', name: 'Savitri Devi', age: 68, condition: 'Hypertension', village: 'Kazipet', lat: 17.9820, lng: 79.5250, lastVitals: { hr: 112, spo2: 89, temp: 37.8 }, status: 'critical', time: '4 hrs ago' },
    { id: 'P-0763', name: 'Abdul Rashid', age: 75, condition: 'COPD', village: 'Waddepally', lat: 17.9997, lng: 79.5417, lastVitals: { hr: 92, spo2: 91, temp: 37.3 }, status: 'warning', time: '6 hrs ago' },
    { id: 'P-0654', name: 'Lakshmi Bai', age: 70, condition: 'Cardiac Arrhythmia', village: 'Subedari', lat: 17.9790, lng: 79.5387, lastVitals: { hr: 65, spo2: 97, temp: 36.5 }, status: 'stable', time: '8 hrs ago' },
    { id: 'P-0512', name: 'Venkat Rao', age: 80, condition: 'Post-Stroke', village: 'Bhimaram', lat: 18.0128, lng: 79.5558, lastVitals: { hr: 74, spo2: 95, temp: 36.9 }, status: 'stable', time: '12 hrs ago' },
]

const statusColors: Record<string, string> = {
    stable: 'text-emerald-400 bg-emerald-400/10',
    warning: 'text-amber-400 bg-amber-400/10',
    critical: 'text-red-400 bg-red-400/10',
}
const markerColors: Record<string, string> = {
    stable: '#34d399',
    warning: '#fbbf24',
    critical: '#f87171',
}

export default function ParamedicDashboard() {
    const [status, setStatus] = useState<'STANDBY' | 'DISPATCHED'>('STANDBY')
    const [patientData, setPatientData] = useState<any>(null)
    const [liveHr, setLiveHr] = useState<number[]>([])
    const [liveSpo2, setLiveSpo2] = useState<number[]>([])
    const [isMuted, setIsMuted] = useState(false)
    const [alerts, setAlerts] = useState<{ id: string; patient: string; type: string; value: string; time: string; dismissed: boolean }[]>([])
    const [livePatients, setLivePatients] = useState<any[]>([])
    const { isDemoMode } = useDemoMode()
    const streamInterval = useRef<NodeJS.Timeout | null>(null)
    const vitalsInterval = useRef<NodeJS.Timeout | null>(null)
    const audioCtxRef = useRef<AudioContext | null>(null)
    const [currentTime, setCurrentTime] = useState(new Date())
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    // Poll Patients
    useEffect(() => {
        const fetchPatients = async () => {
            if (isDemoMode) {
                setLivePatients(recentPatients)
                return
            }

            try {
                const res = await fetch('/api/local-db?table=patients')
                const { data } = await res.json()
                if (data) {
                    const mapped = data.map((p: any) => ({
                        ...p,
                        lat: p.lat || 17.9689,
                        lng: p.lng || 79.5941,
                        lastVitals: p.lastVitals || { hr: 0, spo2: 0, temp: 0 },
                        time: 'Just now'
                    }))
                    setLivePatients(mapped)
                }
            } catch (err) {
                console.error('Fetch Patients Error:', err)
            }
        }

        fetchPatients()
        const interval = setInterval(fetchPatients, 10000) // 10s Poll
        return () => clearInterval(interval)
    }, [isDemoMode])

    const handleDispatch = useCallback((data: any) => {
        setPatientData(data)
        setStatus('DISPATCHED')
        
        if (streamInterval.current) clearInterval(streamInterval.current)
        const baseHr = data.hr || 80
        const baseSpo2 = data.spo2 || 95
        
        streamInterval.current = setInterval(() => {
            setLiveHr(prev => [...prev.slice(-20), baseHr + Math.floor(Math.random() * 10 - 5)])
            setLiveSpo2(prev => [...prev.slice(-20), Math.min(100, baseSpo2 + Math.floor(Math.random() * 4 - 2))])
        }, 1000)
    }, [])

    const triggerAlerts = useCallback((patientName: string) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🚨 AMBULANCE DISPATCHED', {
                body: `Emergency call for ${patientName}. Proceed immediately.`,
                icon: '/vitalink-logo.svg', tag: 'dispatch', requireInteraction: true
            })
        }
        if ('vibrate' in navigator) navigator.vibrate([1000, 500, 1000, 500, 1000])
        
        if (!isMuted) {
            if (!audioCtxRef.current) {
                audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
            }
            const ctx = audioCtxRef.current
            
            const playSiren = () => {
                if (ctx.state === 'suspended') ctx.resume()
                const osc = ctx.createOscillator()
                const gain = ctx.createGain()
                osc.connect(gain); gain.connect(ctx.destination)
                osc.type = 'square'
                osc.frequency.setValueAtTime(440, ctx.currentTime)
                osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.5)
                gain.gain.setValueAtTime(0.1, ctx.currentTime)
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
                osc.start(); osc.stop(ctx.currentTime + 0.5)
            }
            
            playSiren()
            const interval = setInterval(playSiren, 1000)
            setTimeout(() => clearInterval(interval), 5000)
        }
    }, [isMuted])

    // Poll Local DB for Patients
    const pollLocalDb = useCallback(async () => {
        try {
            const res = await fetch('/api/local-db?table=patients')
            if (res.ok) {
                const { data } = await res.json()
                if (data && data.length > 0) {
                    setLivePatients(data)
                }
            }
        } catch (err) {
            console.error("Local DB Poll Error:", err)
        }
    }, [])

    useEffect(() => {
        pollLocalDb()
        const pollId = setInterval(pollLocalDb, 5000)
        return () => clearInterval(pollId)
    }, [pollLocalDb])

    // Listeners for Emergency Triggers (from Demo Mode)
    useEffect(() => {
        const handleEmergencyEvent = (e: any) => {
            const { patientName, type, value, patientId, lat, lng, hr, spo2 } = e.detail || e
            
            // Add to alert log
            setAlerts(prev => [{
                id: `${patientId}-${Date.now()}`,
                patient: patientName,
                type: type || 'Emergency',
                value: value || 'SOS',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                dismissed: false,
            }, ...prev].slice(0, 10))

            // Auto-dispatch if it's a critical SOS
            if (type === 'Cardiac SOS' || type === 'Fall Detected') {
                handleDispatch({
                    deviceId: patientId,
                    patientName,
                    lat: lat || 17.9689,
                    lng: lng || 79.5941,
                    hr: hr || 120,
                    spo2: spo2 || 88,
                    village: 'Sector 7'
                })
                triggerAlerts(patientName)
            }
        }

        const bc = new BroadcastChannel('ayulink-dispatch')
        bc.onmessage = (event) => handleEmergencyEvent(event.data)
        
        window.addEventListener('ayulink-emergency-triggered', handleEmergencyEvent)

        return () => {
            bc.close()
            window.removeEventListener('ayulink-emergency-triggered', handleEmergencyEvent)
        }
    }, [handleDispatch, triggerAlerts])

    // Cleanup
    useEffect(() => {
        return () => {
            if (streamInterval.current) clearInterval(streamInterval.current)
            if (audioCtxRef.current) audioCtxRef.current.close()
        }
    }, [])

    const dismissAlert = (id: string) => {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, dismissed: true } : a))
    }

    const activeAlerts = alerts.filter(a => !a.dismissed)
    const criticalCount = livePatients.filter(p => p.status === 'critical').length
    const warningCount = livePatients.filter(p => p.status === 'warning').length

    /* ═══════════ STANDBY VIEW ═══════════ */
    if (status === 'STANDBY') {
        return (
            <div className="min-h-screen bg-[#0a0e17] text-white">
                {/* High-Tech Command Center Header */}
                <header className="px-6 py-4 border-b border-white/[0.06] bg-slate-900/40 backdrop-blur-md flex items-center justify-between sticky top-0 z-50">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-rose-600 flex items-center justify-center shadow-xl shadow-red-500/20 group cursor-pointer overflow-hidden">
                                <Siren className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
                                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#0a0e17] rounded-full" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent italic">
                                AYULINK <span className="text-red-500">MISSION CONTROL</span>
                            </h1>
                            <div className="flex items-center gap-2">
                                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">WARANGAL SECTOR-7 • LIVESTREAM ACTIVE</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-8">
                        <div className="hidden md:flex flex-col items-end">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Network Latency</p>
                            <p className="text-sm font-mono font-bold text-teal-400">0.24ms <span className="text-[10px] text-slate-600">LoRa</span></p>
                        </div>
                        <div className="text-right border-l border-white/10 pl-8">
                            <p className="text-3xl font-black font-mono text-white tracking-tighter tabular-nums drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                                {isMounted ? currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : '--:--:--'}
                            </p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{isMounted ? currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' }) : 'Loading...'}</p>
                        </div>
                    </div>
                </header>

                {/* Abnormal Alerts Banner */}
                {activeAlerts.length > 0 && (
                    <div className="px-6 pt-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-bold text-red-400 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" /> Emergency Alerts ({activeAlerts.length})
                            </h3>
                            <button
                                onClick={() => setAlerts(prev => prev.map(a => ({ ...a, dismissed: true })))}
                                className="text-[10px] font-bold bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded text-slate-400 hover:text-white transition-colors uppercase tracking-wider"
                            >
                                Clear All
                            </button>
                        </div>
                        <div className="space-y-2">
                            {activeAlerts.slice(0, 3).map(a => (
                                <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-red-500/8 border border-red-500/15 animate-pulse">
                                    <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-red-400">{a.type}: <span className="text-white">{a.value}</span></p>
                                        <p className="text-xs text-slate-500">{a.patient} • {a.time}</p>
                                    </div>
                                    <button onClick={() => dismissAlert(a.id)} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                                        <X className="h-3.5 w-3.5 text-slate-500" />
                                    </button>
                                </div>
                            ))}
                            {activeAlerts.length > 3 && (
                                <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest pt-1">
                                    + {activeAlerts.length - 3} more alerts
                                </p>
                            )}
                        </div>
                    </div>
                )}

                <div className="max-w-7xl mx-auto p-6">
                    {/* Status Cards */}
                    <div className="grid grid-cols-5 gap-4 mb-6">
                        {[
                            { icon: Shield, label: 'Status', value: 'Standby', color: 'text-emerald-400', bg: 'bg-emerald-500/8' },
                            { icon: Radio, label: 'LoRa Mesh', value: 'Connected', color: 'text-blue-400', bg: 'bg-blue-500/8' },
                            { icon: MapPin, label: 'Coverage', value: '8.2 km', color: 'text-purple-400', bg: 'bg-purple-500/8' },
                            { icon: Activity, label: 'Patients', value: `${livePatients.length} Active`, color: 'text-amber-400', bg: 'bg-amber-500/8' },
                            { icon: AlertTriangle, label: 'Alerts', value: criticalCount > 0 ? `${criticalCount} Critical` : warningCount > 0 ? `${warningCount} Warning` : 'All Clear', color: criticalCount > 0 ? 'text-red-400' : warningCount > 0 ? 'text-amber-400' : 'text-emerald-400', bg: criticalCount > 0 ? 'bg-red-500/8' : warningCount > 0 ? 'bg-amber-500/8' : 'bg-emerald-500/8' },
                        ].map((c, i) => (
                            <div key={i} className={`p-4 rounded-2xl ${c.bg} border border-white/[0.06]`}>
                                <c.icon className={`h-5 w-5 ${c.color} mb-2`} />
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">{c.label}</p>
                                <p className={`text-lg font-black ${c.color}`}>{c.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Main Content: Map + Patient List */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Live Location Map */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-teal-400" /> Live Patient Locations
                                </h2>
                                <div className="flex items-center gap-3 text-[10px] font-bold uppercase">
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Stable</span>
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> Warning</span>
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" /> Critical</span>
                                </div>
                            </div>
                            <div className="h-[420px] rounded-2xl overflow-hidden border border-white/[0.06]">
                                <DynamicMap center={[17.9689, 79.5941]} zoom={11}>
                                    <DynamicTileLayer
                                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                        attribution='&copy; OpenStreetMap'
                                    />
                                    {livePatients.map((p, i) => (
                                        <DynamicCircleMarker
                                            key={p.id}
                                            center={[p.lat, p.lng]}
                                            radius={p.status === 'critical' ? 12 : p.status === 'warning' ? 9 : 7}
                                            fillColor={markerColors[p.status]}
                                            color={markerColors[p.status]}
                                            fillOpacity={0.7}
                                            weight={2}
                                        >
                                            <DynamicPopup>
                                                <div className="text-slate-900 min-w-[160px]">
                                                    <p className="font-bold text-sm">{p.name}</p>
                                                    <p className="text-xs text-slate-500">{p.age} yrs • {p.condition || 'General'}</p>
                                                    <div className="mt-2 flex gap-3 text-xs">
                                                        <span className="font-bold">HR: {p.lastVitals?.hr || '--'}</span>
                                                        <span className="font-bold">SpO2: {p.lastVitals?.spo2 || '--'}%</span>
                                                        <span className="font-bold">{p.lastVitals?.temp || '--'}°C</span>
                                                    </div>
                                                </div>
                                            </DynamicPopup>
                                        </DynamicCircleMarker>
                                    ))}
                                </DynamicMap>
                            </div>
                        </div>

                        {/* Recent Patients List */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-lg font-bold text-white">Recent Patients</h2>
                                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{livePatients.length} monitored</span>
                            </div>
                            <div className="space-y-2.5">
                                {livePatients.map((p) => (
                                    <div key={p.id} className={`group p-4 rounded-2xl bg-white/[0.02] border transition-all flex items-center gap-4 ${p.status === 'critical' ? 'border-red-500/20 bg-red-500/[0.03]' : 'border-white/[0.06] hover:border-white/10'}`}>
                                        {/* Avatar */}
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-base font-black shrink-0 ${p.status === 'critical' ? 'bg-red-500/15 text-red-400' : 'bg-slate-800 text-slate-500'}`}>
                                            {p.name.charAt(0)}
                                        </div>
                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h3 className="text-sm font-bold text-white truncate">{p.name}</h3>
                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${statusColors[p.status]}`}>{p.status}</span>
                                            </div>
                                            <p className="text-[11px] text-slate-500">{p.age} yrs • {p.condition} • {p.village}</p>
                                        </div>
                                        {/* Live Vitals */}
                                        <div className="hidden md:flex items-center gap-4 shrink-0">
                                            <div className="text-center">
                                                <p className={`text-sm font-black ${(p.lastVitals?.hr || 0) > 100 || (p.lastVitals?.hr || 0) < 55 ? 'text-red-400' : 'text-emerald-400'}`}>{p.lastVitals?.hr || '--'}</p>
                                                <p className="text-[8px] text-slate-600 font-bold uppercase">BPM</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-black text-amber-400">{p.lastVitals?.spo2 || '--'}%</p>
                                                <p className="text-[8px] text-slate-600 font-bold uppercase">SpO2</p>
                                            </div>
                                            <div className="text-center">
                                                <p className={`text-sm font-black ${(p.lastVitals?.temp || 0) > 37.5 ? 'text-red-400' : 'text-amber-400'}`}>{p.lastVitals?.temp || '--'}°</p>
                                                <p className="text-[8px] text-slate-600 font-bold uppercase">Temp</p>
                                            </div>
                                        </div>
                                        {/* Meta */}
                                        <div className="text-right shrink-0">
                                            <p className="text-[10px] text-slate-500">{p.time}</p>
                                            <p className="text-[9px] text-slate-600 font-mono">{p.id}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Listening Banner */}
                    <div className="mt-6 p-5 rounded-2xl bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-white/[0.06] flex items-center gap-5">
                        <div className="relative">
                            <div className="w-14 h-14 rounded-full border-2 border-emerald-500/30 flex items-center justify-center">
                                <Radio className="h-6 w-6 text-emerald-400 animate-pulse" />
                            </div>
                            <div className="absolute inset-0 border-2 border-emerald-500/10 rounded-full animate-ping" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white">Listening for Emergency Dispatch</p>
                            <p className="text-xs text-slate-500">LoRa mesh connected • Real-time SOS monitoring active • Abnormal vitals auto-alert ON</p>
                        </div>
                        <div className="ml-auto flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><Wifi className="h-3 w-3 text-emerald-400" /> Mesh Active</span>
                            <span className="flex items-center gap-1"><BatteryCharging className="h-3 w-3 text-emerald-400" /> 98%</span>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    /* ═══════════ DISPATCHED VIEW ═══════════ */
    return (
        <div className="min-h-screen bg-[#0a0e17] text-white flex flex-col">
            {/* Emergency Header */}
            <header className="bg-red-600 px-6 py-3 flex items-center justify-between shadow-lg shadow-red-900/50 z-50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-full animate-bounce">
                        <Siren className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="font-black text-lg leading-none">PRIORITY 1 DISPATCH</h1>
                        <p className="text-red-200 text-xs font-mono">INCIDENT #SOS-{Math.floor(Math.random() * 1000)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsMuted(!isMuted)} className="p-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors">
                        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </button>
                    <p className="font-bold text-2xl font-mono">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
            </header>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-1 p-1">
                {/* Map */}
                <div className="relative h-[400px] md:h-auto bg-slate-900 rounded-lg overflow-hidden border border-slate-800">
                    <DynamicMap center={[patientData.lat, patientData.lng]} zoom={16}>
                        <DynamicTileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; OpenStreetMap' />
                    </DynamicMap>
                    <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur border border-slate-700 p-4 rounded-xl z-[1000]">
                        <div className="flex justify-between items-center mb-3">
                            <div>
                                <p className="text-slate-400 text-xs uppercase font-bold">Target Location</p>
                                <p className="text-white font-mono text-sm">{patientData.lat.toFixed(5)}, {patientData.lng.toFixed(5)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-slate-400 text-xs uppercase font-bold">ETA</p>
                                <p className="text-green-400 font-bold text-xl">8 MIN</p>
                            </div>
                        </div>
                        <button
                            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${patientData.lat},${patientData.lng}`, '_blank')}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                        >
                            <Navigation className="h-5 w-5" /> START NAVIGATION
                        </button>
                    </div>
                </div>

                {/* Vitals */}
                <div className="flex flex-col gap-1">
                    <div className="bg-slate-900 p-5 rounded-lg border border-slate-800 flex items-center gap-4">
                        <div className="h-14 w-14 bg-red-500/10 rounded-xl flex items-center justify-center font-bold text-2xl text-red-400 border border-red-500/20">
                            {patientData.patientName?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold">{patientData.patientName}</h2>
                            <p className="text-slate-400 text-sm">72 yrs • Type 2 Diabetes • {patientData.village || 'Unknown Village'}</p>
                        </div>
                        <span className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-400 uppercase">Critical</span>
                    </div>

                    <div className="flex-1 bg-black p-5 rounded-lg border border-slate-800 flex flex-col justify-center gap-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <HeartPulse className="h-8 w-8 text-green-500 animate-pulse" />
                                <div>
                                    <p className="text-green-500/60 text-xs font-bold uppercase">Heart Rate</p>
                                    <p className="text-green-500 text-5xl font-black font-mono leading-none">{liveHr.length > 0 ? liveHr[liveHr.length - 1] : '--'}</p>
                                </div>
                            </div>
                            <div className="h-16 w-32 flex items-end gap-1">
                                {liveHr.map((h, i) => (<div key={i} style={{ height: `${(h / 150) * 100}%` }} className="w-1 bg-green-500/50 rounded-t" />))}
                            </div>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-800 pt-5">
                            <div className="flex items-center gap-3">
                                <Activity className="h-7 w-7 text-yellow-500" />
                                <div>
                                    <p className="text-yellow-500/60 text-xs font-bold uppercase">Patient Motion (MPU6050)</p>
                                    <p className="text-yellow-500 text-2xl font-black font-mono">STABLE / MOVING</p>
                                </div>
                            </div>
                            <span className="text-emerald-400 text-xs font-bold px-2 py-1 bg-emerald-400/10 rounded">LIVE</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-800 pt-5">
                            <div className="flex items-center gap-3">
                                <Droplets className="h-8 w-8 text-blue-500" />
                                <div>
                                    <p className="text-blue-500/60 text-xs font-bold uppercase">SpO2 %</p>
                                    <p className="text-blue-500 text-5xl font-black font-mono leading-none">{liveSpo2.length > 0 ? liveSpo2[liveSpo2.length - 1] : '--'}</p>
                                </div>
                            </div>
                            <div className="h-16 w-32 flex items-end gap-1">
                                {liveSpo2.map((s, i) => (<div key={i} style={{ height: `${(s / 100) * 100}%` }} className="w-1 bg-blue-500/50 rounded-t" />))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 grid grid-cols-2 gap-3">
                        <button className="bg-emerald-600 hover:bg-emerald-500 py-4 rounded-lg font-bold text-white uppercase tracking-wider transition-colors">Arrived at Scene</button>
                        <button className="bg-slate-800 hover:bg-slate-700 py-4 rounded-lg font-bold text-white uppercase tracking-wider transition-colors">Call Hospital</button>
                    </div>
                </div>
            </div>
        </div>
    )
}
