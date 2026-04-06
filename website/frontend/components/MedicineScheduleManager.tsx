'use client'

import { useState, useEffect } from 'react'
import { Pill, Plus, Edit, Trash2, Clock, User, X, Check, Calendar, AlertCircle, Loader2, ChevronRight, Activity, Bell, Info } from 'lucide-react'
import { useTheme } from '@/lib/theme-context'
import { supabase } from '@/lib/supabaseClient'
import { useDemoMode } from '@/lib/demo-context'

interface MedicineSchedule {
    id: string
    patientId: string
    patientName: string
    medicine: string
    dosage: string
    pillsPerDose: number
    times: string[]
    days: string[]
    dispenserId: string
    slot: number
    enabled: boolean
    status: string
}

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function MedicineScheduleManager() {
    const { t } = useTheme()
    const { isDemoMode } = useDemoMode()
    const [schedules, setSchedules] = useState<MedicineSchedule[]>([])
    const [patients, setPatients] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingSchedule, setEditingSchedule] = useState<MedicineSchedule | null>(null)
    const [filterPatient, setFilterPatient] = useState<string>('all')
    const [activeTab, setActiveTab] = useState<'all' | 'active' | 'missed'>('all')

    // State for all 4 slots
    const [slotsData, setSlotsData] = useState(
        [1, 2, 3, 4].map(s => ({
            slot: s,
            medicine: '',
            dosage: '',
            time: '08:00',
            enabled: false
        }))
    )
    const [selectedPatientId, setSelectedPatientId] = useState('')

    const openAddModal = () => {
        setEditingSchedule(null)
        setSelectedPatientId(filterPatient !== 'all' ? filterPatient : '')
        setSlotsData([1, 2, 3, 4].map(s => {
            // Check if there's an existing schedule for this patient and slot
            const existing = schedules.find(sch => sch.patientId === (filterPatient !== 'all' ? filterPatient : '') && sch.slot === s)
            return {
                slot: s,
                medicine: existing?.medicine || '',
                dosage: existing?.dosage || '',
                time: existing?.times[0] || '08:00',
                enabled: !!existing
            }
        }))
        setIsModalOpen(true)
    }

    const openEditModal = (schedule: MedicineSchedule) => {
        setEditingSchedule(schedule)
        setSelectedPatientId(schedule.patientId)
        setSlotsData([1, 2, 3, 4].map(s => {
            const existing = schedules.find(sch => sch.patientId === schedule.patientId && sch.slot === s)
            return {
                slot: s,
                medicine: existing?.medicine || '',
                dosage: existing?.dosage || '',
                time: existing?.times[0] || '08:00',
                enabled: !!existing
            }
        }))
        setIsModalOpen(true)
    }

    const fetchInitialData = async () => {
        setLoading(true)
        try {
            const { data: pData, error: pError } = await supabase.from('patients').select('*')
            if (pError) throw pError
            if (pData) setPatients(pData.map((p: any) => ({ ...p, dispenserId: p.device_id || '---' })))

            if (isDemoMode) {
                setSchedules([
                    { id: 'S-1', patientId: 'P-001', patientName: 'Ramulu Goud', medicine: 'Metformin', dosage: '500mg', pillsPerDose: 1, times: ['08:00'], days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], dispenserId: 'D-101', slot: 1, enabled: true, status: 'pending' },
                    { id: 'S-2', patientId: 'P-001', patientName: 'Ramulu Goud', medicine: 'Atorvastatin', dosage: '20mg', pillsPerDose: 1, times: ['20:00'], days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], dispenserId: 'D-101', slot: 2, enabled: true, status: 'pending' },
                    { id: 'S-3', patientId: 'P-002', patientName: 'Laxmi Narsamma', medicine: 'Amlodipine', dosage: '5mg', pillsPerDose: 1, times: ['09:00'], days: ['Mon', 'Wed', 'Fri'], dispenserId: 'D-102', slot: 1, enabled: true, status: 'taken' },
                ])
                setLoading(false)
                return
            }

            const { data, error } = await supabase
                .from('medications')
                .select(`*, patients (name, device_id)`)
                .order('slot', { ascending: true })

            if (error && error.code === '42P01') {
                setSchedules([{ id: 'S-1', patientId: 'P-001', patientName: 'System Demo', medicine: 'Sample Med', dosage: '10mg', pillsPerDose: 1, times: ['08:00'], days: ['Mon'], dispenserId: 'D-X', slot: 1, enabled: true, status: 'pending' }])
                return
            }

            if (data && !error) {
                const formatted = data.map((m: any) => ({
                    id: m.id,
                    patientId: m.patient_id,
                    patientName: m.patients?.name || 'Unknown',
                    medicine: m.medicine_name,
                    dosage: m.dosage,
                    pillsPerDose: 1,
                    times: [m.schedule_time.slice(0, 5)],
                    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    dispenserId: m.patients?.device_id || '---',
                    slot: m.slot || 1,
                    enabled: m.status !== 'inactive',
                    status: m.status || 'pending'
                }))
                setSchedules(formatted)
            }
        } catch (err) {
            console.error('Fetch error:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchInitialData()
    }, [isDemoMode])

    const handleSave = async () => {
        if (!selectedPatientId) return
        setLoading(true)

        try {
            const operations = slotsData.map(slotItem => {
                if (!slotItem.medicine && !slotItem.enabled) {
                    const existing = schedules.find(s => s.patientId === selectedPatientId && s.slot === slotItem.slot)
                    if (existing) {
                        return supabase.from('medications').delete().eq('id', existing.id)
                    }
                    return null
                }

                if (!slotItem.medicine) return null

                const payload = {
                    patient_id: selectedPatientId,
                    medicine_name: slotItem.medicine,
                    dosage: slotItem.dosage,
                    schedule_time: slotItem.time,
                    slot: slotItem.slot,
                    status: slotItem.enabled ? 'pending' : 'inactive'
                }

                const existing = schedules.find(s => s.patientId === selectedPatientId && s.slot === slotItem.slot)

                if (existing) {
                    return supabase.from('medications').update(payload).eq('id', existing.id)
                } else {
                    return supabase.from('medications').insert([payload])
                }
            }).filter(Boolean)

            await Promise.all(operations)
            await fetchInitialData()
        } catch (err) {
            console.error('Save error:', err)
        } finally {
            setLoading(false)
            setIsModalOpen(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to remove this medication schedule?')) return
        setLoading(true)
        try {
            const { error } = await supabase.from('medications').delete().eq('id', id)
            if (!error) setSchedules(prev => prev.filter(s => s.id !== id))
        } catch (err) {
            console.error('Delete error:', err)
        } finally {
            setLoading(false)
        }
    }

    const toggleStatus = async (schedule: MedicineSchedule) => {
        const newStatus = schedule.status === 'inactive' ? 'pending' : 'inactive'
        try {
            const { error } = await supabase.from('medications').update({ status: newStatus }).eq('id', schedule.id)
            if (!error) {
                setSchedules(prev => prev.map(s =>
                    s.id === schedule.id ? { ...s, status: newStatus, enabled: newStatus !== 'inactive' } : s
                ))
            }
        } catch (err) {
            console.error('Toggle status error:', err)
        }
    }

    const filteredSchedules = schedules
        .filter(s => filterPatient === 'all' || s.patientId === filterPatient)
        .filter(sch => {
            if (activeTab === 'all') return true
            if (activeTab === 'active') return sch.enabled && sch.status !== 'missed'
            if (activeTab === 'missed') return sch.status === 'missed'
            return true
        })

    return (
        <div className="h-full flex flex-col overflow-hidden animate-fadeIn">
            {/* Action Bar */}
            <div className="p-6 border-b backdrop-blur-sm" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <Activity className="w-32 h-32 text-purple-500" />
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <Pill className="h-7 w-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                                Protocol Engine
                            </h2>
                            <p className="text-xs font-medium opacity-50" style={{ color: 'var(--text-muted)' }}>
                                {schedules.length} clinical plans active
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex bg-[var(--bg-primary)] p-1 rounded-xl border border-[var(--border-color)]">
                            {['all', 'active'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all uppercase ${activeTab === tab ? 'bg-purple-500 text-white shadow-md' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <select
                            value={filterPatient}
                            onChange={(e) => setFilterPatient(e.target.value)}
                            className="h-11 px-4 rounded-xl border-2 text-sm font-bold focus:ring-4 focus:ring-purple-500/10 transition-all outline-none"
                            style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                        >
                            <option value="all">Global View</option>
                            {patients.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>

                        <button
                            onClick={openAddModal}
                            className="h-11 flex items-center gap-2 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-black text-xs uppercase tracking-widest hover:scale-[1.05] active:scale-[0.95] transition-all shadow-lg shadow-purple-500/20"
                        >
                            <Plus className="h-4 w-4" />
                            Manage Protocols
                        </button>
                    </div>
                </div>
            </div>

            {/* List area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {loading && schedules.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-purple-500 mb-4" />
                        <p className="font-bold uppercase tracking-widest text-xs">Syncing Medical Records...</p>
                    </div>
                ) : filteredSchedules.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] py-20 bg-[var(--bg-primary)] rounded-3xl border-2 border-dashed border-[var(--border-color)] opacity-60">
                        <Calendar className="h-16 w-16 mb-4 opacity-20" />
                        <p className="font-bold text-lg">No medications assigned</p>
                    </div>
                ) : (
                    filteredSchedules.map(schedule => (
                        <div
                            key={schedule.id}
                            className={`group flex items-center justify-between p-5 rounded-3xl transition-all border-2 ${schedule.enabled ? 'hover:border-purple-500/50 bg-[var(--bg-secondary)]' : 'bg-[var(--bg-primary)] grayscale opacity-60 border-transparent'}`}
                            style={{ borderColor: schedule.enabled ? 'var(--border-color)' : 'transparent' }}
                        >
                            <div className="flex items-center gap-5">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${schedule.enabled ? 'bg-purple-500/10 text-purple-500' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                                    <Pill className="h-7 w-7" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h4 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{schedule.medicine}</h4>
                                        <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-purple-500/10 text-purple-500">{schedule.dosage}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs font-bold mt-1" style={{ color: 'var(--text-muted)' }}>
                                        <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 opacity-50" /> {schedule.patientName}</span>
                                        <div className="w-1 h-1 rounded-full bg-[var(--border-color)]" />
                                        <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 opacity-50" /> {schedule.times[0]}</span>
                                        <div className="w-1 h-1 rounded-full bg-[var(--border-color)]" />
                                        <span className="flex items-center gap-1.5 uppercase tracking-widest">Slot {schedule.slot}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => toggleStatus(schedule)} className={`w-10 h-10 flex items-center justify-center rounded-xl ${schedule.enabled ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                                    <Check className="h-5 w-5" />
                                </button>
                                <button onClick={() => openEditModal(schedule)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-500/20">
                                    <Edit className="h-5 w-5" />
                                </button>
                                <button onClick={() => handleDelete(schedule.id)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500 text-white shadow-lg shadow-red-500/20">
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Quad-Slot Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-md animate-fadeIn" onClick={() => setIsModalOpen(false)} />

                    <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl p-8 shadow-2xl animate-zoomIn border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
                                    <Activity className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                        Medicine Schedule
                                    </h3>
                                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                        Configure 4-slot dispenser for patient
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--text-muted)] hover:text-red-500">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Patient Selector */}
                        <div className="mb-6 p-5 rounded-2xl border" style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
                            <label className="block text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Select Patient</label>
                            <select
                                value={selectedPatientId}
                                onChange={(e) => setSelectedPatientId(e.target.value)}
                                className="w-full h-14 px-5 rounded-xl border-2 text-base font-semibold focus:ring-4 focus:ring-purple-500/20 outline-none transition-all"
                                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                            >
                                <option value="">Choose a patient...</option>
                                {patients.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} • Device: {p.device_id || 'LOCAL'}</option>
                                ))}
                            </select>
                        </div>

                        {/* Quad Slot Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {slotsData.map((slot, idx) => (
                                <div
                                    key={slot.slot}
                                    className={`p-5 rounded-2xl border-2 transition-all ${slot.enabled
                                        ? 'border-purple-400 dark:border-purple-500 bg-purple-50 dark:bg-purple-900/10'
                                        : 'border-transparent bg-gray-50 dark:bg-slate-800/50 opacity-70'
                                        }`}
                                    style={{ borderColor: slot.enabled ? undefined : 'var(--border-color)' }}
                                >
                                    {/* Slot Header */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${slot.enabled
                                                ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30'
                                                : 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
                                                }`}>
                                                {slot.slot}
                                            </div>
                                            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                                                Slot {slot.slot}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const newSlots = [...slotsData]
                                                newSlots[idx].enabled = !newSlots[idx].enabled
                                                setSlotsData(newSlots)
                                            }}
                                            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${slot.enabled
                                                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                                                : 'bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-slate-500'
                                                }`}
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Slot Fields */}
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Medicine Name</label>
                                            <input
                                                type="text"
                                                value={slot.medicine}
                                                onChange={(e) => {
                                                    const newSlots = [...slotsData]
                                                    newSlots[idx].medicine = e.target.value
                                                    if (e.target.value) newSlots[idx].enabled = true
                                                    setSlotsData(newSlots)
                                                }}
                                                placeholder="e.g. Metformin 500mg"
                                                className="w-full h-11 px-4 rounded-xl border text-sm font-medium focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                                                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Dispense Time</label>
                                            <input
                                                type="time"
                                                value={slot.time}
                                                onChange={(e) => {
                                                    const newSlots = [...slotsData]
                                                    newSlots[idx].time = e.target.value
                                                    setSlotsData(newSlots)
                                                }}
                                                className="w-full h-11 px-3 rounded-xl border text-sm font-medium focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                                                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 h-14 rounded-2xl font-semibold text-sm transition-all border-2 hover:bg-gray-50 dark:hover:bg-slate-800"
                                style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!selectedPatientId || loading}
                                className="flex-[2] h-14 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold text-sm shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all"
                            >
                                {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                                <Pill className="h-4 w-4" />
                                Save Schedule
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
