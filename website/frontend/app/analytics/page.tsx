'use client'

import { useState } from 'react'
import {
    TrendingUp, TrendingDown, Users, IndianRupee, Activity, Clock,
    Target, PieChart, BarChart3, LineChart, ArrowUpRight, ArrowDownRight,
    Calendar, Download, Filter, RefreshCw, Zap, Heart, Shield, MapPin
} from 'lucide-react'
import { useDemoMode } from '@/lib/demo-context'

const kpiData = [
    {
        title: 'Total Revenue',
        value: '₹24.5L',
        change: '+32%',
        trend: 'up',
        subtitle: 'This Quarter',
        icon: IndianRupee,
        gradient: 'from-emerald-500 to-teal-500'
    },
    {
        title: 'Active Patients',
        value: '2,847',
        change: '+18%',
        trend: 'up',
        subtitle: 'Across 12 villages',
        icon: Users,
        gradient: 'from-blue-500 to-cyan-500'
    },
    {
        title: 'Avg Response Time',
        value: '3.2 min',
        change: '-45%',
        trend: 'up',
        subtitle: 'Emergency alerts',
        icon: Clock,
        gradient: 'from-orange-500 to-amber-500'
    },
    {
        title: 'Lives Impacted',
        value: '4,520',
        change: '+142',
        trend: 'up',
        subtitle: 'This month',
        icon: Heart,
        gradient: 'from-pink-500 to-rose-500'
    },
]

const revenueData = [
    { month: 'Jan', b2g: 180000, b2b: 120000, b2c: 45000 },
    { month: 'Feb', b2g: 220000, b2b: 150000, b2c: 52000 },
    { month: 'Mar', b2g: 280000, b2b: 180000, b2c: 68000 },
    { month: 'Apr', b2g: 350000, b2b: 220000, b2c: 85000 },
    { month: 'May', b2g: 420000, b2b: 280000, b2c: 95000 },
    { month: 'Jun', b2g: 480000, b2b: 320000, b2c: 110000 },
]

const impactMetrics = [
    { label: 'Emergency Responses', value: 847, unit: 'this month', change: '+23%' },
    { label: 'Preventive Alerts', value: 2340, unit: 'critical alerts sent', change: '+45%' },
    { label: 'Doctor Consultations', value: 1250, unit: 'remote consults', change: '+67%' },
    { label: 'Medication Adherence', value: 89, unit: '% compliance rate', change: '+12%' },
]

const villagePerformance = [
    { name: 'Rampur', patients: 342, alerts: 45, response: '2.1 min', revenue: '₹3.2L' },
    { name: 'Gopalpur', patients: 287, alerts: 32, response: '2.8 min', revenue: '₹2.7L' },
    { name: 'Sundarpur', patients: 198, alerts: 28, response: '3.4 min', revenue: '₹1.9L' },
    { name: 'Krishnanagar', patients: 156, alerts: 21, response: '4.1 min', revenue: '₹1.5L' },
    { name: 'Lakshmipur', patients: 134, alerts: 18, response: '3.8 min', revenue: '₹1.2L' },
]

const roiMetrics = [
    { label: 'Cost per Patient Saved', value: '₹2,400/year', comparison: 'vs ₹12,000 traditional', savings: '80%' },
    { label: 'Hospital Admission Reduction', value: '45%', comparison: 'preventive monitoring', savings: '45%' },
    { label: 'Emergency Mortality Reduction', value: '62%', comparison: 'faster response times', savings: '62%' },
    { label: 'ASHA Efficiency Increase', value: '3.5x', comparison: 'patients per worker', savings: '250%' },
]

