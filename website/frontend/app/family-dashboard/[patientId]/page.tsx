'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
    Heart, Activity, Thermometer, Droplets, Pill, Clock, Calendar,
    Phone, MessageSquare, AlertTriangle, Shield, Bell, LogOut, User,
    MapPin, Wifi, Battery, TrendingUp, CheckCircle, Sun, Cloud,
    ChevronRight, Home, Sparkles, Video
} from 'lucide-react'
import { useTheme } from '@/lib/theme-context'

// Mock patient data - in production this would come from API
const patientDatabase: { [key: string]: any } = {
    'P-001': {
        id: 'P-001',
        name: 'Rajesh Kumar',
        age: 68,
        gender: 'Male',
        photo: null,
        village: 'Rampur',
        address: 'House 15, Near Temple, Rampur',
        conditions: ['Type 2 Diabetes', 'Hypertension'],
        bloodGroup: 'B+',
        allergies: ['Penicillin'],
        ashaWorker: { name: 'Priya Sharma', phone: '+91 98765 43220' },
        phcDoctor: { name: 'Dr. Arun Sharma', phone: '+91 98765 43221' },
        deviceStatus: 'online',
        deviceBattery: 78,
        lastSync: '2 mins ago',
        currentVitals: {
            heartRate: { value: 78, status: 'normal', time: '2 mins ago', trend: 'stable' },
            spo2: { value: 96, status: 'normal', time: '2 mins ago', trend: 'up' },
            temperature: { value: 36.8, status: 'normal', time: '15 mins ago', trend: 'stable' },
            bp: { systolic: 128, diastolic: 82, status: 'normal', time: '1 hour ago', trend: 'stable' },
            steps: { value: 2340, goal: 5000 }
        },
        medications: [
            { name: 'Metformin 500mg', schedule: '8:00 AM, 8:00 PM', status: 'taken', nextDose: '8:00 PM', adherence: 95 },
            { name: 'Amlodipine 5mg', schedule: '8:00 AM', status: 'taken', nextDose: 'Tomorrow', adherence: 92 },
            { name: 'Aspirin 75mg', schedule: '9:00 AM', status: 'pending', nextDose: '9:00 AM', adherence: 88 },
        ],
        recentAlerts: [
            { message: 'Blood sugar slightly elevated', time: '2 days ago', resolved: true },
            { message: 'Missed evening medication', time: '3 days ago', resolved: true },
        ],
        upcomingAppointments: [
            { type: 'PHC Checkup', date: 'Feb 10, 2026', time: '10:00 AM', doctor: 'Dr. Sharma' },
            { type: 'Blood Sugar Test', date: 'Feb 12, 2026', time: '9:00 AM', location: 'Rampur Center' },
        ],
        lastVisit: { date: 'Jan 28, 2026', type: 'Routine Checkup', notes: 'All vitals normal. Continue current medication.' },
        weather: { temp: '28°C', condition: 'Sunny', advice: 'Good weather for morning walk. Stay hydrated.' }
    },
    'P-002': {
        id: 'P-002',
        name: 'Sunita Devi',
        age: 72,
        gender: 'Female',
        village: 'Rampur',
        conditions: ['Arthritis', 'Mild Hypertension'],
        currentVitals: {
            heartRate: { value: 82, status: 'normal', time: '5 mins ago' },
            spo2: { value: 94, status: 'warning', time: '5 mins ago' },
            temperature: { value: 36.6, status: 'normal', time: '30 mins ago' },
            bp: { systolic: 140, diastolic: 88, status: 'warning', time: '2 hours ago' },
            steps: { value: 1200, goal: 3000 }
        },
        medications: [
            { name: 'Calcium + Vitamin D', schedule: '9:00 AM', status: 'taken', adherence: 90 },
        ],
        deviceStatus: 'online',
        deviceBattery: 55,
        ashaWorker: { name: 'Priya Sharma', phone: '+91 98765 43220' },
        phcDoctor: { name: 'Dr. Sharma', phone: '+91 98765 43221' },
        weather: { temp: '28°C', condition: 'Sunny', advice: 'Take rest during afternoon heat.' }
    },
    'P-004': {
        id: 'P-004',
        name: 'Lakshmi Devi',
        age: 68,
        gender: 'Female',
        village: 'Rampur',
        conditions: ['Diabetes', 'Hypertension'],
        currentVitals: {
            heartRate: { value: 92, status: 'warning', time: 'Just now' },
            spo2: { value: 91, status: 'warning', time: 'Just now' },
            temperature: { value: 37.2, status: 'normal', time: '10 mins ago' },
            bp: { systolic: 155, diastolic: 98, status: 'warning', time: '30 mins ago' },
            steps: { value: 890, goal: 4000 }
        },
        medications: [
            { name: 'Metformin 500mg', schedule: '8:00 AM, 8:00 PM', status: 'pending', adherence: 78 },
            { name: 'Telmisartan 40mg', schedule: '8:00 AM', status: 'taken', adherence: 85 },
        ],
        deviceStatus: 'online',
        deviceBattery: 45,
        ashaWorker: { name: 'Priya Sharma', phone: '+91 98765 43220' },
        phcDoctor: { name: 'Dr. Sharma', phone: '+91 98765 43221' },
        weather: { temp: '28°C', condition: 'Sunny', advice: 'Monitor BP closely today.' }
    }
}

