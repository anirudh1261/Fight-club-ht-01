'use client'

import { useState, useEffect } from 'react'
import { Send, Users, UserCheck, MessageSquare, Bell, CheckCircle, Globe, Languages } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useDemoMode } from '@/lib/demo-context'

// Patient data with language preferences
const mockPatients = [
    { id: 'P-001', name: 'Rajesh Kumar', deviceStatus: 'online', language: 'hi' },
    { id: 'P-002', name: 'Sunita Devi', deviceStatus: 'online', language: 'hi' },
    { id: 'P-003', name: 'Amit Singh', deviceStatus: 'offline', language: 'en' },
    { id: 'P-004', name: 'Lakshmi Devi', deviceStatus: 'online', language: 'te' },
    { id: 'P-005', name: 'Ravi Kumar', deviceStatus: 'online', language: 'hi' },
    { id: 'P-006', name: 'Priya Sharma', deviceStatus: 'online', language: 'en' },
]

// Multilingual message templates
const messageTemplates = [
    {
        id: 1,
        title: 'Medication Reminder',
        messages: {
            en: 'Time to take your medicine',
            hi: 'दवाई लेने का समय',
            te: 'మందు తీసుకునే సమయం',
            ta: 'மருந்து எடுக்க நேரம்',
            kn: 'ಔಷಧಿ ತೆಗೆದುಕೊಳ್ಳುವ ಸಮಯ',
            mr: 'औषध घेण्याची वेळ'
        }
    },
    {
        id: 2,
        title: 'Water Reminder',
        messages: {
            en: 'Drink water - stay hydrated',
            hi: 'पानी पीजिए - हाइड्रेटेड रहें',
            te: 'నీళ్ళు తాగండి',
            ta: 'தண்ணீர் குடிக்கவும்',
            kn: 'ನೀರು ಕುಡಿಯಿರಿ',
            mr: 'पाणी प्या'
        }
    },
    {
        id: 3,
        title: 'Exercise Reminder',
        messages: {
            en: 'Time for your daily walk',
            hi: 'टहलने का समय है',
            te: 'నడక సమయం',
            ta: 'நடைப்பயிற்சி நேரம்',
            kn: 'ನಡಿಗೆ ಸಮಯ',
            mr: 'चालण्याची वेळ'
        }
    },
    {
        id: 4,
        title: 'Checkup Reminder',
        messages: {
            en: 'Doctor visit tomorrow 10 AM',
            hi: 'कल सुबह 10 बजे डॉक्टर से मिलना है',
            te: 'రేపు ఉదయం 10 గంటలకు డాక్టర్ సందర్శన',
            ta: 'நாளை காலை 10 மணி மருத்துவர் சறந்தர்சனம்',
            kn: 'ನಾಳೆ ಬೆಳಿಗ್ಗೆ 10 ಗಂಟೆ ವೈದ್ಯರ ಭೇಟಿ',
            mr: 'उद्या सकाळी 10 वा डॉक्टरांची भेट'
        }
    },
    {
        id: 5,
        title: 'Emergency Alert',
        messages: {
            en: 'Please come to PHC immediately',
            hi: 'कृपया तुरंत PHC आएं',
            te: 'దయచేసి వెంటనే PHC కి రండి',
            ta: 'உடனடியாக PHC வாருங்கள்',
            kn: 'ದಯವಿಟ್ಟು ತಕ್ಷಣ PHC ಗೆ ಬನ್ನಿ',
            mr: 'कृपया लगेच PHC ला या'
        }
    },
    {
        id: 6,
        title: 'BP Check Reminder',
        messages: {
            en: 'Time to measure your BP',
            hi: 'बीपी जांच का समय',
            te: 'BP కొలవడానికి సమయం',
            ta: 'BP அளவிடும் நேரம்',
            kn: 'BP ಅಳೆಯುವ ಸಮಯ',
            mr: 'BP मोजण्याची वेळ'
        }
    },
]

const languageInfo: { [key: string]: { name: string, flag: string } } = {
    en: { name: 'English', flag: '🇬🇧' },
    hi: { name: 'Hindi', flag: '🇮🇳' },
    te: { name: 'Telugu', flag: '🇮🇳' },
    ta: { name: 'Tamil', flag: '🇮🇳' },
    kn: { name: 'Kannada', flag: '🇮🇳' },
    mr: { name: 'Marathi', flag: '🇮🇳' },
}

import { generateDemoPatients } from '@/lib/demo-data'

