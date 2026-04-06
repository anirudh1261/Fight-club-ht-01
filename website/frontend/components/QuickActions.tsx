'use client'

import { Phone, Ambulance, Stethoscope, Pill, Video, MessageSquare, Users, MapPin, Zap } from 'lucide-react'
import { useTheme } from '@/lib/theme-context'
import { useState } from 'react'

interface QuickActionsProps {
    onAction?: (action: string) => void
    onManageMedicines?: () => void
}

export default function QuickActions({ onAction, onManageMedicines }: QuickActionsProps) {
    const { t } = useTheme()
    const [activeAction, setActiveAction] = useState<string | null>(null)
    const [showAmbulanceModal, setShowAmbulanceModal] = useState(false)
    const [callingAmbulance, setCallingAmbulance] = useState(false)

    const quickActions = [
        { icon: Ambulance, labelKey: 'callAmbulance', color: 'from-red-600 to-rose-700', glow: 'shadow-red-600/50', action: 'ambulance', pulse: true },
        { icon: Phone, labelKey: 'callPHC', color: 'from-emerald-500 to-green-600', glow: 'shadow-emerald-500/40', action: 'call' },
        { icon: Stethoscope, labelKey: 'teleconsult', color: 'from-blue-500 to-indigo-600', glow: 'shadow-blue-500/40', action: 'teleconsult' },
        { icon: Pill, labelKey: 'medicines', color: 'from-purple-500 to-violet-600', glow: 'shadow-purple-500/40', action: 'medicines' },
        { icon: Video, labelKey: 'videoCall', color: 'from-pink-500 to-rose-600', glow: 'shadow-pink-500/40', action: 'video' },
        { icon: MessageSquare, labelKey: 'sendAlert', color: 'from-amber-500 to-orange-600', glow: 'shadow-amber-500/40', action: 'alert', href: '/notifications' },
    ]

    const familyContacts = [
        { name: 'Son - Rajesh', phone: '+91-9876543210', relation: 'Primary' },
        { name: 'Daughter - Priya', phone: '+91-9876543211', relation: 'Secondary' },
        { name: 'Neighbor - Sharma Ji', phone: '+91-9876543212', relation: 'Emergency' },
    ]

    const handleAmbulanceCall = () => {
        setCallingAmbulance(true)

        // Simulate getting GPS location
        setTimeout(() => {
            setCallingAmbulance(false)

            // Open phone dialer with 108 (India ambulance)
            window.location.href = 'tel:108'

            // Show confirmation
            setTimeout(() => {
                alert(`🚑 Ambulance Dispatched!\n\n` +
                    `📍 Location Shared: Rampur Village, Hyderabad\n` +
                    `📞 Calling: 108 Emergency Services\n\n` +
                    `✅ Family members notified:\n` +
                    `• Son - Rajesh (SMS sent)\n` +
                    `• Daughter - Priya (SMS sent)\n\n` +
                    `⏱️ Estimated arrival: 12-15 minutes`)
            }, 500)
        }, 2000)
    }

    const handleAction = (action: string, href?: string) => {
        setActiveAction(action)
        setTimeout(() => setActiveAction(null), 300)

        switch (action) {
            case 'medicines':
                if (onManageMedicines) {
                    onManageMedicines()
                    return
                }
                break
            case 'ambulance':
                setShowAmbulanceModal(true)
                return
            case 'call':
                window.location.href = 'tel:+911234567890'
                return
            case 'teleconsult':
                alert('👨‍⚕️ Starting Teleconsultation...\n\nConnecting to available doctor.\nPlease wait...')
                return
            case 'video':
                alert('📹 Starting Video Call...\n\nInitializing camera and microphone.\nConnecting to consultation room...')
                return
        }

        if (href) {
            window.location.href = href
            return
        }

        onAction?.(action)
    }

    return (
        <>
            <div className="card p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300" style={{ backgroundColor: 'var(--bg-card, #ffffff)' }}>
                <h3 className="text-sm font-black mb-3 text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    {t('quickActions')}
                </h3>
                <div className="grid grid-cols-2 min-[400px]:grid-cols-3 md:grid-cols-6 gap-3">
                    {quickActions.map((action, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleAction(action.action, action.href)}
                            className={`flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 shadow-sm hover:shadow-md transition-all duration-200 group ${activeAction === action.action ? 'scale-95' : ''} ${action.pulse ? 'ring-2 ring-red-500/50 animate-pulse' : ''}`}
                        >
                            <div className={`p-2.5 rounded-full bg-gradient-to-br ${action.color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                                <action.icon className="h-5 w-5" />
                            </div>
                            <span className="text-[10px] font-black text-center text-slate-900 dark:text-slate-200 uppercase leading-none tracking-tight">{t(action.labelKey)}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Ambulance Emergency Modal */}
            {showAmbulanceModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => !callingAmbulance && setShowAmbulanceModal(false)}>
                    <div className="w-full max-w-md card p-0 overflow-hidden animate-fadeInUp" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="bg-gradient-to-r from-red-600 to-rose-700 p-4 text-white">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-white/20 rounded-full animate-pulse">
                                    <Ambulance className="h-8 w-8" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Emergency Ambulance</h3>
                                    <p className="text-sm opacity-90">Call 108 - Free Ambulance Service</p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-4" style={{ background: 'var(--bg-primary)' }}>
                            {/* Patient Info */}
                            <div className="p-3 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Patient: Lakshmi Devi (68 yrs)</p>
                                <div className="flex items-center gap-2 mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                                    <MapPin className="h-4 w-4 text-red-500" />
                                    <span>Rampur Village, Telangana</span>
                                </div>
                                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                                    Current Vitals: HR 110 bpm • SpO2 89% • Temp 38.2°C
                                </p>
                            </div>

                            {/* Call Ambulance Button */}
                            <button
                                onClick={handleAmbulanceCall}
                                disabled={callingAmbulance}
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 text-white font-bold text-lg shadow-lg shadow-red-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-3"
                            >
                                {callingAmbulance ? (
                                    <>
                                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                                        Getting Location...
                                    </>
                                ) : (
                                    <>
                                        <Phone className="h-5 w-5" />
                                        Call 108 Now
                                    </>
                                )}
                            </button>

                            {/* Family Contacts */}
                            <div>
                                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                    <Users className="h-4 w-4" />
                                    Notify Family Members
                                </h4>
                                <div className="space-y-2">
                                    {familyContacts.map((contact, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                                            <div>
                                                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{contact.name}</p>
                                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{contact.phone}</p>
                                            </div>
                                            <button
                                                onClick={() => window.location.href = `tel:${contact.phone}`}
                                                className="p-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                                            >
                                                <Phone className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Cancel Button */}
                            <button
                                onClick={() => setShowAmbulanceModal(false)}
                                className="w-full py-2 rounded-xl border text-sm font-medium transition-colors"
                                style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
                                disabled={callingAmbulance}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

