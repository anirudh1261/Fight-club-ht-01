'use client'

import { useState } from 'react'
import { X, Settings, Moon, Sun, Globe, Bell, Shield, Palette, Monitor } from 'lucide-react'
import { useTheme } from '@/lib/theme-context'
import { useDemoMode } from '@/lib/demo-context'
import { Play, AlertCircle, Zap } from 'lucide-react'

interface SettingsModalProps {
    isOpen: boolean
    onClose: () => void
}

const languageNames: Record<string, string> = {
    en: 'English',
    hi: 'हिन्दी (Hindi)',
    te: 'తెలుగు (Telugu)',
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { theme, setTheme, language, setLanguage, gatewayIP, setGatewayIP, t } = useTheme()
    const { isDemoMode, toggleDemoMode } = useDemoMode()
    const [notifications, setNotifications] = useState(true)
    const [soundAlerts, setSoundAlerts] = useState(true)
    const [autoRefresh, setAutoRefresh] = useState(true)

    if (!isOpen) return null

    const handleThemeChange = (newTheme: 'light' | 'dark') => {
        // Add transition class to prevent blinking
        document.documentElement.style.transition = 'background-color 0.3s ease, color 0.3s ease'
        setTheme(newTheme)
        // Remove transition after it completes
        setTimeout(() => {
            document.documentElement.style.transition = ''
        }, 300)
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-scaleIn"
                style={{ background: 'var(--bg-card)' }}>

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500">
                            <Settings className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('settingsTitle')}</h2>
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('settingsDesc')}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                    >
                        <X className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">

                    {/* Appearance Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Palette className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                            <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                                {t('appearance')}
                            </span>
                        </div>

                        {/* Theme Toggle */}
                        <div className="flex items-center justify-between p-4 rounded-2xl" style={{ background: 'var(--bg-secondary)' }}>
                            <div className="flex items-center gap-3">
                                <Monitor className="h-5 w-5" style={{ color: 'var(--text-secondary)' }} />
                                <div>
                                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{t('theme')}</p>
                                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('themeDesc')}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleThemeChange('light')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${theme === 'light'
                                        ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-lg'
                                        : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10'
                                        }`}
                                    style={{ color: theme === 'light' ? 'white' : 'var(--text-secondary)' }}
                                >
                                    <Sun className="h-4 w-4" />
                                    <span className="text-sm font-medium">{t('light')}</span>
                                </button>
                                <button
                                    onClick={() => handleThemeChange('dark')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${theme === 'dark'
                                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                                        : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10'
                                        }`}
                                    style={{ color: theme === 'dark' ? 'white' : 'var(--text-secondary)' }}
                                >
                                    <Moon className="h-4 w-4" />
                                    <span className="text-sm font-medium">{t('dark')}</span>
                                </button>
                            </div>
                        </div>

                        {/* Language */}
                        <div className="flex items-center justify-between p-4 rounded-2xl" style={{ background: 'var(--bg-secondary)' }}>
                            <div className="flex items-center gap-3">
                                <Globe className="h-5 w-5" style={{ color: 'var(--text-secondary)' }} />
                                <div>
                                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{t('language')}</p>
                                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('languageDesc')}</p>
                                </div>
                            </div>
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value as 'en' | 'hi' | 'te')}
                                className="px-4 py-2 rounded-xl border-0 font-medium cursor-pointer"
                                style={{
                                    background: 'var(--bg-primary)',
                                    color: 'var(--text-primary)',
                                    minWidth: '140px'
                                }}
                            >
                                {Object.entries(languageNames).map(([code, name]) => (
                                    <option key={code} value={code}>{name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Notifications Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Bell className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                            <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                                {t('notifications')}
                            </span>
                        </div>

                        {/* Push Notifications */}
                        <div className="flex items-center justify-between p-4 rounded-2xl" style={{ background: 'var(--bg-secondary)' }}>
                            <div>
                                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{t('pushNotifications')}</p>
                                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('pushDesc')}</p>
                            </div>
                            <button
                                onClick={() => setNotifications(!notifications)}
                                className={`w-14 h-8 rounded-full transition-all relative ${notifications ? 'bg-gradient-to-r from-teal-500 to-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                                    }`}
                            >
                                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${notifications ? 'left-7' : 'left-1'
                                    }`} />
                            </button>
                        </div>

                        {/* Sound Alerts */}
                        <div className="flex items-center justify-between p-4 rounded-2xl" style={{ background: 'var(--bg-secondary)' }}>
                            <div>
                                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{t('soundAlerts')}</p>
                                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('soundDesc')}</p>
                            </div>
                            <button
                                onClick={() => setSoundAlerts(!soundAlerts)}
                                className={`w-14 h-8 rounded-full transition-all relative ${soundAlerts ? 'bg-gradient-to-r from-teal-500 to-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                                    }`}
                            >
                                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${soundAlerts ? 'left-7' : 'left-1'
                                    }`} />
                            </button>
                        </div>
                    </div>

                    {/* Data Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Shield className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                            <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                                {t('dataPrivacy')}
                            </span>
                        </div>

                        {/* Auto Refresh */}
                        <div className="flex items-center justify-between p-4 rounded-2xl" style={{ background: 'var(--bg-secondary)' }}>
                            <div>
                                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{t('autoRefresh')}</p>
                                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('autoRefreshDesc')}</p>
                            </div>
                            <button
                                onClick={() => setAutoRefresh(!autoRefresh)}
                                className={`w-14 h-8 rounded-full transition-all relative ${autoRefresh ? 'bg-gradient-to-r from-teal-500 to-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                                    }`}
                            >
                                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${autoRefresh ? 'left-7' : 'left-1'
                                    }`} />
                            </button>
                        </div>
                    </div>

                    {/* Demo Center Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Zap className="h-4 w-4 text-amber-500" />
                            <span className="text-sm font-semibold uppercase tracking-wider text-amber-500">
                                {t('demoCenter')}
                            </span>
                        </div>

                        {/* Demo Mode Toggle */}
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                            <div>
                                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{t('simulationMode')}</p>
                                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('simulationDesc')}</p>
                            </div>
                            <button
                                onClick={toggleDemoMode}
                                className={`w-14 h-8 rounded-full transition-all relative ${isDemoMode ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'
                                    }`}
                            >
                                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${isDemoMode ? 'left-7' : 'left-1'
                                    }`} />
                            </button>
                        </div>

                        {isDemoMode && (
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => {
                                        window.dispatchEvent(new CustomEvent('trigger-jury-demo'))
                                        onClose()
                                    }}
                                    className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20 transition-all font-bold text-sm"
                                >
                                    <Play className="h-4 w-4" /> {t('startJuryDemo')}
                                </button>
                                <button
                                    onClick={() => {
                                        window.dispatchEvent(new CustomEvent('trigger-manual-sos'))
                                        onClose()
                                    }}
                                    className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all font-bold text-sm"
                                >
                                    <AlertCircle className="h-4 w-4" /> {t('manualSOS')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t flex justify-end gap-3" style={{ borderColor: 'var(--border-color)' }}>
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl font-semibold transition-all bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:shadow-lg hover:shadow-teal-500/25"
                    >
                        {t('done')}
                    </button>
                </div>
            </div>
        </div>
    )
}
