'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    AlertTriangle, Phone, MapPin, Clock, User, Heart, Activity,
    CheckCircle, XCircle, Ambulance, Shield, Volume2, Navigation,
    PhoneCall, MessageSquare, Users, Siren
} from 'lucide-react'

// Mock emergency data
const activeEmergencies = [
    {
        id: 'E-001',
        patientId: 'P-004',
        patientName: 'Lakshmi Devi',
        age: 68,
        type: 'SOS Button Pressed',
        priority: 'critical',
        village: 'Rampur',
        location: { lat: 26.8467, lng: 80.9462 },
        address: 'House 23, Near Temple, Rampur',
        phone: '+91 98765 43213',
        emergencyContact: { name: 'Rahul Devi (Son)', phone: '+91 98765 43214' },
        timestamp: new Date(Date.now() - 3 * 60000).toISOString(),
        vitals: { hr: 110, spo2: 88, bp: '165/95' },
        conditions: ['Diabetes', 'Hypertension'],
        status: 'active'
    },
    {
        id: 'E-002',
        patientId: 'P-005',
        patientName: 'Ravi Kumar',
        age: 70,
        type: 'High Blood Pressure',
        priority: 'warning',
        village: 'Gopalpur',
        location: { lat: 26.8512, lng: 80.9534 },
        address: 'House 8, Main Road, Gopalpur',
        phone: '+91 98765 43214',
        emergencyContact: { name: 'Priya Kumar (Daughter)', phone: '+91 98765 43215' },
        timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
        vitals: { hr: 95, spo2: 94, bp: '158/102' },
        conditions: ['Hypertension'],
        status: 'acknowledged'
    }
]

const emergencyProtocols = [
    { type: 'SOS Button', steps: ['Call patient immediately', 'Alert emergency contact', 'Dispatch ASHA worker', 'Prepare for ambulance if needed'] },
    { type: 'Fall Detected', steps: ['Call patient to verify', 'Check vitals remotely', 'Send ASHA for home visit', 'Document incident'] },
    { type: 'High BP', steps: ['Send medication reminder', 'Schedule teleconsult', 'Monitor for 30 mins', 'Escalate if no improvement'] },
    { type: 'Low SpO2', steps: ['Call patient - assess breathing', 'Guide breathing exercises', 'Alert PHC doctor', 'Prepare oxygen support'] },
]

