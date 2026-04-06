'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Upload, FileText, Image as ImageIcon, Trash2, Loader2, Eye, Download } from 'lucide-react'
import { supabase, isSupabaseLive } from '@/lib/supabaseClient'

interface PatientRecord {
    id: string
    file_name: string
    file_url: string
    file_type: 'image' | 'pdf'
    created_at: string
}

interface RecordUploadModalProps {
    isOpen: boolean
    onClose: () => void
    patientId: string
    patientName: string
}

export default function RecordUploadModal({ isOpen, onClose, patientId, patientName }: RecordUploadModalProps) {
    const [records, setRecords] = useState<PatientRecord[]>([])
    const [uploading, setUploading] = useState(false)
    const [loading, setLoading] = useState(true)

    // New State for Metadata & Selected File
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [metadata, setMetadata] = useState({
        category: 'Prescription',
        doctorName: '',
        recordDate: new Date().toISOString().split('T')[0]
    })

    useEffect(() => {
        if (isOpen && patientId) {
            fetchRecords()
            // Reset state on open
            setSelectedFile(null)
            setMetadata({
                category: 'Prescription',
                doctorName: '',
                recordDate: new Date().toISOString().split('T')[0]
            })
        }
    }, [isOpen, patientId])

    const fetchRecords = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/local-db?table=patient_records&eqCol=patient_id&eqVal=${patientId}`)
            if (res.ok) {
                const { data } = await res.json()
                if (data) setRecords(data)
            }
        } catch (err) {
            console.error('Error fetching records:', err)
        }
        setLoading(false)
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        const isImage = file.type.startsWith('image/')
        const isPdf = file.type === 'application/pdf'

        if (!isImage && !isPdf) {
            alert('Please upload an image or a PDF file.')
            return
        }

        setSelectedFile(file)
    }

    const handleUpload = async () => {
        if (!selectedFile) return

        setUploading(true)
        try {
            // 1. Upload to Local Storage API
            const formData = new FormData()
            formData.append('file', selectedFile)
            formData.append('path', `records/${patientId}/${Date.now()}_${selectedFile.name}`)

            const uploadRes = await fetch('/api/local-storage', {
                method: 'POST',
                body: formData
            })

            if (!uploadRes.ok) throw new Error('Local upload failed')
            const { url: publicUrl } = await uploadRes.json()

            // 2. Save Metadata to Local DB
            const dbRes = await fetch('/api/local-db', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    table: 'patient_records',
                    action: 'insert',
                    data: {
                        id: `REC-${Math.floor(Math.random() * 10000)}`,
                        patient_id: patientId,
                        file_name: selectedFile.name,
                        file_url: publicUrl,
                        file_type: selectedFile.type === 'application/pdf' ? 'pdf' : 'image',
                        category: metadata.category,
                        doctor_name: metadata.doctorName,
                        record_date: metadata.recordDate,
                        created_at: new Date().toISOString()
                    }
                })
            })

            if (!dbRes.ok) throw new Error('Database entry failed')

            // Success
            fetchRecords()
            setSelectedFile(null)
            setMetadata({ ...metadata, doctorName: '' })
        } catch (error) {
            console.error('Error uploading record:', error)
            alert('Failed to upload record locally')
        } finally {
            setUploading(false)
        }
    }

    const handleDelete = async (recordId: string, fileUrl: string) => {
        if (!confirm('Are you sure you want to delete this record?')) return

        try {
            // Delete from Local DB
            const res = await fetch('/api/local-db', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    table: 'patient_records',
                    action: 'delete',
                    eqCol: 'id',
                    eqVal: recordId
                })
            })

            if (!res.ok) throw new Error('Delete failed')

            setRecords(prev => prev.filter(r => r.id !== recordId))
        } catch (error) {
            console.error('Error deleting record:', error)
            alert('Failed to delete record')
        }
    }

    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    if (!isOpen || !mounted) return null

    return createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-start justify-center z-[9999] p-4 pt-10 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full my-4 flex flex-col border border-slate-200 dark:border-slate-800 animate-fadeIn relative">
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10 rounded-t-2xl">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Patient Records</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Records for <span className="font-semibold text-teal-600 dark:text-teal-400">{patientName}</span></p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X className="h-6 w-6 text-slate-500 hover:text-red-500" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[75vh] custom-scrollbar">
                    {/* New Upload Section */}
                    <div className="mb-8 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                        {!selectedFile ? (
                            <label className="flex flex-col items-center justify-center w-full h-32 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all rounded-xl group relative overflow-hidden">
                                <div className="absolute inset-0 bg-teal-500/5 group-hover:bg-teal-500/10 transition-colors" />
                                <div className="p-4 bg-white dark:bg-slate-900 rounded-full shadow-lg mb-3 group-hover:scale-110 transition-transform">
                                    <Upload className="h-6 w-6 text-teal-500" />
                                </div>
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 z-10">Click to Upload New Record</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 z-10">PDF, JPG, PNG (Max 5MB)</span>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*,application/pdf"
                                    onChange={handleFileSelect}
                                />
                            </label>
                        ) : (
                            <div className="space-y-4 animate-fadeIn">
                                <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-teal-50 dark:bg-teal-900/30 rounded-xl border border-teal-100 dark:border-teal-800">
                                            {selectedFile.type === 'application/pdf' ? <FileText className="h-6 w-6 text-teal-600 dark:text-teal-400" /> : <ImageIcon className="h-6 w-6 text-teal-600 dark:text-teal-400" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold truncate max-w-[200px] text-slate-900 dark:text-white">{selectedFile.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{(selectedFile.size / 1024).toFixed(0)} KB • Ready to upload</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedFile(null)} className="px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                        Remove
                                    </button>
                                </div>

                                {/* Metadata Inputs */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block text-slate-500 dark:text-slate-400">Category</label>
                                        <select
                                            className="w-full px-4 py-2.5 text-sm rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all font-medium"
                                            value={metadata.category}
                                            onChange={(e) => setMetadata({ ...metadata, category: e.target.value })}
                                        >
                                            <option>Prescription</option>
                                            <option>Lab Report</option>
                                            <option>X-Ray / Scan</option>
                                            <option>Discharge Summary</option>
                                            <option>Insurance</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block text-slate-500 dark:text-slate-400">Date</label>
                                        <input
                                            type="date"
                                            className="w-full px-4 py-2.5 text-sm rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all font-medium"
                                            value={metadata.recordDate}
                                            onChange={(e) => setMetadata({ ...metadata, recordDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block text-slate-500 dark:text-slate-400">Doctor / Hospital Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Dr. Rajesh, Apollo Hospital"
                                            className="w-full px-4 py-2.5 text-sm rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all placeholder:text-slate-400 font-medium"
                                            value={metadata.doctorName}
                                            onChange={(e) => setMetadata({ ...metadata, doctorName: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleUpload}
                                    disabled={uploading}
                                    className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                                    {uploading ? 'Uploading Document...' : 'Confirm Upload'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Records List */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                                Stored Documents ({records.length})
                            </h3>
                            {loading && <Loader2 className="h-4 w-4 text-teal-500 animate-spin" />}
                        </div>

                        {!loading && records.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
                                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FileText className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                                </div>
                                <h4 className="font-bold text-slate-700 dark:text-slate-300">No records found</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Uploaded documents will appear here</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {records.map((record: any) => (
                                    <div
                                        key={record.id}
                                        className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 group hover:border-teal-500/50 dark:hover:border-teal-500/50 transition-all hover:shadow-lg hover:shadow-teal-500/5"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-xl ${record.file_type === 'pdf' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'}`}>
                                                {record.file_type === 'pdf' ? <FileText className="h-6 w-6" /> : <ImageIcon className="h-6 w-6" />}
                                            </div>
                                            <div>
                                                <p className="font-bold truncate max-w-[250px] text-slate-900 dark:text-white text-sm">
                                                    {record.category || 'Document'}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                    {record.doctor_name && (
                                                        <>
                                                            <span className="font-medium text-slate-700 dark:text-slate-300">{record.doctor_name}</span>
                                                            <span>•</span>
                                                        </>
                                                    )}
                                                    <span>{record.record_date ? new Date(record.record_date).toLocaleDateString() : new Date(record.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <a
                                                href={record.file_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:text-teal-600 dark:hover:text-teal-400 font-bold text-xs transition-colors flex items-center gap-2"
                                            >
                                                <Eye className="h-3.5 w-3.5" /> View
                                            </a>
                                            <button
                                                onClick={() => handleDelete(record.id, record.file_url)}
                                                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-400 hover:text-red-600 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="w-full py-3 font-bold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(156, 163, 175, 0.5);
                    border-radius: 20px;
                }
            `}</style>
        </div>,
        document.body
    )
}