export default function AnalyticsPage() {
    const { isDemoMode } = useDemoMode()
    const [timeRange, setTimeRange] = useState('quarter')

    // In real mode, we might want to show actual zeros or fetch real data. 
    // For now, if NOT demo mode, we clear the data to avoid confusion.
    const displayKpiData = isDemoMode ? kpiData : kpiData.map(k => ({ ...k, value: '0', change: '0%', trend: 'neutral' }))
    const displayRevenueData = isDemoMode ? revenueData : revenueData.map(d => ({ ...d, b2g: 0, b2b: 0, b2c: 0 }))
    const displayImpactMetrics = isDemoMode ? impactMetrics : impactMetrics.map(m => ({ ...m, value: 0, change: '0%' }))
    const displayVillagePerformance = isDemoMode ? villagePerformance : []
    const displayRoiMetrics = isDemoMode ? roiMetrics : roiMetrics.map(m => ({ ...m, value: '0', savings: '0%' }))

    const maxRevenue = Math.max(...displayRevenueData.map(d => d.b2g + d.b2b + d.b2c)) || 1000 // Avoid div by zero

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Business Analytics</h1>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Real-time metrics for investors and stakeholders</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="px-4 py-2 rounded-xl border text-sm"
                        style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                    >
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="quarter">This Quarter</option>
                        <option value="year">This Year</option>
                    </select>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl btn-primary">
                        <Download className="h-4 w-4" /> Export Report
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {displayKpiData.map((kpi, i) => (
                    <div key={i} className="card p-5 rounded-2xl">
                        <div className="flex items-start justify-between mb-3">
                            <div className={`p-3 rounded-xl bg-gradient-to-br ${kpi.gradient}`}>
                                <kpi.icon className="h-5 w-5 text-white" />
                            </div>
                            <span className={`flex items-center gap-1 text-sm font-semibold ${kpi.trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
                                {kpi.trend === 'up' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                {kpi.change}
                            </span>
                        </div>
                        <p className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{kpi.value}</p>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{kpi.title}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{kpi.subtitle}</p>
                    </div>
                ))}
            </div>

            {/* Revenue Chart + ROI Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 card p-5 rounded-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Revenue Growth</h2>
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Monthly breakdown by revenue stream</p>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-teal-500" /> B2G</span>
                            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500" /> B2B</span>
                            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-purple-500" /> B2C</span>
                        </div>
                    </div>
                    <div className="h-64 flex items-end gap-4">
                        {displayRevenueData.map((month, i) => {
                            const total = month.b2g + month.b2b + month.b2c
                            const height = (total / maxRevenue) * 100
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                    <div
                                        className="w-full rounded-t-lg overflow-hidden flex flex-col justify-end"
                                        style={{ height: `${height}%` }}
                                    >
                                        <div className="bg-purple-500" style={{ height: `${(month.b2c / total) * 100}%` }} />
                                        <div className="bg-blue-500" style={{ height: `${(month.b2b / total) * 100}%` }} />
                                        <div className="bg-teal-500" style={{ height: `${(month.b2g / total) * 100}%` }} />
                                    </div>
                                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{month.month}</span>
                                </div>
                            )
                        })}
                    </div>
                    <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm" style={{ borderColor: 'var(--border-color)' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Total Q2 Revenue: <strong className="text-emerald-500">₹24.5L</strong></span>
                        <span style={{ color: 'var(--text-muted)' }}>Projected EOY: <strong className="text-teal-500">₹1.2Cr</strong></span>
                    </div>
                </div>

                {/* ROI Metrics */}
                <div className="card p-5 rounded-2xl">
                    <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>ROI & Impact Metrics</h2>
                    <div className="space-y-4">
                        {displayRoiMetrics.map((metric, i) => (
                            <div key={i} className="p-3 rounded-xl" style={{ background: 'var(--bg-primary)' }}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{metric.label}</span>
                                    <span className="text-sm font-bold text-emerald-500">{metric.savings} saved</span>
                                </div>
                                <p className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{metric.value}</p>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{metric.comparison}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Impact & Village Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Impact Metrics */}
                <div className="card p-5 rounded-2xl">
                    <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Health Impact Dashboard</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {displayImpactMetrics.map((metric, i) => (
                            <div key={i} className="p-4 rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{metric.label}</span>
                                    <span className="text-xs font-semibold text-emerald-500">{metric.change}</span>
                                </div>
                                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{metric.value.toLocaleString()}</p>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{metric.unit}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Village Performance Table */}
                <div className="card p-5 rounded-2xl">
                    <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Village Performance</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr style={{ color: 'var(--text-muted)' }}>
                                    <th className="text-left py-2 font-semibold">Village</th>
                                    <th className="text-center py-2 font-semibold">Patients</th>
                                    <th className="text-center py-2 font-semibold">Alerts</th>
                                    <th className="text-center py-2 font-semibold">Response</th>
                                    <th className="text-right py-2 font-semibold">Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayVillagePerformance.map((village, i) => (
                                    <tr key={i} className="border-t" style={{ borderColor: 'var(--border-color)' }}>
                                        <td className="py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                                            <span className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-teal-500" />
                                                {village.name}
                                            </span>
                                        </td>
                                        <td className="py-3 text-center" style={{ color: 'var(--text-secondary)' }}>{village.patients}</td>
                                        <td className="py-3 text-center" style={{ color: 'var(--text-secondary)' }}>{village.alerts}</td>
                                        <td className="py-3 text-center">
                                            <span className={`font-medium ${parseFloat(village.response) < 3 ? 'text-emerald-500' : parseFloat(village.response) < 4 ? 'text-amber-500' : 'text-red-500'}`}>
                                                {village.response}
                                            </span>
                                        </td>
                                        <td className="py-3 text-right font-semibold text-emerald-500">{village.revenue}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Investor Summary Banner */}
            <div className="card p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, #0d9488 0%, #10b981 100%)' }}>
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6 text-white">
                    <div>
                        <h3 className="text-2xl font-bold mb-2">Investment Opportunity</h3>
                        <p className="text-teal-100">Seeking ₹2 Cr seed funding for pan-India expansion</p>
                    </div>
                    <div className="flex items-center gap-8">
                        <div className="text-center">
                            <p className="text-3xl font-bold">₹50Cr</p>
                            <p className="text-xs text-teal-100">5-Year Revenue Target</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-bold">10M+</p>
                            <p className="text-xs text-teal-100">Lives Impacted Goal</p>
                        </div>
                        <button className="px-6 py-3 rounded-xl bg-white text-teal-700 font-bold hover:bg-teal-50 transition-colors">
                            Download Pitch Deck
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
