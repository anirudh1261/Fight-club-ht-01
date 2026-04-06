'use client'

import { useState, useEffect } from 'react'
import { Radio, SignalHigh, SignalMedium, SignalLow, Battery, Circle, Wifi, WifiOff, Zap, CheckCircle, AlertTriangle, RefreshCw, X } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useDemoMode } from '@/lib/demo-context'
import { generateDemoPatients } from '@/lib/demo-data'

const mockDevices = [
    { id: 'WB-2024-001', patient: 'Rajesh Kumar', signal: 90, battery: 88, status: 'online', lastSeen: '2 mins ago', village: 'Rampur' },
    { id: 'WB-2024-002', patient: 'Sunita Devi', signal: 75, battery: 55, status: 'online', lastSeen: '5 mins ago', village: 'Rampur' },
    { id: 'WB-2024-003', patient: 'Amit Singh', signal: 45, battery: 15, status: 'offline', lastSeen: '1 hour ago', village: 'Gopalpur' },
    { id: 'WB-2024-004', patient: 'Lakshmi Devi', signal: 100, battery: 98, status: 'online', lastSeen: 'Just now', village: 'Rampur' },
    { id: 'WB-2024-005', patient: 'Ravi Kumar', signal: 82, battery: 72, status: 'online', lastSeen: '3 mins ago', village: 'Gopalpur' },
]

const initialAvailableDevices = [
    { id: 'WB-NEW-001', signal: 95, battery: 95, rssi: -45 },
    { id: 'WB-NEW-002', signal: 60, battery: 60, rssi: -68 },
    { id: 'WB-NEW-003', signal: 20, battery: 20, rssi: -89 },
]

