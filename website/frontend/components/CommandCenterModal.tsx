'use client'

import { useState, useEffect } from 'react'
import { X, Shield, Users, Ambulance, Globe, Maximize2, Minimize2, Radio, Activity, Signal, Server, CheckCircle2, Map as MapIcon } from 'lucide-react'

export default function CommandCenterModal({ isOpen, onClose, externalAlerts = [] }: { isOpen: boolean; onClose: () => void; externalAlerts?: any[] }) {
    const [view, setView] = useState<'map' | 'units' | 'logs'>('map')
    const [isFullScreen, setIsFullScreen] = useState(false)
    const [units, setUnits] = useState([
        { id: 'U1', name: 'Rekha (ASHA)', status: 'Active', location: 'Miyapur', speed: '5 km/h' },
        { id: 'U2', name: 'Ambulance 102', status: 'En Route', location: 'Sector 3', speed: '45 km/h' },
        { id: 'U3', name: 'Vijay (ASHA)', status: 'Standby', location: 'Gachibowli', speed: '0 km/h' }
    ])

    // Listen for demo/real location updates
    useEffect(() => {
        const handleLocationUpdate = (e: CustomEvent) => {
            const { patientName, lat, lng, deviceId } = e.detail
            setUnits(prev => {
                const existing = prev.findIndex(u => u.id === deviceId || u.name.includes(patientName))
                const newUnit = {
                    id: deviceId || Math.random().toString(),
                    name: patientName || 'Unknown Unit',
                    status: 'Active' as const,
                    location: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                    speed: 'Moving'
                }

                if (existing >= 0) {
                    const updated = [...prev]
                    updated[existing] = { ...updated[existing], ...newUnit }
                    return updated
                } else {
                    return [newUnit, ...prev].slice(0, 5)
                }
            })
        }

        window.addEventListener('location-update', handleLocationUpdate as EventListener)
        return () => window.removeEventListener('location-update', handleLocationUpdate as EventListener)
    }, [])

    const activeEmergencies = externalAlerts.length > 0
        ? externalAlerts.map(a => ({
            id: a.id.toString(),
            patient: a.patient,
            village: a.village,
            type: a.messageKey === 'highHeartRate' ? 'Cardiac' : a.messageKey === 'lowOxygen' ? 'O2 Critical' : 'Medical',
            status: a.responded ? 'Handled' : 'Critical',
            time: a.time
        }))
        : [
            { id: 'E1', patient: 'Sunita Devi', village: 'Miyapur', type: 'Cardiac', status: 'En Route', time: '4m ago' },
            { id: 'E2', patient: 'Rajesh Kumar', village: 'Gachibowli', type: 'Respiratory', status: 'Alerted', time: '1m ago' }
        ]

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div
                className={`shadow-2xl overflow-hidden transition-all duration-500 flex flex-col border ${isFullScreen ? 'w-screen h-screen rounded-none' : 'w-[92vw] h-[85vh] rounded-3xl'}`}
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
            >

                {/* Header: Professional SaaS Navigation */}
                <div
                    className="border-b px-8 py-5 flex items-center justify-between shrink-0"
                    style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-200 dark:border-blue-500/20">
                            <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Regional Health Operations</h2>
                                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold rounded">LIVE MONITOR</span>
                            </div>
                            <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>District Triage & Resource Management Hub</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Operational Status Indicators */}
                        <div className="hidden lg:flex items-center gap-8 mr-6 px-6 py-2 rounded-2xl border font-medium text-[10px]" style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span className="uppercase tracking-wider">Network: <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Stable</span></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                <span className="uppercase tracking-wider">Data Sync: <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Normal</span></span>
                            </div>
                        </div>

                        {/* Tactical Switcher */}
                        <div className="flex gap-1 p-1 rounded-xl border" style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
                            {[
                                { id: 'map', icon: Globe, label: 'Geo-View' },
                                { id: 'units', icon: Users, label: 'Units' },
                                { id: 'logs', icon: Radio, label: 'Audit Log' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setView(tab.id as any)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${view === tab.id ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                                >
                                    <tab.icon className="h-3.5 w-3.5" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-1 pl-4 border-l" style={{ borderColor: 'var(--border-color)' }}>
                            <button onClick={() => setIsFullScreen(!isFullScreen)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-all text-slate-500 dark:text-slate-400">
                                {isFullScreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                            </button>
                            <button onClick={onClose} className="p-2 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 rounded-full transition-all text-slate-400">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex overflow-hidden lg:grid-cols-[384px_1fr]" style={{ background: 'var(--bg-primary)' }}>
                    {/* Left Sidebar: Operational Stream */}
                    <div className="w-96 border-r flex flex-col overflow-hidden shrink-0" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                        {/* Emergency Triage Section */}
                        <div className="p-6 border-b overflow-y-auto max-h-[50%]" style={{ borderColor: 'var(--border-color)' }}>
                            <h3 className="text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center justify-between" style={{ color: 'var(--text-muted)' }}>
                                Active Incidents
                                <span className="text-red-600 dark:text-red-500 text-[9px] font-bold uppercase tracking-wider">2 Critical Alerts</span>
                            </h3>
                            <div className="space-y-3">
                                {activeEmergencies.map((e) => (
                                    <div key={e.id} className="p-4 rounded-2xl border hover:border-red-500/30 transition-all cursor-pointer group shadow-sm" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[9px] font-black text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-400/10 px-2 py-0.5 rounded uppercase">{e.type}</span>
                                            <span className="text-[9px] font-medium" style={{ color: 'var(--text-muted)' }}>{e.time}</span>
                                        </div>
                                        <h4 className="font-bold group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" style={{ color: 'var(--text-primary)' }}>{e.patient}</h4>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{e.village} • {e.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Fleet Status Section */}
                        <div className="p-6 flex-1 overflow-y-auto">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>Unit Deployment</h3>
                            <div className="space-y-4">
                                {units.map((u) => (
                                    <div key={u.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                        <div className={`p-2.5 rounded-xl border ${u.status === 'Active' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-500' : u.status === 'En Route' ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-500' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-white/5 text-slate-500'}`}>
                                            {u.name.includes('Ambulance') ? <Ambulance className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>{u.name}</span>
                                                <span className="text-[9px] font-bold tabular-nums uppercase" style={{ color: 'var(--text-muted)' }}>{u.speed}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={`text-[9px] font-black uppercase tracking-wider ${u.status === 'Active' ? 'text-emerald-500' : u.status === 'En Route' ? 'text-blue-500' : 'text-slate-400'}`}>{u.status}</span>
                                                <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                                                <span className="text-[9px] truncate uppercase" style={{ color: 'var(--text-muted)' }}>{u.location}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Area: Regional Map Visualization */}
                    <div className="flex-1 relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
                        {view === 'map' ? (
                            <div className="absolute inset-0 flex flex-col p-8 items-center justify-center">

                                <div className="z-10 text-center max-w-lg">
                                    <div className="relative inline-block mb-8">
                                        <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
                                        <Globe className="h-24 w-24 text-blue-600 dark:text-blue-400 opacity-60 relative" />
                                        <div className="absolute -top-2 -right-2 p-2 bg-emerald-500 rounded-full border-4 shadow-xl" style={{ borderColor: 'var(--bg-card)' }}>
                                            <CheckCircle2 className="h-5 w-5 text-white" />
                                        </div>
                                    </div>

                                    <h3 className="text-3xl font-extrabold tracking-tight mb-3 italic" style={{ color: 'var(--text-primary)' }}>District Geo-Orchestration</h3>
                                    <p className="text-sm leading-relaxed mb-10" style={{ color: 'var(--text-muted)' }}>
                                        Real-time regional mapping engine initialized. Aggregating telemetry from <span className="text-blue-600 dark:text-blue-400 font-bold">4 Local Nodes</span> and <span className="text-blue-600 dark:text-blue-400 font-bold">143 Active Devices</span> within the Gachibowli mesh network.
                                    </p>

                                    <div className="grid grid-cols-2 gap-4 w-full">
                                        <div className="p-5 rounded-2xl border shadow-sm" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                                            <div className="flex items-center justify-center gap-2 mb-1">
                                                <Signal className="h-3.5 w-3.5 text-emerald-500" />
                                                <p className="text-[10px] uppercase font-black tracking-widest" style={{ color: 'var(--text-muted)' }}>Network Health</p>
                                            </div>
                                            <span className="text-2xl font-black font-mono" style={{ color: 'var(--text-primary)' }}>99.8%</span>
                                        </div>
                                        <div className="p-5 rounded-2xl border shadow-sm" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                                            <div className="flex items-center justify-center gap-2 mb-1">
                                                <Activity className="h-3.5 w-3.5 text-red-500" />
                                                <p className="text-[10px] uppercase font-black tracking-widest" style={{ color: 'var(--text-muted)' }}>Active SOS</p>
                                            </div>
                                            <span className="text-2xl font-black font-mono" style={{ color: 'var(--text-primary)' }}>02</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Map Overlay Legend: Clean & Professional */}
                                <div className="absolute bottom-10 left-10 p-5 border backdrop-blur-md rounded-2xl shadow-xl z-20" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4" style={{ color: 'var(--text-muted)' }}>Legend</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm border border-red-200" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>Emergency Triage</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm border border-blue-200" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>Field Personnel</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm border border-emerald-200" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>Active LoRa Hub</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Status Chip Overlay */}
                                <div className="absolute top-10 right-10 flex gap-2">
                                    <div className="px-3 py-1.5 bg-slate-900 text-white rounded-lg flex items-center gap-2 shadow-xl border border-white/10">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                        <span className="text-[9px] font-bold font-mono">Z-INDEX: DISTRICT_GEO_01</span>
                                    </div>
                                </div>
                            </div>
                        ) : view === 'logs' ? (
                            <div className="flex-1 flex flex-col p-8 overflow-hidden">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>Mission Audit Log</h3>
                                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] font-bold text-emerald-600 uppercase">Streaming Live</span>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-2 font-mono text-[11px]">
                                    {[
                                        { time: '18:56:12', event: 'SYS_BOOT', msg: 'LoRa Regional Gateway Node-01 Initialized', type: 'info' },
                                        { time: '18:56:08', event: 'PKT_RECV', msg: 'Vitals Sync: P-009 (Narsimha Kumar) - STATUS: NORMAL', type: 'data' },
                                        { time: '18:55:40', event: 'NET_HEALTH', msg: 'Mesh link stability confirmed at 99.8% (Gachibowli sector)', type: 'info' },
                                        { time: '18:54:12', event: 'PKT_RECV', msg: 'Vitals Sync: P-012 (Suvarna Naidu) - STATUS: NORMAL', type: 'data' },
                                        { time: '18:50:00', event: 'BATTERY_LOW', msg: 'Node-04 (Wearable-42) reporting < 15% charge', type: 'warning' },
                                        { time: '18:45:22', event: 'SOS_TRIGGER', msg: 'Emergency Broadcast from P-001 (Ravi Kumar Goud) - RESOLVED', type: 'resolved' },
                                    ].map((log, i) => (
                                        <div key={i} className="p-3 rounded-lg border flex gap-4 items-start" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                                            <span className="text-slate-400 shrink-0">{log.time}</span>
                                            <span className={`px-1.5 py-0.5 rounded font-black text-[9px] ${log.type === 'data' ? 'bg-blue-500/10 text-blue-600' : log.type === 'warning' ? 'bg-orange-500/10 text-orange-600' : log.type === 'resolved' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-500/10 text-slate-500'}`}>{log.event}</span>
                                            <span className="flex-1" style={{ color: 'var(--text-muted)' }}>{log.msg}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                                <Server className="h-16 w-16 mb-6" style={{ color: 'var(--border-color)' }} />
                                <h4 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Regional Operations Active</h4>
                                <p className="text-xs mt-2 max-w-xs" style={{ color: 'var(--text-muted)' }}>Regional mesh synchronization active. All telemetry routed through Gateway-01.</p>
                            </div>
                        )}

                        {/* Footer Status Bar: Minimal & Clean */}
                        <div className="border-t px-8 py-4 flex items-center justify-between backdrop-blur-md z-30" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                            <div className="flex items-center gap-8 font-mono text-[9px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                                <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> System Health: Nominal</span>
                                <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Latency: 12ms</span>
                                <span className="flex items-center gap-2 italic">Signal Source: Shamshabad Gateway</span>
                            </div>
                            <div className="text-[9px] font-bold uppercase tracking-tighter tabular-nums" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
                                VITALINK OP-CENTER // BUILD 2.04.1
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
