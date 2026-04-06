'use client'

import { useState, useEffect } from 'react'
import { Brain, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Sparkles, ChevronRight, Activity, Heart, Pill, Users } from 'lucide-react'

interface Insight {
    id: string
    type: 'alert' | 'trend' | 'recommendation' | 'prediction'
    priority: 'high' | 'medium' | 'low'
    title: string
    description: string
    patient?: string
    action?: string
    confidence?: number
}

const mockInsights: Insight[] = [
    {
        id: '1',
        type: 'alert',
        priority: 'high',
        title: 'BP Pattern Detected',
        description: 'Lakshmi Devi\'s blood pressure shows increasing trend over 3 days. Current: 148/95',
        patient: 'Lakshmi Devi',
        action: 'Schedule immediate consultation',
        confidence: 94
    },
    {
        id: '2',
        type: 'prediction',
        priority: 'medium',
        title: 'Medication Adherence Risk',
        description: 'Amit Singh likely to miss evening medication based on past patterns',
        patient: 'Amit Singh',
        action: 'Send proactive reminder at 6:30 PM',
        confidence: 87
    },
    {
        id: '3',
        type: 'trend',
        priority: 'low',
        title: 'Improved Activity Levels',
        description: '4 patients showing increased daily step counts this week (+23% avg)',
        action: 'Continue monitoring, consider new fitness goals',
        confidence: 91
    },
    {
        id: '4',
        type: 'recommendation',
        priority: 'medium',
        title: 'Weather Advisory',
        description: 'High temperature expected tomorrow. Recommend hydration reminders for all patients',
        action: 'Schedule water reminders',
        confidence: 88
    }
]

const priorityStyles = {
    high: 'border-red-500 bg-red-50 dark:bg-red-900/20',
    medium: 'border-amber-500 bg-amber-50 dark:bg-amber-900/20',
    low: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
}

const typeIcons = {
    alert: AlertTriangle,
    trend: TrendingUp,
    recommendation: Lightbulb,
    prediction: Brain
}

export default function AIInsightsPanel() {
    const [insights, setInsights] = useState<Insight[]>(mockInsights)
    const [isAnalyzing, setIsAnalyzing] = useState(false)

    const handleAnalyze = () => {
        setIsAnalyzing(true)
        setTimeout(() => {
            setIsAnalyzing(false)
            alert('✨ AI Analysis Complete!\n\nNew insights generated based on latest patient data.')
        }, 2000)
    }

    const handleAction = (insight: Insight) => {
        alert(`✅ Action Initiated\n\n${insight.action}\n\nPatient: ${insight.patient || 'All Patients'}`)
    }

    return (
        <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
                        <Brain className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h2 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            AI Health Insights
                            <Sparkles className="h-4 w-4 text-amber-400" />
                        </h2>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Powered by Google Gemini</p>
                    </div>
                </div>
                <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${isAnalyzing
                        ? 'bg-purple-100 text-purple-400 dark:bg-purple-900/30'
                        : 'bg-purple-500 text-white hover:bg-purple-600'
                        }`}
                >
                    {isAnalyzing ? (
                        <span className="flex items-center gap-2">
                            <span className="animate-spin">⏳</span> Analyzing...
                        </span>
                    ) : (
                        'Run Analysis'
                    )}
                </button>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {insights.map((insight) => {
                    const Icon = typeIcons[insight.type]
                    return (
                        <div
                            key={insight.id}
                            className={`p-4 rounded-xl border-l-4 ${priorityStyles[insight.priority]}`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`p-1.5 rounded-lg ${insight.priority === 'high' ? 'bg-red-200 dark:bg-red-800' :
                                        insight.priority === 'medium' ? 'bg-amber-200 dark:bg-amber-800' :
                                            'bg-emerald-200 dark:bg-emerald-800'
                                    }`}>
                                    <Icon className={`h-4 w-4 ${insight.priority === 'high' ? 'text-red-700 dark:text-red-300' :
                                            insight.priority === 'medium' ? 'text-amber-700 dark:text-amber-300' :
                                                'text-emerald-700 dark:text-emerald-300'
                                        }`} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{insight.title}</h3>
                                        {insight.confidence && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700" style={{ color: 'var(--text-muted)' }}>
                                                {insight.confidence}% confidence
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>{insight.description}</p>
                                    {insight.action && (
                                        <button
                                            onClick={() => handleAction(insight)}
                                            className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                                        >
                                            {insight.action} <ChevronRight className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
