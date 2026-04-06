'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, AlertCircle, CheckCircle, Salad, Info } from 'lucide-react'

interface DietaryModalProps {
    isOpen: boolean
    onClose: () => void
    patientName: string
    allergies: string[]
    conditions: string[]
}

const dietaryRecommendations: Record<string, {
    avoid: string[]
    recommended: string[]
    reason: string
}> = {
    'Diabetes': {
        avoid: ['White rice', 'Sugar', 'Sweets', 'White bread', 'Fried foods'],
        recommended: ['Millets (Jowar, Bajra)', 'Green leafy vegetables', 'Brown rice', 'Legumes', 'Nuts'],
        reason: 'Controls blood sugar levels'
    },
    'Hypertension': {
        avoid: ['Salt', 'Pickles', 'Papad', 'Processed foods', 'Fried snacks'],
        recommended: ['Fresh fruits', 'Vegetables', 'Oats', 'Low-fat dairy', 'Garlic'],
        reason: 'Helps manage blood pressure'
    },
    'High Cholesterol': {
        avoid: ['Ghee', 'Butter', 'Red meat', 'Egg yolk', 'Coconut oil'],
        recommended: ['Fish', 'Oats', 'Almonds', 'Olive oil', 'Apples'],
        reason: 'Reduces LDL cholesterol'
    }
}

export default function DietaryModal({ isOpen, onClose, patientName, allergies, conditions }: DietaryModalProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    if (!isOpen || !mounted) return null

    return createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-[9999] p-4 pt-10 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full my-4 flex flex-col border border-slate-200 dark:border-slate-800 animate-fadeIn relative">
                {/* Header */}
                <div className="sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-700 px-6 py-5 flex items-center justify-between rounded-t-2xl z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <Salad className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Dietary Guide</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Personalized for {patientName}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Allergies Section */}
                    {allergies.length > 0 && (
                        <div className="bg-red-50 dark:bg-red-900/10 border-2 border-red-100 dark:border-red-900/30 rounded-xl p-5">
                            <div className="flex items-start gap-4">
                                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-red-900 dark:text-red-200 mb-2">⚠️ Known Allergies</h3>
                                    <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                                        <strong>CRITICAL: Avoid these at all costs</strong>
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {allergies.map((allergy, idx) => (
                                            <span
                                                key={idx}
                                                className="px-3 py-1 bg-white dark:bg-red-950/50 text-red-700 dark:text-red-300 rounded-full text-sm font-bold border border-red-200 dark:border-red-800 shadow-sm"
                                            >
                                                {allergy}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Condition-Based Recommendations */}
                    {conditions.length > 0 ? (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Info className="h-5 w-5 text-blue-500" />
                                Condition-Specific Recommendations
                            </h3>

                            {conditions.map((condition) => {
                                const rec = dietaryRecommendations[condition]
                                if (!rec) return null

                                return (
                                    <div key={condition} className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                                        <div className="bg-slate-50 dark:bg-slate-800/50 px-5 py-3 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
                                            <h3 className="font-bold text-gray-900 dark:text-white">{condition}</h3>
                                            <span className="text-xs font-medium px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md">
                                                {rec.reason}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-slate-700">
                                            {/* Foods to Avoid */}
                                            <div className="p-5 bg-red-50/30 dark:bg-red-900/5">
                                                <h4 className="font-semibold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                                                    <X className="h-4 w-4" />
                                                    Foods to Avoid
                                                </h4>
                                                <ul className="space-y-2.5">
                                                    {rec.avoid.map((food, idx) => (
                                                        <li key={idx} className="text-sm text-gray-700 dark:text-slate-300 flex items-start gap-2.5">
                                                            <div className="min-w-[4px] h-[4px] rounded-full bg-red-400 mt-2" />
                                                            <span>{food}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {/* Recommended Foods */}
                                            <div className="p-5 bg-green-50/30 dark:bg-green-900/5">
                                                <h4 className="font-semibold text-green-700 dark:text-green-400 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                                                    <CheckCircle className="h-4 w-4" />
                                                    Recommended Foods
                                                </h4>
                                                <ul className="space-y-2.5">
                                                    {rec.recommended.map((food, idx) => (
                                                        <li key={idx} className="text-sm text-gray-700 dark:text-slate-300 flex items-start gap-2.5">
                                                            <div className="min-w-[4px] h-[4px] rounded-full bg-green-400 mt-2" />
                                                            <span>{food}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-10 px-6 rounded-xl border-2 border-dashed border-gray-200 dark:border-slate-700">
                            <Salad className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-slate-600" />
                            <p className="text-gray-500 dark:text-slate-400 font-medium">No specific dietary restrictions found.</p>
                            <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Maintain a balanced diet rich in vegetables and hydration.</p>
                        </div>
                    )}

                    {/* General Tips */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 border border-blue-100 dark:border-blue-800/50">
                        <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                            <span className="text-xl">💡</span> General Health Tips
                        </h3>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                                'Drink 8-10 glasses of water daily',
                                'Eat small meals every 3-4 hours',
                                'Include seasonal fruits and vegetables',
                                'Limit tea/coffee to 2 cups per day',
                                'Avoid eating late at night',
                                'Walk for at least 30 minutes daily'
                            ].map((tip, i) => (
                                <li key={i} className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 p-4 rounded-b-2xl flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                    >
                        Got it, Thanks!
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}
