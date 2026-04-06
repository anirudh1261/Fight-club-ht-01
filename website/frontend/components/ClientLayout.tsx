'use client'

import { ReactNode, useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import SettingsModal from '@/components/SettingsModal'
import EmergencyMapModal from '@/components/EmergencyMapModal'
import GatewayConnector from '@/components/GatewayConnector'
import { ThemeProvider } from '@/lib/theme-context'
import { DemoProvider } from '@/lib/demo-context'
import DemoSimulator from '@/components/DemoSimulator'
import ParamedicQRModal from '@/components/ParamedicQRModal'
import VoiceAssistant from '@/components/VoiceAssistant'

export default function ClientLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname()
    const isLandingPage = pathname === '/'
    const isParamedicPage = pathname?.startsWith('/paramedic')
    const [settingsOpen, setSettingsOpen] = useState(false)

    useEffect(() => {
        const handleOpenSettings = () => setSettingsOpen(true)
        window.addEventListener('openSettings', handleOpenSettings)
        return () => window.removeEventListener('openSettings', handleOpenSettings)
    }, [])


    // Emergency State
    const [emergencyData, setEmergencyData] = useState<any>(null)

    // Listen for emergency events
    useEffect(() => {
        const handleEmergency = (e: CustomEvent) => {
            if (e.detail.active) {
                setEmergencyData(e.detail)
            }
        }
        window.addEventListener('emergency-state', handleEmergency as EventListener)
        return () => window.removeEventListener('emergency-state', handleEmergency as EventListener)
    }, [])

    // Landing page or Paramedic → full-screen, no sidebar, no padding
    if (isLandingPage || isParamedicPage) {
        return (
            <DemoProvider>
                <ThemeProvider>
                    {children}
                </ThemeProvider>
            </DemoProvider>
        )
    }

    return (
        <DemoProvider>
            <ThemeProvider>
                <VoiceAssistant />
                <DemoSimulator />

                {/* Global Emergency Banner */}
                <div className={`fixed top-0 left-0 right-0 z-[60] bg-red-600 text-white px-4 py-2 flex items-center justify-center gap-3 transition-transform duration-300 ${emergencyData?.active ? 'translate-y-0' : '-translate-y-full'}`}>
                    <span className="animate-pulse font-bold text-lg">🚨 CRITICAL EMERGENCY ACTIVE</span>
                    <button
                        onClick={() => setEmergencyData(null)}
                        className="ml-4 text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded"
                    >
                        Dismiss
                    </button>
                </div>

                {/* Wrapper with proper background */}
                <div className={`min-h-screen transition-all duration-300 ${emergencyData?.active ? 'pt-10' : ''}`} style={{ background: 'var(--bg-primary)' }}>
                    <Sidebar emergencyActive={!!emergencyData?.active} />
                    <div className="lg:ml-64 pt-16 lg:pt-0">
                        <main className="p-4 min-h-screen transition-colors duration-300 relative">
                            {emergencyData?.active && (
                                <div className="absolute inset-0 border-[6px] border-red-500/50 pointer-events-none z-50 animate-pulse"></div>
                            )}
                            {children}
                        </main>
                    </div>
                </div>

                <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

                <EmergencyMapModal
                    isOpen={!!emergencyData?.active}
                    onClose={() => setEmergencyData(null)}
                    data={emergencyData ? {
                        patientName: emergencyData.patientName || 'Unknown',
                        lat: emergencyData.lat || 18.0019,
                        lng: emergencyData.lng || 79.5664,
                        timestamp: new Date().toISOString(),
                        history: emergencyData.history,
                        // Pass vitals for QR
                        hr: emergencyData.hr,
                        spo2: emergencyData.spo2
                    } : null}
                />

                <GatewayConnector />
            </ThemeProvider>
        </DemoProvider>
    )
}
