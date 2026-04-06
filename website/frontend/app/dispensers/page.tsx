'use client'

import { useState, useEffect } from 'react'
import {
    Radio, Wifi, WifiOff, Pill, Clock, CheckCircle, AlertCircle,
    Battery, BatteryLow, BatteryCharging, X, Activity, TrendingUp,
    MapPin, Signal, Zap, RefreshCw, ChevronRight, Package,
    ShieldCheck, AlertTriangle, CircleDot, Timer, Loader2
} from 'lucide-react'
import MedicineCompliance from '@/components/MedicineCompliance'
import MedicineScheduleManager from '@/components/MedicineScheduleManager'
import { useDemoMode } from '@/lib/demo-context'
import { supabase } from '@/lib/supabaseClient'
import { useTheme } from '@/lib/theme-context'

interface Dispenser {
    id: string
    patient: string
    location: string
    status: 'online' | 'offline'
    battery: number
    lastSync: string
    slots: number
    filled: number
    nextDose?: string
    compliance?: number
}

const demoDispensers: Dispenser[] = [
    { id: 'MB-001', patient: 'Ramulu Goud', location: 'Shadnagar', status: 'online', battery: 100, lastSync: '2 min ago', slots: 4, filled: 4, nextDose: '14:00', compliance: 95 },
    { id: 'MB-002', patient: 'Laxmi Narsamma', location: 'Shadnagar', status: 'online', battery: 85, lastSync: '5 min ago', slots: 4, filled: 3, nextDose: '16:30', compliance: 88 },
    { id: 'MB-003', patient: 'Srinivas Reddy', location: 'Shamshabad', status: 'offline', battery: 12, lastSync: '2 hours ago', slots: 4, filled: 2, nextDose: '—', compliance: 62 },
    { id: 'MB-004', patient: 'Buchamma', location: 'Chevella', status: 'online', battery: 92, lastSync: '1 min ago', slots: 4, filled: 4, nextDose: '09:00', compliance: 100 },
    { id: 'MB-005', patient: 'Venkat Rao', location: 'Ibrahimpatnam', status: 'online', battery: 78, lastSync: '8 min ago', slots: 4, filled: 2, nextDose: '20:00', compliance: 74 },
]

function BatteryIndicator({ level }: { level: number }) {
    const color = level <= 15 ? 'text-red-500' : level <= 40 ? 'text-amber-500' : 'text-emerald-500'
    const bgColor = level <= 15 ? 'bg-red-500' : level <= 40 ? 'bg-amber-500' : 'bg-emerald-500'
    const Icon = level <= 15 ? BatteryLow : level >= 95 ? BatteryCharging : Battery

    return (
        <div className="flex items-center gap-2">
            <div className="relative w-10 h-5 rounded-sm border-2 border-current opacity-60" style={{ color: 'var(--text-muted)' }}>
                <div className="absolute right-[-4px] top-[4px] w-[3px] h-[8px] rounded-r-sm bg-current opacity-40" />
                <div
                    className={`absolute left-[2px] top-[2px] bottom-[2px] rounded-[1px] transition-all ${bgColor}`}
                    style={{ width: `${Math.max(4, (level / 100) * 85)}%` }}
                />
            </div>
            <span className={`text-xs font-bold ${color}`}>{level}%</span>
        </div>
    )
}

function SlotVisualizer({ total, filled }: { total: number, filled: number }) {
    return (
        <div className="flex items-center gap-1.5">
            {Array.from({ length: total }, (_, i) => (
                <div
                    key={i}
                    className={`w-3 h-3 rounded-full transition-all ${i < filled
                        ? 'bg-purple-500 shadow-sm shadow-purple-500/40'
                        : 'bg-gray-200 dark:bg-slate-700'
                        }`}
                />
            ))}
        </div>
    )
}

function ComplianceRing({ value, size = 44 }: { value: number, size?: number }) {
    const radius = (size - 6) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (value / 100) * circumference
    const color = value >= 90 ? '#10b981' : value >= 70 ? '#f59e0b' : '#ef4444'

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border-color)" strokeWidth="3" />
                <circle
                    cx={size / 2} cy={size / 2} r={radius} fill="none"
                    stroke={color} strokeWidth="3" strokeLinecap="round"
                    strokeDasharray={circumference} strokeDashoffset={offset}
                    className="transition-all duration-700"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold" style={{ color }}>{value}%</span>
            </div>
        </div>
    )
}

