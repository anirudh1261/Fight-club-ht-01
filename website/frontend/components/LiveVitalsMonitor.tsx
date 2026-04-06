'use client'

import { useState, useEffect } from 'react'
import { Activity, Heart, Thermometer, Droplets, Users, AlertTriangle, TrendingUp, Wifi } from 'lucide-react'
import { useDemoMode } from '@/lib/demo-context'
import { generateDemoPatients } from '@/lib/demo-data'

interface LiveVital {
    patientId: string
    patientName: string
    village: string
    hr: number
    spo2: number
    temp: number
    status: 'normal' | 'warning' | 'critical'
    lastUpdate: number
}

export default function LiveVitalsMonitor() {
    const { isDemoMode } = useDemoMode()
    const [vitals, setVitals] = useState<LiveVital[]>([])
    const [lastRefresh, setLastRefresh] = useState(Date.now())

    // Initialize from the SINGLE canonical demo data source
    useEffect(() => {
        if (isDemoMode) {
            const demoPatients = generateDemoPatients()
            // Pick the first 4 patients for the live monitor widget
            const initialVitals: LiveVital[] = demoPatients.slice(0, 4).map((p: any) => ({
                patientId: p.id,
                patientName: p.name,
                village: p.village,
                hr: p.hr,
                spo2: p.spo2,
                temp: 36.5 + Math.random() * 1.0,
                status: (p.hr > 100 || p.spo2 < 90) ? 'critical' : (p.hr > 90 || p.spo2 < 94) ? 'warning' : 'normal',
                lastUpdate: Date.now()
            }))
            setVitals(initialVitals)
        } else {
            setVitals([])
        }
    }, [isDemoMode])

    // Simulate real-time fluctuations
    useEffect(() => {
        if (vitals.length === 0) return
        const interval = setInterval(() => {
            setVitals(prev => prev.map(v => ({
                ...v,
                hr: Math.max(50, Math.min(130, v.hr + Math.floor(Math.random() * 5) - 2)),
                spo2: Math.min(100, Math.max(88, v.spo2 + Math.floor(Math.random() * 3) - 1)),
                temp: Math.round((v.temp + (Math.random() * 0.2 - 0.1)) * 10) / 10,
                lastUpdate: Date.now()
            })))
            setLastRefresh(Date.now())
        }, 3000)
        return () => clearInterval(interval)
    }, [vitals.length])

    const statusColors = {
        normal: 'bg-emerald-500',
        warning: 'bg-amber-500',
        critical: 'bg-red-500 animate-pulse'
    }

    const getHRStatus = (hr: number) => hr > 100 || hr < 55 ? 'critical' : hr > 90 || hr < 60 ? 'warning' : 'normal'
    const getSpo2Status = (spo2: number) => spo2 < 90 ? 'critical' : spo2 < 94 ? 'warning' : 'normal'

    if (vitals.length === 0) {
        return (
            <div className="card p-5">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 relative">
                        <Activity className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Live Vitals Monitor</h2>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No devices connected</p>
                    </div>
                </div>
                <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
                    Enable Simulation Mode to view live vitals
                </p>
            </div>
        )
    }

    return (
        <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 relative">
                        <Activity className="h-5 w-5 text-white" />
                        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
                    </div>
                    <div>
                        <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Live Vitals Monitor</h2>
                        <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                            <Wifi className="h-3 w-3 text-emerald-500" />
                            Real-time LoRa data
                        </p>
                    </div>
                </div>
                <div className="text-xs px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    {vitals.length} patients connected
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="text-xs uppercase" style={{ color: 'var(--text-muted)' }}>
                            <th className="text-left py-2 font-semibold">Patient</th>
                            <th className="text-center py-2 font-semibold">
                                <div className="flex items-center justify-center gap-1">
                                    <Heart className="h-3 w-3 text-red-500" /> HR
                                </div>
                            </th>
                            <th className="text-center py-2 font-semibold">
                                <div className="flex items-center justify-center gap-1">
                                    <Droplets className="h-3 w-3 text-blue-500" /> SpO2
                                </div>
                            </th>
                            <th className="text-center py-2 font-semibold">
                                <div className="flex items-center justify-center gap-1">
                                    <Heart className="h-3 w-3 text-emerald-500" /> BP
                                </div>
                            </th>
                            <th className="text-center py-2 font-semibold">
                                <div className="flex items-center justify-center gap-1">
                                    <Thermometer className="h-3 w-3 text-orange-500" /> Temp
                                </div>
                            </th>
                            <th className="text-center py-2 font-semibold">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vitals.map((vital) => {
                            const hrStatus = getHRStatus(vital.hr)
                            const spo2Status = getSpo2Status(vital.spo2)
                            const overallStatus = hrStatus === 'critical' || spo2Status === 'critical' ? 'critical' :
                                hrStatus === 'warning' || spo2Status === 'warning' ? 'warning' : 'normal'

                            return (
                                <tr key={vital.patientId} className="border-t transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50" style={{ borderColor: 'var(--border-color)' }}>
                                    <td className="py-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`h-2 w-2 rounded-full ${statusColors[overallStatus]}`} />
                                            <div>
                                                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{vital.patientName}</p>
                                                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{vital.village}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 text-center">
                                        <span className={`text-lg font-bold ${hrStatus === 'critical' ? 'text-red-500' :
                                            hrStatus === 'warning' ? 'text-amber-500' : ''
                                            }`} style={{ color: hrStatus === 'normal' ? 'var(--text-primary)' : undefined }}>
                                            {vital.hr}
                                        </span>
                                        <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>bpm</span>
                                    </td>
                                    <td className="py-3 text-center">
                                        <span className={`text-lg font-bold ${spo2Status === 'critical' ? 'text-red-500' :
                                            spo2Status === 'warning' ? 'text-amber-500' : ''
                                            }`} style={{ color: spo2Status === 'normal' ? 'var(--text-primary)' : undefined }}>
                                            {vital.spo2}%
                                        </span>
                                    </td>
                                    <td className="py-3 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">Coming Soon</span>
                                        </div>
                                    </td>
                                    <td className="py-3 text-center">
                                        <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{vital.temp}°</span>
                                    </td>
                                    <td className="py-3 text-center">
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${overallStatus === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                            overallStatus === 'warning' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                            }`}>
                                            {overallStatus}
                                        </span>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
                <span>Last update: Just now</span>
                <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Refreshing every 3s
                </span>
            </div>
        </div>
    )
}
