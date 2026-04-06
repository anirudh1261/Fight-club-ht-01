'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, Edit2, Trash2, Salad, Heart, Activity, Phone, MapPin, AlertCircle, X, FileText, RefreshCw } from 'lucide-react'
import AddPatientModal from '@/components/AddPatientModal'
import DietaryModal from '@/components/DietaryModal'
import CallModal from '@/components/CallModal'
import RecordUploadModal from '@/components/RecordUploadModal'
import { useTheme } from '@/lib/theme-context'
import { supabase } from '@/lib/supabaseClient'
import { useDemoMode } from '@/lib/demo-context'
import { generateDemoPatients } from '@/lib/demo-data'

// Define Patient Interface
export interface Patient {
    id: string
    name: string
    age: number | string
    gender: string
    deviceStatus: 'online' | 'offline'
    lastReading: string
    hr: number
    spo2: number
    phone: string
    village: string
    allergies: string[]
    conditions: string[]
    emergencyContact: string
    bloodGroup: string
    language: string
    abhaId?: string
    rationCardType?: string
    familyHeadName?: string
}

// Mock care team (Static for now, could be moved to DB later)
const careTeam = {
    ashaWorker: { name: 'Priya Sharma', phone: '+91 98765 43220' },
    doctor: { name: 'Dr. Arun Sharma', phone: '+91 98765 43221' },
}

