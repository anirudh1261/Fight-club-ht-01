'use client'

import { Calendar, Clock, Plus, User, MapPin, FileText, Loader2, Edit, Trash2 } from 'lucide-react'
import { useTheme } from '@/lib/theme-context'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useDemoMode } from '@/lib/demo-context'
import BookAppointmentModal from '@/components/BookAppointmentModal'

const mockAppointments = [
    { id: 'A-001', patient: 'Ramulu Goud', patient_id: 'P-001', doctor_name: 'Dr. Sharma', time: '09:00', date: 'Today', type: 'Check-up', status: 'confirmed', location: 'PHC', raw_date: new Date() },
    { id: 'A-002', patient: 'Laxmi Narsamma', patient_id: 'P-002', doctor_name: 'Dr. Rao', time: '10:30', date: 'Today', type: 'Follow-up', status: 'pending', location: 'Home Visit', raw_date: new Date() },
    { id: 'A-003', patient: 'Srinivas Reddy', patient_id: 'P-003', doctor_name: 'Dr. Sharma', time: '11:00', date: 'Tomorrow', type: 'Emergency', status: 'confirmed', location: 'District Hospital', raw_date: new Date(new Date().setDate(new Date().getDate() + 1)) },
    { id: 'A-004', patient: 'Buchamma', patient_id: 'P-004', doctor_name: 'Dr. Reddy', time: '09:30', date: 'Tomorrow', type: 'Check-up', status: 'pending', location: 'PHC', raw_date: new Date(new Date().setDate(new Date().getDate() + 1)) },
]

const statusColors = {
    confirmed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 font-bold',
    pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 font-bold',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 font-bold',
}

