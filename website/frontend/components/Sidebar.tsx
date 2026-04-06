'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
    LayoutDashboard,
    Users,
    Activity,
    Radio,
    Bell,
    Calendar,
    FileText,
    Pill,
    BarChart3,
    Heart,
    Sun,
    Moon,
    Globe,
    LogOut,
    Sparkles,
    ChevronRight,
    AlertTriangle,
    Home,
    TrendingUp,
    Menu,
    X,
    Settings,
    ChevronDown,
    Cpu,
    Wifi,
    UserCheck,
} from 'lucide-react'
import { useTheme } from '@/lib/theme-context'

interface MenuItem {
    icon: any
    label?: string
    labelKey?: string
    href?: string
    color?: string
    submenu?: MenuItem[]
    badge?: string
}

// Menu with submenus
const menuStructure: MenuItem[] = [
    { icon: LayoutDashboard, labelKey: 'dashboard', href: '/dashboard', color: 'from-teal-400 to-emerald-500' },
    {
        icon: Heart,
        labelKey: 'monitoring',
        color: 'from-pink-400 to-rose-500',
        submenu: [
            { icon: Users, labelKey: 'patients', href: '/patients' },
            { icon: Activity, labelKey: 'vitals', href: '/vitals' },
            { icon: Radio, labelKey: 'devices', href: '/devices' },
        ]
    },
    {
        icon: Pill,
        labelKey: 'careManagement',
        color: 'from-purple-400 to-violet-500',
        submenu: [
            { icon: Pill, labelKey: 'prescriptions', href: '/prescriptions' },
            { icon: Calendar, labelKey: 'appointments', href: '/appointments' },
            { icon: UserCheck, labelKey: 'ashaVerification', href: '/asha-visits' },
        ]
    },
    {
        icon: Cpu,
        labelKey: 'infrastructure',
        color: 'from-cyan-400 to-sky-500',
        submenu: [
            { icon: Wifi, labelKey: 'loraMesh', href: '/lora-mesh' },
            { icon: Radio, labelKey: 'medicineDispensers', href: '/dispensers' },
            { icon: TrendingUp, labelKey: 'analyticsDashboard', href: '/stats' },
        ]
    },
    { icon: Bell, labelKey: 'notifications', href: '/notifications', color: 'from-amber-400 to-orange-500' },
    { icon: FileText, labelKey: 'records', href: '/records', color: 'from-green-400 to-emerald-500' },
    { icon: BarChart3, labelKey: 'reports', href: '/reports', color: 'from-indigo-400 to-purple-500' },
]

const specialMenuItems: MenuItem[] = [
    { icon: AlertTriangle, labelKey: 'emergency', href: '/emergency', color: 'from-red-500 to-red-600', badge: '2' },
    { icon: Home, labelKey: 'familyPortal', href: '/family', color: 'from-rose-400 to-pink-500' },
]


const languageNames: Record<string, string> = {
    en: '🇬🇧 English',
    hi: '🇮🇳 हिंदी',
    te: '🇮🇳 తెలుగు',
}

