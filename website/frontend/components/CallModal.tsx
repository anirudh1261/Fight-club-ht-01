'use client'

import { useState } from 'react'
import { X, Phone, User, Users, Stethoscope, Heart, PhoneCall, PhoneOff, Video, ShieldCheck } from 'lucide-react'

interface CallModalProps {
    isOpen: boolean
    onClose: () => void
    patient: {
        name: string
        phone: string
        emergencyContact?: string
    }
    ashaWorker?: { name: string; phone: string }
    doctor?: { name: string; phone: string }
}

export default function CallModal({ isOpen, onClose, patient, ashaWorker, doctor }: CallModalProps) {
    const [calling, setCalling] = useState<string | null>(null)
    const [callDuration, setCallDuration] = useState(0)
    const [callMode, setCallMode] = useState<'voice' | 'video'>('voice')

    const callOptions = [
        {
            id: 'patient',
            label: 'Call Patient',
            name: patient.name,
            phone: patient.phone,
            icon: User,
            color: 'from-blue-500 to-cyan-500'
        },
        patient.emergencyContact ? {
            id: 'family',
            label: 'Call Family',
            name: 'Emergency Contact',
            phone: patient.emergencyContact,
            icon: Users,
            color: 'from-purple-500 to-pink-500'
        } : null,
        ashaWorker ? {
            id: 'asha',
            label: 'Call ASHA Worker',
            name: ashaWorker.name,
            phone: ashaWorker.phone,
            icon: Heart,
            color: 'from-emerald-500 to-teal-500'
        } : null,
        doctor ? {
            id: 'doctor',
            label: 'Call Doctor',
            name: doctor.name,
            phone: doctor.phone,
            icon: Stethoscope,
            color: 'from-red-500 to-rose-500'
        } : null,
    ].filter(Boolean)

    const handleCall = (option: typeof callOptions[0]) => {
        if (!option) return
        setCalling(option.id)

        if (callMode === 'voice') {
            // Start duration counter for voice
            const startTime = Date.now()
            const timer = setInterval(() => {
                setCallDuration(Math.floor((Date.now() - startTime) / 1000))
            }, 1000)

            // Open phone app on mobile
            window.location.href = `tel:${option.phone}`

            // @ts-ignore
            window._callTimer = timer;
        }
    }

    const endCall = () => {
        setCalling(null)
        setCallDuration(0)
        // @ts-ignore
        if (window._callTimer) {
            // @ts-ignore
            clearInterval(window._callTimer)
        }
    }

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    if (!isOpen) return null

    // Generate a unique, deterministic room name based on the patient's name
    const roomName = `AyuLink-Consult-${patient.name.replace(/\s+/g, '')}-${new Date().toISOString().split('T')[0]}`

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div 
                className={`card w-full rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${
                    calling && callMode === 'video' ? 'max-w-4xl h-[80vh]' : 'max-w-md'
                }`} 
                style={{ background: 'var(--bg-card)', display: 'flex', flexDirection: 'column' }}
            >
                {/* Header */}
                <div className="p-5 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl bg-gradient-to-br ${callMode === 'video' ? 'from-indigo-500 to-purple-600' : 'from-teal-400 to-emerald-500'}`}>
                            {callMode === 'video' ? <Video className="h-5 w-5 text-white" /> : <Phone className="h-5 w-5 text-white" />}
                        </div>
                        <div>
                            <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                                {callMode === 'video' ? 'Secure Tele-Consultation' : 'Standard Dial'}
                            </h2>
                            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                                {calling ? `Connected to ${callOptions.find(o => o?.id === calling)?.name}` : 'Select contact to call'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <X className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />
                    </button>
                </div>

                {/* Video Call Mode View */}
                {calling && callMode === 'video' && (
                    <div className="flex-1 w-full bg-black relative flex flex-col">
                        <iframe
                            allow="camera; microphone; fullscreen; display-capture; autoplay"
                            src={`https://meet.jit.si/${roomName}#config.prejoinPageEnabled=false&userInfo.displayName="Doctor"`}
                            style={{ height: '100%', width: '100%', border: 0 }}
                            className="flex-1"
                        />
                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
                            <ShieldCheck className="h-4 w-4 text-emerald-400" />
                            <span className="text-xs text-white font-medium">Encrypted WebRTC Channel</span>
                        </div>
                    </div>
                )}

                {/* Voice Call Mode View */}
                {calling && callMode === 'voice' && (
                    <div className="p-8 text-center flex-1">
                        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center animate-bounce shadow-lg shadow-teal-500/30">
                            <PhoneCall className="h-10 w-10 text-white animate-pulse" />
                        </div>
                        <p className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                            Calling {callOptions.find(o => o?.id === calling)?.name}...
                        </p>
                        <p className="text-3xl font-mono tracking-wider mb-8" style={{ color: 'var(--text-primary)' }}>
                            {formatDuration(callDuration)}
                        </p>
                    </div>
                )}

                {/* Contact Options (Before Calling) */}
                {!calling && (
                    <div className="p-4 space-y-4 flex-1">
                        {/* Audio/Video Toggle */}
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                            <button
                                onClick={() => setCallMode('voice')}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
                                    callMode === 'voice' 
                                        ? 'bg-white dark:bg-slate-700 shadow-sm text-teal-600 dark:text-teal-400' 
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                            >
                                <Phone className="h-4 w-4" /> GSM Call
                            </button>
                            <button
                                onClick={() => setCallMode('video')}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
                                    callMode === 'video' 
                                        ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' 
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                            >
                                <Video className="h-4 w-4" /> WebRTC Video
                            </button>
                        </div>
                        
                        <div className="space-y-2">
                            {callOptions.map((option) => option && (
                                <button
                                    key={option.id}
                                    onClick={() => handleCall(option)}
                                    className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all hover:-translate-y-1 hover:shadow-md border border-transparent ${
                                        callMode === 'video' ? 'hover:border-indigo-500/30' : 'hover:border-teal-500/30'
                                    }`}
                                    style={{ background: 'var(--bg-primary)' }}
                                >
                                    <div className={`p-3 rounded-xl bg-gradient-to-br ${callMode === 'video' ? 'from-indigo-400 to-purple-500' : option.color}`}>
                                        <option.icon className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{option.label}</p>
                                        <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{option.name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-mono px-2 py-1 rounded bg-slate-100 dark:bg-slate-800" style={{ color: 'var(--text-secondary)' }}>
                                            {callMode === 'video' ? 'Secure Link' : option.phone}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer Footer Controls */}
                <div className="p-4 border-t flex-shrink-0 bg-slate-50 dark:bg-slate-900/50" style={{ borderColor: 'var(--border-color)' }}>
                    {calling ? (
                        <button
                            onClick={endCall}
                            className="w-full py-4 rounded-xl bg-red-500 text-white font-bold flex items-center justify-center gap-2 hover:bg-red-600 transition-all shadow-lg hover:shadow-red-500/25 active:scale-95"
                        >
                            <PhoneOff className="h-5 w-5" />
                            {callMode === 'video' ? 'End Secure Consultation' : 'End Call'}
                        </button>
                    ) : (
                        <p className="text-xs text-center font-medium" style={{ color: 'var(--text-muted)' }}>
                            {callMode === 'video' 
                                ? 'Video calls are free, end-to-end encrypted, and run completely in-browser.' 
                                : 'Voice calls will open your native phone dialer app.'}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