export default function AppointmentsPage() {
    const { t } = useTheme()
    const { isDemoMode } = useDemoMode()
    const [appointments, setAppointments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editData, setEditData] = useState<any>(null)

    const fetchAppointments = async () => {
        setLoading(true)
        if (isDemoMode) {
            const saved = localStorage.getItem('demo_appointments')
            const version = localStorage.getItem('demo_data_version')

            // Clear if version mismatch or old data (simple check)
            if (version !== 'v2') {
                localStorage.removeItem('demo_appointments')
                localStorage.setItem('demo_data_version', 'v2')
                setAppointments(mockAppointments.map(a => ({ ...a, raw_date: new Date() })))
                localStorage.setItem('demo_appointments', JSON.stringify(mockAppointments))
                setLoading(false)
                return
            }

            if (saved) {
                const parsed = JSON.parse(saved)
                setAppointments(parsed.map((apt: any) => ({
                    ...apt,
                    patient: apt.patient || apt.patients?.name || 'Unknown Patient',
                    time: apt.scheduled_time ? new Date(apt.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : apt.time,
                    date: apt.scheduled_time ? new Date(apt.scheduled_time).toDateString() : apt.date,
                    raw_date: apt.scheduled_time ? new Date(apt.scheduled_time) : new Date()
                })))
            } else {
                setAppointments(mockAppointments.map(a => ({ ...a, raw_date: new Date() })))
                localStorage.setItem('demo_appointments', JSON.stringify(mockAppointments))
                localStorage.setItem('demo_data_version', 'v2') // Versioning to force refresh
            }
            setLoading(false)
            return
        }

        const { data, error } = await supabase
            .from('appointments')
            .select('*, patients(name)')
            .order('scheduled_time', { ascending: true })

        if (error) {
            console.warn('Appointments error:', error.message)
            setAppointments([])
        } else if (data) {
            setAppointments(data.map((apt: any) => ({
                id: apt.id,
                patient_id: apt.patient_id,
                patient: apt.patients?.name || 'Unknown Patient',
                time: apt.scheduled_time ? new Date(apt.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
                date: apt.scheduled_time ? new Date(apt.scheduled_time).toDateString() : '-',
                scheduled_time: apt.scheduled_time, // Keep raw for editing
                raw_date: new Date(apt.scheduled_time),
                type: apt.type || 'General',
                status: apt.status || 'pending',
                location: apt.location || 'PHC',
                doctor_name: apt.doctor_name
            })))
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchAppointments()
    }, [isDemoMode])

    const handleDelete = async (id: string) => {
        // if (!confirm('Are you sure you want to cancel this appointment?')) return

        // Optimistic update
        setAppointments(prev => prev.filter(a => a.id !== id))

        if (isDemoMode) {
            const saved = localStorage.getItem('demo_appointments')
            if (saved) {
                const current = JSON.parse(saved)
                const updated = current.filter((a: any) => a.id != id)
                localStorage.setItem('demo_appointments', JSON.stringify(updated))
                // No need to fetchAppointments() as we updated state optimistically
            }
            return
        }

        const { error } = await supabase.from('appointments').delete().eq('id', id)
        if (error) {
            alert('Error deleting: ' + error.message)
            fetchAppointments() // Revert on error
        }
    }

    const getDateLabel = (dateStr: string, rawDate?: Date) => {
        // Handle mock "Today" / "Tomorrow" strings first
        if (dateStr === 'Today') return <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">Today</span>
        if (dateStr === 'Tomorrow') return <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">Tomorrow</span>

        if (!rawDate) return <span className="text-sm text-slate-500">{dateStr}</span>

        const today = new Date()
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const isToday = rawDate.toDateString() === today.toDateString()
        const isTomorrow = rawDate.toDateString() === tomorrow.toDateString()

        if (isToday) return <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">Today</span>
        if (isTomorrow) return <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">Tomorrow</span>

        return <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{dateStr}</span>
    }

    const todayCount = appointments.filter(a => {
        if (a.date === 'Today') return true
        if (a.raw_date) return a.raw_date.toDateString() === new Date().toDateString()
        return false
    }).length
    const thisWeekCount = appointments.length

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--foreground)]">{t('appointments')}</h1>
                    <p className="mt-1 text-[var(--muted-foreground)]">Manage patient appointments and schedules</p>
                </div>
                <button
                    onClick={() => { setEditData(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl font-medium hover:opacity-90 transition-all shadow-lg hover:shadow-xl active:scale-95"
                >
                    <Plus className="h-5 w-5" />
                    {t('scheduleAppointment')}
                </button>
            </div>

            {/* Calendar Quick View */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 glass-card rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            <Calendar className="h-5 w-5 text-blue-500" />
                        </div>
                        <h2 className="font-bold text-[var(--foreground)]">Quick Stats</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-[var(--muted)]">
                            <p className="text-3xl font-bold text-[var(--foreground)]">{todayCount}</p>
                            <p className="text-sm text-[var(--muted-foreground)]">Today&apos;s Appointments</p>
                        </div>
                        <div className="p-4 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{thisWeekCount}</p>
                            <p className="text-sm text-emerald-600 dark:text-emerald-400">Total Scheduled</p>
                        </div>
                    </div>
                </div>

                {/* Appointments List */}
                <div className="lg:col-span-3 glass-card rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-[var(--border)]">
                        <h2 className="text-xl font-bold text-[var(--foreground)]">{t('upcomingAppointments')}</h2>
                    </div>
                    <div className="divide-y divide-[var(--border)]">
                        {loading ? (
                            <div className="p-12 flex flex-col items-center justify-center text-[var(--muted-foreground)]">
                                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                <p>Loading schedules...</p>
                            </div>
                        ) : appointments.length === 0 ? (
                            <div className="p-12 text-center text-[var(--muted-foreground)] italic">
                                {t('noAppointments')}
                            </div>
                        ) : (
                            appointments.map((apt) => (
                                <div key={apt.id} className="p-4 hover:bg-[var(--muted)] transition-colors group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold text-lg">
                                                {apt.patient.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-slate-900 dark:text-white text-lg">{apt.patient}</p>
                                                    {getDateLabel(apt.date, apt.raw_date)}
                                                </div>
                                                <div className="flex items-center gap-3 mt-1 text-sm text-slate-600 dark:text-slate-400 font-medium tracking-tight">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-4 w-4 text-blue-500" /> {apt.time}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="h-4 w-4 text-emerald-500" /> {apt.location}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                                {apt.type}
                                            </span>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[apt.status as keyof typeof statusColors]}`}>
                                                {t(apt.status)}
                                            </span>

                                            {/* Actions */}
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => { setEditData(apt); setIsModalOpen(true); }}
                                                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500 hover:text-blue-600 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(apt.id)}
                                                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full text-slate-500 hover:text-red-600 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <BookAppointmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchAppointments}
                editData={editData}
            />
        </div>
    )
}