export default function EmergencyPage() {
    const router = useRouter()
    const [emergencies, setEmergencies] = useState(activeEmergencies)
    const [selectedEmergency, setSelectedEmergency] = useState<any>(activeEmergencies[0])
    const [timeElapsed, setTimeElapsed] = useState('')

    useEffect(() => {
        const handleEmergency = (e: any) => {
            const { active, deviceId, lat, lng } = e.detail
            if (active && deviceId) {
                const newEmergency = {
                    id: `SOS-${Date.now()}`,
                    patientId: deviceId,
                    patientName: e.detail.patientName || (deviceId === 'WEAR-PAT-001' ? 'Test Patient (Live)' : 'Unknown Patient'),
                    age: deviceId === 'WEAR-PAT-001' ? 75 : 0,
                    type: 'LoRa SOS Alert',
                    priority: 'critical',
                    village: 'Live LoRa Mesh',
                    location: { lat: lat || 17.448, lng: lng || 78.391 },
                    address: lat ? `GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}` : 'Gachibowli, Hyderabad (Approx)',
                    phone: 'LoRa Signal',
                    emergencyContact: { name: 'Local Gateway', phone: 'LoRa' },
                    timestamp: new Date().toISOString(),
                    vitals: { hr: 0, spo2: 0, bp: '--/--' },
                    conditions: ['Urgent Response'],
                    status: 'active'
                }
                setEmergencies(prev => [newEmergency, ...prev])
                setSelectedEmergency(newEmergency)
            }
        }

        window.addEventListener('emergency-state', handleEmergency)

        // Update elapsed time every second
        const interval = setInterval(() => {
            if (selectedEmergency) {
                const elapsed = Math.floor((Date.now() - new Date(selectedEmergency.timestamp).getTime()) / 1000)
                const mins = Math.floor(elapsed / 60)
                const secs = elapsed % 60
                setTimeElapsed(`${mins}:${secs.toString().padStart(2, '0')}`)
            }
        }, 1000)

        return () => {
            window.removeEventListener('emergency-state', handleEmergency)
            clearInterval(interval)
        }
    }, [selectedEmergency])

    const handleAcknowledge = (id: string) => {
        setEmergencies(emergencies.map(e =>
            e.id === id ? { ...e, status: 'acknowledged' } : e
        ))
        alert('✅ Emergency acknowledged. ASHA worker has been notified.')
    }

    const handleResolve = (id: string) => {
        if (confirm('Are you sure this emergency is resolved?')) {
            setEmergencies(emergencies.filter(e => e.id !== id))
            alert('✓ Emergency marked as resolved.')
        }
    }

    const handleDispatch = () => {
        if (confirm('Dispatch ambulance to patient location?')) {
            alert(`🚑 Ambulance dispatched to:\n${selectedEmergency.address}\n\nETA: ~15 minutes`)
        }
    }

    return (
        <div className="space-y-4">
            {/* Emergency Alert Banner */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-4 text-white animate-pulse-slow">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <Siren className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Emergency Response Center</h1>
                            <p className="text-sm text-red-100">{emergencies.filter(e => e.status === 'active').length} active emergencies requiring attention</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => alert('🔊 Alert sound enabled')}
                            className="px-4 py-2 bg-white/20 rounded-xl text-sm font-medium hover:bg-white/30 transition-colors flex items-center gap-2"
                        >
                            <Volume2 className="h-4 w-4" /> Sound On
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Emergency List */}
                <div className="card p-4">
                    <h2 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Active Emergencies</h2>
                    <div className="space-y-2">
                        {emergencies.map(emergency => (
                            <div
                                key={emergency.id}
                                onClick={() => setSelectedEmergency(emergency)}
                                className={`p-3 rounded-xl cursor-pointer transition-all border-2 ${selectedEmergency?.id === emergency.id
                                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                    } ${emergency.status === 'acknowledged' ? 'opacity-70' : ''}`}
                                style={{ borderColor: selectedEmergency?.id !== emergency.id ? 'var(--border-color)' : undefined }}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg ${emergency.priority === 'critical' ? 'bg-red-500' : 'bg-amber-500'
                                        }`}>
                                        <AlertTriangle className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{emergency.patientName}</p>
                                            {emergency.status === 'acknowledged' && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">ACK</span>
                                            )}
                                        </div>
                                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{emergency.type}</p>
                                        <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                                            <Clock className="h-3 w-3" />
                                            {new Date(emergency.timestamp).toLocaleTimeString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Emergency Details */}
                {selectedEmergency && (
                    <div className="lg:col-span-2 space-y-4">
                        {/* Patient Info Card */}
                        <div className="card p-5 border-2 border-red-200 dark:border-red-800">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl ${selectedEmergency.priority === 'critical' ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
                                        }`}>
                                        {selectedEmergency.patientName.charAt(0)}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{selectedEmergency.patientName}</h2>
                                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{selectedEmergency.age} yrs • {selectedEmergency.patientId}</p>
                                        <div className="flex gap-2 mt-1">
                                            {selectedEmergency.conditions.map((c: string, i: number) => (
                                                <span key={i} className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{c}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-mono font-bold text-red-500">{timeElapsed}</div>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Time elapsed</p>
                                </div>
                            </div>

                            <div className={`p-3 rounded-xl mb-4 ${selectedEmergency.priority === 'critical' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'
                                }`}>
                                <p className={`font-semibold ${selectedEmergency.priority === 'critical' ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'}`}>
                                    ⚠️ {selectedEmergency.type}
                                </p>
                            </div>

                            {/* Current Vitals */}
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-center">
                                    <Heart className="h-5 w-5 mx-auto mb-1 text-red-500" />
                                    <p className="text-xl font-bold text-red-600">{selectedEmergency.vitals.hr}</p>
                                    <p className="text-xs text-red-500">BPM</p>
                                </div>
                                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-center">
                                    <Activity className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                                    <p className="text-xl font-bold text-blue-600">{selectedEmergency.vitals.spo2}%</p>
                                    <p className="text-xs text-blue-500">SpO2</p>
                                </div>
                                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-center">
                                    <Activity className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                                    <p className="text-xl font-bold text-purple-600">{selectedEmergency.vitals.bp}</p>
                                    <p className="text-xs text-purple-500">BP</p>
                                </div>
                            </div>

                            {/* Location & Contact */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="p-3 rounded-xl" style={{ background: 'var(--bg-primary)' }}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <MapPin className="h-4 w-4 text-teal-500" />
                                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Location</span>
                                    </div>
                                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{selectedEmergency.address}</p>
                                    <a
                                        href={`https://maps.google.com/?q=${selectedEmergency.location.lat},${selectedEmergency.location.lng}`}
                                        target="_blank"
                                        className="text-xs text-teal-600 hover:underline flex items-center gap-1 mt-1"
                                    >
                                        <Navigation className="h-3 w-3" /> Open in Maps
                                    </a>
                                </div>
                                <div className="p-3 rounded-xl" style={{ background: 'var(--bg-primary)' }}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Users className="h-4 w-4 text-teal-500" />
                                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Emergency Contact</span>
                                    </div>
                                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{selectedEmergency.emergencyContact.name}</p>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{selectedEmergency.emergencyContact.phone}</p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-4 gap-2">
                                <button
                                    onClick={() => alert(`Calling ${selectedEmergency.patientName}...`)}
                                    className="py-3 px-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors flex flex-col items-center gap-1"
                                >
                                    <PhoneCall className="h-5 w-5" />
                                    <span className="text-xs font-medium">Call Patient</span>
                                </button>
                                <button
                                    onClick={() => alert(`Calling ${selectedEmergency.emergencyContact.name}...`)}
                                    className="py-3 px-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-colors flex flex-col items-center gap-1"
                                >
                                    <Phone className="h-5 w-5" />
                                    <span className="text-xs font-medium">Call Family</span>
                                </button>
                                <button
                                    onClick={() => router.push('/notifications')}
                                    className="py-3 px-2 rounded-xl bg-purple-500 text-white hover:bg-purple-600 transition-colors flex flex-col items-center gap-1"
                                >
                                    <MessageSquare className="h-5 w-5" />
                                    <span className="text-xs font-medium">Send Alert</span>
                                </button>
                                <button
                                    onClick={handleDispatch}
                                    className="py-3 px-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors flex flex-col items-center gap-1"
                                >
                                    <Ambulance className="h-5 w-5" />
                                    <span className="text-xs font-medium">Ambulance</span>
                                </button>
                            </div>
                        </div>

                        {/* Response Actions */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Protocol Steps */}
                            <div className="card p-4">
                                <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                    <Shield className="h-4 w-4 text-teal-500" />
                                    Response Protocol
                                </h3>
                                <div className="space-y-2">
                                    {emergencyProtocols[0].steps.map((step, i) => (
                                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                                            <div className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-600 flex items-center justify-center text-xs font-bold">
                                                {i + 1}
                                            </div>
                                            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{step}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Quick Resolution */}
                            <div className="card p-4">
                                <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Quick Actions</h3>
                                <div className="space-y-2">
                                    {selectedEmergency.status !== 'acknowledged' && (
                                        <button
                                            onClick={() => handleAcknowledge(selectedEmergency.id)}
                                            className="w-full py-2 px-4 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle className="h-4 w-4" />
                                            Acknowledge Emergency
                                        </button>
                                    )}
                                    <button
                                        onClick={() => router.push(`/patients/${selectedEmergency.patientId}`)}
                                        className="w-full py-2 px-4 rounded-xl border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                                        style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                    >
                                        <User className="h-4 w-4" />
                                        View Patient Details
                                    </button>
                                    <button
                                        onClick={() => handleResolve(selectedEmergency.id)}
                                        className="w-full py-2 px-4 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle className="h-4 w-4" />
                                        Mark as Resolved
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
