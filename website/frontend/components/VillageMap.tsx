'use client'

import { MapPin, Users, Activity, AlertTriangle, ArrowRight } from 'lucide-react'
import { useTheme } from '@/lib/theme-context'
import { useRouter } from 'next/navigation'
import { useDemoMode } from '@/lib/demo-context'
import { getDemoStats } from '@/lib/demo-data'
import { useState, useEffect } from 'react'



const statusColors = {
    good: 'bg-emerald-500',
    warning: 'bg-amber-500',
    critical: 'bg-red-500'
}

export default function VillageMap() {
    const { t } = useTheme()
    const router = useRouter()
    const { isDemoMode } = useDemoMode()
    const [stats, setStats] = useState<any>(null)

    useEffect(() => {
        const fetchStats = async () => {
            if (isDemoMode) {
                setStats(getDemoStats())
                return
            }

            try {
                const res = await fetch('/api/local-db?table=patients')
                const { data: patients } = await res.json()
                if (patients) {
                    // Aggregation logic
                    const vMap: Record<string, any> = {}
                    let totalOnline = 0
                    let totalAlerts = 0

                    patients.forEach((p: any) => {
                        const v = p.village || 'Other'
                        if (!vMap[v]) vMap[v] = { name: v, patients: 0, online: 0, alerts: 0, status: 'good' }
                        
                        vMap[v].patients++
                        if (p.deviceStatus === 'online') {
                            vMap[v].online++
                            totalOnline++
                        }
                        if (p.status === 'critical' || p.status === 'warning') {
                            vMap[v].alerts++
                            totalAlerts++
                            vMap[v].status = (p.status === 'critical') ? 'critical' : 'warning'
                        }
                    })

                    setStats({
                        villages: Object.values(vMap),
                        totalOnline,
                        totalAlerts
                    })
                }
            } catch (err) {
                console.error('VillageMap Error:', err)
            }
        }
        fetchStats()
    }, [isDemoMode])

    const villages = stats?.villages || []

    const handleVillageClick = (village: any) => {
        if (village.alerts > 0) {
            alert(`⚠️ ${village.name} Alerts\n\n${village.alerts} active alert(s) in this village.\n\nClick OK to view patient alerts from ${village.name}.`)
            router.push('/notifications')
        } else {
            alert(`📍 ${village.name}\n\n✓ All systems normal\n\nPatients: ${village.patients}\nOnline: ${village.online}\nOffline: ${village.patients - village.online}`)
        }
    }

    const handleViewAll = () => {
        router.push('/patients')
    }

    return (
        <div className="card">
            <div className="p-5 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-3">
                    <div className="icon-box bg-gradient-to-br from-cyan-500 to-blue-600">
                        <MapPin className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                            {t('villageCoverage')}
                        </h2>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('realtimeNetwork')}</p>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-2">
                {villages.map((village: any, idx: number) => (
                    <div
                        key={idx}
                        onClick={() => handleVillageClick(village)}
                        className="flex items-center justify-between p-3 rounded-xl transition-all hover:scale-[1.02] cursor-pointer group"
                        style={{ background: 'var(--bg-primary)' }}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-2.5 h-2.5 rounded-full ${statusColors[village.status as keyof typeof statusColors]}`} />
                            <div>
                                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{village.name}</p>
                                <div className="flex items-center gap-2 mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                                    <span className="flex items-center gap-1">
                                        <Users className="h-3 w-3" /> {village.patients} {t('patients')}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Activity className="h-3 w-3" /> {village.online} {t('online')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {village.alerts > 0 ? (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30">
                                <AlertTriangle className="h-3 w-3 text-red-500" />
                                <span className="text-xs font-bold text-red-600 dark:text-red-400">{village.alerts} {t('alerts')}</span>
                            </div>
                        ) : (
                            <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-muted)' }} />
                        )}
                    </div>
                ))}
            </div>

            {/* Stats Footer */}
            <div className="p-4 pt-0 grid grid-cols-3 gap-2">
                <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-primary)' }}>
                    <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{villages.length}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('villages')}</p>
                </div>
                <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-primary)' }}>
                    <p className="text-xl font-bold text-emerald-500">{stats?.totalOnline || 0}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('online')}</p>
                </div>
                <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-primary)' }}>
                    <p className="text-xl font-bold text-red-500">{stats?.totalAlerts || 0}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('alerts')}</p>
                </div>
            </div>

            <div className="p-4 pt-0">
                <button
                    onClick={handleViewAll}
                    className="w-full btn-primary py-2 text-sm"
                >
                    View All Patients →
                </button>
            </div>
        </div>
    )
}
