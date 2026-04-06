'use client'

import { Brain, TrendingUp, AlertCircle, Lightbulb, ArrowRight, Sparkles } from 'lucide-react'
import { useTheme } from '@/lib/theme-context'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface AIHealthInsightsProps {
    className?: string
}

export default function AIHealthInsights({ className = '' }: AIHealthInsightsProps) {
    const { t } = useTheme()
    const router = useRouter()
    const [expandedInsight, setExpandedInsight] = useState<number | null>(null)

    const insights = [
        {
            type: 'prediction',
            icon: Brain,
            titleKey: 'aiPrediction',
            message: '3 patients showing early signs of hypertension. Recommend preventive BP camps in Sector 3.',
            action: 'Schedule BP Camp',
            actionMsg: '📅 BP Camp Scheduler\n\nRecommended dates:\n- Tuesday 10:00 AM\n- Thursday 2:00 PM\n\nTarget: 3 patients in Sector 3',
            confidence: 87,
            color: 'purple'
        },
        {
            type: 'trend',
            icon: TrendingUp,
            titleKey: 'positiveTrend',
            message: 'Diabetes management improved 23% this month. Average HbA1c levels down across 45 patients.',
            action: 'View Report',
            actionMsg: '📊 Diabetes Management Report\n\n✓ HbA1c improvement: 23%\n✓ Patients affected: 45\n✓ Medication compliance: 89%\n\nTrend: Positive ▲',
            confidence: 92,
            color: 'green'
        },
        {
            type: 'alert',
            icon: AlertCircle,
            titleKey: 'riskAlert',
            message: '5 elderly patients in Gopalpur showing irregular heart patterns. Schedule ECG screening.',
            action: 'Schedule ECG',
            actionMsg: '🩺 ECG Screening Alert\n\n⚠️ 5 patients require immediate ECG\n\nLocation: Gopalpur\nPriority: HIGH\n\nNearest ECG facility:\nPHC Gopalpur (2.3 km)',
            confidence: 78,
            color: 'red',
            href: '/notifications'
        },
        {
            type: 'recommendation',
            icon: Lightbulb,
            titleKey: 'smartSuggestion',
            message: 'Optimal time for health camps: Tuesday & Thursday mornings based on patient availability data.',
            action: 'Plan Camp',
            actionMsg: '📋 Health Camp Planner\n\nOptimal Schedule:\n• Tuesday 9:00 AM - 12:00 PM\n• Thursday 9:00 AM - 12:00 PM\n\nBased on:\n- Patient availability (89%)\n- ASHA worker schedules\n- Weather forecasts',
            confidence: 95,
            color: 'blue'
        }
    ]

    const colorClasses = {
        purple: {
            bg: 'from-purple-500 to-violet-600',
            light: 'bg-purple-100 dark:bg-purple-900/30',
            text: 'text-purple-600 dark:text-purple-400',
            btn: 'bg-purple-500 hover:bg-purple-600'
        },
        green: {
            bg: 'from-emerald-500 to-green-600',
            light: 'bg-emerald-100 dark:bg-emerald-900/30',
            text: 'text-emerald-600 dark:text-emerald-400',
            btn: 'bg-emerald-500 hover:bg-emerald-600'
        },
        red: {
            bg: 'from-red-500 to-rose-600',
            light: 'bg-red-100 dark:bg-red-900/30',
            text: 'text-red-600 dark:text-red-400',
            btn: 'bg-red-500 hover:bg-red-600'
        },
        blue: {
            bg: 'from-blue-500 to-indigo-600',
            light: 'bg-blue-100 dark:bg-blue-900/30',
            text: 'text-blue-600 dark:text-blue-400',
            btn: 'bg-blue-500 hover:bg-blue-600'
        }
    }

    const handleInsightClick = (insight: typeof insights[0], idx: number) => {
        setExpandedInsight(expandedInsight === idx ? null : idx)
    }

    const handleAction = (insight: typeof insights[0]) => {
        alert(insight.actionMsg)
        if (insight.href) {
            router.push(insight.href)
        }
    }

    return (
        <div className={`card ${className}`}>
            <div className="p-5 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="icon-box bg-gradient-to-br from-purple-500 to-violet-600 animate-pulse-glow">
                            <Brain className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                Risk Scoring Engine
                            </h2>
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Rule-based alerts • Transparent logic</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'var(--bg-primary)' }}>
                        <Sparkles className="h-3 w-3 text-purple-500 animate-pulse" />
                        <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Threshold-based</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
                {insights.map((insight, idx) => {
                    const colors = colorClasses[insight.color as keyof typeof colorClasses]
                    const isExpanded = expandedInsight === idx
                    return (
                        <div
                            key={idx}
                            onClick={() => handleInsightClick(insight, idx)}
                            className={`p-4 rounded-xl transition-all duration-300 cursor-pointer group ${isExpanded ? 'ring-2 ring-offset-2' : 'hover:scale-[1.02]'}`}
                            style={{
                                background: 'var(--bg-primary)',
                                // ringColor: isExpanded ? insight.color : undefined
                            }}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${colors.bg} shadow-lg`}>
                                    <insight.icon className="h-4 w-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`text-xs font-bold uppercase tracking-wider ${colors.text}`}>
                                            {t(insight.titleKey)}
                                        </span>
                                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                            style={{ background: 'var(--border-color)', color: 'var(--text-muted)' }}>
                                            {insight.confidence}% {t('confidence')}
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                                        {insight.message}
                                    </p>

                                    {/* Action Button */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleAction(insight); }}
                                        className={`mt-3 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-white ${colors.btn} transition-all hover:scale-105`}
                                    >
                                        {insight.action}
                                        <ArrowRight className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>

                            {/* Confidence Bar */}
                            <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
                                <div
                                    className={`h-full bg-gradient-to-r ${colors.bg} transition-all duration-500`}
                                    style={{ width: `${insight.confidence}%` }}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
