'use client'

import { FileText, Upload, Download, Search, Calendar, User, AlertCircle, Loader2 } from 'lucide-react'
import { useTheme } from '@/lib/theme-context'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useDemoMode } from '@/lib/demo-context'

const records = [
    { id: 1, patient: 'Rajesh Kumar', type: 'Lab Report', date: '2025-02-05', doctor: 'Dr. Sharma', status: 'complete', condition: 'Diabetes Type 2' },
    { id: 2, patient: 'Sunita Devi', type: 'X-Ray', date: '2025-02-04', doctor: 'Dr. Patel', status: 'pending', condition: 'Hypertension' },
    { id: 3, patient: 'Amit Singh', type: 'Blood Test', date: '2025-02-03', doctor: 'Dr. Kumar', status: 'complete', condition: 'General Checkup' },
    { id: 4, patient: 'Lakshmi Devi', type: 'ECG Report', date: '2025-02-02', doctor: 'Dr. Sharma', status: 'complete', condition: 'Heart Monitoring' },
    { id: 5, patient: 'Ravi Kumar', type: 'MRI Scan', date: '2025-02-01', doctor: 'Dr. Reddy', status: 'review', condition: 'High Cholesterol' },
]

const statusColors = {
    complete: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    review: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
}

export default function MedicalRecordsPage() {
    const { t } = useTheme()
    const { isDemoMode } = useDemoMode()
    const [medicalRecords, setMedicalRecords] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchRecords = async () => {
            setLoading(true)
            if (isDemoMode) {
                // Use hardcoded mock data for demo
                setMedicalRecords(records)
                setLoading(false)
                return
            }

            // Fetch real data
            const { data, error } = await supabase
                .from('patient_records')
                .select(`
                    *,
                    patients (name, conditions)
                `)
                .order('record_date', { ascending: false })

            if (data && !error) {
                const formatted = data.map((r: any) => ({
                    id: r.id,
                    patient: r.patients?.name || 'Unknown',
                    type: r.category || 'General',
                    date: r.record_date ? new Date(r.record_date).toISOString().split('T')[0] : 'N/A',
                    doctor: r.doctor_name || 'Dr. Assigned',
                    status: 'complete', // Records are usually past events
                    condition: r.patients?.conditions?.[0] || 'Routine Checkup',
                    file_url: r.file_url
                }))
                setMedicalRecords(formatted)
            } else {
                console.error('Error fetching records:', error)
            }
            setLoading(false)
        }

        fetchRecords()
    }, [isDemoMode])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--foreground)]">{t('records')}</h1>
                    <p className="mt-1 text-[var(--muted-foreground)]">View and manage patient medical histories</p>
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium hover:opacity-90 transition-all shadow-lg hover:shadow-xl">
                    <Upload className="h-5 w-5" />
                    Upload Record
                </button>
            </div>

            {/* Search and Filters */}
            <div className="glass-card rounded-2xl p-4">
                <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--muted-foreground)]" />
                        <input
                            type="text"
                            placeholder="Search records by patient name or type..."
                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-[var(--muted)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        />
                    </div>
                    <select className="px-4 py-3 rounded-xl bg-[var(--muted)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
                        <option>All Types</option>
                        <option>Lab Report</option>
                        <option>X-Ray</option>
                        <option>Blood Test</option>
                        <option>ECG Report</option>
                    </select>
                </div>
            </div>

            {/* Records Table */}
            <div className="glass-card rounded-2xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-[var(--muted)]">
                        <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--foreground)]">Patient</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--foreground)]">Record Type</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--foreground)]">Condition</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--foreground)]">Date</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--foreground)]">Doctor</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--foreground)]">Status</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--foreground)]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-[var(--muted-foreground)]">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                        <p>Loading records...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : medicalRecords.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-[var(--muted-foreground)] italic">
                                    No records found
                                </td>
                            </tr>
                        ) : (
                            medicalRecords.map((record) => (
                                <tr key={record.id} className="hover:bg-[var(--muted)] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold">
                                                {record.patient.charAt(0)}
                                            </div>
                                            <span className="font-medium text-[var(--foreground)]">{record.patient}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-[var(--muted-foreground)]" />
                                            <span className="text-[var(--foreground)]">{record.type}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-[var(--muted-foreground)]">{record.condition}</td>
                                    <td className="px-6 py-4 text-[var(--muted-foreground)]">{record.date}</td>
                                    <td className="px-6 py-4 text-[var(--foreground)]">{record.doctor}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[record.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
                                            {record.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-500 transition-colors">
                                            <Download className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
