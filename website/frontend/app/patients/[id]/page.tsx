'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
    ArrowLeft, Heart, Activity, Thermometer, Droplets, MapPin, Phone,
    Bell, Calendar, AlertTriangle, CheckCircle, TrendingUp, TrendingDown,
    Battery, Wifi, Clock, Pill, User, Home, Send, FileText
} from 'lucide-react'

// Mock patient data
const patientsData: { [key: string]: any } = {
    'P-001': {
        id: 'P-001',
        name: 'Rajesh Kumar',
        age: 68,
        gender: 'Male',
        phone: '+91 98765 43210',
        address: 'House 42, Rampur Village',
        village: 'Rampur',
        bloodGroup: 'B+',
        language: 'hi',
        emergencyContact: '+91 98765 43211',
        conditions: ['Diabetes', 'Hypertension'],
        allergies: ['Penicillin'],
        deviceId: 'WB-2024-001',
        deviceBattery: 78,
        deviceStatus: 'online',
        lastSync: '2 mins ago',
        currentVitals: {
            heartRate: 78,
            spo2: 96,
            temperature: 36.8,
            bp: '128/82',
            steps: 2340
        },
        // 7-day trend data
        vitalsTrend: {
            heartRate: [72, 75, 78, 74, 80, 76, 78],
            spo2: [97, 96, 95, 96, 97, 96, 96],
            bpSystolic: [130, 128, 135, 132, 128, 130, 128],
            bpDiastolic: [85, 82, 88, 84, 82, 84, 82],
            temperature: [36.6, 36.7, 36.8, 36.5, 36.9, 36.7, 36.8]
        },
        medications: [
            { name: 'Metformin 500mg', time: '8:00 AM', status: 'taken', adherence: 95 },
            { name: 'Amlodipine 5mg', time: '8:00 AM', status: 'taken', adherence: 90 },
            { name: 'Metformin 500mg', time: '8:00 PM', status: 'pending', adherence: 95 },
        ],
        recentAlerts: [
            { type: 'warning', message: 'High BP detected: 142/90', time: '2 days ago', resolved: true },
            { type: 'info', message: 'Missed medication reminder', time: '3 days ago', resolved: true },
            { type: 'critical', message: 'Fall detected', time: '1 week ago', resolved: true },
        ],
        visits: [
            { date: '2026-02-05', type: 'Routine Checkup', notes: 'BP stable, continue medication' },
            { date: '2026-01-28', type: 'Follow-up', notes: 'Blood sugar improved' },
        ]
    },
    'P-002': {
        id: 'P-002',
        name: 'Sunita Devi',
        age: 72,
        gender: 'Female',
        phone: '+91 98765 43211',
        address: 'House 15, Rampur Village',
        village: 'Rampur',
        bloodGroup: 'O+',
        language: 'hi',
        emergencyContact: '+91 98765 43212',
        conditions: ['Hypertension'],
        allergies: [],
        deviceId: 'WB-2024-002',
        deviceBattery: 45,
        deviceStatus: 'online',
        lastSync: '5 mins ago',
        currentVitals: {
            heartRate: 82,
            spo2: 94,
            temperature: 36.6,
            bp: '138/88',
            steps: 1200
        },
        vitalsTrend: {
            heartRate: [80, 82, 78, 84, 82, 80, 82],
            spo2: [95, 94, 95, 94, 93, 94, 94],
            bpSystolic: [140, 138, 142, 136, 140, 138, 138],
            bpDiastolic: [90, 88, 92, 86, 88, 88, 88],
            temperature: [36.5, 36.6, 36.5, 36.7, 36.6, 36.5, 36.6]
        },
        medications: [
            { name: 'Losartan 50mg', time: '9:00 AM', status: 'taken', adherence: 88 },
            { name: 'Aspirin 75mg', time: '9:00 AM', status: 'taken', adherence: 92 },
        ],
        recentAlerts: [
            { type: 'warning', message: 'SpO2 dropped to 93%', time: '1 day ago', resolved: true },
        ],
        visits: [
            { date: '2026-02-03', type: 'BP Check', notes: 'Slightly elevated, monitor' },
        ]
    }
}

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function PatientDetailPage() {
    const params = useParams()
    const router = useRouter()
    const patientId = params.id as string
    const [patient, setPatient] = useState<any>(null)
    const [activeTab, setActiveTab] = useState<'vitals' | 'medications' | 'history'>('vitals')

    useEffect(() => {
        // In real app, fetch from API
        const data = patientsData[patientId] || patientsData['P-001']
        setPatient(data)
    }, [patientId])

    if (!patient) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full" />
            </div>
        )
    }

    const getVitalStatus = (type: string, value: number) => {
        if (type === 'heartRate') return value > 100 || value < 60 ? 'critical' : value > 90 ? 'warning' : 'normal'
        if (type === 'spo2') return value < 92 ? 'critical' : value < 95 ? 'warning' : 'normal'
        if (type === 'temperature') return value > 38 ? 'critical' : value > 37.5 ? 'warning' : 'normal'
        return 'normal'
    }

    const statusColors = {
        normal: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
        warning: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
        critical: 'text-red-500 bg-red-50 dark:bg-red-900/20'
    }

    // Mini chart component
    const MiniChart = ({ data, color, label }: { data: number[], color: string, label: string }) => {
        const max = Math.max(...data)
        const min = Math.min(...data)
        const range = max - min || 1

        return (
            <div className="mt-2">
                <div className="flex items-end gap-1 h-12">
                    {data.map((value, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center">
                            <div
                                className={`w-full rounded-t ${color}`}
                                style={{ height: `${((value - min) / range) * 100}%`, minHeight: '4px' }}
                            />
                        </div>
                    ))}
                </div>
                <div className="flex justify-between mt-1">
                    {days.map((day, i) => (
                        <span key={i} className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{day}</span>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" style={{ color: 'var(--text-primary)' }} />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{patient.name}</h1>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {patient.age} years • {patient.gender} • {patient.id}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => alert(`Calling ${patient.phone}...`)}
                        className="p-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                    >
                        <Phone className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => router.push('/notifications')}
                        className="p-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                    >
                        <Send className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => router.push('/emergency')}
                        className="p-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors"
                    >
                        <AlertTriangle className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Top Info Cards */}
            <div className="grid grid-cols-4 gap-4">
                {/* Patient Info */}
                <div className="card p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold text-lg">
                            {patient.name.charAt(0)}
                        </div>
                        <div>
                            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{patient.bloodGroup}</p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Blood Group</p>
                        </div>
                    </div>
                    <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                            <MapPin className="h-3 w-3" /> {patient.village}
                        </div>
                        <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                            <Phone className="h-3 w-3" /> {patient.phone}
                        </div>
                    </div>
                </div>

                {/* Device Status */}
                <div className="card p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Device</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${patient.deviceStatus === 'online' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-600'}`}>
                            {patient.deviceStatus}
                        </span>
                    </div>
                    <p className="font-mono text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{patient.deviceId}</p>
                    <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                        <span className="flex items-center gap-1">
                            <Battery className={`h-3 w-3 ${patient.deviceBattery < 30 ? 'text-red-500' : 'text-emerald-500'}`} />
                            {patient.deviceBattery}%
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {patient.lastSync}
                        </span>
                    </div>
                </div>

                {/* Conditions */}
                <div className="card p-4">
                    <span className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Conditions</span>
                    <div className="flex flex-wrap gap-1 mt-2">
                        {patient.conditions.map((c: string, i: number) => (
                            <span key={i} className="text-xs px-2 py-1 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                {c}
                            </span>
                        ))}
                    </div>
                    {patient.allergies.length > 0 && (
                        <div className="mt-2">
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Allergies: </span>
                            <span className="text-xs text-red-500">{patient.allergies.join(', ')}</span>
                        </div>
                    )}
                </div>

                {/* Medication Adherence */}
                <div className="card p-4">
                    <span className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Med Adherence</span>
                    <div className="flex items-center gap-3 mt-2">
                        <div className="relative w-14 h-14">
                            <svg className="w-14 h-14 -rotate-90">
                                <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="none" className="text-gray-200 dark:text-gray-700" />
                                <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="none"
                                    className="text-emerald-500"
                                    strokeDasharray={`${(patient.medications[0]?.adherence || 0) * 1.5} 150`}
                                />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                                {patient.medications[0]?.adherence || 0}%
                            </span>
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {patient.medications.filter((m: any) => m.status === 'taken').length}/{patient.medications.length} taken today
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Tabs */}
            <div className="card">
                {/* Tab Headers */}
                <div className="flex border-b" style={{ borderColor: 'var(--border-color)' }}>
                    {[
                        { id: 'vitals', label: 'Vital Signs', icon: Heart },
                        { id: 'medications', label: 'Medications', icon: Pill },
                        { id: 'history', label: 'History', icon: FileText },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                    ? 'border-teal-500 text-teal-600'
                                    : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                            style={{ color: activeTab !== tab.id ? 'var(--text-secondary)' : undefined }}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="p-5">
                    {activeTab === 'vitals' && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Heart Rate */}
                            <div className={`p-4 rounded-xl ${statusColors[getVitalStatus('heartRate', patient.currentVitals.heartRate)]}`}>
                                <div className="flex items-center justify-between">
                                    <Heart className="h-5 w-5" />
                                    <span className="text-xs font-medium">7-day trend</span>
                                </div>
                                <p className="text-3xl font-bold mt-2">{patient.currentVitals.heartRate}</p>
                                <p className="text-xs opacity-75">bpm</p>
                                <MiniChart data={patient.vitalsTrend.heartRate} color="bg-red-400" label="HR" />
                            </div>

                            {/* SpO2 */}
                            <div className={`p-4 rounded-xl ${statusColors[getVitalStatus('spo2', patient.currentVitals.spo2)]}`}>
                                <div className="flex items-center justify-between">
                                    <Droplets className="h-5 w-5" />
                                    <span className="text-xs font-medium">7-day trend</span>
                                </div>
                                <p className="text-3xl font-bold mt-2">{patient.currentVitals.spo2}%</p>
                                <p className="text-xs opacity-75">SpO2</p>
                                <MiniChart data={patient.vitalsTrend.spo2} color="bg-blue-400" label="SpO2" />
                            </div>

                            {/* Blood Pressure */}
                            <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600">
                                <div className="flex items-center justify-between">
                                    <Activity className="h-5 w-5" />
                                    <span className="text-xs font-medium">7-day trend</span>
                                </div>
                                <p className="text-3xl font-bold mt-2">{patient.currentVitals.bp}</p>
                                <p className="text-xs opacity-75">mmHg</p>
                                <MiniChart data={patient.vitalsTrend.bpSystolic} color="bg-purple-400" label="BP" />
                            </div>

                            {/* Temperature */}
                            <div className={`p-4 rounded-xl ${statusColors[getVitalStatus('temperature', patient.currentVitals.temperature)]}`}>
                                <div className="flex items-center justify-between">
                                    <Thermometer className="h-5 w-5" />
                                    <span className="text-xs font-medium">7-day trend</span>
                                </div>
                                <p className="text-3xl font-bold mt-2">{patient.currentVitals.temperature}°</p>
                                <p className="text-xs opacity-75">Celsius</p>
                                <MiniChart data={patient.vitalsTrend.temperature} color="bg-orange-400" label="Temp" />
                            </div>
                        </div>
                    )}

                    {activeTab === 'medications' && (
                        <div className="space-y-3">
                            {patient.medications.map((med: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--bg-primary)' }}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${med.status === 'taken' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                            <Pill className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{med.name}</p>
                                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Scheduled: {med.time}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{med.adherence}%</p>
                                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>adherence</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${med.status === 'taken'
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                            }`}>
                                            {med.status === 'taken' ? '✓ Taken' : '○ Pending'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="grid grid-cols-2 gap-6">
                            {/* Alerts */}
                            <div>
                                <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Recent Alerts</h3>
                                <div className="space-y-2">
                                    {patient.recentAlerts.map((alert: any, i: number) => (
                                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'var(--bg-primary)' }}>
                                            <AlertTriangle className={`h-4 w-4 mt-0.5 ${alert.type === 'critical' ? 'text-red-500' :
                                                    alert.type === 'warning' ? 'text-amber-500' : 'text-blue-500'
                                                }`} />
                                            <div className="flex-1">
                                                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{alert.message}</p>
                                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{alert.time}</p>
                                            </div>
                                            {alert.resolved && (
                                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Visits */}
                            <div>
                                <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Visit History</h3>
                                <div className="space-y-2">
                                    {patient.visits.map((visit: any, i: number) => (
                                        <div key={i} className="p-3 rounded-lg" style={{ background: 'var(--bg-primary)' }}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{visit.type}</span>
                                                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{visit.date}</span>
                                            </div>
                                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{visit.notes}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