export default function DevicesPage() {
    const { isDemoMode } = useDemoMode()
    const [devices, setDevices] = useState(mockDevices)
    const [available, setAvailable] = useState(initialAvailableDevices)
    const [patients, setPatients] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [showPairingWizard, setShowPairingWizard] = useState(false)
    const [pairingStep, setPairingStep] = useState(1)
    const [isScanning, setIsScanning] = useState(false)

    const SignalIcon = (signal: number) => {
        if (signal > 75) return <SignalHigh className="h-4 w-4 text-emerald-500" />
        if (signal > 40) return <SignalMedium className="h-4 w-4 text-amber-500" />
        return <SignalLow className="h-4 w-4 text-red-500" />
    }

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/local-db?table=patients')
            if (res.ok) {
                const { data: pData } = await res.json()
                if (pData) {
                    // STRICT DATA ISOLATION: Hide demo simulator devices when Demo Mode is OFF
                    const realPatients = pData.filter((p: any) => !p.id.match(/^P-0[0-4]\d$/) && !p.id.match(/^P-050$/))
                    setPatients(realPatients)
                    const paired = realPatients
                        .filter((p: any) => p.id && p.status) // Assuming all real patients have a device for the expo
                        .map((p: any) => ({
                            id: `LR-${p.id.split('-')[1] || p.id.slice(-4)}`,
                            patient: p.name,
                            signal: 85 + Math.floor(Math.random() * 10),
                            battery: 92,
                            status: 'online',
                            lastSeen: 'Active',
                            village: p.village || 'Sector 7'
                        }))
                    setDevices(paired)
                }
            }
        } catch (err) {
            console.error('Fetch devices error:', err)
        }
        setLoading(false)
    }

    useEffect(() => {
        if (isDemoMode) {
            // Curated demo devices for the expo (High quality telemetry)
            const demoDevices = [
                { id: 'LR-MESH-001', patient: 'Ramulu Goud', signal: 94, battery: 88, status: 'online', lastSeen: '1s ago', village: 'Hanamkonda' },
                { id: 'LR-MESH-002', patient: 'Laxmi Reddy', signal: 82, battery: 92, status: 'online', lastSeen: '3s ago', village: 'Kazipet' },
                { id: 'LR-MESH-003', patient: 'Venkat Rao', signal: 45, battery: 12, status: 'warning', lastSeen: '5m ago', village: 'Bhimaram' },
                { id: 'LR-MESH-004', patient: 'Padma Devi', signal: 98, battery: 95, status: 'online', lastSeen: 'Just now', village: 'Waddepally' },
            ]
            setDevices(demoDevices)
            setAvailable(initialAvailableDevices)
            return
        }
        fetchData()
    }, [isDemoMode])

    const handleScan = () => {
        setIsScanning(true)
        setTimeout(() => setIsScanning(false), 2000)
    }

    const onlineCount = devices.filter(d => d.status === 'online').length
    const lowBatteryCount = devices.filter(d => d.battery < 30).length

    return (
        <div className="space-y-4">
            {/* Header with Stats */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>LoRa Device Management</h1>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Pair and manage wearable devices via LoRa network</p>
                </div>
                <button
                    onClick={() => setShowPairingWizard(true)}
                    className="flex items-center gap-2 btn-primary px-5 py-2.5 rounded-xl"
                >
                    <Radio className="h-5 w-5" />
                    Scan for Devices
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-4 gap-4">
                <div className="card p-4 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                        <Wifi className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{onlineCount}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Devices Online</p>
                    </div>
                </div>
                <div className="card p-4 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800">
                        <WifiOff className="h-6 w-6 text-gray-500" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{devices.length - onlineCount}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Devices Offline</p>
                    </div>
                </div>
                <div className="card p-4 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30">
                        <Battery className="h-6 w-6 text-red-500" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{lowBatteryCount}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Low Battery</p>
                    </div>
                </div>
                <div className="card p-4 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                        <Zap className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{isDemoMode ? available.length : 0}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Available to Pair</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {/* Available Devices */}
                <div className="card p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Available Devices</h2>
                        <button
                            onClick={handleScan}
                            className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${isScanning ? 'animate-spin' : ''}`}
                        >
                            <RefreshCw className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                        </button>
                    </div>
                    <div className="space-y-3">
                        {isDemoMode ? available.map((device) => (
                            <div key={device.id} className="p-4 rounded-xl border-2 hover:border-teal-500 transition-all cursor-pointer" style={{ borderColor: 'var(--border-color)' }}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-mono text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{device.id}</span>
                                    {SignalIcon(device.signal)}
                                </div>
                                <div className="flex items-center gap-4 mb-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                                    <span className="flex items-center gap-1">
                                        <Battery className={`h-3 w-3 ${device.battery > 30 ? 'text-emerald-500' : 'text-red-500'}`} />
                                        {device.battery}%
                                    </span>
                                    <span>RSSI: {device.rssi}dBm</span>
                                </div>
                                <button
                                    onClick={() => { setShowPairingWizard(true); setPairingStep(2); }}
                                    className="w-full py-2 btn-primary text-sm rounded-lg"
                                >
                                    Pair Device
                                </button>
                            </div>
                        )) : (
                            <div className="text-center py-12 border-2 border-dashed rounded-xl" style={{ borderColor: 'var(--border-color)' }}>
                                <Radio className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
                                    {isScanning ? 'Searching LoRa Mesh...' : 'No new devices discovered nearby.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Paired Devices Table */}
                <div className="col-span-2 card p-5">
                    <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Paired Devices</h2>
                    <div className="space-y-2">
                        <div className="grid grid-cols-6 gap-4 px-4 py-2 rounded-lg text-xs font-semibold uppercase" style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)' }}>
                            <div>Device ID</div>
                            <div>Patient Name</div>
                            <div>Signal Quality</div>
                            <div>Last Seen</div>
                            <div>Battery %</div>
                            <div>Status</div>
                        </div>
                        {devices.length > 0 ? devices.map((device) => (
                            <div key={device.id} className="grid grid-cols-6 gap-4 px-4 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <div className="font-mono text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{device.id}</div>
                                <div>
                                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{device.patient}</p>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{device.village}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
                                        <div
                                            className={`h-full ${device.signal > 75 ? 'bg-emerald-500' : device.signal > 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                                            style={{ width: `${device.signal}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{device.signal}%</span>
                                </div>
                                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{device.lastSeen}</div>
                                <div className="flex items-center gap-2">
                                    <Battery className={`h-4 w-4 ${device.battery < 20 ? 'text-red-500' : device.battery < 50 ? 'text-amber-500' : 'text-emerald-500'}`} />
                                    <span className={`text-sm font-semibold ${device.battery < 20 ? 'text-red-500' : ''}`} style={{ color: device.battery >= 20 ? 'var(--text-primary)' : undefined }}>
                                        {device.battery}%
                                    </span>
                                    {device.battery < 20 && <AlertTriangle className="h-3 w-3 text-red-500" />}
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`h-2 w-2 rounded-full ${device.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                                    <span className="text-sm capitalize" style={{ color: device.status === 'online' ? 'var(--text-primary)' : 'var(--text-muted)' }}>{device.status}</span>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-12 text-gray-400 italic">
                                No paired devices found.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Pairing Wizard Modal */}
            {showPairingWizard && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="card rounded-2xl p-8 max-w-2xl w-full" style={{ background: 'var(--bg-card)' }}>
                        <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Device Pairing Wizard</h2>

                        {/* Steps */}
                        <div className="flex items-center justify-between mb-8">
                            {['Scan', 'Select Patient', 'Configure', 'Test'].map((step, i) => (
                                <div key={i} className="flex items-center">
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${i + 1 === pairingStep ? 'bg-teal-500 text-white' :
                                        i + 1 < pairingStep ? 'bg-emerald-500 text-white' : ''
                                        }`} style={{ background: i + 1 > pairingStep ? 'var(--bg-primary)' : undefined, color: i + 1 > pairingStep ? 'var(--text-muted)' : undefined }}>
                                        {i + 1 < pairingStep ? <CheckCircle className="h-5 w-5" /> : i + 1}
                                    </div>
                                    <span className="hidden md:block ml-2 text-xs font-medium" style={{ color: i + 1 === pairingStep ? 'var(--text-primary)' : 'var(--text-muted)' }}>{step}</span>
                                    {i < 3 && <div className="h-0.5 w-8 mx-2" style={{ background: i + 1 < pairingStep ? '#10b981' : 'var(--border-color)' }} />}
                                </div>
                            ))}
                        </div>

                        {/* Step Content */}
                        {pairingStep === 1 && (
                            <div className="text-center py-12">
                                <div className="relative w-32 h-32 mx-auto mb-6">
                                    <div className="absolute inset-0 border-4 border-teal-500 rounded-full animate-ping opacity-75"></div>
                                    <div className="absolute inset-4 border-4 border-teal-500 rounded-full animate-ping opacity-50" style={{ animationDelay: '0.2s' }}></div>
                                    <div className="absolute inset-8 border-4 border-teal-500 rounded-full animate-ping opacity-25" style={{ animationDelay: '0.4s' }}></div>
                                    <Radio className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-10 w-10 text-teal-500" />
                                </div>
                                <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Scanning LoRa Network...</p>
                                <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Found {isDemoMode ? available.length : 0} devices</p>
                            </div>
                        )}

                        {pairingStep === 2 && (
                            <div className="py-6">
                                <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>Select a patient to assign this device to:</p>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {(isDemoMode ? ['Rajesh Kumar', 'Sunita Devi'] : patients.map(p => p.name)).map((name, i) => (
                                        <div key={i} className="p-4 rounded-xl border-2 cursor-pointer hover:border-teal-500 transition-all" style={{ borderColor: 'var(--border-color)' }}>
                                            <span style={{ color: 'var(--text-primary)' }}>{name}</span>
                                        </div>
                                    ))}
                                    <div className="p-4 rounded-xl border-2 border-dashed cursor-pointer hover:border-teal-500 transition-all" style={{ borderColor: 'var(--border-color)' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>+ Add New Patient</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {pairingStep === 3 && (
                            <div className="py-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Monitoring Interval</label>
                                    <select className="w-full p-3 rounded-xl border" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                                        <option>Every 5 minutes</option>
                                        <option>Every 15 minutes</option>
                                        <option>Every 30 minutes</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Alert Thresholds</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input placeholder="HR Low (60)" className="p-3 rounded-xl border" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                                        <input placeholder="HR High (100)" className="p-3 rounded-xl border" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {pairingStep === 4 && (
                            <div className="text-center py-12">
                                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                    <CheckCircle className="h-10 w-10 text-emerald-500" />
                                </div>
                                <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Device Paired Successfully!</p>
                                <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Device is now connected to LoRa Mesh</p>
                            </div>
                        )}

                        <div className="flex gap-3 justify-end mt-6">
                            <button
                                onClick={() => { setShowPairingWizard(false); setPairingStep(1); }}
                                className="px-6 py-2 rounded-xl border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                            >
                                {pairingStep === 4 ? 'Close' : 'Cancel'}
                            </button>
                            {pairingStep < 4 && (
                                <button
                                    onClick={() => setPairingStep(p => p + 1)}
                                    className="px-6 py-2 btn-primary rounded-xl"
                                >
                                    Next
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
