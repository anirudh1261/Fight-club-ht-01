'use client'
import { useState, useEffect } from 'react'
import { Plus, X, Activity, Thermometer, Droplets, Check } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useDemoMode } from '@/lib/demo-context'

export default function VitalsEntryModal({ onClose }: { onClose: () => void }) {
    const { isDemoMode } = useDemoMode()
    const [step, setStep] = useState(1)
    const [submitted, setSubmitted] = useState(false)
    const [patients, setPatients] = useState<any[]>([])
    const [selectedPatientId, setSelectedPatientId] = useState('')
    const [bpSys, setBpSys] = useState('')
    const [bpDia, setBpDia] = useState('')
    const [bloodSugar, setBloodSugar] = useState('')
    const [notes, setNotes] = useState('')

    useEffect(() => {
        if (isDemoMode) {
            const demoPatients = [
                { id: 'P-001', name: 'Lakshmi Devi' },
                { id: 'P-002', name: 'Venkata Rao' },
                { id: 'P-003', name: 'Savitri Amma' },
            ]
            setPatients(demoPatients)
            setSelectedPatientId(demoPatients[0].id)
            return
        }
        const fetchPatients = async () => {
            const { data, error } = await supabase.from('patients').select('id, name')
            if (data && !error) {
                setPatients(data)
                if (data.length > 0) setSelectedPatientId(data[0].id)
            }
        }
        fetchPatients()
    }, [isDemoMode])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (isDemoMode) {
            setSubmitted(true)
            setTimeout(() => {
                onClose()
            }, 2000)
            return
        }

        const { error } = await supabase.from('vitals').insert([{
            patient_id: selectedPatientId,
            blood_pressure: `${bpSys}/${bpDia}`,
            blood_sugar: parseInt(bloodSugar) || null,
            clinical_notes: notes,
            timestamp: new Date().toISOString()
        }])

        if (!error) {
            setSubmitted(true)
            setTimeout(() => {
                onClose()
            }, 2000)
        } else {
            console.error('Error saving vitals:', error)
            alert('Failed to save vitals')
        }
    }

    if (submitted) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl border border-emerald-500/20">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4 animate-scaleIn">
                        <Check className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Vitals Recorded!</h3>
                    <p className="text-muted-foreground text-sm">Data synced to Health Cloud & updated in Patient Stats.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-border animate-scaleIn relative overflow-hidden">
                {/* Header */}
                <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                            <Plus className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Add Patient Vitals</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">ASHA Worker: Rekha (ID: 402)</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white dark:bg-slate-900">
                    {/* Patient Selector (Mock) */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Select Patient</label>
                        <select
                            value={selectedPatientId}
                            onChange={(e) => setSelectedPatientId(e.target.value)}
                            className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        >
                            {patients.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Manual Clinic Checks</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                    <Activity className="h-4 w-4 text-red-500" /> BP (Sys/Dia)
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={bpSys}
                                        onChange={(e) => setBpSys(e.target.value)}
                                        placeholder="120"
                                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                                        required
                                    />
                                    <span className="text-xl text-slate-400 dark:text-slate-600">/</span>
                                    <input
                                        type="number"
                                        value={bpDia}
                                        onChange={(e) => setBpDia(e.target.value)}
                                        placeholder="80"
                                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                                        required
                                    />
                                </div>
                                <p className="text-[9px] text-slate-400 dark:text-slate-500 italic">* Manual testing required</p>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                    <Droplets className="h-4 w-4 text-blue-500" /> Blood Sugar
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={bloodSugar}
                                        onChange={(e) => setBloodSugar(e.target.value)}
                                        placeholder="110"
                                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pr-8 font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                                    />
                                    <span className="absolute right-3 top-2.5 text-xs text-slate-500 dark:text-slate-400 font-medium">mg/dL</span>
                                </div>
                                <p className="text-[9px] text-slate-400 dark:text-slate-500 italic">* Strip test results</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Clinical Notes / Symptoms</label>
                        <textarea
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Patient reports dizziness or headaches..."
                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm resize-none focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                        />
                    </div>

                    <div className="pt-2">
                        <button type="submit" className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transform hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                            <Check className="h-5 w-5" />
                            Use Vitals
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