export default function NotificationsPage() {
    const { isDemoMode } = useDemoMode()
    const [patients, setPatients] = useState<any[]>([])
    const [recipientMode, setRecipientMode] = useState<'all' | 'specific'>('all')
    const [selectedPatients, setSelectedPatients] = useState<string[]>([])
    const [message, setMessage] = useState('')
    const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null)
    const [sentNotifications, setSentNotifications] = useState<any[]>([])

    useEffect(() => {
        const fetchPatients = async () => {
            if (isDemoMode) {
                setPatients(generateDemoPatients())
                return
            }

            const { data, error } = await supabase
                .from('patients')
                .select('*')

            if (data && !error) {
                const formatted = data.map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    deviceStatus: p.status === 'offline' ? 'offline' : 'online',
                    language: 'en' // Default to English as language col might be missing or complex
                }))
                setPatients(formatted)
            }
        }
        fetchPatients()
    }, [isDemoMode])

    const togglePatient = (id: string) => {
        if (selectedPatients.includes(id)) {
            setSelectedPatients(selectedPatients.filter(p => p !== id))
        } else {
            setSelectedPatients([...selectedPatients, id])
        }
    }

    const selectTemplate = (template: typeof messageTemplates[0]) => {
        setSelectedTemplate(template.id)
        setMessage(template.messages.en) // Show English in the input
    }

    const handleSend = () => {
        // Determine recipients
        const recipients = recipientMode === 'all'
            ? onlinePatients
            : onlinePatients.filter(p => selectedPatients.includes(p.id))

        // Group by language
        const languageGroups: { [key: string]: string[] } = {}
        recipients.forEach(patient => {
            const lang = patient.language || 'en'
            if (!languageGroups[lang]) languageGroups[lang] = []
            languageGroups[lang].push(patient.name)
        })

        const template = messageTemplates.find(t => t.id === selectedTemplate)

        const notification = {
            id: Date.now(),
            message,
            template: template?.title,
            recipients: recipientMode === 'all' ? 'All Patients' : `${selectedPatients.length} selected`,
            languageBreakdown: languageGroups,
            timestamp: new Date().toLocaleTimeString(),
            status: 'sent'
        }

        setSentNotifications([notification, ...sentNotifications])

        // Show confirmation with language breakdown
        let confirmMsg = `✅ Notification Sent!\n\nMessage sent to ${recipients.length} patients:\n`
        Object.entries(languageGroups).forEach(([lang, names]) => {
            const langInfo = languageInfo[lang]
            const localizedMsg = template?.messages[lang as keyof typeof template.messages] || message
            confirmMsg += `\n${langInfo?.flag || '🌐'} ${langInfo?.name || lang}: ${names.length} patient(s)\n   → "${localizedMsg}"`
        })

        alert(confirmMsg)
        setMessage('')
        setSelectedPatients([])
        setSelectedTemplate(null)
    }

    const onlinePatients = patients.filter(p => p.deviceStatus === 'online')

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Push Notifications</h1>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Send multilingual messages to patient wearables via LoRa</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800">
                    <Languages className="h-4 w-4 text-teal-600" />
                    <span className="text-sm font-medium text-teal-700 dark:text-teal-300">Auto-translates to patient's language</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left Panel - Compose Message */}
                <div className="lg:col-span-2 card p-5">
                    <h2 className="text-lg font-semibold mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
                        <MessageSquare className="h-5 w-5 mr-2 text-teal-600" />
                        Compose Notification
                    </h2>

                    {/* Recipient Selection */}
                    <div className="mb-5">
                        <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Send to:</label>
                        <div className="flex gap-3 mb-4">
                            <button
                                onClick={() => setRecipientMode('all')}
                                className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all ${recipientMode === 'all'
                                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                                    : ''
                                    }`}
                                style={{ borderColor: recipientMode !== 'all' ? 'var(--border-color)' : undefined }}
                            >
                                <Users className="h-5 w-5 mx-auto mb-1" style={{ color: recipientMode === 'all' ? '#0d9488' : 'var(--text-muted)' }} />
                                <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>All Patients</div>
                                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{onlinePatients.length} online</div>
                            </button>
                            <button
                                onClick={() => setRecipientMode('specific')}
                                className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all ${recipientMode === 'specific'
                                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                                    : ''
                                    }`}
                                style={{ borderColor: recipientMode !== 'specific' ? 'var(--border-color)' : undefined }}
                            >
                                <UserCheck className="h-5 w-5 mx-auto mb-1" style={{ color: recipientMode === 'specific' ? '#0d9488' : 'var(--text-muted)' }} />
                                <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Specific Patients</div>
                                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Select individually</div>
                            </button>
                        </div>

                        {/* Patient Selection */}
                        {recipientMode === 'specific' && (
                            <div className="rounded-xl max-h-48 overflow-y-auto p-1" style={{ background: 'var(--bg-primary)' }}>
                                <div className="space-y-1">
                                    {onlinePatients.map((patient) => (
                                        <label
                                            key={patient.id}
                                            className="flex items-center p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedPatients.includes(patient.id)}
                                                onChange={() => togglePatient(patient.id)}
                                                className="h-4 w-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
                                            />
                                            <span className="ml-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{patient.name}</span>
                                            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                                {languageInfo[patient.language]?.flag} {languageInfo[patient.language]?.name}
                                            </span>
                                            <span className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>{patient.id}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Message Templates */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Quick Templates (Auto-translates):</label>
                        <div className="grid grid-cols-3 gap-2">
                            {messageTemplates.map((template) => (
                                <button
                                    key={template.id}
                                    onClick={() => selectTemplate(template)}
                                    className={`px-3 py-2 text-xs rounded-lg border transition-all text-left ${selectedTemplate === template.id
                                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300'
                                        : 'hover:border-teal-400 hover:bg-teal-50/50'
                                        }`}
                                    style={{ borderColor: selectedTemplate !== template.id ? 'var(--border-color)' : undefined, color: selectedTemplate !== template.id ? 'var(--text-primary)' : undefined }}
                                >
                                    {template.title}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Message Input */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                            Message (English - will be auto-translated):
                        </label>
                        <textarea
                            rows={3}
                            maxLength={64}
                            value={message}
                            onChange={(e) => { setMessage(e.target.value); setSelectedTemplate(null); }}
                            placeholder="Enter your message in English..."
                            className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none transition-all"
                            style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                        />
                        <div className="flex justify-between mt-1">
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                {message.length}/64 characters
                            </span>
                            {message.length >= 50 && (
                                <span className="text-xs text-orange-600">
                                    ⚠️ Long messages may wrap on OLED
                                </span>
                            )}
                        </div>
                    </div>

                    {/* OLED Preview with language tabs */}
                    <div className="mb-5">
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>OLED Preview:</label>
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-4 rounded-xl">
                            <div className="bg-blue-950 p-3 rounded-lg font-mono text-xs" style={{ fontFamily: 'monospace' }}>
                                <div className="border border-cyan-400/50 p-2 text-cyan-400">
                                    {message || 'Your message will appear here'}
                                </div>
                            </div>
                            {selectedTemplate && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {Object.entries(messageTemplates.find(t => t.id === selectedTemplate)?.messages || {}).slice(0, 4).map(([lang, msg]) => (
                                        <div key={lang} className="text-[10px] px-2 py-1 rounded bg-gray-700 text-gray-300">
                                            <span className="font-semibold">{languageInfo[lang]?.flag}</span> {(msg as string).substring(0, 20)}...
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Send Button */}
                    <button
                        onClick={handleSend}
                        disabled={!message || (recipientMode === 'specific' && selectedPatients.length === 0)}
                        className="w-full py-3 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold rounded-xl"
                    >
                        <Send className="h-5 w-5" />
                        Send Notification via LoRa
                    </button>
                </div>

                {/* Right Panel - Sent History */}
                <div className="card p-5">
                    <h2 className="text-lg font-semibold mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
                        <Bell className="h-5 w-5 mr-2 text-teal-600" />
                        Recent Notifications
                    </h2>
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                        {sentNotifications.length === 0 ? (
                            <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                                <Bell className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                <p className="text-sm">No notifications sent yet</p>
                            </div>
                        ) : (
                            sentNotifications.map((notif) => (
                                <div key={notif.id} className="rounded-xl p-3" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                                    <div className="flex items-start gap-2 mb-2">
                                        <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            {notif.template && (
                                                <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">{notif.template}</span>
                                            )}
                                            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{notif.message}</p>
                                            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>To: {notif.recipients}</p>
                                            {notif.languageBreakdown && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {Object.entries(notif.languageBreakdown).slice(0, 3).map(([lang, names]) => (
                                                        <span key={lang} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                                            {languageInfo[lang]?.flag} {(names as string[]).length}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{notif.timestamp}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Info Banner */}
            <div className="card p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Multilingual Notification System
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 grid grid-cols-2 gap-x-4">
                    <li>• Automatic translation to patient's preferred language</li>
                    <li>• Supports Hindi, Telugu, Tamil, Kannada, Marathi</li>
                    <li>• Messages appear on 128x64 OLED display</li>
                    <li>• Sent via LoRa network to paired wearables</li>
                </ul>
            </div>
        </div>
    )
}