export default function PatientsPage() {
    const [patients, setPatients] = useState<Patient[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [editingPatient, setEditingPatient] = useState<Patient | null>(null)
    const [dietaryModalData, setDietaryModalData] = useState<{ isOpen: boolean; patient?: Patient }>({ isOpen: false })
    const [callModalData, setCallModalData] = useState<{ isOpen: boolean; patient?: Patient }>({ isOpen: false })
    const [isRecordModalOpen, setIsRecordModalOpen] = useState(false)
    const [selectedPatient, setSelectedPatient] = useState<{ id: string, name: string } | null>(null)
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
    const { t } = useTheme()
    const { isDemoMode } = useDemoMode()

    // Fetch Patients from Local DB
    const fetchPatients = async () => {
        setLoading(true)

        if (isDemoMode) {
            await new Promise(resolve => setTimeout(resolve, 500))
            const demoData = generateDemoPatients()
            setPatients(demoData)
            setLoading(false)
            return
        }

        try {
            const res = await fetch('/api/local-db?table=patients')
            if (!res.ok) throw new Error('Failed to fetch')
            const { data } = await res.json()
            
            if (data) {
                const mapped: Patient[] = data.map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    age: p.age || '-',
                    gender: p.gender || '-',
                    deviceStatus: p.status === 'offline' ? 'offline' : 'online',
                    lastReading: 'Sync active',
                    hr: p.lastVitals?.hr || 0,
                    spo2: p.lastVitals?.spo2 || 0,
                    phone: p.phone || '-',
                    village: p.village || '-',
                    allergies: p.allergies || [],
                    conditions: p.conditions || [],
                    emergencyContact: p.emergencyContact || '-',
                    bloodGroup: p.blood_group || p.bloodGroup || '-',
                    language: 'hi',
                    abhaId: p.abha_id || p.abhaId,
                    rationCardType: p.ration_card_type || p.rationCardType,
                    familyHeadName: p.family_head_name || p.familyHeadName
                }))
                
                // STRICT DATA ISOLATION: Hide all Simulated Demo patients when not in Demo Mode
                const realPatients = mapped.filter(p => !p.id.match(/^P-0[0-4]\d$/) && !p.id.match(/^P-050$/))
                
                setPatients(realPatients)
            }
        } catch (err) {
            console.error('Error fetching patients:', err)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchPatients()
    }, [isDemoMode])

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Add new patient
    const handleAddPatient = async (patientData: any) => {
        const payload = {
            id: `P-${Math.floor(Math.random() * 900) + 100}`,
            ...patientData,
            status: 'online',
            created_at: new Date().toISOString()
        }

        if (isDemoMode) {
            const { registerDemoPatient } = await import('@/lib/demo-data')
            const updatedPatient = registerDemoPatient(payload)
            
            // IMMEDIATE SYNC: Broadcast to UI and Hardware
            const hr = 70 + Math.floor(Math.random() * 10)
            const spo2 = 96 + Math.floor(Math.random() * 4)

            // 1. Update UI Map/Registry
            window.dispatchEvent(new CustomEvent('vitals-update', {
                detail: {
                    deviceId: updatedPatient.id,
                    patientName: updatedPatient.name,
                    village: updatedPatient.village,
                    hr,
                    spo2,
                    lat: updatedPatient.lat,
                    lng: updatedPatient.lng,
                    status: 'normal',
                    isDemo: true
                }
            }))

            // 2. Update Hardware OLED
            fetch('/api/local-db', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    table: 'commands',
                    action: 'insert',
                    data: {
                        device_id: 'GATEWAY',
                        cmd: 'update_vitals',
                        hr,
                        oxy: spo2,
                        node: updatedPatient.name,
                        status: 'pending'
                    }
                })
            })

            fetchPatients()
            setIsAddModalOpen(false)
            return
        }

        const res = await fetch('/api/local-db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ table: 'patients', action: 'insert', data: payload })
        })

        if (!res.ok) {
            alert('Failed to register patient locally')
        } else {
            fetchPatients()
            setIsAddModalOpen(false)
        }
    }

    // Edit existing patient
    const handleEditPatient = async (patientData: any) => {
        const res = await fetch('/api/local-db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                table: 'patients', 
                action: 'update', 
                data: patientData, 
                eqCol: 'id', 
                eqVal: editingPatient?.id 
            })
        })

        if (!res.ok) {
            alert('Failed to update patient')
        } else {
            fetchPatients()
            setEditingPatient(null)
        }
    }

    // Delete patient
    const handleDeletePatient = async (id: string) => {
        const res = await fetch('/api/local-db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ table: 'patients', action: 'delete', eqCol: 'id', eqVal: id })
        })

        if (!res.ok) {
            alert('Failed to delete patient')
        } else {
            fetchPatients()
            setDeleteConfirm(null)
        }
    }

    // Open edit modal
    const openEditModal = (patient: Patient) => {
        setEditingPatient(patient)
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="card p-6 rounded-2xl max-w-sm w-full" style={{ background: 'var(--bg-card)' }}>
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <Trash2 className="h-8 w-8 text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Delete Patient?</h3>
                            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                                This will permanently remove {patients.find(p => p.id === deleteConfirm)?.name} from the system.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 py-2 rounded-xl border"
                                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDeletePatient(deleteConfirm)}
                                    className="flex-1 py-2 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        {t('patients')} Registry
                    </h1>
                    <p className="mt-2 text-lg" style={{ color: 'var(--text-secondary)' }}>
                        Manage patient records and device assignments • {patients.length} patients registered
                    </p>
                </div>
                <div className="flex gap-3">
                    {isDemoMode && (
                        <button
                            onClick={async () => {
                                const { reloadDemoData } = await import('@/lib/demo-data')
                                reloadDemoData()
                                fetchPatients()
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-3 rounded-xl border border-slate-700 transition-all flex items-center gap-2"
                            title="Reset Demo Data"
                        >
                            <RefreshCw className="h-5 w-5" />
                        </button>
                    )}
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus className="h-5 w-5" />
                        {t('addPatient')}
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>Total Patients</p>
                            <p className="text-3xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{patients.length}</p>
                        </div>
                        <div className="p-3 rounded-xl stat-teal">
                            <Heart className="h-6 w-6 text-white" />
                        </div>
                    </div>
                </div>
                {/* Other stats cards remain similar, could be enhanced with real aggregations later */}
                <div className="card p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>Online Devices</p>
                            <p className="text-3xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                                {patients.filter(p => p.deviceStatus === 'online').length}
                            </p>
                        </div>
                        <div className="p-3 rounded-xl stat-emerald">
                            <Activity className="h-6 w-6 text-white" />
                        </div>
                    </div>
                </div>
                <div className="card p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>Offline Devices</p>
                            <p className="text-3xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                                {patients.filter(p => p.deviceStatus === 'offline').length}
                            </p>
                        </div>
                        <div className="p-3 rounded-xl stat-amber">
                            <AlertCircle className="h-6 w-6 text-white" />
                        </div>
                    </div>
                </div>
                <div className="card p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>Critical Patients</p>
                            <p className="text-3xl font-bold mt-1 text-red-500">
                                {patients.filter(p => p.hr > 100 || p.spo2 < 90).length}
                            </p>
                        </div>
                        <div className="p-3 rounded-xl stat-red">
                            <AlertCircle className="h-6 w-6 text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="card p-4">
                <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder={t('search')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3"
                        />
                    </div>
                    {/* Filters could be made functional later */}
                    <select className="px-4 py-3">
                        <option>All Status</option>
                        <option>Online</option>
                        <option>Offline</option>
                    </select>
                    <select className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500/50">
                        <option>All Villages</option>
                        <option>Hanamkonda</option>
                        <option>Kazipet</option>
                        <option>Waddepally</option>
                        <option>Darga</option>
                        <option>Bheemaram</option>
                    </select>
                </div>
            </div>

            {/* Patients Table */}
            <div className="card overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="table-header">
                            <th className="px-6 py-4 text-left">Patient</th>
                            <th className="px-6 py-4 text-left">Contact & Family</th>
                            <th className="px-6 py-4 text-left">Device Status</th>
                            <th className="px-6 py-4 text-left">Last Reading</th>
                            <th className="px-6 py-4 text-left">Vitals</th>
                            <th className="px-6 py-4 text-left">Conditions / Ration</th>
                            <th className="px-6 py-4 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center" style={{ color: 'var(--text-muted)' }}>
                                    Loading...
                                </td>
                            </tr>
                        ) : filteredPatients.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center" style={{ color: 'var(--text-muted)' }}>
                                    No patients found.
                                </td>
                            </tr>
                        ) : (
                            filteredPatients.map((patient) => (
                                <tr key={patient.id} className="table-row">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full stat-teal flex items-center justify-center text-white font-bold text-lg">
                                                {patient.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{patient.name}</p>
                                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                                    {patient.age} yrs • {patient.gender} • {patient.id}
                                                </p>
                                                {patient.abhaId && (
                                                    <p className="text-xs font-mono text-teal-600 mt-0.5">
                                                        🆔 {patient.abhaId}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            <button
                                                onClick={() => setCallModalData({ isOpen: true, patient })}
                                                className="flex items-center gap-2 text-sm hover:text-teal-500 transition-colors"
                                                style={{ color: 'var(--text-primary)' }}
                                            >
                                                <Phone className="h-4 w-4 text-teal-500" />
                                                {patient.phone}
                                            </button>
                                            <p className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                                                <MapPin className="h-4 w-4" />
                                                {patient.village}
                                            </p>
                                            {patient.familyHeadName && patient.familyHeadName !== 'Self' && (
                                                <p className="text-xs text-gray-500">
                                                    C/O {patient.familyHeadName}
                                                </p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className={patient.deviceStatus === 'online' ? 'status-online' : 'status-offline'} />
                                            <span className={`font-semibold ${patient.deviceStatus === 'online' ? 'text-emerald-600' : 'text-gray-500'}`}>
                                                {patient.deviceStatus === 'online' ? 'Online' : 'Offline'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4" style={{ color: 'var(--text-secondary)' }}>
                                        {patient.lastReading}
                                    </td>
                                    <td className="px-6 py-4">
                                        {patient.deviceStatus === 'online' ? (
                                            <div className="flex items-center gap-3">
                                                <span className={`font-bold ${patient.hr > 100 ? 'text-red-500' : ''}`} style={{ color: patient.hr > 100 ? undefined : 'var(--text-primary)' }}>
                                                    ❤️ {patient.hr}
                                                </span>
                                                <span className={`font-bold ${patient.spo2 < 90 ? 'text-red-500' : ''}`} style={{ color: patient.spo2 < 90 ? undefined : 'var(--text-primary)' }}>
                                                    💨 {patient.spo2}%
                                                </span>
                                            </div>
                                        ) : (
                                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex flex-wrap gap-1">
                                                {patient.conditions.length > 0 ? (
                                                    patient.conditions.map((c, i) => (
                                                        <span key={i} className="badge badge-warning text-xs">{c}</span>
                                                    ))
                                                ) : (
                                                    <span className="badge badge-success text-xs">Healthy</span>
                                                )}
                                            </div>
                                            {patient.rationCardType && (
                                                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded w-fit ${patient.rationCardType === 'BPL' ? 'bg-yellow-100 text-yellow-700' :
                                                    patient.rationCardType === 'AAY' ? 'bg-purple-100 text-purple-700' :
                                                        'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    💳 {patient.rationCardType} Card
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => setDietaryModalData({ isOpen: true, patient })}
                                                className="p-2 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 transition-colors"
                                                title="Dietary Guide"
                                            >
                                                <Salad className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedPatient({ id: patient.id, name: patient.name })
                                                    setIsRecordModalOpen(true)
                                                }}
                                                className="p-2 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-900/30 text-teal-600 transition-colors"
                                                title="Medical Records"
                                            >
                                                <FileText className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => openEditModal(patient)}
                                                className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 transition-colors"
                                                title="Edit Patient"
                                            >
                                                <Edit2 className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(patient.id)}
                                                className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 transition-colors"
                                                title="Delete Patient"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modals */}
            <AddPatientModal
                isOpen={isAddModalOpen || !!editingPatient}
                onClose={() => {
                    setIsAddModalOpen(false)
                    setEditingPatient(null)
                }}
                editPatient={editingPatient}
                onSave={editingPatient ? handleEditPatient : handleAddPatient}
            />

            {dietaryModalData.patient && (
                <DietaryModal
                    isOpen={dietaryModalData.isOpen}
                    onClose={() => setDietaryModalData({ isOpen: false })}
                    patientName={dietaryModalData.patient.name}
                    allergies={dietaryModalData.patient.allergies}
                    conditions={dietaryModalData.patient.conditions}
                />
            )}

            {callModalData.patient && (
                <CallModal
                    isOpen={callModalData.isOpen}
                    onClose={() => setCallModalData({ isOpen: false })}
                    patient={callModalData.patient}
                    ashaWorker={careTeam.ashaWorker}
                    doctor={careTeam.doctor}
                />
            )}
            {/* Record Upload Modal */}
            {selectedPatient && (
                <RecordUploadModal
                    isOpen={isRecordModalOpen}
                    onClose={() => {
                        setIsRecordModalOpen(false)
                        setSelectedPatient(null)
                    }}
                    patientId={selectedPatient.id}
                    patientName={selectedPatient.name}
                />
            )}
        </div>
    )
}
