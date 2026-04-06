'use client'

import { Users, Radio, AlertTriangle, Heart, Clock, ChevronRight, Activity, Thermometer, MapPin, Phone, Zap, Shield, TrendingUp, Bell, X, Wifi, Building2, Smartphone, Pill } from 'lucide-react'
import { useTheme } from '@/lib/theme-context'
import AIHealthInsights from '@/components/AIHealthInsights'
import QuickActions from '@/components/QuickActions'
import VillageMap from '@/components/VillageMap'
import LiveMap from '@/components/LiveMap'
import ASHAVerification from '@/components/ASHAVerification'
import MedicineCompliance from '@/components/MedicineCompliance'
import VoiceTranslator from '@/components/VoiceTranslator'
import GatewayConnector from '@/components/GatewayConnector'
import VitalsEntryModal from '@/components/VitalsEntryModal'
import MobileAccessModal from '@/components/MobileAccessModal'
import CommandCenterModal from '@/components/CommandCenterModal'
import MedicineScheduleManager from '@/components/MedicineScheduleManager'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useDemoMode } from '@/lib/demo-context'
import { DEMO_PATIENT_COUNT, getDemoStats } from '@/lib/demo-data'

const stats = [
    { id: 1, labelKey: 'totalPatients', value: '...', icon: Users, gradient: 'bg-gradient-teal', trend: '+12%', trendUp: true, href: '/patients' },
    { id: 2, labelKey: 'activeDevices', value: '...', icon: Radio, gradient: 'bg-gradient-blue', trend: '+8%', trendUp: true, href: '/devices' },
    { id: 3, labelKey: 'criticalAlerts', value: '...', icon: AlertTriangle, gradient: 'bg-gradient-red', trend: '-25%', trendUp: false, href: '/notifications' },
    { id: 4, labelKey: 'healthScore', value: '82%', icon: Heart, gradient: 'bg-gradient-green', trend: '+5%', trendUp: true, href: '/reports' },
]

const initialAlerts: any[] = []

const schedule: any[] = []

const liveVitals: any[] = []

