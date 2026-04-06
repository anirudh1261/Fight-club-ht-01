'use client'

import { BarChart3, TrendingUp, Download, Users, Heart, Activity, Shield } from 'lucide-react'
import { useTheme } from '@/lib/theme-context'
import { getDemoStats, DEMO_PATIENT_COUNT } from '@/lib/demo-data'
import { useDemoMode } from '@/lib/demo-context'

const healthMetrics = [
    { label: 'Average BP', value: '128/82', change: '-3%', trend: 'down', color: 'emerald' },
    { label: 'Avg Heart Rate', value: '76 bpm', change: '+2%', trend: 'up', color: 'blue' },
    { label: 'Avg SpO2', value: '96%', change: '+1%', trend: 'up', color: 'purple' },
    { label: 'Fall Incidents', value: '2', change: '-50%', trend: 'down', color: 'amber' },
]

const topConditions = [
    { condition: 'Hypertension', count: 45, percentage: 32 },
    { condition: 'Diabetes Type 2', count: 38, percentage: 27 },
    { condition: 'Arthritis', count: 25, percentage: 18 },
    { condition: 'Heart Disease', count: 18, percentage: 13 },
    { condition: 'COPD', count: 16, percentage: 11 },
]

export default function ReportsPage() {
    const { t } = useTheme()
    const { isDemoMode } = useDemoMode()
    const stats = isDemoMode ? getDemoStats() : null

    const monthlyStats = [
        { month: 'Jan', patients: Math.floor(DEMO_PATIENT_COUNT * 0.85), visits: 450, alerts: 23 },
        { month: 'Feb', patients: Math.floor(DEMO_PATIENT_COUNT * 0.90), visits: 480, alerts: 18 },
        { month: 'Mar', patients: Math.floor(DEMO_PATIENT_COUNT * 0.95), visits: 520, alerts: 15 },
        { month: 'Apr', patients: DEMO_PATIENT_COUNT, visits: 545, alerts: 12 },
    ]

    const handleExportPDF = () => {
        window.print()
    }

    const handleExportCSV = () => {
        // combine all data into one csv
        const rows = []

        // 1. Health Metrics
        rows.push(['--- Health Metrics ---'])
        rows.push(['Metric', 'Value', 'Change', 'Trend'])
        healthMetrics.forEach(m => rows.push([m.label, m.value, m.change, m.trend]))
        rows.push([])

        // 2. Monthly Stats
        rows.push(['--- Monthly Stats ---'])
        rows.push(['Month', 'Patients', 'Visits', 'Alerts'])
        monthlyStats.forEach(s => rows.push([s.month, s.patients, s.visits, s.alerts]))
        rows.push([])

        // 3. Top Conditions
        rows.push(['--- Top Conditions ---'])
        rows.push(['Condition', 'Count', 'Percentage'])
        topConditions.forEach(c => rows.push([c.condition, c.count, c.percentage + '%']))

        const csvContent = "data:text/csv;charset=utf-8,"
            + rows.map(e => e.join(",")).join("\n")

        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", `health_report_${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="space-y-4 print:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 print:hidden">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white">{t('reports')}</h1>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Analytics and health reports for your PHC</p>
                </div>
                <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-3">
                    <select
                        className="px-4 py-2 rounded-xl text-sm font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                    >
                        <option>Last 30 Days</option>
                        <option>Last 90 Days</option>
                        <option>This Year</option>
                    </select>
                    <div className="flex bg-blue-600 rounded-xl shadow-lg shadow-blue-500/30 overflow-hidden">
                        <button
                            onClick={handleExportPDF}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-white text-sm font-black hover:bg-blue-700 transition-all border-r border-blue-500"
                        >
                            <Download className="h-4 w-4" />
                            PDF
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-white text-sm font-black hover:bg-blue-700 transition-all"
                        >
                            <Download className="h-4 w-4" />
                            CSV
                        </button>
                    </div>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {healthMetrics.map((metric, idx) => (
                    <div key={idx} className="card p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">{metric.label}</p>
                        <div className="flex items-end justify-between mt-2">
                            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{metric.value}</p>
                            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${metric.trend === 'down' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20'}`}>
                                {metric.change} {metric.trend === 'down' ? '↓' : '↑'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Monthly Trends */}
                <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-10 w-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="font-black text-slate-900 dark:text-white">Monthly Overview</h2>
                            <p className="text-xs text-slate-500 font-medium">Patient visit volume & alerts</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {monthlyStats.map((stat) => (
                            <div key={stat.month} className="flex items-center gap-4">
                                <span className="w-10 text-xs font-black text-slate-400 uppercase tracking-tighter">{stat.month}</span>
                                <div className="flex-1 h-8 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800/50">
                                    <div
                                        className="h-full bg-gradient-teal flex items-center justify-end px-3 shadow-inner"
                                        style={{ width: `${(stat.patients / 150) * 100}%` }}
                                    >
                                        <span className="text-xs text-white font-black">{stat.patients}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-wide">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        Active Patients
                    </div>
                </div>

                {/* Top Conditions */}
                <div className="card p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="icon-box bg-gradient-purple">
                            <Activity className="h-5 w-5 text-white" />
                        </div>
                        <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Top Health Conditions</h2>
                    </div>
                    <div className="space-y-3">
                        {topConditions.map((item, idx) => (
                            <div key={idx}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.condition}</span>
                                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.count} patients ({item.percentage}%)</span>
                                </div>
                                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
                                    <div
                                        className="h-full bg-gradient-purple rounded-full"
                                        style={{ width: `${item.percentage}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* High-Impact Investor Section: ROI & Social Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 card p-6 bg-gradient-to-br from-slate-900 to-slate-800 border-teal-500/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <TrendingUp className="w-32 h-32 text-teal-400" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-12 w-12 rounded-2xl bg-teal-500/20 flex items-center justify-center border border-teal-500/30">
                                <Shield className="h-6 w-6 text-teal-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white italic">WARANGAL IMPACT PROJECTION</h2>
                                <p className="text-xs text-teal-400 font-bold uppercase tracking-widest">Regional Scale: Kazipet - Hanamkonda Corridor</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-6">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Lives Saved (Proj. Annual)</p>
                                <p className="text-3xl font-black text-white">420+</p>
                                <div className="mt-2 h-1 bg-teal-500/20 rounded-full overflow-hidden">
                                    <div className="h-full bg-teal-500 w-[75%]" />
                                </div>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">PHC Cost Reduction</p>
                                <p className="text-3xl font-black text-emerald-400">₹1.2Cr</p>
                                <div className="mt-2 h-1 bg-emerald-500/20 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 w-[85%]" />
                                </div>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">ASHA Efficiency</p>
                                <p className="text-3xl font-black text-blue-400">+65%</p>
                                <div className="mt-2 h-1 bg-blue-500/20 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 w-[90%]" />
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-6 p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20">
                            <p className="text-xs text-teal-100/80 leading-relaxed italic">
                                "By bypassing cellular dependency in the Warangal region, AyuLink provides a 100% reliable safety net for chronically ill patients, reducing emergency wait times by an average of 18 minutes."
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card p-6 bg-gradient-to-br from-indigo-900 to-slate-900 border-indigo-500/20">
                    <h2 className="text-lg font-black text-white mb-4 italic flex items-center gap-2">
                        <Activity className="h-5 w-5 text-indigo-400" /> SYSTEM HEALTH
                    </h2>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                            <span className="text-xs font-bold text-slate-400">LoRa Gateway Uptime</span>
                            <span className="text-xs font-mono text-emerald-400 font-bold">99.98%</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                            <span className="text-xs font-bold text-slate-400">Mesh Node Latency</span>
                            <span className="text-xs font-mono text-teal-400 font-bold">14ms</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                            <span className="text-xs font-bold text-slate-400">Battery Life (Wearable)</span>
                            <span className="text-xs font-mono text-amber-400 font-bold">14 Days</span>
                        </div>
                        <button className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition-all shadow-lg shadow-indigo-500/20 mt-2">
                            DOWNLOAD INVESTOR PACK
                        </button>
                    </div>
                </div>
            </div>

            {/* AI Insights (Moved to bottom) */}
            <div className="card p-5">
                <div className="flex items-center gap-3 mb-4">
                    <div className="icon-box bg-gradient-pink">
                        <Heart className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>AI Health Insights</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                        <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">✓ Positive Trend</p>
                        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mt-1">Overall patient health improved by 12% this month</p>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                        <p className="text-sm font-bold text-amber-800 dark:text-amber-200">⚠ Attention Needed</p>
                        <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mt-1">5 patients showing early signs of hypertension</p>
                    </div>
                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                        <p className="text-sm font-bold text-blue-800 dark:text-blue-200">💡 Recommendation</p>
                        <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mt-1">Schedule BP camps for next week in sector 3</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
