'use client'

import { Heart, Droplets, Thermometer, Activity, Battery, Wifi, RefreshCw } from 'lucide-react'
import { useTheme } from '@/lib/theme-context'
import { useState, useEffect } from 'react'
import { useDemoMode } from '@/lib/demo-context'
import { supabase } from '@/lib/supabaseClient'
import RiskScoreCard from '@/components/RiskScoreCard'
import RiskTrendCard from '@/components/RiskTrendCard'

export default function VitalsPage() {
    const { t } = useTheme()
    const { isDemoMode } = useDemoMode()
    const [filter, setFilter] = useState('all')
    const [lastUpdated, setLastUpdated] = useState(0)
    const [vitals, setVitals] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Initialize Data — pull from the SINGLE canonical demo data source
    useEffect(() => {
        if (isDemoMode) {
            const { generateDemoPatients } = require('@/lib/demo-data')
            const demoPatients = generateDemoPatients()
            // Show the first 6 patients as vitals cards (or all if fewer)
            const demoVitals = demoPatients.slice(0, 6).map((p: any) => ({
                id: p.id,
                patient: p.name,
                age: p.age,
                hr: p.hr,
                spo2: p.spo2,
                temp: parseFloat((36.2 + Math.random() * 1.3).toFixed(1)),
                battery: 60 + Math.floor(Math.random() * 40),
                status: (p.hr > 100 || p.spo2 < 90) ? 'critical' : (p.hr > 90 || p.spo2 < 94) ? 'warning' : 'normal',
                village: p.village,
                lastSync: 'Just now'
            }))
            setVitals(demoVitals)
            setLoading(false)
            return
        }

        const fetchPatients = async () => {
            setLoading(true)
            try {
                const res = await fetch('/api/local-db?table=patients')
                const { data } = await res.json()
                
                if (data) {
                    const realPatients = data.filter((p: any) => !p.id.match(/^P-0[0-4]\d$/) && !p.id.match(/^P-050$/))
                    setVitals(realPatients.map((p: any) => ({
                        id: p.id,
                        patient: p.name,
                        age: p.age || '--',
                        hr: p.lastVitals?.hr || 0,
                        spo2: p.lastVitals?.spo2 || 0,
                        temp: p.lastVitals?.temp || 0,
                        battery: p.battery_level || 100,
                        status: p.status || 'normal',
                        village: p.village || 'Unknown',
                        lastSync: 'Waiting for signal...'
                    })))
                }
            } catch (err) {
                console.error('Failed to load local vitals for devices:', err)
            }
            setLoading(false)
        }
        fetchPatients()
    }, [isDemoMode])

    useEffect(() => {
        const handleUpdate = (e: any) => {
            const { deviceId, patientName, hr, spo2, temp } = e.detail
            setVitals(prev => {
                const existingIndex = prev.findIndex(v => v.id === deviceId)
                const status = (hr > 120 || spo2 < 90) ? 'critical' : (hr > 100 || spo2 < 94) ? 'warning' : 'normal'

                if (existingIndex >= 0) {
                    // Update existing
                    const updated = [...prev]
                    updated[existingIndex] = {
                        ...updated[existingIndex],
                        patient: patientName || updated[existingIndex].patient,
                        hr, spo2, temp, status,
                        lastSync: 'Just now'
                    }
                    return updated
                } else {
                    // Add new (Real or Demo)
                    return [...prev, {
                        id: deviceId,
                        patient: patientName || 'Unknown Device',
                        age: '--',
                        hr, spo2, temp,
                        battery: 100, // Default for now
                        status,
                        village: 'LORA MESH',
                        lastSync: 'Just now'
                    }]
                }
            })
            setLastUpdated(0)
        }

        window.addEventListener('vitals-update', handleUpdate)
        const interval = setInterval(() => {
            setLastUpdated(prev => prev + 1)
        }, 1000)

        return () => {
            window.removeEventListener('vitals-update', handleUpdate)
            clearInterval(interval)
        }
    }, [])

    const filteredVitals = vitals.filter(v => {
        if (filter === 'critical') return v.status === 'critical'
        if (filter === 'active') return v.status !== 'normal'
        return true
    })

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        {t('liveVitalsMonitor')}
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        Multi-patient real-time monitoring dashboard
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === 'all' ? 'bg-gradient-teal text-white' : 'glass'}`}
                        style={{ color: filter === 'all' ? undefined : 'var(--text-primary)' }}
                    >
                        All Devices
                    </button>
                    <button
                        onClick={() => setFilter('critical')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === 'critical' ? 'bg-gradient-red text-white' : 'glass'}`}
                        style={{ color: filter === 'critical' ? undefined : 'var(--text-primary)' }}
                    >
                        Critical Only
                    </button>
                    <button
                        onClick={() => setFilter('active')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === 'active' ? 'bg-gradient-blue text-white' : 'glass'}`}
                        style={{ color: filter === 'active' ? undefined : 'var(--text-primary)' }}
                    >
                        Active Monitoring
                    </button>
                </div>
            </div>

            {/* Vitals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredVitals.map((patient) => (
                    <div
                        key={patient.id}
                        className={`card p-5 border-l-4 transition-all hover:scale-[1.01] ${patient.status === 'critical' ? 'border-l-red-500 glow-red' :
                            patient.status === 'warning' ? 'border-l-amber-500' :
                                'border-l-emerald-500'
                            }`}
                    >
                        {/* Patient Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`avatar w-12 h-12 text-lg ${patient.status === 'critical' ? 'bg-gradient-red animate-heartbeat' :
                                    patient.status === 'warning' ? 'bg-gradient-orange' :
                                        'bg-gradient-teal'
                                    }`}>
                                    {patient.patient.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{patient.patient}</p>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                        Age: {patient.age} • {patient.village}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {/* Battery Indicator */}
                                <div className="flex items-center gap-1">
                                    <div className={`w-8 h-3 rounded-full overflow-hidden bg-gray-700`}>
                                        <div
                                            className={`h-full ${patient.battery > 60 ? 'bg-emerald-500' :
                                                patient.battery > 30 ? 'bg-amber-500' : 'bg-red-500'
                                                }`}
                                            style={{ width: `${patient.battery}%` }}
                                        />
                                    </div>
                                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{patient.battery}%</span>
                                </div>
                                {/* Status Badge */}
                                <span className={`badge text-xs px-2 py-1 ${patient.status === 'critical' ? 'badge-danger' :
                                    patient.status === 'warning' ? 'badge-warning' :
                                        'badge-success'
                                    }`}>
                                    {patient.status === 'normal' ? '✓ Online' : patient.status === 'warning' ? '⚠ Warning' : '🚨 Critical'}
                                </span>
                            </div>
                        </div>

                        {/* Vital Signs Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            {/* Heart Rate */}
                            <div className="p-3 rounded-xl" style={{ background: 'var(--bg-primary)' }}>
                                <div className="flex items-center gap-2 mb-1">
                                    <Heart className={`h-4 w-4 ${patient.hr > 100 ? 'text-red-500 animate-heartbeat' : 'text-pink-500'}`} />
                                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('heartRate')}</span>
                                </div>
                                <p className={`text-2xl font-bold ${patient.hr > 100 ? 'text-red-500' : 'text-emerald-500'}`}>
                                    {patient.hr} <span className="text-sm font-normal">bpm</span>
                                </p>
                                {/* Mini ECG Chart */}
                                <div className="mt-2 h-6 flex items-end gap-0.5">
                                    {[...Array(12)].map((_, i) => (
                                        <div
                                            key={i}
                                            className={`flex-1 rounded-t ${patient.hr > 100 ? 'bg-red-500/50' : 'bg-emerald-500/50'}`}
                                            style={{ height: `${20 + Math.sin(i * 0.8) * 40 + Math.random() * 20}%` }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* SpO2 */}
                            <div className="p-3 rounded-xl" style={{ background: 'var(--bg-primary)' }}>
                                <div className="flex items-center gap-2 mb-1">
                                    <Droplets className={`h-4 w-4 ${patient.spo2 < 90 ? 'text-red-500' : 'text-blue-500'}`} />
                                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('oxygen')}</span>
                                </div>
                                <p className={`text-2xl font-bold ${patient.spo2 < 90 ? 'text-red-500' : 'text-blue-500'}`}>
                                    {patient.spo2}<span className="text-sm font-normal">%</span>
                                </p>
                                {/* Oxygen Level Bar */}
                                <div className="mt-2 h-6 flex items-end gap-0.5">
                                    {[...Array(12)].map((_, i) => (
                                        <div
                                            key={i}
                                            className={`flex-1 rounded-t ${patient.spo2 < 90 ? 'bg-red-500/50' : 'bg-blue-500/50'}`}
                                            style={{ height: `${75 + Math.random() * 25}%` }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Temperature */}
                            <div className="p-3 rounded-xl" style={{ background: 'var(--bg-primary)' }}>
                                <div className="flex items-center gap-2 mb-1">
                                    <Thermometer className={`h-4 w-4 ${patient.temp > 37.5 ? 'text-orange-500' : 'text-purple-500'}`} />
                                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('temperature')}</span>
                                </div>
                                <p className={`text-2xl font-bold ${patient.temp > 37.5 ? 'text-orange-500' : 'text-purple-500'}`}>
                                    {patient.temp}<span className="text-sm font-normal">°C</span>
                                </p>
                            </div>

                            {/* ECG Waveform */}
                            <div className="p-3 rounded-xl" style={{ background: 'var(--bg-primary)' }}>
                                <div className="flex items-center gap-2 mb-1">
                                    <Activity className="h-4 w-4 text-purple-500" />
                                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>ECG</span>
                                </div>
                                <div className="h-10 flex items-center">
                                    <svg className="w-full h-full" viewBox="0 0 120 40" preserveAspectRatio="none">
                                        <polyline
                                            points="0,20 15,20 20,20 25,8 30,32 35,20 40,20 55,20 60,20 65,8 70,32 75,20 80,20 95,20 100,20 105,8 110,32 115,20 120,20"
                                            fill="none"
                                            stroke={patient.status === 'critical' ? '#ef4444' : '#a855f7'}
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Risk Score Analysis */}
                        <div className="mt-4">
                            <RiskScoreCard
                                hr={patient.hr}
                                spo2={patient.spo2}
                                temp={patient.temp}
                            />
                        </div>

                        {/* 24h Risk Forecast */}
                        <div className="mt-2">
                            <RiskTrendCard
                                hr={patient.hr}
                                spo2={patient.spo2}
                                temp={patient.temp}
                            />
                        </div>

                        {/* Footer */}
                        <div className="mt-3 pt-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
                            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                                <Wifi className="h-3 w-3 text-emerald-500" />
                                Last sync: {patient.lastSync}
                            </div>
                            <button className="btn-primary px-3 py-1 text-xs">
                                View Details
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Status */}
            <div className="card p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="status-online" />
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {filteredVitals.length} devices connected
                        </span>
                    </div>
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        Last Updated: {lastUpdated}s ago
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-emerald-500 animate-spin" style={{ animationDuration: '3s' }} />
                    <span className="text-sm text-emerald-500 font-medium">Auto-refresh enabled</span>
                </div>
            </div>
        </div>
    )
}