export default function DashboardPage() {
    const { t, language } = useTheme()
    const router = useRouter()
    const { isDemoMode } = useDemoMode()
    const [alerts, setAlerts] = useState<any[]>(initialAlerts)
    const [liveVitalsData, setLiveVitalsData] = useState<any[]>(liveVitals)
    const [dashboardStats, setDashboardStats] = useState(stats)
    const [showNotifications, setShowNotifications] = useState(false)
    const [showVitalsEntry, setShowVitalsEntry] = useState(false)
    const [showStrategy, setShowStrategy] = useState(false)
    const [showMobileAccess, setShowMobileAccess] = useState(false)
    const [showCommandCenter, setShowCommandCenter] = useState(false)
    const [showMedicineManager, setShowMedicineManager] = useState(false)
    const [respondingTo, setRespondingTo] = useState<number | null>(null)
    const [demoSchedule, setDemoSchedule] = useState<any[]>([])

    // We compute this on every render in demo mode for simplicity as it pulls from localStorage/cache
    const demoDataStats = isDemoMode ? getDemoStats() : null

    // Initialize Demo Data
    useEffect(() => {
        if (isDemoMode) {
            setDashboardStats(prev => [
                { id: 1, labelKey: 'totalPatients', value: DEMO_PATIENT_COUNT.toString(), icon: Users, gradient: 'bg-gradient-teal', trend: '+12%', trendUp: true, href: '/patients' },
                { id: 2, labelKey: 'activeDevices', value: (demoDataStats?.totalOnline || 128).toString(), icon: Radio, gradient: 'bg-gradient-blue', trend: '+8%', trendUp: true, href: '/devices' },
                { id: 3, labelKey: 'criticalAlerts', value: demoDataStats?.totalAlerts.toString() || '5', icon: AlertTriangle, gradient: 'bg-gradient-red', trend: '-25%', trendUp: false, href: '/notifications' },
                { id: 4, labelKey: 'healthScore', value: `${demoDataStats?.healthScore || 82}%`, icon: Heart, gradient: 'bg-gradient-green', trend: '+5%', trendUp: true, href: '/reports' },
            ])
            const savedAppts = localStorage.getItem('demo_appointments')
            if (savedAppts) {
                const parsed = JSON.parse(savedAppts)
                // Filter for "Today" or matching date
                const todayAppts = parsed.filter((a: any) => {
                    if (a.date === 'Today') return true
                    if (a.scheduled_time) {
                        return new Date(a.scheduled_time).toDateString() === new Date().toDateString()
                    }
                    return false
                }).map((a: any) => ({
                    time: a.time,
                    patient: a.patient,
                    typeKey: 'healthCheckup', // Default for demo
                    status: a.status === 'confirmed' ? 'next' : 'upcoming'
                }))
                setDemoSchedule(todayAppts)
            } else {
                setDemoSchedule([])
            }
        } else {
            // Reset if toggled off
            setDemoSchedule([])
        }
    }, [isDemoMode])

    // Listen for Demo Vitals Updates
    useEffect(() => {
        const handleVitalsUpdate = (e: CustomEvent) => {
            const { deviceId, patientName, hr, spo2, temp, isDemo } = e.detail

            // Only update if in demo mode OR if it's a real device
            // (But here we want demo mode to *show* these events)
            if (!isDemo && !isDemoMode) return // Should not happen given logic, but safety

            // Update Live Vitals List
            setLiveVitalsData(prev => {
                const existing = prev.findIndex(v => v.patient === patientName)
                const newVital = {
                    patient: patientName,
                    hr,
                    spo2,
                    temp,
                    status: e.detail.status || ((hr > 100 || spo2 < 90) ? 'critical' : 'normal'),
                    village: e.detail.village || 'LoRa Mesh',
                    lastSync: 'Now'
                }

                if (existing >= 0) {
                    const updated = [...prev]
                    updated[existing] = newVital
                    return updated
                } else {
                    return [newVital, ...prev].slice(0, 3)
                }
            })

            // Trigger Alert if Critical
            if (hr > 100 || spo2 < 90) {
                setAlerts(prev => {
                    // Prevent duplicate alerts for same patient within short time
                    const lastAlert = prev.find(a => a.patient === patientName)
                    if (lastAlert && Date.now() - lastAlert.id < 10000) return prev

                    return [
                        {
                            id: Date.now(),
                            patient: patientName,
                            messageKey: hr > 100 ? 'highHeartRate' : 'lowOxygen',
                            time: 'Just now',
                            severity: 'critical',
                            vitals: `HR: ${hr} • SpO2: ${spo2}%`,
                            village: e.detail.village || 'LoRa Mesh',
                            responded: false
                        },
                        ...prev
                    ].slice(0, 5)
                })
            }
        }

        window.addEventListener('vitals-update', handleVitalsUpdate as EventListener)
        return () => window.removeEventListener('vitals-update', handleVitalsUpdate as EventListener)
    }, [isDemoMode])

    // Real-time Data Fetching
    useEffect(() => {
        const savedDemo = typeof window !== 'undefined' ? localStorage.getItem('swasthgram_demo_mode') : null
        const initialDemoMode = savedDemo ? JSON.parse(savedDemo) : false
        if (isDemoMode || initialDemoMode) return

        const fetchInitialData = async () => {
            // 1. Fetch Patients & Stats
            const { data: patients, error: pError } = await supabase.from('patients').select('*')
            if (patients && !pError) {
                const criticalCount = patients.filter((p: any) => p.status === 'critical').length
                const offlineCount = patients.filter((p: any) => p.status === 'offline').length

                setDashboardStats(prev => prev.map(s => {
                    if (s.id === 1) return { ...s, value: patients.length.toString() }
                    if (s.id === 2) return { ...s, value: (patients.length - offlineCount).toString() }
                    if (s.id === 3) return { ...s, value: criticalCount.toString() }
                    return s
                }))
            }

            // 2. Fetch Latest Vitals
            const { data: vitals, error: vError } = await supabase
                .from('vitals')
                .select(`
                    *,
                    patients (name, village, status)
                `)
                .order('timestamp', { ascending: false })
                .limit(10)

            if (vitals && !vError) {
                const formattedVitals = vitals.map((v: any) => ({
                    patient: v.patients?.name || 'Unknown',
                    hr: v.heart_rate,
                    spo2: v.spo2,
                    temp: v.temperature,
                    status: v.patients?.status || 'normal',
                    village: v.patients?.village || 'Unknown',
                    lastSync: 'Now'
                }))
                setLiveVitalsData(formattedVitals.slice(0, 3))
            }

            // 3. Fetch Today's Appointments (Real Mode)
            const todayStart = new Date()
            todayStart.setHours(0, 0, 0, 0)
            const todayEnd = new Date()
            todayEnd.setHours(23, 59, 59, 999)

            const { data: appts, error: aError } = await supabase
                .from('appointments')
                .select(`
                    *,
                    patients (name)
                `)
                .gte('scheduled_time', todayStart.toISOString())
                .lte('scheduled_time', todayEnd.toISOString())
                .order('scheduled_time', { ascending: true })
                .limit(5)

            if (appts && !aError) {
                const formattedAppts = appts.map((a: any) => ({
                    time: new Date(a.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    patient: a.patients?.name || a.patient_name || 'Unknown', // Fallback for direct name
                    typeKey: a.type === 'Emergency' ? 'emergency' : 'healthCheckup', // Simple mapping
                    status: a.status === 'confirmed' ? 'next' : 'upcoming',
                    // Original type for display if key missing
                    originalType: a.type
                }))
                setDemoSchedule(formattedAppts)
            }
        }

        fetchInitialData()

        // 3. Real-time Subscription (Vitals & Patients)
        const channel = supabase
            .channel('dashboard-updates')
            // Listen for VITALS (History/Trends)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vitals' }, (payload: { [key: string]: any }) => {
                const newVital = payload.new as any
                // Refresh data to update charts/lists
                fetchInitialData()

                // Critical Alert Logic (Red)
                if (newVital.heart_rate > 100 || newVital.spo2 < 90) {
                    // ... existing alert logic ...
                }
            })
            // Listen for PATIENTS (Status Changes: SOS / CALL)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'patients' }, (payload: { [key: string]: any }) => {
                const newPatient = payload.new as any
                const oldPatient = payload.old as any

                // Refresh Data
                fetchInitialData()

                // DETECT CALL REQUEST (Status changed to 'calling')
                if (newPatient.status === 'calling' && oldPatient.status !== 'calling') {
                    setAlerts(prev => [
                        {
                            id: Date.now(),
                            patient: newPatient.name || 'Unknown',
                            messageKey: 'callRequest', // You might need to add this key to translations or handle raw string
                            time: 'Just now',
                            severity: 'info', // Blue
                            vitals: 'Requesting Callback',
                            village: newPatient.village || 'LORA MESH',
                            responded: false
                        },
                        ...prev
                    ].slice(0, 5))

                    // Optional: Audio Alert
                    const audio = new Audio('/alert.mp3')
                    audio.play().catch(e => console.log("Audio play failed", e))
                }

                // DETECT SOS (Status changed to 'critical')
                if (newPatient.status === 'critical' && oldPatient.status !== 'critical') {
                    setAlerts(prev => [
                        {
                            id: Date.now(),
                            patient: newPatient.name || 'Unknown',
                            messageKey: 'sosAlert',
                            time: 'Just now',
                            severity: 'critical', // Red
                            vitals: 'SOS BUTTON PRESSED',
                            village: newPatient.village || 'LORA MESH',
                            responded: false
                        },
                        ...prev
                    ].slice(0, 5))
                    const audio = new Audio('/alert.mp3')
                    audio.play().catch(e => console.log("Audio play failed", e))
                }
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [isDemoMode])

    const currentDate = new Date().toLocaleDateString(
        language === 'hi' ? 'hi-IN' : language === 'te' ? 'te-IN' : 'en-IN',
        { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
    )

    const handleRespond = (alertId: number) => {
        setRespondingTo(alertId)
        setTimeout(() => {
            setAlerts(prev => prev.map(a =>
                a.id === alertId ? { ...a, responded: true } : a
            ))
            setRespondingTo(null)
        }, 1000)
    }

    const handleRespondAll = () => {
        if (confirm('Respond to all alerts?\n\nThis will mark all alerts as acknowledged and notify ASHA workers.')) {
            setAlerts(prev => prev.map(a => ({ ...a, responded: true })))
            alert('✅ All alerts responded!\n\nNotifications sent to:\n- Local ASHA workers\n- Family contacts\n- Ambulance service (for critical)')
        }
    }

    const handleScheduleClick = (patient: string, type: string) => {
        alert(`📅 Appointment Details\n\nPatient: ${patient}\nType: ${type}\n\nOptions:\n- Start consultation\n- Reschedule\n- View patient history`)
    }

    const handleVitalClick = (patient: string) => {
        router.push('/vitals')
    }

    const handleStatClick = (href: string) => {
        router.push(href)
    }

    return (
        <div className="space-y-4 pb-6 relative">

            {/* Vitals Entry Modal */}
            {showVitalsEntry && <VitalsEntryModal onClose={() => setShowVitalsEntry(false)} />}

            {/* Notification Panel */}
            {showNotifications && (
                <div className="fixed inset-0 z-50 flex items-start justify-end p-4 bg-black/30" onClick={() => setShowNotifications(false)}>
                    <div className="w-96 max-h-[80vh] overflow-y-auto card mt-16 mr-4 animate-fadeInUp" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
                            <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Notifications</h3>
                            <button onClick={() => setShowNotifications(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                                <X className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                            </button>
                        </div>
                        <div className="p-4 space-y-3">
                            {alerts.map(alert => (
                                <div key={alert.id} className={`p-3 rounded-xl ${alert.responded ? 'opacity-50' : ''} ${alert.severity === 'critical' ? 'border-2 border-red-500 animate-emergency-pulse shadow-red-500/50' : ''}`} style={{ background: 'var(--bg-primary)' }}>
                                    {alert.severity === 'critical' && (
                                        <div className="absolute inset-0 bg-red-500/10 pointer-events-none animate-pulse" />
                                    )}
                                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{alert.patient}</p>
                                    <p className="text-xs mt-1" style={{ color: alert.severity === 'critical' ? '#ef4444' : 'var(--text-muted)' }}>
                                        {t(alert.messageKey)}
                                    </p>
                                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{alert.time} {alert.isHour ? t('hourAgo') : t('minsAgo')}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Content Area */}
            <div className="pt-2 md:pt-0">
                <div className="animate-fadeInUp space-y-4">
                    {/* Top Status Shelf - Connectivity & Health */}
                    <div className="flex flex-wrap items-center justify-between gap-3 p-2 rounded-2xl glass-indigo shadow-lg border border-indigo-500/20">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-teal text-white text-[10px] sm:text-xs font-black shadow-lg animate-pulse-subtle whitespace-nowrap">
                                <Shield className="h-3.5 w-3.5" />
                                SWASTHGRAM SECURE
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-emerald text-[10px] sm:text-xs font-black text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                                <Wifi className="h-3.5 w-3.5 text-emerald-500" />
                                LoRa MESH: ACTIVE
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="hidden lg:flex items-center gap-3 px-3 py-1 border-r border-slate-200 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">{t('systemOnline')}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowNotifications(true)}
                                    className="relative p-2 rounded-xl glass-indigo hover:bg-slate-100 dark:hover:bg-indigo-900/40 transition-all hover:scale-105"
                                >
                                    <Bell className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-lg">
                                        {alerts.filter(a => !a.responded).length}
                                    </span>
                                </button>

                                <button
                                    onClick={() => setShowMobileAccess(true)}
                                    className="flex items-center gap-3 px-3 py-1.5 rounded-xl glass hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all group border border-teal-200/50 dark:border-teal-900/30"
                                >
                                    <div className="h-6 w-6 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center group-hover:rotate-12 transition-transform">
                                        <Smartphone className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                                    </div>
                                    <div className="text-left hidden sm:block">
                                        <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase leading-none mb-0.5">{t('mobileEMS')}</p>
                                        <div className="flex items-center gap-1">
                                            <p className="text-xs font-black text-slate-900 dark:text-white leading-none">{t('tabletView')}</p>
                                        </div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setShowStrategy(true)}
                                    className="flex items-center gap-3 px-3 py-1.5 rounded-xl glass hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all group border border-orange-200/50 dark:border-orange-900/30"
                                >
                                    <div className="h-6 w-6 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center group-hover:rotate-12 transition-transform">
                                        <TrendingUp className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <div className="text-left hidden sm:block">
                                        <p className="text-[10px] font-black uppercase tracking-tighter text-slate-600 dark:text-slate-400 leading-none mb-1">{t('intelligence')}</p>
                                        <p className="text-xs font-bold text-slate-900 dark:text-white leading-none">{t('viewAnalytics')}</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Title & Primary Actions Row */}
                    <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 px-1">
                        <div className="space-y-1">
                            <h1 className="text-3xl md:text-4xl xl:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight pr-4" style={{ color: 'var(--text-primary)' }}>
                                {t('primaryHealthCenter')}
                            </h1>
                            <div className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-400">
                                <div className="flex items-center gap-1.5 px-2.5 py-1.5 glass-indigo rounded-lg border border-indigo-500/10">
                                    <MapPin className="h-3.5 w-3.5 text-rose-500" />
                                    <span className="tracking-tight text-indigo-900 dark:text-indigo-300">{currentDate}</span>
                                </div>
                                <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 glass-emerald rounded-lg border border-emerald-500/10 text-emerald-800 dark:text-emerald-400">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="tracking-wide">HYDERABAD • GACHIBOWLI SECTOR</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                            <button
                                onClick={() => setShowVitalsEntry(true)}
                                className="flex-1 flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-800 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_20px_rgba(37,99,235,0.15)] hover:border-blue-500/50 dark:hover:border-blue-400/30 transition-all hover:-translate-y-1 active:scale-95 group font-black uppercase tracking-widest text-xs"
                            >
                                <Activity className="h-4.5 w-4.5 text-blue-500 group-hover:scale-125 group-hover:rotate-12 transition-all" />
                                {t('recordVitals') || 'RECORD VITALS'}
                            </button>
                            <button
                                onClick={() => setShowCommandCenter(true)}
                                className="flex-1 flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-[0_4px_12px_rgba(239,68,68,0.2)] hover:shadow-[0_8px_24px_rgba(239,68,68,0.4)] transition-all hover:-translate-y-1 active:scale-95 group font-black uppercase tracking-widest text-xs"
                            >
                                <Radio className="h-4.5 w-4.5 text-red-500 animate-pulse group-hover:scale-125 transition-all" />
                                {t('commandCenter') || 'COMMAND CENTER'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Quick Actions row (Compact) */}
                <div className="mt-1">
                    <QuickActions onManageMedicines={() => setShowMedicineManager(true)} />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                    {dashboardStats.map((stat, idx) => (
                        <div
                            key={stat.id}
                            onClick={() => handleStatClick(stat.href)}
                            className={`stat-card card animate-fadeInUp stagger-${idx + 1} cursor-pointer hover:scale-[1.02] transition-transform`}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                        {t(stat.labelKey)}
                                    </p>
                                    <p className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white" style={{ color: 'var(--text-primary)' }}>
                                        {stat.value || '0'}
                                    </p>
                                    <div className="mt-2 flex items-center gap-2">
                                        <TrendingUp className={`h-3 w-3 ${stat.trendUp ? 'text-emerald-500' : 'text-red-500'}`} style={{ transform: stat.trendUp ? 'none' : 'rotate(180deg)' }} />
                                        <span className={`text-xs font-semibold ${stat.trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {stat.trend}
                                        </span>
                                        <span className="text-xs text-slate-800 dark:text-slate-400 font-medium">{t('vsLastWeek')}</span>
                                    </div>
                                </div>
                                <div className={`icon-box ${stat.gradient}`}>
                                    <stat.icon className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Critical Alerts - Takes 2 columns */}
                    <div className="lg:col-span-2 card animate-fadeInUp">
                        <div className="p-5 border-b" style={{ borderColor: 'var(--border-color)' }}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="icon-box bg-gradient-red animate-pulse-glow">
                                        <AlertTriangle className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                            {t('criticalAlerts')}
                                        </h2>
                                        <p className="text-sm text-slate-700 dark:text-slate-400 font-medium">{t('realTimeEmergency')}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleRespondAll}
                                    className="btn-primary flex items-center gap-2 text-sm px-4 py-2 hover:scale-105 transition-transform"
                                >
                                    <Zap className="h-4 w-4" /> {t('respondAll')}
                                </button>
                            </div>
                        </div>
                        <div>
                            {alerts.map((alert) => (
                                <div
                                    key={alert.id}
                                    className={`p-4 alert-${alert.severity} transition-all duration-300 hover:pl-6 cursor-pointer ${alert.responded ? 'opacity-50' : ''}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`avatar w-12 h-12 text-base ${alert.severity === 'critical' ? 'bg-gradient-red animate-heartbeat' : alert.severity === 'warning' ? 'bg-gradient-orange' : 'bg-gradient-blue animate-pulse-slow'}`}>
                                                {alert.patient.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-slate-900 dark:text-white text-lg">
                                                        {alert.patient}
                                                    </p>
                                                    <span className="badge badge-outline text-xs px-2 py-0.5 border-slate-300 dark:border-slate-700 text-slate-500">
                                                        ID: {alert.patient.substring(0, 3).toUpperCase() + '...'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                    <span>{alert.age || 65} yrs</span>
                                                    <span>•</span>
                                                    <span>{alert.village}</span>
                                                </div>
                                                <p className="text-sm font-bold mt-1" style={{ color: alert.severity === 'critical' ? '#ef4444' : alert.severity === 'warning' ? '#f59e0b' : '#3b82f6' }}>
                                                    {alert.severity === 'info' ? '📞 CALL REQUEST' : `⚠️ ${t(alert.messageKey)}`}
                                                </p>
                                                <p className="text-xs mt-0.5 font-mono text-slate-500 dark:text-slate-400">
                                                    {alert.vitals}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className="text-xs text-slate-800 dark:text-slate-400 font-bold">
                                                {alert.time} {alert.isHour ? t('hourAgo') : t('minsAgo')}
                                            </span>
                                            {alert.responded ? (
                                                <span className="badge badge-success px-3 py-1.5 text-xs">✓ Responded</span>
                                            ) : (
                                                <div className="flex flex-col gap-2 w-full">
                                                    <button
                                                        onClick={() => handleRespond(alert.id)}
                                                        disabled={respondingTo === alert.id}
                                                        className={`${alert.severity === 'critical' ? 'btn-danger' : alert.severity === 'info' ? 'btn-primary bg-blue-600 hover:bg-blue-700' : 'btn-primary'} px-3 py-1.5 text-xs hover:scale-105 transition-transform w-full`}
                                                    >
                                                        {respondingTo === alert.id ? 'Connecting...' : alert.severity === 'info' ? '📞 Call Patient' : `${t('respond')} →`}
                                                    </button>
                                                    <button
                                                        onClick={() => router.push(`/patient/${Math.floor(Math.random() * 100)}`)}
                                                        className="text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white uppercase tracking-wider text-right"
                                                    >
                                                        View Profile
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Today's Schedule */}
                    <div className="card animate-fadeInUp">
                        <div className="p-5 border-b" style={{ borderColor: 'var(--border-color)' }}>
                            <div className="flex items-center gap-3">
                                <div className="icon-box bg-gradient-blue">
                                    <Clock className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                        {t('todaySchedule')}
                                    </h2>
                                    <p className="text-sm text-slate-700 dark:text-slate-400 font-medium">{(schedule.length + demoSchedule.length)} {t('appointments_count')}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowMedicineManager(true)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-all font-bold text-xs shadow-sm hover:shadow-md active:scale-95"
                            >
                                <Pill className="h-4 w-4" />
                                {t('manageDispenserSchedules')}
                            </button>
                        </div>
                        <div className="p-4 space-y-2">
                            {[...schedule, ...demoSchedule].map((item, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => handleScheduleClick(item.patient, t(item.typeKey))}
                                    className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 cursor-pointer group hover:scale-[1.02] ${item.status === 'next' ? 'glow-teal bg-gradient-teal-dark dark:bg-gradient-teal text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                >
                                    <div className={`text-center min-w-[50px] p-1.5 rounded-lg ${item.status === 'next' ? 'bg-white/20 backdrop-blur-sm' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                        <p className={`text-sm font-bold ${item.status === 'next' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                            {item.time}
                                        </p>
                                    </div>
                                    <div className="flex-1">
                                        <p className={`font-black text-sm ${item.status === 'next' ? 'text-white' : 'text-slate-900'}`}>{item.patient}</p>
                                        <p className={`text-xs font-bold ${item.status === 'next' ? 'text-white/90' : 'text-slate-700 dark:text-slate-400'}`}>{t(item.typeKey)}</p>
                                    </div>
                                    {item.status === 'next' && (
                                        <span className="badge badge-success text-xs px-2 py-0.5 bg-white/20 text-white border-none">{t('next')}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="p-4 pt-0">
                            <button
                                onClick={() => router.push('/appointments')}
                                className="w-full btn-primary py-2 text-sm"
                            >
                                {t('viewAllAppointments')} →
                            </button>
                        </div>
                    </div>
                </div>

                {/* Live Vitals + Village Map Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Live Vitals Monitor */}
                    <div className="lg:col-span-2 card animate-fadeInUp">
                        <div className="p-5 border-b" style={{ borderColor: 'var(--border-color)' }}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="icon-box bg-gradient-green animate-pulse-glow">
                                        <Activity className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                            {t('liveVitalsMonitor')}
                                        </h2>
                                        <p className="text-sm text-slate-700 dark:text-slate-400 font-medium">{t('realtimeData')}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="status-online" />
                                    <span className="text-sm font-semibold" style={{ color: '#10b981' }}>{liveVitalsData.length} {t('streaming')}</span>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x" style={{ borderColor: 'var(--border-color)' }}>
                            {liveVitalsData.map((vital, idx) => (
                                <div
                                    key={idx}
                                    className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors relative overflow-hidden ${vital.status === 'critical' ? 'bg-red-50/50 dark:bg-red-900/10 border-l-4 border-red-500 animate-emergency-pulse' : ''}`}
                                    onClick={() => handleVitalClick(vital.patient)}
                                >
                                    {vital.status === 'critical' && (
                                        <div className="absolute inset-0 bg-red-500/5 pointer-events-none animate-pulse" />
                                    )}
                                    <div className="flex items-center justify-between mb-3 relative z-10">
                                        <div className="flex items-center gap-2">
                                            <div className={`avatar w-8 h-8 text-sm ${vital.status === 'critical' ? 'bg-gradient-red animate-heartbeat' : vital.status === 'offline' ? 'bg-gray-400' : 'bg-gradient-teal'}`}>
                                                {vital.patient.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-slate-900 dark:text-white">{vital.patient}</p>
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-400">{vital.village}</p>
                                            </div>
                                        </div>
                                        <span className={`badge text-xs px-2 py-0.5 ${vital.status === 'normal' ? 'badge-success' : vital.status === 'offline' ? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300' : 'badge-danger'}`}>
                                            {vital.status === 'normal' ? '✓' : vital.status === 'offline' ? 'Not Worn' : '⚠'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="p-2 rounded-lg text-center" style={{ background: 'var(--bg-primary)' }}>
                                            <Heart className={`h-4 w-4 mx-auto mb-1 ${vital.status === 'offline' ? 'text-slate-400' : vital.hr > 100 ? 'text-red-500 animate-heartbeat' : 'text-pink-500'}`} />
                                            <p className={`text-lg font-bold ${vital.hr > 100 ? 'text-red-500' : ''}`} style={{ color: vital.hr > 100 ? undefined : 'var(--text-primary)' }}>
                                                {vital.status === 'offline' ? '--' : vital.hr}
                                            </p>
                                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>bpm</p>
                                        </div>
                                        <div className="p-2 rounded-lg text-center" style={{ background: 'var(--bg-primary)' }}>
                                            <Activity className={`h-4 w-4 mx-auto mb-1 ${vital.status === 'offline' ? 'text-slate-400' : vital.spo2 < 90 ? 'text-red-500' : 'text-blue-500'}`} />
                                            <p className={`text-lg font-bold ${vital.spo2 < 90 ? 'text-red-500' : ''}`} style={{ color: vital.spo2 < 90 ? undefined : 'var(--text-primary)' }}>
                                                {vital.status === 'offline' ? '--' : vital.spo2}%
                                            </p>
                                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('oxygen')}</p>
                                        </div>
                                        <div className="p-2 rounded-lg text-center" style={{ background: 'var(--bg-primary)' }}>
                                            <Thermometer className={`h-4 w-4 mx-auto mb-1 ${vital.status === 'offline' ? 'text-slate-400' : vital.temp > 37.5 ? 'text-orange-500' : 'text-purple-500'}`} />
                                            <p className={`text-lg font-bold ${vital.temp > 37.5 ? 'text-orange-500' : ''}`} style={{ color: vital.temp > 37.5 ? undefined : 'var(--text-primary)' }}>
                                                {vital.status === 'offline' ? '--' : vital.temp}°
                                            </p>
                                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('temperature')}</p>
                                        </div>
                                        <div className="p-2 rounded-lg text-center" style={{ background: 'var(--bg-primary)' }}>
                                            <Zap className="h-4 w-4 mx-auto mb-1 text-slate-400" />
                                            <p className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>
                                                --
                                            </p>
                                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>BP (Soon)</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                            <button
                                onClick={() => router.push('/vitals')}
                                className="w-full btn-primary py-2 text-sm"
                            >
                                Open Full Vitals Monitor →
                            </button>
                        </div>
                    </div>

                    {/* Village Map */}
                    <VillageMap />
                </div>

                {/* Emergency Response Map - Full Width */}
                <LiveMap />

                {/* Medicine Compliance - Full Width */}
                <MedicineCompliance />

                {/* ASHA Verification - Full Width */}
                <ASHAVerification />

                {/* AI Voice Translator - Full Width */}
                <div className="animate-fadeInUp">
                    <VoiceTranslator />
                </div>

                {/* AI Health Insights - Full Width */}
                <AIHealthInsights className="animate-fadeInUp" />

                {/* Strategy & Business Model Panel (Slide Over) */}
                {showStrategy && (
                    <div className="fixed inset-0 z-[100] flex items-stretch justify-end">
                        <div
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-fadeIn"
                            onClick={() => setShowStrategy(false)}
                        />
                        <div className="relative w-full max-w-2xl bg-slate-950 border-l border-white/10 shadow-2xl animate-slideInRight overflow-y-auto">
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                            <TrendingUp className="h-6 w-6 text-emerald-500" />
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Health Intelligence</h2>
                                            <p className="text-sm text-slate-200 font-black tracking-widest uppercase opacity-80">Predictive Patient Insights</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowStrategy(false)}
                                        className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                                    >
                                        <X className="h-6 w-6 text-white" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="p-6 rounded-3xl bg-slate-900 border border-white/5 relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest relative z-10">Alert Resolution</p>
                                        <p className="text-4xl font-black text-white tracking-tighter italic relative z-10">94.2%</p>
                                        <div className="mt-4 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden relative z-10">
                                            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 w-[94.2%] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                        </div>
                                        <p className="text-xs text-emerald-400 mt-3 font-bold uppercase relative z-10 flex items-center gap-1">
                                            <TrendingUp className="h-3 w-3" />
                                            +2.4% this month
                                        </p>
                                    </div>
                                    <div className="p-6 rounded-3xl bg-slate-900 border border-white/5 relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest relative z-10">Avg. Response</p>
                                        <div className="flex items-baseline gap-1 relative z-10">
                                            <p className="text-4xl font-black text-white tracking-tighter italic">12.5</p>
                                            <span className="text-sm font-black text-slate-500 italic">min</span>
                                        </div>
                                        <div className="mt-4 flex items-end gap-1 h-8 relative z-10">
                                            {[35, 45, 30, 60, 40, 25, 20].map((h, i) => (
                                                <div key={i} className="flex-1 bg-blue-500/20 rounded-t-sm group-hover:bg-blue-500/40 transition-all" style={{ height: `${h}%` }} />
                                            ))}
                                        </div>
                                        <p className="text-xs text-blue-400 mt-3 font-bold uppercase relative z-10">Target: &lt;15.0m</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-black text-white italic uppercase tracking-tight ml-2">Condition Prevalence</h3>
                                    {[
                                        { title: 'Hypertension', desc: 'High Blood Pressure Risk', meta: '32% of Pop.', icon: Activity, color: 'text-red-500' },
                                        { title: 'Diabetes Type 2', desc: 'Blood Glucose Monitoring', meta: '24% of Pop.', icon: Pill, color: 'text-blue-500' },
                                        { title: 'Cardiac Risk', desc: 'High ECG Anomaly Detection', meta: '12% of Pop.', icon: Heart, color: 'text-rose-500' },
                                    ].map((model, i) => (
                                        <div key={i} className="group p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-all">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                        <model.icon className={`h-5 w-5 ${model.color}`} />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-white uppercase tracking-tight">{model.title}</p>
                                                        <p className="text-xs text-slate-200 font-bold opacity-70">{model.desc}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-black text-white tracking-tighter italic">{model.meta}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-8 p-6 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/10">
                                    <h3 className="font-black text-white italic uppercase tracking-tight mb-4">Risk Distribution Map</h3>
                                    <div className="space-y-4">
                                        {[
                                            { label: 'Age 65+', val: 45, color: 'bg-emerald-500' },
                                            { label: 'Chronic Patients', val: 78, color: 'bg-blue-500' },
                                            { label: 'Remote/Sector 3', val: 32, color: 'bg-purple-500' },
                                        ].map((item, i) => (
                                            <div key={i}>
                                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1.5">
                                                    <span className="text-slate-300">{item.label}</span>
                                                    <span className="text-white">{item.val}%</span>
                                                </div>
                                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                    <div className={`h-full ${item.color} shadow-[0_0_8px_rgba(0,0,0,0.3)] transition-all duration-1000`} style={{ width: `${item.val}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-white/10">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">Predictive Insight</p>
                                        <div className="bg-indigo-500/20 p-3 rounded-xl border border-indigo-500/30">
                                            <p className="text-xs text-indigo-200 font-medium text-center">
                                                Resource reallocation to <span className="text-white font-bold italic">Sector 3</span> recommended for Q2.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Mobile Access QR Modal */}
                <MobileAccessModal
                    isOpen={showMobileAccess}
                    onClose={() => setShowMobileAccess(false)}
                    url="http://10.218.55.237:3000/paramedic/dashboard"
                />
            </div>
            {/* Command Center Hub */}
            <CommandCenterModal
                isOpen={showCommandCenter}
                onClose={() => setShowCommandCenter(false)}
                externalAlerts={alerts}
            />

            {/* Medicine Schedule Manager Modal */}
            {showMedicineManager && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md animate-fadeIn" onClick={() => setShowMedicineManager(false)} />
                    <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto animate-zoomIn" onClick={e => e.stopPropagation()}>
                        <div className="absolute top-4 right-4 z-10">
                            <button
                                onClick={() => setShowMedicineManager(false)}
                                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <MedicineScheduleManager />
                    </div>
                </div>
            )}
        </div>
    )
}
