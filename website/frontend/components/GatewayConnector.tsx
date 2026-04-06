"use client"

import { useState, useEffect, useRef } from 'react'
import { Wifi, AlertTriangle, Activity, Phone, PhoneIncoming, PhoneOutgoing } from 'lucide-react'
import { useTheme } from '@/lib/theme-context'

interface GatewayData {
    id?: string         // Matches firmware "id"
    device_id?: string  // Legacy support
    type: 'data' | 'sos' | 'vitals' | 'fall' | 'call_status' | 'call_incoming' | 'call'
    hr?: number
    spo2?: number
    temp?: number
    lat?: number
    lng?: number
    rssi?: number
    gatewayTemp?: number
    status?: string
    number?: string
    worn?: boolean // New
}

interface ToastMsg {
    id: number
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
}

export default function GatewayConnector() {
    const [isConnected, setIsConnected] = useState(false)
    const [lastPacket, setLastPacket] = useState<GatewayData | null>(null)
    const [toasts, setToasts] = useState<ToastMsg[]>([])
    const socketRef = useRef<WebSocket | null>(null)
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const { gatewayIP } = useTheme()

    // Dynamic Gateway URL
    const GATEWAY_WS_URL = `ws://${gatewayIP}:81`

    useEffect(() => {
        connectToGateway()
        return () => {
            if (socketRef.current) socketRef.current.close()
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
        }
    }, [gatewayIP]) // Reconnect on IP change

    const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
        const id = Date.now()
        setToasts(prev => [...prev, { id, message, type }])
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, 8000)
    }

    const connectToGateway = () => {
        try {
            const socket = new WebSocket(GATEWAY_WS_URL)

            socket.onopen = () => {
                setIsConnected(true)
                showToast("Connected to Local Gateway", 'success')
                if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
            }

            socket.onmessage = (event) => {
                try {
                    const data: GatewayData = JSON.parse(event.data)
                    handleGatewayData(data)
                } catch (e) {
                    console.error("Gateway parse error", e)
                }
            }

            socket.onclose = () => {
                setIsConnected(false)
                reconnectTimeoutRef.current = setTimeout(connectToGateway, 5000)
            }

            socket.onerror = (error) => {
                // console.error("Gateway WS Error", error)
                // If not already showing an error, show connection hint
                if (isConnected) {
                    showToast("Connection to Gateway Lost! Check WiFi.", 'error')
                } else {
                    // Only show once on startup failure to avoid spam
                    // (Assuming connectToGateway is called initially)

                }
                socket.close()
            }

            socketRef.current = socket

        } catch (e) {
            console.error("Connection failed", e)
            reconnectTimeoutRef.current = setTimeout(connectToGateway, 5000)
        }
    }

    const handleGatewayData = (data: GatewayData) => {
        const deviceID = data.id || data.device_id
        if (deviceID) {
            setLastPacket({ ...data, device_id: deviceID })
        }

        const patientName = 'Unknown Patient'

        if (data.type === 'sos') {
            showToast(`SOS ALERT: ${patientName}`, 'error')
            playAlertSound()
            window.dispatchEvent(new CustomEvent('emergency-state', {
                detail: { active: true, deviceId: deviceID, patientName, lat: data.lat, lng: data.lng }
            }))
        }

        if (data.type === 'fall') {
            showToast(`FALL DETECTED: ${patientName}`, 'warning')
            playAlertSound()
            window.dispatchEvent(new CustomEvent('emergency-state', {
                detail: { active: true, deviceId: deviceID, patientName }
            }))
        }

        if (data.type === 'vitals') {
            // Dispatch event for specialized vitals widgets
            window.dispatchEvent(new CustomEvent('vitals-update', {
                detail: {
                    deviceId: deviceID,
                    patientName,
                    hr: data.hr,
                    spo2: data.spo2,
                    temp: data.temp
                }
            }))

            if (data.hr && (data.hr > 120 || data.hr < 50)) {
                showToast(`Abnormal Heart Rate: ${data.hr} bpm (${patientName})`, 'warning')
            }
        }

        if (data.type === 'call') {
            showToast(`📞 CALL REQUEST: ${patientName}`, 'info')
            playAlertSound()
        }

        // Call Handling
        if (data.type === 'call_status') {
            if (data.status === 'dialing') {
                showToast(`Dialing Emergency Contact (${data.number})...`, 'info')
            } else if (data.status === 'ended') {
                showToast("Call Ended", 'info')
            }
        }

        if (data.worn === false) {
            showToast(`Device Not Worn! (${patientName})`, 'warning')
        }

        if (data.type === 'call_incoming') {
            showToast(`📞 Incoming Call from ${data.number || 'Unknown'}`, 'info')
            playAlertSound()
        }
    }

    const playAlertSound = () => {
        const audio = new Audio('/alert.mp3')
        audio.play().catch(() => { })
    }

    if (!isConnected) return null

    return (
        <>
            {/* Custom Toast Container */}
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
                {toasts.map(t => (
                    <div key={t.id} className={`pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium animate-in slide-in-from-right-5 fade-in duration-300 ${t.type === 'success' ? 'bg-green-600' :
                        t.type === 'error' ? 'bg-red-600' :
                            t.type === 'info' ? 'bg-blue-600' : 'bg-orange-500'
                        }`}>
                        {t.type === 'error' && <AlertTriangle className="h-4 w-4" />}
                        {t.type === 'warning' && <Activity className="h-4 w-4" />}
                        {t.type === 'success' && <Wifi className="h-4 w-4" />}
                        {t.type === 'info' && <Phone className="h-4 w-4" />}
                        {t.message}
                    </div>
                ))}
            </div>

            {/* Status Widget */}
            <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-3 flex items-center gap-3">
                    <div className="relative">
                        <div className="absolute -inset-0.5 bg-green-500 rounded-full animate-ping opacity-75"></div>
                        <Wifi className="h-5 w-5 text-green-500 relative" />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Gateway Live</h4>
                        <p className="text-[10px] text-slate-500">
                            {lastPacket ? `RX from ${lastPacket.device_id}` : "Connected, Waiting..."}
                        </p>
                    </div>

                    {lastPacket && (
                        <div className="flex flex-col items-end border-l border-slate-100 pl-2 ml-1">
                            <div className="flex items-center gap-1">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${lastPacket.type === 'sos' ? 'bg-red-600 text-white animate-pulse' :
                                    lastPacket.type === 'fall' ? 'bg-orange-500 text-white animate-bounce' :
                                        lastPacket.type === 'call' ? 'bg-blue-500 text-white animate-pulse' :
                                            'text-slate-500 bg-slate-100 dark:bg-slate-700 dark:text-slate-400'
                                    }`}>
                                    {lastPacket.type === 'sos' ? 'SOS' :
                                        lastPacket.type === 'fall' ? 'FALL' :
                                            lastPacket.type === 'call' ? 'CALL REQ' : 'ACTIVE'}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-[10px] font-mono text-slate-400">WORN</span>
                                <span className={`text-xs font-bold ${lastPacket.worn !== false ? 'text-green-600' : 'text-red-500'}`}>
                                    {lastPacket.worn !== false ? 'YES' : 'NO'}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-[10px] font-mono text-slate-400">RSSI</span>
                                <span className="text-xs font-bold text-indigo-600">{lastPacket.rssi || '--'}dBm</span>
                            </div>
                        </div>
                    )}
                </div>
            </div >
        </>
    )
}
