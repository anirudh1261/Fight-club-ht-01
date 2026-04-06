
'use client'

import { Car, Car as CarIcon, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { calculateRiskScore, RiskAnalysis } from '@/lib/risk-engine'
import { useEffect, useState } from 'react'

interface RiskScoreCardProps {
    hr: number
    spo2: number
    temp: number
    activity?: string
}

export default function RiskScoreCard({ hr, spo2, temp, activity }: RiskScoreCardProps) {
    const [risk, setRisk] = useState<RiskAnalysis | null>(null)

    useEffect(() => {
        const analysis = calculateRiskScore({ hr, spo2, temp, activity })
        setRisk(analysis)
    }, [hr, spo2, temp, activity])

    if (!risk) return null

    return (
        <div className="card p-6 border-l-4" style={{ borderLeftColor: risk.color }}>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" style={{ color: risk.color }} />
                        Health Risk Score
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Real-time health intelligence assessment</p>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-black" style={{ color: risk.color }}>
                        {risk.score}/100
                    </div>
                    <div className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 inline-block mt-1">
                        {risk.level} Risk
                    </div>
                </div>
            </div>

            {/* Gauge Bar */}
            <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-6">
                <div
                    className="h-full transition-all duration-1000 ease-out"
                    style={{
                        width: `${risk.score}%`,
                        background: risk.color
                    }}
                />
            </div>

            {/* Explanations */}
            <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-500" />
                    Why this score?
                </h4>
                {risk.factors.length > 0 ? (
                    <ul className="space-y-2">
                        {risk.factors.map((factor, idx) => (
                            <li key={idx} className="text-sm flex items-start gap-2 bg-red-50 dark:bg-red-900/20 p-2 rounded text-red-700 dark:text-red-300">
                                <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
                                {factor}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-sm flex items-center gap-2 bg-green-50 dark:bg-green-900/20 p-2 rounded text-green-700 dark:text-green-300">
                        <CheckCircle className="h-4 w-4" />
                        Vitals are within normal range. No immediate risks detected.
                    </div>
                )}
            </div>

            {/* Action Recommendation */}
            {risk.level === 'Critical' && (
                <div className="mt-4 p-3 bg-red-600 text-white rounded-lg animate-pulse">
                    <p className="text-sm font-bold flex items-center justify-center gap-2">
                        🚨 IMMEDIATE ACTION REQUIRED: Dispatch Ambulance
                    </p>
                </div>
            )}
        </div>
    )
}
