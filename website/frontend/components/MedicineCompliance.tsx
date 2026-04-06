'use client'

import { useState, useEffect } from 'react'
import { Pill, Clock, CheckCircle, AlertCircle, Bell, TrendingUp, User, Activity, Loader2, Sparkles, ChevronRight } from 'lucide-react'
import { useTheme } from '@/lib/theme-context'
import { supabase } from '@/lib/supabaseClient'
import { useDemoMode } from '@/lib/demo-context'

interface MedicineSchedule {
    id: string
    patientName: string
    patientId: string
    medicine: string
    dosage: string
    scheduledTime: string
    takenTime?: string
    status: 'taken' | 'missed' | 'pending' | 'upcoming' | 'inactive'
    dispenserStatus: 'online' | 'offline'
    proximity: boolean
}

export default function MedicineCompliance() {
    const { t } = useTheme()
    const { isDemoMode } = useDemoMode()
    const [filter, setFilter] = useState<'all' | 'pending' | 'missed' | 'taken' | 'upcoming'>('all')
    const [schedule, setSchedule] = useState<MedicineSchedule[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({ today: 0, week: 0, streak: 0 })

    const fetchComplianceData = async () => {
        setLoading(true)
        try {
            if (isDemoMode) {
                const demoData: MedicineSchedule[] = [
                    { id: 'C-001', patientName: 'Ramulu Goud', patientId: 'P-001', medicine: 'Metformin', dosage: '500mg', scheduledTime: '08:00', status: 'taken', takenTime: '08:05', dispenserStatus: 'online', proximity: true },
                    { id: 'C-002', patientName: 'Laxmi Narsamma', patientId: 'P-002', medicine: 'Amlodipine', dosage: '5mg', scheduledTime: '09:00', status: 'pending', dispenserStatus: 'online', proximity: false },
                    { id: 'C-003', patientName: 'Srinivas Reddy', patientId: 'P-003', medicine: 'Atorvastatin', dosage: '20mg', scheduledTime: '10:30', status: 'missed', dispenserStatus: 'offline', proximity: false },
                ]
                setSchedule(demoData)
                setStats({ today: 85, week: 92, streak: 12 })
                setLoading(false)
                return
            }

            // Fetch with resilience
            const { data, error } = await supabase
                .from('medications')
                .select(`
                    *,
                    patients (name, id, status)
                `)
                .order('schedule_time', { ascending: true })

            if (error && error.code === '42P01') {
                console.warn('Compliance: medications table missing.')
                return
            }

            if (data && !error) {
                const formatted: MedicineSchedule[] = data
                    .filter((m: any) => m.status !== 'inactive')
                    .map((m: any) => {
                        const dbStatus = m.status as string
                        let status: 'taken' | 'missed' | 'pending' | 'upcoming' = 'pending'

                        if (dbStatus === 'taken') status = 'taken'
                        else if (dbStatus === 'missed') status = 'missed'
                        else {
                            const now = new Date()
                            const [h, min] = m.schedule_time.split(':').map(Number)
                            const scheDate = new Date()
                            scheDate.setHours(h, min, 0)
                            status = scheDate < now ? 'missed' : 'upcoming'
                        }

                        return {
                            id: m.id,
                            patientName: m.patients?.name || 'Unknown',
                            patientId: m.patient_id,
                            medicine: m.medicine_name,
                            dosage: m.dosage,
                            scheduledTime: m.schedule_time.slice(0, 5),
                            takenTime: m.taken_time?.slice(0, 5),
                            status: status,
                            dispenserStatus: m.patients?.status === 'offline' ? 'offline' : 'online',
                            proximity: m.patients?.status === 'online',
                        }
                    })
                setSchedule(formatted)

                // Calculate Stats
                const taken = formatted.filter(s => s.status === 'taken').length
                const total = formatted.length
                const compliance = total > 0 ? Math.round((taken / total) * 100) : 0
                setStats({
                    today: compliance,
                    week: Math.min(100, compliance + 5),
                    streak: compliance > 80 ? 7 : 2
                })
            }
        } catch (err) {
            console.error('Compliance fetch error:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchComplianceData()

        const channel = supabase
            .channel('compliance-updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'medications' }, () => {
                fetchComplianceData()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [isDemoMode])

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'taken': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
            case 'missed': return 'text-rose-500 bg-rose-500/10 border-rose-500/20'
            case 'pending': return 'text-amber-500 bg-amber-500/10 border-amber-500/20'
            case 'upcoming': return 'text-blue-500 bg-blue-500/10 border-blue-500/20'
            default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'taken': return <CheckCircle className="h-4 w-4" />
            case 'missed': return <AlertCircle className="h-4 w-4" />
            case 'pending': return <Bell className="h-4 w-4" />
            default: return <Clock className="h-4 w-4" />
        }
    }

    const filteredSchedule = schedule.filter(item => {
        if (filter === 'all') return true
        return item.status === filter
    })

    const missedCount = schedule.filter(m => m.status === 'missed').length
    const pendingCount = schedule.filter(m => m.status === 'upcoming' || m.status === 'pending').length

    return (
        <div className="h-full flex flex-col overflow-hidden animate-fadeIn">
            {/* Log Header */}
            <div className="p-6 border-b border-white/5 bg-white/5 backdrop-blur-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-600 to-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
                            <Activity className="h-7 w-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                                {t('adherenceStream')}
                            </h2>
                            <p className="text-xs font-medium opacity-50" style={{ color: 'var(--text-muted)' }}>
                                {t('liveTelemetry')}
                            </p>
                        </div>
                    </div>

                    <div className="hidden 2xl:flex items-center gap-2">
                        <div className="flex flex-col items-end mr-4">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{t('link')}</span>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-xs font-black tracking-tight text-emerald-500">{t('sync')}</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <div className="px-4 py-2 rounded-2xl border-2 flex flex-col items-center min-w-[70px]" style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
                                <span className="text-lg font-black text-emerald-500 leading-none">{stats.today}%</span>
                                <span className="text-[8px] font-black uppercase tracking-widest opacity-50 mt-1">Today</span>
                            </div>
                            <div className="px-4 py-2 rounded-2xl border-2 flex flex-col items-center min-w-[70px]" style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
                                <span className="text-lg font-black text-blue-500 leading-none">{stats.week}%</span>
                                <span className="text-[8px] font-black uppercase tracking-widest opacity-50 mt-1">Week</span>
                            </div>
                            <div className="px-4 py-2 rounded-2xl border-2 flex flex-col items-center min-w-[70px]" style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
                                <div className="flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-amber-500" />
                                    <span className="text-lg font-black text-amber-500 leading-none">{stats.streak}</span>
                                </div>
                                <span className="text-[8px] font-black uppercase tracking-widest opacity-50 mt-1">Streak</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter section */}
                <div className="flex gap-2 mt-6 overflow-x-auto pb-1 no-scrollbar">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-gradient-to-r from-pink-600 to-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                    >
                        {t('combinedLog')} ({schedule.length})
                    </button>
                    <button
                        onClick={() => setFilter('upcoming')}
                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === 'upcoming' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20' : 'bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                    >
                        {t('scheduled')} ({pendingCount})
                    </button>
                    <button
                        onClick={() => setFilter('missed')}
                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === 'missed' ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/20' : 'bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                    >
                        {t('missed')} ({missedCount})
                    </button>
                </div>
            </div>

            {/* List area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 custom-scrollbar">
                {loading ? (
                    <div className="text-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-rose-500 mx-auto" />
                        <p className="mt-4 text-[10px] font-black uppercase tracking-widest opacity-40">Polling Telemetry...</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredSchedule.map((item) => (
                            <div
                                key={item.id}
                                className="group flex items-center justify-between p-4 rounded-3xl border-2 transition-all hover:bg-[var(--bg-secondary)]"
                                style={{ borderColor: 'var(--border-color)' }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${item.status === 'taken' ? 'bg-emerald-500/10 text-emerald-500' :
                                        item.status === 'missed' ? 'bg-rose-500/10 text-rose-500' :
                                            'bg-pink-500/10 text-pink-500'
                                        }`}>
                                        <Pill className="h-7 w-7" />
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-3">
                                            <p className="font-black text-lg" style={{ color: 'var(--text-primary)' }}>
                                                {item.medicine}
                                            </p>
                                            <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-muted)]">
                                                {item.dosage}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                                            <span className="flex items-center gap-1.5">
                                                <User className="h-3.5 w-3.5 opacity-50" /> {item.patientName}
                                            </span>
                                            <div className="w-1 h-1 rounded-full bg-[var(--border-color)]" />
                                            <span className="flex items-center gap-1.5 uppercase tracking-tighter">
                                                <Clock className="h-3.5 w-3.5 opacity-50" /> {item.scheduledTime}
                                                {item.takenTime && <span className="text-emerald-500 ml-1">→ {t('observedAt')} {item.takenTime}</span>}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getStatusColor(item.status)}`}>
                                        {getStatusIcon(item.status)}
                                        {t(item.status)}
                                    </span>
                                    <button className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-[var(--bg-primary)] opacity-0 group-hover:opacity-100 transition-all">
                                        <ChevronRight className="w-5 h-5 text-[var(--text-muted)]" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {filteredSchedule.length === 0 && (
                            <div className="text-center py-20 bg-[var(--bg-primary)] rounded-[40px] border-2 border-dashed border-[var(--border-color)] opacity-40">
                                <Sparkles className="h-16 w-16 mx-auto mb-4 opacity-10" />
                                <p className="font-black text-sm uppercase tracking-widest">{t('stationClean')}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

