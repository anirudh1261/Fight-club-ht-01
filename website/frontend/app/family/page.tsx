'use client'

import { useState } from 'react'
import {
    Heart, Activity, Thermometer, Droplets, MapPin, Phone,
    Bell, Clock, Pill, Shield, Users, MessageSquare, Calendar,
    CheckCircle, AlertTriangle, Wifi, Battery, Sun, Cloud
} from 'lucide-react'
import SchemeEligibility from '@/components/SchemeEligibility'

// Mock family view data - simulating a logged-in family member viewing their elderly relative
const familyMember = {
    name: 'Rahul Kumar',
    relation: 'Son',
    patient: {
        id: 'P-001',
        name: 'Rajesh Kumar',
        age: 68,
        gender: 'Male',
        village: 'Rampur',
        photo: null,
        conditions: ['Diabetes', 'Hypertension'],
        deviceStatus: 'online',
        deviceBattery: 78,
        lastSync: '2 mins ago',
        ashaWorker: { name: 'Priya Sharma', phone: '+91 98765 43220' },
        phcDoctor: { name: 'Dr. Sharma', phone: '+91 98765 43221' },
        currentVitals: {
            heartRate: { value: 78, status: 'normal', time: '2 mins ago' },
            spo2: { value: 96, status: 'normal', time: '2 mins ago' },
            temperature: { value: 36.8, status: 'normal', time: '15 mins ago' },
            bp: { value: '128/82', status: 'normal', time: '1 hour ago' },
            steps: { value: 2340, goal: 5000 }
        },
        medications: [
            { name: 'Metformin 500mg', time: '8:00 AM', status: 'taken', nextDose: '8:00 PM' },
            { name: 'Amlodipine 5mg', time: '8:00 AM', status: 'taken', nextDose: 'Tomorrow 8:00 AM' },
        ],
        recentActivity: [
            { type: 'vital', message: 'Morning BP check completed', time: '1 hour ago', icon: Activity },
            { type: 'medication', message: 'Morning medications taken', time: '3 hours ago', icon: Pill },
            { type: 'activity', message: 'Morning walk - 1.2km', time: '4 hours ago', icon: MapPin },
            { type: 'checkup', message: 'ASHA visit completed', time: 'Yesterday', icon: Users },
        ],
        upcomingAppointments: [
            { type: 'PHC Visit', date: 'Feb 10, 2026', time: '10:00 AM', doctor: 'Dr. Sharma' },
            { type: 'BP Camp', date: 'Feb 15, 2026', time: '9:00 AM', location: 'Rampur Community Center' },
        ],
        weatherAlert: { temp: '28°C', condition: 'Sunny', advice: 'Good weather for outdoor walk' }
    }
}