export default function FamilyDashboardPage() {
    const router = useRouter()
    const params = useParams()
    const patientId = params.patientId as string
    const { t } = useTheme()

    const [patient, setPatient] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [showCallModal, setShowCallModal] = useState(false)
    const [callTarget, setCallTarget] = useState<any>(null)

    useEffect(() => {
        // Check auth
        const auth = sessionStorage.getItem('familyAuth')
        if (!auth) {
            router.push('/family-login')
            return
        }

        // Load patient data
        const patientData = patientDatabase[patientId]
        if (patientData) {
            setPatient(patientData)
        }
        setIsLoading(false)
    }, [patientId, router])

    const handleLogout = () => {
        sessionStorage.removeItem('familyAuth')
        router.push('/family-login')
    }

    const handleCall = (target: any, type: string) => {
        setCallTarget({ ...target, type })
        setShowCallModal(true)
    }

    const handleEmergency = () => {
        if (confirm(t('emergencyConfirmTitle') + '\n\n' + t('emergencyConfirmBody'))) {
            alert(t('emergencySentTitle') + '\n\n' + t('emergencySentBody'))
        }
    }

    // Use white cards with colored borders and icons for better text visibility
    const statusStyles: { [key: string]: { bg: string, border: string, iconColor: string, textColor: string } } = {
        normal: {
            bg: 'bg-white dark:bg-gray-800',
            border: 'border-2 border-emerald-400',
            iconColor: 'text-emerald-600',
            textColor: '#065f46' // emerald-800 readable on white
        },
        warning: {
            bg: 'bg-white dark:bg-gray-800',
            border: 'border-2 border-amber-400',
            iconColor: 'text-amber-600',
            textColor: '#92400e' // amber-800 readable on white
        },
        critical: {
            bg: 'bg-white dark:bg-gray-800',
            border: 'border-2 border-red-400',
            iconColor: 'text-red-600',
            textColor: '#991b1b' // red-800 readable on white
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
                <div className="text-center">
                    <div className="animate-spin text-4xl mb-4">💚</div>
                    <p style={{ color: 'var(--text-muted)' }}>{t('connecting')}</p>
                </div>
            </div>
        )
    }

    if (!patient) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
                <div className="text-center">
                    <p className="text-red-500 mb-4">{t('patientNotFound')}</p>
                    <button onClick={() => router.push('/family-login')} className="btn-primary px-4 py-2 rounded-lg">
                        {t('backToLogin')}
                    </button>
                </div>
            </div>
        )
    }

    const overallStatus = patient.currentVitals.spo2.status === 'critical' || patient.currentVitals.heartRate.status === 'critical' ? 'critical' :
        patient.currentVitals.spo2.status === 'warning' || patient.currentVitals.heartRate.status === 'warning' || patient.currentVitals.bp.status === 'warning' ? 'warning' : 'normal'

    return (
        <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
            {/* Call Modal */}
            {showCallModal && callTarget && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="card p-6 rounded-2xl max-w-sm w-full text-center" style={{ background: 'var(--bg-card)' }}>
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <Phone className="h-8 w-8 text-emerald-600" />
                        </div>
                        <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{t('callConfirmTitle')} {callTarget.type}</h3>
                        <p className="text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{callTarget.name}</p>
                        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{callTarget.phone}</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowCallModal(false)} className="flex-1 py-2 rounded-xl border" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                                {t('cancel')}
                            </button>
                            <a href={`tel:${callTarget.phone}`} className="flex-1 py-2 rounded-xl bg-emerald-500 text-white font-semibold">
                                {t('callNow')}
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="sticky top-0 z-40 px-4 py-3 border-b" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center">
                            <Heart className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>AyuLink</h1>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('familyPortalTitle')}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <LogOut className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('logout')}</span>
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto p-4 space-y-4 pb-24">
                {/* Patient Header */}
                <div className="card p-5 rounded-2xl" style={{ background: 'linear-gradient(135deg, #0d9488 0%, #10b981 100%)' }}>
                    <div className="flex items-center justify-between text-white">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold">
                                {patient.name.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">{patient.name}</h2>
                                <p className="text-teal-100">{patient.age} {t('age')} • {patient.gender}</p>
                                <p className="text-teal-100 text-sm flex items-center gap-1">
                                    <MapPin className="h-3 w-3" /> {patient.village}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-2 text-sm mb-1">
                                <Wifi className="h-4 w-4" />
                                <span>{patient.deviceStatus === 'online' ? t('deviceOnline') : t('offline')}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-teal-100">
                                <Battery className="h-4 w-4" />
                                <span>{patient.deviceBattery}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Overall Status Banner */}
                <div className={`p-4 rounded-xl flex items-center justify-between ${statusStyles[overallStatus].bg} ${statusStyles[overallStatus].border}`} style={{ color: statusStyles[overallStatus].textColor }}>
                    <div className="flex items-center gap-3">
                        {overallStatus === 'normal' ? (
                            <CheckCircle className="h-6 w-6" />
                        ) : (
                            <AlertTriangle className="h-6 w-6" />
                        )}
                        <div>
                            <p className="font-semibold">
                                {overallStatus === 'normal' ? t('allVitalsNormal') :
                                    overallStatus === 'warning' ? t('someVitalsWarning') :
                                        t('criticalContactTeam')}
                            </p>
                            <p className="text-xs opacity-75">{t('lastUpdated')}: {patient.currentVitals.heartRate.time}</p>
                        </div>
                    </div>
                </div>

                {/* Weather Advisory */}
                {patient.weather && (
                    <div className="card p-3 rounded-xl flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' }}>
                        <div className="flex items-center gap-3">
                            <Sun className="h-8 w-8 text-amber-600" />
                            <div>
                                <span className="font-bold text-amber-800">{patient.weather.temp}</span>
                                <span className="text-amber-700 ml-2">{patient.weather.condition}</span>
                            </div>
                        </div>
                        <p className="text-xs text-amber-700 max-w-[50%] text-right">{patient.weather.advice}</p>
                    </div>
                )}

                {/* Current Vitals */}
                <div className="card p-5 rounded-2xl">
                    <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Activity className="h-5 w-5 text-red-500" />
                        {t('currentHealthStatus')}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {/* Heart Rate */}
                        <div className={`p-4 rounded-xl shadow-sm ${statusStyles[patient.currentVitals.heartRate.status].bg} ${statusStyles[patient.currentVitals.heartRate.status].border}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <Heart className={`h-5 w-5 ${statusStyles[patient.currentVitals.heartRate.status].iconColor}`} />
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{t('heartRate')}</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{patient.currentVitals.heartRate.value}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('bpm')} • {patient.currentVitals.heartRate.time}</p>
                        </div>

                        {/* SpO2 */}
                        <div className={`p-4 rounded-xl shadow-sm ${statusStyles[patient.currentVitals.spo2.status].bg} ${statusStyles[patient.currentVitals.spo2.status].border}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <Droplets className={`h-5 w-5 ${statusStyles[patient.currentVitals.spo2.status].iconColor}`} />
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{t('oxygen')}</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{patient.currentVitals.spo2.value}%</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">SpO2 • {patient.currentVitals.spo2.time}</p>
                        </div>

                        {/* Blood Pressure */}
                        <div className={`p-4 rounded-xl shadow-sm ${statusStyles[patient.currentVitals.bp.status].bg} ${statusStyles[patient.currentVitals.bp.status].border}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <Activity className={`h-5 w-5 ${statusStyles[patient.currentVitals.bp.status].iconColor}`} />
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{t('bloodPressure')}</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{patient.currentVitals.bp.systolic}/{patient.currentVitals.bp.diastolic}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('mmHg')} • {patient.currentVitals.bp.time}</p>
                        </div>

                        {/* Temperature */}
                        <div className={`p-4 rounded-xl shadow-sm ${statusStyles[patient.currentVitals.temperature.status].bg} ${statusStyles[patient.currentVitals.temperature.status].border}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <Thermometer className={`h-5 w-5 ${statusStyles[patient.currentVitals.temperature.status].iconColor}`} />
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{t('temperature')}</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{patient.currentVitals.temperature.value}°</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('celsius')} • {patient.currentVitals.temperature.time}</p>
                        </div>
                    </div>

                    {/* Daily Steps Progress */}
                    <div className="mt-4 p-4 rounded-xl" style={{ background: 'var(--bg-primary)' }}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{t('dailySteps')}</span>
                            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                {patient.currentVitals.steps.value} / {patient.currentVitals.steps.goal}
                            </span>
                        </div>
                        <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
                            <div
                                className="h-full bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full transition-all"
                                style={{ width: `${Math.min((patient.currentVitals.steps.value / patient.currentVitals.steps.goal) * 100, 100)}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Medications */}
                <div className="card p-5 rounded-2xl">
                    <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Pill className="h-5 w-5 text-purple-500" />
                        {t('todaysMedications')}
                    </h3>
                    <div className="space-y-3">
                        {patient.medications?.map((med: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--bg-primary)' }}>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${med.status === 'taken' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                        {med.status === 'taken' ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{med.name}</p>
                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{med.schedule}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`text-xs font-medium ${med.status === 'taken' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                        {med.status === 'taken' ? '✓ ' + t('taken') : t('pending')}
                                    </span>
                                    {med.adherence && (
                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{med.adherence}% {t('adherence')}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Upcoming Appointments */}
                {patient.upcomingAppointments && (
                    <div className="card p-5 rounded-2xl">
                        <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <Calendar className="h-5 w-5 text-blue-500" />
                            {t('upcomingAppointments')}
                        </h3>
                        <div className="space-y-3">
                            {patient.upcomingAppointments.map((apt: any, i: number) => (
                                <div key={i} className="p-3 rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{apt.type}</p>
                                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{apt.date} at {apt.time}</p>
                                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{apt.doctor || apt.location}</p>
                                        </div>
                                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                            {t('scheduled')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Contact Care Team */}
                <div className="card p-5 rounded-2xl">
                    <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Phone className="h-5 w-5 text-emerald-500" />
                        {t('contactCareTeam')}
                    </h3>
                    <div className="space-y-3">
                        {patient.ashaWorker && (
                            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--bg-primary)' }}>
                                <div>
                                    <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{patient.ashaWorker.name}</p>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>ASHA Worker</p>
                                </div>
                                <button
                                    onClick={() => handleCall(patient.ashaWorker, 'ASHA Worker')}
                                    className="px-4 py-2 rounded-xl bg-teal-500 text-white text-sm font-semibold hover:bg-teal-600 transition-colors flex items-center gap-2"
                                >
                                    <Phone className="h-4 w-4" /> {t('call')}
                                </button>
                            </div>
                        )}
                        {patient.phcDoctor && (
                            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--bg-primary)' }}>
                                <div>
                                    <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{patient.phcDoctor.name}</p>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>PHC Doctor</p>
                                </div>
                                <button
                                    onClick={() => handleCall(patient.phcDoctor, 'Doctor')}
                                    className="px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors flex items-center gap-2"
                                >
                                    <Phone className="h-4 w-4" /> {t('call')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Security Footer */}
                <div className="text-center py-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: 'var(--bg-card)' }}>
                        <Shield className="h-4 w-4 text-emerald-500" />
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('dataEncrypted')}</span>
                    </div>
                </div>
            </main>

            {/* Fixed Bottom Emergency Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 border-t" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div className="max-w-4xl mx-auto">
                    <button
                        onClick={handleEmergency}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold flex items-center justify-center gap-2 hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-500/30"
                    >
                        <AlertTriangle className="h-5 w-5" />
                        {t('reportEmergency')}
                    </button>
                </div>
            </div>
        </div>
    )
}
