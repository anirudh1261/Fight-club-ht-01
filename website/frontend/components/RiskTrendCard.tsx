'use client'

import { predictRiskTrend, type RiskTrendPoint } from '@/lib/risk-engine'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useMemo } from 'react'

interface RiskTrendCardProps {
    hr: number
    spo2: number
    temp: number
}

export default function RiskTrendCard({ hr, spo2, temp }: RiskTrendCardProps) {
    const trend = useMemo(() => {
        // Generate synthetic history from current vitals with slight variations
        const history = Array.from({ length: 8 }, (_, i) => ({
            hr: hr + (Math.random() - 0.5) * 10 * (1 - i / 8),
            spo2: spo2 + (Math.random() - 0.5) * 3 * (1 - i / 8),
            temp: temp + (Math.random() - 0.5) * 0.5 * (1 - i / 8),
        })).reverse()
        return predictRiskTrend(history)
    }, [hr, spo2, temp])

    const currentScore = trend[0]?.score ?? 0
    const futureScore = trend[trend.length - 1]?.score ?? 0
    const trendDirection = futureScore > currentScore + 5 ? 'up' : futureScore < currentScore - 5 ? 'down' : 'stable'
    const maxScore = Math.max(...trend.map(t => t.score), 1)

    return (
        <div className="p-3 rounded-xl" style={{ background: 'var(--bg-primary)' }}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                        24h Risk Forecast
                    </span>
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold ${trendDirection === 'up' ? 'text-red-500' : trendDirection === 'down' ? 'text-emerald-500' : 'text-amber-500'
                    }`}>
                    {trendDirection === 'up' ? <TrendingUp className="h-3 w-3" /> :
                        trendDirection === 'down' ? <TrendingDown className="h-3 w-3" /> :
                            <Minus className="h-3 w-3" />}
                    {trendDirection === 'up' ? 'Rising' : trendDirection === 'down' ? 'Declining' : 'Stable'}
                </div>
            </div>

            {/* Sparkline */}
            <div className="h-10 flex items-end gap-[2px]">
                {trend.map((point, i) => (
                    <div
                        key={i}
                        className="flex-1 rounded-t transition-all"
                        style={{
                            height: `${Math.max(8, (point.score / maxScore) * 100)}%`,
                            backgroundColor: point.color,
                            opacity: 0.4 + (i / trend.length) * 0.6,
                        }}
                    />
                ))}
            </div>

            <div className="flex justify-between mt-1">
                <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Now</span>
                <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>+24h</span>
            </div>
        </div>
    )
}