export default function Sidebar({ emergencyActive = false }: { emergencyActive?: boolean }) {
    const pathname = usePathname()
    const { theme, language, setTheme, setLanguage, t } = useTheme()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [expandedMenus, setExpandedMenus] = useState<string[]>(['Monitoring', 'Care Management', 'Infrastructure'])

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false)
    }, [pathname])

    // Close mobile menu on window resize to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setMobileMenuOpen(false)
            }
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`fixed left-4 z-[60] lg:hidden p-3 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg hover:scale-105 transition-all duration-300 ${emergencyActive ? 'top-16' : 'top-4'}`}
            >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            {/* Mobile Backdrop */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed left-0 w-64 sidebar text-white flex flex-col z-50 transition-all duration-300 ${!mobileMenuOpen ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'
                } ${emergencyActive ? 'top-10 h-[calc(100vh-2.5rem)]' : 'top-0 h-screen'}`}>
                {/* Logo */}
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-lg animate-float p-1">
                            <img src="/ayulink_logo.png" alt="AyuLink Logo" className="w-full h-full object-contain mix-blend-multiply" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="font-extrabold text-xl tracking-tight text-white">AyuLink</h1>
                                <Sparkles className="h-4 w-4 text-emerald-400" />
                            </div>
                            <p className="text-xs text-teal-200/80">Smart Health. Zero Boundaries.</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 overflow-y-auto px-4">
                    <p className="px-4 mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                        Main Menu
                    </p>
                    <ul className="space-y-2">
                        {menuStructure.map((item) => {
                            const hasSubmenu = 'submenu' in item && item.submenu
                            const isExpanded = expandedMenus.includes(item.label || '')
                            const isActive = !hasSubmenu && pathname === item.href

                            // Toggle submenu
                            const toggleSubmenu = () => {
                                if (hasSubmenu) {
                                    // Use labelKey for expansion state if label is missing, or fallback to English string?
                                    // Better: use the resolved label
                                    const labelText = item.labelKey ? t(item.labelKey) : (item as any).label
                                    setExpandedMenus(prev =>
                                        prev.includes(labelText)
                                            ? prev.filter(m => m !== labelText)
                                            : [...prev, labelText]
                                    )
                                }
                            }

                            const labelText = item.labelKey ? t(item.labelKey) : (item as any).label

                            return (
                                <li key={item.labelKey || item.href}>
                                    {hasSubmenu ? (
                                        <>
                                            {/* Submenu Header */}
                                            <button
                                                onClick={toggleSubmenu}
                                                className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group text-slate-300 hover:text-white hover:bg-white/10"
                                            >
                                                <div className={`p-2 rounded-xl bg-gradient-to-br ${item.color} transition-all`}>
                                                    <item.icon className="h-5 w-5 text-white" />
                                                </div>
                                                <span className="font-semibold flex-1 text-left">{labelText}</span>
                                                <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${expandedMenus.includes(labelText) ? 'rotate-180' : ''}`} />
                                            </button>

                                            {/* Submenu Items */}
                                            <div className={`overflow-hidden transition-all duration-300 ${expandedMenus.includes(labelText) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                                                <ul className="mt-1 ml-6 space-y-1 border-l-2 border-white/10 pl-4">
                                                    {item.submenu!.map((subItem) => {
                                                        const isSubActive = pathname === subItem.href
                                                        return (
                                                            <li key={subItem.href}>
                                                                <Link
                                                                    href={subItem.href || '#'}
                                                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${isSubActive
                                                                        ? 'bg-white/20 text-white'
                                                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                                                        }`}
                                                                >
                                                                    <subItem.icon className="h-4 w-4" />
                                                                    <span className="text-sm font-medium">
                                                                        {subItem.labelKey ? t(subItem.labelKey) : subItem.label}
                                                                    </span>
                                                                </Link>
                                                            </li>
                                                        )
                                                    })}
                                                </ul>
                                            </div>
                                        </>
                                    ) : (
                                        /* Regular Menu Item */
                                        <Link
                                            href={item.href!}
                                            className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden ${isActive
                                                ? 'bg-white text-slate-900 shadow-xl'
                                                : 'text-slate-300 hover:text-white hover:bg-white/10'
                                                }`}
                                        >
                                            {isActive && (
                                                <div className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-10`} />
                                            )}
                                            <div className={`p-2 rounded-xl ${isActive ? `bg-gradient-to-br ${item.color}` : 'bg-white/10 group-hover:bg-white/20'} transition-all`}>
                                                <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`} />
                                            </div>
                                            <span className={`font-semibold ${isActive ? 'text-slate-900' : ''}`}>
                                                {labelText}
                                            </span>
                                            {isActive && (
                                                <ChevronRight className="ml-auto h-5 w-5 text-slate-400" />
                                            )}
                                        </Link>
                                    )}
                                </li>
                            )
                        })}
                    </ul>

                    {/* Special Links */}
                    <p className="px-4 mt-6 mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                        {t('quickAccess')}
                    </p>
                    <ul className="space-y-2">
                        {specialMenuItems.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href || '#'}
                                        className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden ${isActive
                                            ? 'bg-white text-slate-900 shadow-xl'
                                            : 'text-slate-300 hover:text-white hover:bg-white/10'
                                            }`}
                                    >
                                        {isActive && (
                                            <div className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-10`} />
                                        )}
                                        <div className={`p-2 rounded-xl ${isActive ? `bg-gradient-to-br ${item.color}` : item.href === '/emergency' ? 'bg-red-500/30' : 'bg-white/10 group-hover:bg-white/20'} transition-all`}>
                                            <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : item.href === '/emergency' ? 'text-red-400' : 'text-slate-300 group-hover:text-white'}`} />
                                        </div>
                                        <span className={`font-semibold ${isActive ? 'text-slate-900' : ''}`}>
                                            {item.labelKey ? t(item.labelKey) : item.label}
                                        </span>
                                        {item.badge && (
                                            <span className="ml-auto px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full animate-pulse">
                                                {item.badge}
                                            </span>
                                        )}
                                        {isActive && !item.badge && (
                                            <ChevronRight className="ml-auto h-5 w-5 text-slate-400" />
                                        )}
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                </nav>

                {/* Settings Button */}
                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={() => {
                            window.dispatchEvent(new CustomEvent('openSettings'))
                        }}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 transition-all font-semibold group"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-300 group-hover:text-white group-hover:rotate-90 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-slate-200">{t('settings')}</span>
                    </button>
                </div>


                {/* Hardware Status */}
                <div className="p-4 border-t border-white/10">
                    <div className="p-4 rounded-2xl bg-slate-900/50 border border-white/5 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Radio className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">LoRa Mesh</span>
                            </div>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">ACTIVE</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                                <p className="text-[9px] text-slate-500 font-medium">Gateway</p>
                                <p className="text-[11px] font-bold text-teal-300">ESP32-G1</p>
                            </div>
                            <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                                <p className="text-[9px] text-slate-500 font-medium">Latency</p>
                                <p className="text-[11px] font-bold text-teal-300">24ms</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 w-[85%]" />
                            </div>
                            <span className="text-[9px] font-bold text-slate-500 italic">85% Link</span>
                        </div>
                    </div>
                </div>

                {/* User Profile */}
                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-teal-500/20 to-emerald-500/20 border border-teal-500/30">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            DR
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-white">Dr. Sharma</p>
                            <p className="text-xs text-teal-200/80">{t('primaryHealthCenter')}</p>
                        </div>
                        <button className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    )
}
