'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Heart, Droplets, Activity, Thermometer, Brain, Zap, MapPin, Globe, Upload, Camera, Sparkles } from 'lucide-react'
import WebcamCapture from './WebcamCapture'
import VillageSearchInput from './VillageSearchInput'

interface Sensor {
    id: string
    name: string
    icon: any
    description: string
    enabled: boolean
}

interface AddPatientModalProps {
    isOpen: boolean
    onClose: () => void
    editPatient?: any  // For edit mode
    onSave?: (patientData: any) => void  // Callback to save patient
    onAdd?: (patientData: any) => void // Legacy callback
}

const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'hi', name: 'हिंदी (Hindi)', flag: '🇮🇳' },
    { code: 'te', name: 'తెలుగు (Telugu)', flag: '🇮🇳' },
    { code: 'ta', name: 'தமிழ் (Tamil)', flag: '🇮🇳' },
    { code: 'kn', name: 'ಕನ್ನಡ (Kannada)', flag: '🇮🇳' },
    { code: 'mr', name: 'मराठी (Marathi)', flag: '🇮🇳' },
]

export default function AddPatientModal({ isOpen, onClose, editPatient, onSave, onAdd }: AddPatientModalProps) {
    const [formData, setFormData] = useState({
        name: editPatient?.name || '',
        age: editPatient?.age || '',
        gender: editPatient?.gender || 'male',
        phone: editPatient?.phone || '',
        address: editPatient?.address || '',
        bloodGroup: editPatient?.bloodGroup || '',
        allergies: editPatient?.allergies || '',
        emergencyContact: editPatient?.emergencyContact || '',
        language: editPatient?.language || 'en',  // Default to English
        village: editPatient?.village || '',
        deviceId: editPatient?.deviceId || '',
        abhaId: editPatient?.abhaId || '',
        rationCardType: editPatient?.rationCardType || 'APL',
        familyHeadName: editPatient?.familyHeadName || '',
        conditions: editPatient?.conditions || '',
    })

    const [avatarUrl, setAvatarUrl] = useState(editPatient?.avatarUrl || '')
    const [showCamera, setShowCamera] = useState(false)

    // Sync form data when editPatient changes
    useEffect(() => {
        if (editPatient) {
            setFormData({
                name: editPatient.name || '',
                age: editPatient.age || '',
                gender: editPatient.gender || 'male',
                phone: editPatient.phone || '',
                address: editPatient.address || '',
                bloodGroup: editPatient.bloodGroup || '',
                allergies: Array.isArray(editPatient.allergies) ? editPatient.allergies.join(', ') : editPatient.allergies || '',
                emergencyContact: editPatient.emergencyContact || '',
                language: editPatient.language || 'en',
                village: editPatient.village || '',
                deviceId: editPatient.deviceId || '',
                abhaId: editPatient.abhaId || '',
                rationCardType: editPatient.rationCardType || 'APL',
                familyHeadName: editPatient.familyHeadName || '',
                conditions: Array.isArray(editPatient.conditions) ? editPatient.conditions.join(', ') : editPatient.conditions || '',
            })
            setAvatarUrl(editPatient.avatarUrl || '')
        } else {
            // Reset form for new patient
            setFormData({
                name: '',
                age: '',
                gender: 'male',
                phone: '',
                address: '',
                bloodGroup: '',
                allergies: '',
                emergencyContact: '',
                language: 'en',
                village: '',
                deviceId: '',
                abhaId: '',
                rationCardType: 'APL',
                familyHeadName: '',
                conditions: '',
            })
            setAvatarUrl('')
        }
    }, [editPatient])

    const [sensors, setSensors] = useState<Sensor[]>([
        {
            id: 'max30102',
            name: 'MAX30102',
            icon: Heart,
            description: 'Heart Rate + SpO2',
            enabled: true
        },
        {
            id: 'mpu6050',
            name: 'MPU6050',
            icon: Activity,
            description: 'Fall Detection + Activity',
            enabled: true
        },
        {
            id: 'mlx90614',
            name: 'MLX90614',
            icon: Thermometer,
            description: 'IR Temperature',
            enabled: true
        },
        {
            id: 'ad8232',
            name: 'AD8232',
            icon: Droplets,
            description: 'ECG Monitoring',
            enabled: false
        },
        {
            id: 'gsr',
            name: 'GSR Sensor',
            icon: Brain,
            description: 'Stress Level',
            enabled: false
        },
        {
            id: 'gps',
            name: 'NEO-6M GPS',
            icon: MapPin,
            description: 'Location Tracking',
            enabled: true
        },
    ])

    const toggleSensor = (id: string) => {
        setSensors(sensors.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s))
    }

    const [validationError, setValidationError] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        // Validate required fields
        if (!formData.name.trim()) {
            setValidationError('Please fill in the patient name')
            return
        }
        if (!formData.age) {
            setValidationError('Please fill in the patient age')
            return
        }
        if (!formData.phone.trim()) {
            setValidationError('Please fill in the phone number')
            return
        }
        // Validate phone number is exactly 10 digits
        const phoneDigits = formData.phone.replace(/\D/g, '')
        if (phoneDigits.length !== 10) {
            setValidationError('Phone number must be exactly 10 digits')
            return
        }
        if (!formData.village) {
            setValidationError('Please select a village')
            return
        }

        setValidationError('') // Clear any previous error

        const enabledSensors = sensors.filter(s => s.enabled).map(s => s.id)

        const patientData = {
            ...formData,
            avatarUrl,
            sensors: enabledSensors,
            allergies: formData.allergies ? formData.allergies.split(',').map((a: string) => a.trim()) : [],
            conditions: formData.conditions ? formData.conditions.split(',').map((c: string) => c.trim()) : [],
            status: 'normal',
            lastActive: 'Just now'
        }

        // Handle both onSave (from new code) and onAdd (legacy)
        if (onSave) {
            onSave(patientData)
        } else if (onAdd) {
            onAdd(patientData)
        } else {

            alert(`✅ Patient ${editPatient ? 'Updated' : 'Added'} Successfully!\n\nName: ${formData.name}\nPreferred Language: ${languages.find(l => l.code === formData.language)?.name}`)
        }

        onClose()
    }

    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    if (!isOpen || !mounted) return null

    return createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-start justify-center z-[9999] p-4 pt-10 overflow-y-auto">
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-7xl w-full my-4 animate-fadeIn border border-white/20 dark:border-slate-700 overflow-hidden relative">
                <div className="sticky top-0 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border-b border-teal-500/10 px-8 py-5 flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            {editPatient ? <Zap className="h-6 w-6 text-teal-500" /> : <Sparkles className="h-6 w-6 text-teal-500" />}
                            {editPatient ? 'Edit Patient Profile' : 'Register New Patient'}
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {editPatient ? 'Update patient details and sensor configuration' : 'Enroll a new patient into the AyuLink mesh network'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 group transition-all">
                        <X className="h-6 w-6 text-slate-400 group-hover:text-red-500 transition-colors" />
                    </button>
                </div>

                <div className="p-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* LEFT COLUMN: Photo & Basic Info */}
                            <div className="lg:col-span-1 space-y-6">
                                {/* Photo Section */}
                                <div className="flex flex-col items-center">
                                    {showCamera ? (
                                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-sm font-semibold">Take Photo</h3>
                                                <button onClick={() => setShowCamera(false)} className="text-xs text-red-500">Cancel</button>
                                            </div>
                                            <WebcamCapture onImageCaptured={(url) => { setAvatarUrl(url); setShowCamera(false) }} />
                                        </div>
                                    ) : (
                                        <div className="relative group cursor-pointer" onClick={() => setShowCamera(true)}>
                                            <div className={`w-40 h-40 rounded-full overflow-hidden border-4 ${avatarUrl ? 'border-teal-500 shadow-xl shadow-teal-500/20' : 'border-slate-200 dark:border-slate-700 border-dashed'} transition-all group-hover:border-teal-400 bg-slate-50 dark:bg-slate-800 flex items-center justify-center`}>
                                                {avatarUrl ? (
                                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Camera className="h-10 w-10 text-slate-300 group-hover:text-teal-500 transition-colors" />
                                                )}
                                            </div>
                                            <div className="absolute bottom-2 right-2 p-2 bg-teal-500 rounded-full text-white shadow-lg group-hover:scale-110 transition-transform">
                                                <Upload className="h-4 w-4" />
                                            </div>
                                        </div>
                                    )}
                                    <p className="mt-3 text-sm font-medium text-slate-500">{avatarUrl ? 'Click to retake' : 'Tap to take photo'}</p>
                                </div>

                                {/* Quick Stats / ID */}
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Network Identity</label>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs text-slate-500">LoRa Device MAC</label>
                                            <div className="font-mono text-sm font-bold text-teal-600 dark:text-teal-400 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                                                <Zap className="h-3 w-3" />
                                                <input
                                                    value={formData.deviceId}
                                                    onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
                                                    placeholder="00:00:00:00"
                                                    className="bg-transparent outline-none w-full"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500">ABHA Health ID</label>
                                            <input
                                                value={formData.abhaId}
                                                onChange={(e) => setFormData({ ...formData, abhaId: e.target.value })}
                                                placeholder="XX-XXXX-XXXX-XXXX"
                                                className="w-full font-mono text-sm p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:border-teal-500 transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: Details & Sensors */}
                            <div className="lg:col-span-2 space-y-8">
                                {/* Personal Info Section */}
                                <section>
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                                        <span className="w-1 h-4 bg-teal-500 rounded-full"></span>
                                        Demographics
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">Full Name</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all font-medium text-slate-700 dark:text-slate-200"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="e.g. Ramesh Kumar"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">Age</label>
                                            <input
                                                type="number"
                                                required
                                                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all font-medium text-slate-700 dark:text-slate-200"
                                                value={formData.age}
                                                onChange={e => setFormData({ ...formData, age: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">Gender</label>
                                            <select
                                                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all font-medium text-slate-700 dark:text-slate-200 appearance-none"
                                                value={formData.gender}
                                                onChange={e => setFormData({ ...formData, gender: e.target.value })}
                                            >
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">Phone Number</label>
                                            <input
                                                type="tel"
                                                required
                                                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all font-medium text-slate-700 dark:text-slate-200"
                                                value={formData.phone}
                                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">Language</label>
                                            <select
                                                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all font-medium text-slate-700 dark:text-slate-200 appearance-none"
                                                value={formData.language}
                                                onChange={e => setFormData({ ...formData, language: e.target.value })}
                                            >
                                                {languages.map(l => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-span-3">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">Village / Area</label>
                                            <VillageSearchInput value={formData.village} onChange={v => setFormData({ ...formData, village: v })} placeholder="Search village..." />
                                        </div>
                                    </div>
                                </section>

                                {/* Sensor Modules Section */}
                                <section>
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                                        <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
                                        Active Sensor Modules
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {sensors.map((sensor) => (
                                            <div
                                                key={sensor.id}
                                                onClick={() => toggleSensor(sensor.id)}
                                                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 group ${sensor.enabled
                                                    ? 'border-transparent bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/20 scale-[1.02]'
                                                    : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-teal-200 dark:hover:border-teal-800'
                                                    }`}
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className={`p-3 rounded-lg ${sensor.enabled ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                                                        <sensor.icon className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <h4 className={`font-bold ${sensor.enabled ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>{sensor.name}</h4>
                                                        <p className={`text-xs mt-1 ${sensor.enabled ? 'text-teal-100' : 'text-slate-500'}`}>{sensor.description}</p>
                                                    </div>
                                                    {sensor.enabled && (
                                                        <div className="absolute top-4 right-4 bg-white/20 p-1 rounded-full">
                                                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            {!editPatient && (
                                <button
                                    type="button"
                                    onClick={() => setFormData({
                                        name: "Rajeshwari Devi",
                                        age: "68",
                                        gender: "female",
                                        phone: "9876543210",
                                        address: "House No. 12, Nalgonda",
                                        bloodGroup: "O+",
                                        allergies: "None",
                                        emergencyContact: "9876543222",
                                        language: "te",
                                        village: "Nalgonda",
                                        deviceId: "LORA_01",
                                        abhaId: "91-2345-6789-0123",
                                        rationCardType: "BPL",
                                        familyHeadName: "Self",
                                        conditions: "Hypertension"
                                    })}
                                    className="text-xs font-bold text-slate-400 hover:text-teal-500 flex items-center gap-2 transition-colors"
                                >
                                    <Zap className="h-3 w-3" /> Auto-fill Demo Data
                                </button>
                            )}
                            <div className="flex gap-4 ml-auto">
                                <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                                    Cancel
                                </button>
                                <button type="submit" className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:scale-105 active:scale-95 transition-all">
                                    {editPatient ? 'Save Changes' : 'Register Patient'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    )
}