export default function FamilyPortalPage() {
    const [showCallbackModal, setShowCallbackModal] = useState(false)
    const { patient } = familyMember

    const statusColors: { [key: string]: string } = {
        normal: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
        warning: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
        critical: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
    }

    const handleRequestCallback = (type: string) => {
        alert(`✅ Callback Request Sent!\n\nA ${type} will call you within 30 minutes.\n\nYour contact: +91 98765 43214`)
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl p-5 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold">
                            {patient.name.charAt(0)}
                        </div>
                        <div>
                            <p className="text-sm text-teal-100">Monitoring</p>
                            <h1 className="text-2xl font-bold">{patient.name}</h1>
                            <p className="text-sm text-teal-100">{patient.age} yrs • {patient.village}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-2 text-sm mb-1">
                            <Wifi className="h-4 w-4" />
                            <span className="font-medium">Device Online</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-teal-100">
                            <Battery className="h-4 w-4" />
                            <span>{patient.deviceBattery}% battery</span>
                        </div>
                        <p className="text-xs text-teal-100 mt-1">Last sync: {patient.lastSync}</p>
                    </div>
                </div>
            </div>

            {/* Weather Advisory */}
            <div className="card p-3 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-3">
                    <Sun className="h-8 w-8 text-amber-500" />
                    <div>
                        <span className="text-lg font-bold text-amber-700 dark:text-amber-300">{patient.weatherAlert.temp}</span>
                        <span className="text-sm text-amber-600 dark:text-amber-400 ml-2">{patient.weatherAlert.condition}</span>
                    </div>
                </div>
                <p className="text-sm text-amber-700 dark:text-amber-300">💡 {patient.weatherAlert.advice}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Vitals - Main Focus */}
                <div className="lg:col-span-2 card p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <Heart className="h-5 w-5 text-red-500" />
                            Current Health Status
                        </h2>
                        <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            ✓ All vitals normal
                        </span>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* Heart Rate */}
                        <div className={`p-4 rounded-xl ${statusColors[patient.currentVitals.heartRate.status]}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <Heart className="h-5 w-5" />
                                <span className="text-xs font-medium">Heart Rate</span>
                            </div>
                            <p className="text-3xl font-bold">{patient.currentVitals.heartRate.value}</p>
                            <p className="text-xs opacity-75">bpm • {patient.currentVitals.heartRate.time}</p>
                        </div>

                        {/* SpO2 */}
                        <div className={`p-4 rounded-xl ${statusColors[patient.currentVitals.spo2.status]}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <Droplets className="h-5 w-5" />
                                <span className="text-xs font-medium">Oxygen</span>
                            </div>
                            <p className="text-3xl font-bold">{patient.currentVitals.spo2.value}%</p>
                            <p className="text-xs opacity-75">SpO2 • {patient.currentVitals.spo2.time}</p>
                        </div>

                        {/* Blood Pressure */}
                        <div className={`p-4 rounded-xl ${statusColors[patient.currentVitals.bp.status]}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <Activity className="h-5 w-5" />
                                <span className="text-xs font-medium">Blood Pressure</span>
                            </div>
                            <p className="text-3xl font-bold">{patient.currentVitals.bp.value}</p>
                            <p className="text-xs opacity-75">mmHg • {patient.currentVitals.bp.time}</p>
                        </div>

                        {/* Temperature */}
                        <div className={`p-4 rounded-xl ${statusColors[patient.currentVitals.temperature.status]}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <Thermometer className="h-5 w-5" />
                                <span className="text-xs font-medium">Temperature</span>
                            </div>
                            <p className="text-3xl font-bold">{patient.currentVitals.temperature.value}°</p>
                            <p className="text-xs opacity-75">Celsius • {patient.currentVitals.temperature.time}</p>
                        </div>
                    </div>

                    {/* Daily Steps */}
                    <div className="mt-4 p-4 rounded-xl" style={{ background: 'var(--bg-primary)' }}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Daily Steps</span>
                            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{patient.currentVitals.steps.value} / {patient.currentVitals.steps.goal}</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
                            <div
                                className="h-full bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full transition-all"
                                style={{ width: `${(patient.currentVitals.steps.value / patient.currentVitals.steps.goal) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Medications */}
                <div className="card p-5">
                    <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Pill className="h-5 w-5 text-purple-500" />
                        Today's Medications
                    </h2>
                    <div className="space-y-3">
                        {patient.medications.map((med, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--bg-primary)' }}>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${med.status === 'taken' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                        {med.status === 'taken' ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{med.name}</p>
                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                            {med.status === 'taken' ? `✓ Taken at ${med.time}` : `Next: ${med.nextDose}`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Recent Activity */}
                <div className="card p-5">
                    <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Clock className="h-5 w-5 text-blue-500" />
                        Recent Activity
                    </h2>
                    <div className="space-y-3">
                        {patient.recentActivity.map((activity, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800">
                                    <activity.icon className="h-4 w-4 text-gray-500" />
                                </div>
                                <div>
                                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{activity.message}</p>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{activity.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Upcoming Appointments */}
                <div className="card p-5">
                    <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Calendar className="h-5 w-5 text-teal-500" />
                        Upcoming Appointments
                    </h2>
                    <div className="space-y-3">
                        {patient.upcomingAppointments.map((apt, i) => (
                            <div key={i} className="p-3 rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{apt.type}</span>
                                    <span className="text-xs px-2 py-0.5 rounded bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">{apt.time}</span>
                                </div>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{apt.date}</p>
                                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{apt.doctor || apt.location}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Contact & Actions */}
                <div className="card p-5">
                    <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Phone className="h-5 w-5 text-emerald-500" />
                        Contact Care Team
                    </h2>
                    <div className="space-y-3">
                        {/* ASHA Worker */}
                        <div className="p-3 rounded-xl" style={{ background: 'var(--bg-primary)' }}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{patient.ashaWorker.name}</p>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>ASHA Worker</p>
                                </div>
                                <button
                                    onClick={() => handleRequestCallback('ASHA Worker')}
                                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-teal-500 text-white hover:bg-teal-600 transition-colors"
                                >
                                    Request Call
                                </button>
                            </div>
                        </div>

                        {/* PHC Doctor */}
                        <div className="p-3 rounded-xl" style={{ background: 'var(--bg-primary)' }}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{patient.phcDoctor.name}</p>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>PHC Doctor</p>
                                </div>
                                <button
                                    onClick={() => handleRequestCallback('Doctor')}
                                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                                >
                                    Request Call
                                </button>
                            </div>
                        </div>

                        {/* Emergency */}
                        <button
                            onClick={() => { if (confirm('This will trigger an emergency alert. Continue?')) alert('🚨 Emergency alert sent to PHC!') }}
                            className="w-full py-3 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center justify-center gap-2 font-medium"
                        >
                            <AlertTriangle className="h-5 w-5" />
                            Report Emergency
                        </button>
                    </div>
                </div>
            </div>

            {/* Government Scheme Eligibility */}
            <SchemeEligibility patient={{
                age: patient.age,
                conditions: patient.conditions,
                bplCard: true,
                income: 'low'
            }} />

            {/* Footer Note */}
            <div className="card p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300 text-center">
                    <Shield className="h-4 w-4 inline mr-1" />
                    Your loved one is being monitored 24/7 by AyuLink. You will receive instant alerts for any health concerns.
                </p>
            </div>
        </div>
    )
}
