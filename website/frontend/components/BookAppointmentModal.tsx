'use client'

import React, { useState, useEffect } from 'react'
import { X, Calendar, Clock, MapPin, User, Save, Loader2, Stethoscope } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useTheme } from '@/lib/theme-context'
import { useDemoMode } from '@/lib/demo-context'

interface BookAppointmentModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    editData?: any // If provided, we are editing
}

export default function BookAppointmentModal({ isOpen, onClose, onSuccess, editData }: BookAppointmentModalProps) {
    const { t } = useTheme()
    const { isDemoMode } = useDemoMode()
    const [loading, setLoading] = useState(false)
    const [patients, setPatients] = useState<any[]>([])

    const [formData, setFormData] = useState({
        patient_id: '',
        doctor_name: 'Dr. Sharma', // Default
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        type: 'General Checkup',
        location: 'PHC Main Hall',
        status: 'confirmed'
    })

    // Fetch patients for dropdown
    useEffect(() => {
        if (isOpen) {
            const fetchPatients = async () => {
                const { data } = await supabase.from('patients').select('id, name')
                if (data) setPatients(data)
            }
            fetchPatients()
        }
    }, [isOpen])

    // Pre-fill form if editing
    useEffect(() => {
        if (editData) {
            const dt = new Date(editData.scheduled_time || editData.time) // Handle both raw DB and UI formats
            setFormData({
                patient_id: editData.patient_id || '',
                doctor_name: editData.doctor_name || 'Dr. Sharma',
                date: dt.toISOString().split('T')[0],
                time: dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
                type: editData.type || 'General Checkup',
                location: editData.location || 'PHC Main Hall',
                status: editData.status || 'confirmed'
            })
        } else {
            // Reset form
            setFormData({
                patient_id: '',
                doctor_name: 'Dr. Sharma',
                date: new Date().toISOString().split('T')[0],
                time: '09:00',
                type: 'General Checkup',
                location: 'PHC Main Hall',
                status: 'confirmed'
            })
        }
    }, [editData, isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Combine date and time
            const scheduled_time = new Date(`${formData.date}T${formData.time}`).toISOString()

            const payload = {
                patient_id: formData.patient_id,
                doctor_name: formData.doctor_name,
                scheduled_time,
                type: formData.type,
                location: formData.location,
                status: formData.status
            }

            if (isDemoMode) {
                // Simulate network delay
                await new Promise(resolve => setTimeout(resolve, 600))

                // Get existing demo appointments
                const savedDemoData = localStorage.getItem('demo_appointments')
                let currentAppointments = savedDemoData ? JSON.parse(savedDemoData) : []

                if (editData?.id) {
                    // Update in Local Storage
                    currentAppointments = currentAppointments.map((apt: any) =>
                        apt.id == editData.id ? { ...apt, ...payload, id: editData.id } : apt
                    )
                } else {
                    // Insert into Local Storage
                    const newId = Math.floor(Math.random() * 10000)
                    const patientName = patients.find(p => p.id === formData.patient_id)?.name || 'Unknown Patient'
                    currentAppointments.push({ ...payload, id: newId, patient: patientName, patients: { name: patientName } })
                }

                localStorage.setItem('demo_appointments', JSON.stringify(currentAppointments))
                onSuccess()
                onClose()
                setLoading(false)
                return
            }

            if (editData?.id) {
                // Update Supabase
                const { error } = await supabase
                    .from('appointments')
                    .update(payload)
                    .eq('id', editData.id)
                if (error) throw error
            } else {
                // Insert Supabase
                const { error } = await supabase
                    .from('appointments')
                    .insert([payload])
                if (error) throw error
            }

            onSuccess()
            onClose()
        } catch (error: any) {
            alert('Error saving appointment: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 overflow-hidden">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        {editData ? 'Edit Appointment' : 'Schedule Appointment'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X className="h-5 w-5 text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    {/* Patient Selection */}
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Select Patient</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <select
                                required
                                value={formData.patient_id}
                                onChange={e => setFormData({ ...formData, patient_id: e.target.value })}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none"
                            >
                                <option value="">Select a patient...</option>
                                {patients.length > 0 ? (
                                    patients.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))
                                ) : (
                                    <option disabled>No patients found. Add one first.</option>
                                )}
                            </select>
                        </div>
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <input
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Time</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <input
                                    type="time"
                                    required
                                    value={formData.time}
                                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                                    style={{ colorScheme: 'dark' }} // Force dark calendar picker
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Type & Doctor */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Appointment Type</label>
                            <select
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option>General Checkup</option>
                                <option>Follow-up</option>
                                <option>Lab Test</option>
                                <option>Vaccination</option>
                                <option>Counseling</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Doctor</label>
                            <div className="relative">
                                <Stethoscope className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={formData.doctor_name}
                                    onChange={e => setFormData({ ...formData, doctor_name: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Location & Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Location</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <select
                                    value={formData.location}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option>PHC Main Hall</option>
                                    <option>Room 1</option>
                                    <option>Room 2</option>
                                    <option>Lab</option>
                                    <option>Home Visit</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Status</label>
                            <select
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                                className={`w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold outline-none focus:ring-2 focus:ring-blue-500
                                    ${formData.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' :
                                        formData.status === 'pending' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' : 'bg-red-50 text-red-700 dark:bg-red-900/50 dark:text-red-300'}
                                `}
                            >
                                <option value="confirmed">Confirmed</option>
                                <option value="pending">Pending</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                            {editData ? 'Update Schedule' : 'Book Appointment'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    )
}