export default function DispensersPage() {
    const { t } = useTheme()
    const { isDemoMode } = useDemoMode()
    const [dispensers, setDispensers] = useState<Dispenser[]>([])
    const [loading, setLoading] = useState(true)
    const [showMedicineManager, setShowMedicineManager] = useState(false)
    const [selectedDispenser, setSelectedDispenser] = useState<Dispenser | null>(null)
    const [stats, setStats] = useState({ compliance: 85, doses: 24, taken: 20 })
    const [refreshing, setRefreshing] = useState(false)

    useEffect(() => {
        if (isDemoMode) {
            setDispensers(demoDispensers)
            setStats({ compliance: 85, doses: 24, taken: 20 })
            setLoading(false)
            return
        }

        const fetchData = async () => {
            setLoading(true)
            try {
                // Parallel fetch
                const [patientsRes, medsRes] = await Promise.all([
                    supabase.from('patients').select('*'),
                    supabase.from('medications').select('*')
                ])

                const patients = patientsRes.data
                const pError = patientsRes.error
                const meds = medsRes.data
                const mError = medsRes.error

                if (patients && !pError) {
                    const formatted: Dispenser[] = patients.map((p: any) => ({
                        id: p.device_id || `MB-${p.id.slice(0, 4)}`,
                        patient: p.name,
                        location: p.village || 'Unknown',
                        status: (p.status === 'offline' ? 'offline' : 'online') as 'online' | 'offline',
                        battery: p.battery_level || 100,
                        lastSync: 'Now',
                        slots: 4,
                        filled: 3,
                        nextDose: '—',
                        compliance: 80
                    }))
                    setDispensers(formatted)
                }

                if (meds && !mError) {
                    const taken = meds.filter((m: any) => m.status === 'taken').length
                    const total = meds.length
                    const compliance = total > 0 ? Math.round((taken / total) * 100) : 0
                    setStats({
                        compliance,
                        doses: total,
                        taken
                    })
                }
            } catch (err) {
                console.error('Fetch error:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchData()

        const channel = supabase
            .channel('dispenser-updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'medications' }, () => fetchData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => fetchData())
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [isDemoMode])

    const onlineCount = dispensers.filter(d => d.status === 'online').length
    const offlineCount = dispensers.filter(d => d.status === 'offline').length
    const lowBattery = dispensers.filter(d => d.battery < 20).length
    const avgCompliance = dispensers.length > 0
        ? Math.round(dispensers.reduce((sum, d) => sum + (d.compliance || 0), 0) / dispensers.length)
        : stats.compliance

    const handleRefresh = async () => {
        setRefreshing(true)
        await new Promise(r => setTimeout(r, 800))
        setRefreshing(false)
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                        <Radio className="h-7 w-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                            {t('medicineDispensers')}
                        </h1>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                            {t('smartPillBoxes')} • {dispensers.length} {t('registered')}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleRefresh}
                        className="w-11 h-11 rounded-xl border flex items-center justify-center transition-all hover:bg-gray-50 dark:hover:bg-slate-800"
                        style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
                    >
                        <RefreshCw className={`h-4.5 w-4.5 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => setShowMedicineManager(true)}
                        className="h-11 flex items-center gap-2 px-5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold text-sm shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <Pill className="h-4 w-4" />
                        {t('manageSchedules')}
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Online Devices */}
                <div className="rounded-2xl border p-5 transition-all hover:shadow-md" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                            <Signal className="h-5 w-5 text-emerald-500" />
                        </div>
                        {offlineCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 dark:bg-red-900/20 text-red-500">
                                {offlineCount} offline
                            </span>
                        )}
                    </div>
                    <p className="text-3xl font-bold text-emerald-500">{loading ? '—' : onlineCount}</p>
                    <p className="text-xs font-medium mt-1" style={{ color: 'var(--text-muted)' }}>{t('devicesOnline')}</p>
                    <div className="mt-3 w-full h-1.5 rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                            style={{ width: dispensers.length > 0 ? `${(onlineCount / dispensers.length) * 100}%` : '0%' }}
                        />
                    </div>
                </div>

                {/* Compliance */}
                <div className="rounded-2xl border p-5 transition-all hover:shadow-md" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                            <ShieldCheck className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="flex items-center gap-1 text-emerald-500">
                            <TrendingUp className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-bold">+5%</span>
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-blue-500">{loading ? '—' : `${avgCompliance}%`}</p>
                    <p className="text-xs font-medium mt-1" style={{ color: 'var(--text-muted)' }}>{t('avgCompliance')}</p>
                    <div className="mt-3 w-full h-1.5 rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-blue-500 transition-all duration-700"
                            style={{ width: `${avgCompliance}%` }}
                        />
                    </div>
                </div>

                {/* Low Battery */}
                <div className="rounded-2xl border p-5 transition-all hover:shadow-md" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                    <div className="flex items-center justify-between mb-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${lowBattery > 0 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20'}`}>
                            {lowBattery > 0
                                ? <BatteryLow className="h-5 w-5 text-amber-500" />
                                : <BatteryCharging className="h-5 w-5 text-emerald-500" />
                            }
                        </div>
                        {lowBattery > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                                {t('needsAttention')}
                            </span>
                        )}
                    </div>
                    <p className={`text-3xl font-bold ${lowBattery > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {loading ? '—' : lowBattery}
                    </p>
                    <p className="text-xs font-medium mt-1" style={{ color: 'var(--text-muted)' }}>{t('lowBattery')}</p>
                    <div className="mt-3 w-full h-1.5 rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-700 ${lowBattery > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: dispensers.length > 0 ? `${((dispensers.length - lowBattery) / dispensers.length) * 100}%` : '100%' }}
                        />
                    </div>
                </div>

                {/* Pending Doses */}
                <div className="rounded-2xl border p-5 transition-all hover:shadow-md" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                            <Pill className="h-5 w-5 text-purple-500" />
                        </div>
                        <span className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>TODAY</span>
                    </div>
                    <p className="text-3xl font-bold text-purple-500">{loading ? '—' : stats.doses}</p>
                    <p className="text-xs font-medium mt-1" style={{ color: 'var(--text-muted)' }}>
                        {t('totalDoses')}
                    </p>
                    <div className="mt-3 w-full h-1.5 rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-purple-500 transition-all duration-700"
                            style={{ width: stats.doses > 0 ? `${(stats.taken / stats.doses) * 100}%` : '0%' }}
                        />
                    </div>
                </div>
            </div>

            {/* Dispenser Cards Grid */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                        {t('allDispensers')}
                    </h2>
                    <div className="flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                        <CircleDot className="h-3 w-3 text-emerald-500" />
                        <span>{onlineCount} {t('active')}</span>
                        {offlineCount > 0 && (
                            <>
                                <span>•</span>
                                <CircleDot className="h-3 w-3 text-red-500" />
                                <span>{offlineCount} offline</span>
                            </>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="rounded-2xl border p-6 space-y-4" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
                                <div className="skeleton h-6 w-3/4" />
                                <div className="skeleton h-4 w-1/2" />
                                <div className="flex gap-2">
                                    <div className="skeleton h-3 w-3 rounded-full" />
                                    <div className="skeleton h-3 w-3 rounded-full" />
                                    <div className="skeleton h-3 w-3 rounded-full" />
                                    <div className="skeleton h-3 w-3 rounded-full" />
                                </div>
                                <div className="skeleton h-10 w-full" />
                            </div>
                        ))}
                    </div>
                ) : dispensers.length === 0 ? (
                    <div className="rounded-2xl border-2 border-dashed p-12 text-center" style={{ borderColor: 'var(--border-color)' }}>
                        <Package className="h-16 w-16 mx-auto mb-4 opacity-20" style={{ color: 'var(--text-muted)' }} />
                        <p className="text-lg font-semibold" style={{ color: 'var(--text-muted)' }}>No dispensers found</p>
                        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Register patients to see their dispensers here</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {dispensers.map(d => (
                            <div
                                key={d.id}
                                onClick={() => setSelectedDispenser(selectedDispenser?.id === d.id ? null : d)}
                                className={`group rounded-2xl border-2 p-5 cursor-pointer transition-all hover:shadow-lg ${selectedDispenser?.id === d.id
                                    ? 'border-purple-400 dark:border-purple-500 shadow-lg shadow-purple-500/10'
                                    : d.status === 'offline'
                                        ? 'border-red-200 dark:border-red-900/50 opacity-75'
                                        : 'border-transparent hover:border-purple-200 dark:hover:border-purple-900/50'
                                    }`}
                                style={{ background: 'var(--bg-secondary)', borderColor: selectedDispenser?.id === d.id ? undefined : d.status === 'offline' ? undefined : 'var(--border-color)' }}
                            >
                                {/* Card Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${d.status === 'online'
                                            ? 'bg-emerald-50 dark:bg-emerald-900/20'
                                            : 'bg-red-50 dark:bg-red-900/20'
                                            }`}>
                                            {d.status === 'online'
                                                ? <Wifi className="h-5 w-5 text-emerald-500" />
                                                : <WifiOff className="h-5 w-5 text-red-500" />
                                            }
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{d.patient}</p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <MapPin className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />
                                                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{d.location}</span>
                                                <span className="text-xs opacity-40" style={{ color: 'var(--text-muted)' }}>•</span>
                                                <span className="text-xs font-mono opacity-60" style={{ color: 'var(--text-muted)' }}>{d.id}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <ComplianceRing value={d.compliance || 0} />
                                </div>

                                {/* Slot Visual */}
                                <div className="flex items-center justify-between mb-4 p-3 rounded-xl" style={{ background: 'var(--bg-primary)' }}>
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>{t('dispenserSlots')}</p>
                                        <SlotVisualizer total={d.slots} filled={d.filled} />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>{t('filled')}</p>
                                        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{d.filled}/{d.slots}</p>
                                    </div>
                                </div>

                                {/* Bottom Info Row */}
                                <div className="flex items-center justify-between">
                                    <BatteryIndicator level={d.battery} />

                                    <div className="flex items-center gap-3">
                                        {d.nextDose && d.nextDose !== '—' && (
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                                                <Timer className="h-3 w-3 text-purple-500" />
                                                <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">{d.nextDose}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />
                                            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{d.lastSync}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Detail (when selected) */}
                                {selectedDispenser?.id === d.id && (
                                    <div className="mt-4 pt-4 border-t space-y-3" style={{ borderColor: 'var(--border-color)' }}>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3 rounded-xl" style={{ background: 'var(--bg-primary)' }}>
                                                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Status</p>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <div className={`w-2 h-2 rounded-full ${d.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                                                    <span className="text-sm font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>{d.status}</span>
                                                </div>
                                            </div>
                                            <div className="p-3 rounded-xl" style={{ background: 'var(--bg-primary)' }}>
                                                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{t('signal')}</p>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <Signal className="h-3.5 w-3.5 text-emerald-500" />
                                                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                        {d.status === 'online' ? t('strong') : t('noSignal')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Manual Control Section */}
                                        <div className="mt-4 p-4 rounded-xl border border-dashed border-purple-200 dark:border-purple-900/50" style={{ background: 'var(--bg-primary)' }}>
                                            <div className="flex items-center gap-2 mb-3">
                                                <Zap className="h-3.5 w-3.5 text-purple-500" />
                                                <p className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Manual Override Control</p>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-2">
                                                {[1, 2, 3, 4].map(slot => (
                                                    <button
                                                        key={slot}
                                                        disabled={d.status === 'offline'}
                                                        onClick={async (e) => {
                                                            e.stopPropagation()
                                                            const btn = e.currentTarget
                                                            btn.disabled = true
                                                            const originalText = btn.innerHTML
                                                            btn.innerHTML = `<span class="animate-spin">⌛</span> Slot ${slot}`
                                                            
                                                            try {
                                                                const res = await fetch('/api/local-db', {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({
                                                                        table: 'commands',
                                                                        action: 'insert',
                                                                        data: {
                                                                            device_id: d.id,
                                                                            cmd: 'dispense',
                                                                            slot: slot,
                                                                            timestamp: new Date().toISOString(),
                                                                            status: 'pending'
                                                                        }
                                                                    })
                                                                })
                                                                
                                                                if (res.ok) {
                                                                    btn.innerHTML = `✅ Slot ${slot}`
                                                                    btn.className += " !bg-emerald-500 !text-white"
                                                                    setTimeout(() => {
                                                                        btn.disabled = false
                                                                        btn.innerHTML = originalText
                                                                        btn.className = btn.className.replace(" !bg-emerald-500 !text-white", "")
                                                                    }, 2000)
                                                                }
                                                            } catch (err) {
                                                                btn.innerHTML = `❌ Error`
                                                                setTimeout(() => {
                                                                    btn.disabled = false
                                                                    btn.innerHTML = originalText
                                                                }, 2000)
                                                            }
                                                        }}
                                                        className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-[11px] font-semibold transition-all hover:border-purple-500 hover:text-purple-500 disabled:opacity-40 disabled:cursor-not-allowed"
                                                        style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                                    >
                                                        <Package className="h-3 w-3" />
                                                        Slot {slot}
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="text-[9px] mt-2 text-center" style={{ color: 'var(--text-muted)' }}>
                                                {d.status === 'offline' ? 'Dispenser must be online to control' : 'Command will be relayed via LoRa Mesh'}
                                            </p>
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setShowMedicineManager(true)
                                            }}
                                            className="w-full h-10 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                                        >
                                            <Pill className="h-3.5 w-3.5" />
                                            {t('editSchedules')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Medicine Compliance Section */}
            <MedicineCompliance />

            {/* Medicine Schedule Manager — Full Overlay */}
            {showMedicineManager && (
                <div className="fixed inset-0 z-[9999] animate-fadeIn" style={{ background: 'var(--bg-primary)' }}>
                    <div className="h-full flex flex-col">
                        {/* Top bar with close */}
                        <div className="flex items-center justify-between px-6 py-3 border-b" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowMedicineManager(false)}
                                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500"
                                    style={{ color: 'var(--text-muted)' }}
                                >
                                    <X className="h-5 w-5" />
                                </button>
                                <span className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>{t('backToDispensers')}</span>
                            </div>
                        </div>
                        {/* Full-height Schedule Manager */}
                        <div className="flex-1 overflow-y-auto">
                            <MedicineScheduleManager />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
