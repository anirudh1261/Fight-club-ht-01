'use client'

import { Shield, CheckCircle, ExternalLink, IndianRupee, Users, Heart, FileText } from 'lucide-react'
import { useMemo } from 'react'

interface PatientData {
    age?: number
    gender?: string
    conditions?: string[]
    bplCard?: boolean
    income?: string // 'low' | 'medium' | 'high'
}

interface Scheme {
    name: string
    coverage: string
    eligibility: string[]
    matched: boolean
    icon: typeof Shield
    color: string
    link: string
}

export default function SchemeEligibility({ patient }: { patient: PatientData }) {
    const schemes = useMemo(() => {
        const age = patient.age || 65
        const conditions = patient.conditions || []
        const isLowIncome = patient.income === 'low' || patient.bplCard

        const allSchemes: Scheme[] = [
            {
                name: 'Ayushman Bharat (PM-JAY)',
                coverage: 'Up to ₹5L/family/year for hospitalization',
                eligibility: ['BPL card holder', 'No income tax filing'],
                matched: !!isLowIncome,
                icon: Shield,
                color: 'emerald',
                link: 'https://pmjay.gov.in'
            },
            {
                name: 'National Social Assistance (NSAP)',
                coverage: '₹200-500/month pension for elderly',
                eligibility: ['Age 60+', 'BPL family'],
                matched: age >= 60 && !!isLowIncome,
                icon: IndianRupee,
                color: 'blue',
                link: 'https://nsap.nic.in'
            },
            {
                name: 'Indira Gandhi Old Age Pension',
                coverage: '₹200/month (60-79), ₹500/month (80+)',
                eligibility: ['Age 60+', 'Below poverty line'],
                matched: age >= 60,
                icon: Users,
                color: 'purple',
                link: 'https://nsap.nic.in/ignoaps.html'
            },
            {
                name: 'Rashtriya Swasthya Bima Yojana',
                coverage: 'Smart card for cashless treatment up to ₹30,000',
                eligibility: ['BPL family', 'Unorganized sector'],
                matched: !!isLowIncome,
                icon: Heart,
                color: 'pink',
                link: 'https://www.india.gov.in/spotlight/rashtriya-swasthya-bima-yojana'
            },
            {
                name: 'NHM Free Medicine Scheme',
                coverage: 'Free essential medicines at public facilities',
                eligibility: ['All citizens', 'Visit government hospital'],
                matched: true,
                icon: FileText,
                color: 'amber',
                link: 'https://nhm.gov.in'
            },
        ]

        return allSchemes
    }, [patient])

    const matchedCount = schemes.filter(s => s.matched).length

    return (
        <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                        <Shield className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                            Government Scheme Eligibility
                        </h3>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {matchedCount} schemes matched
                        </p>
                    </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                    {matchedCount}/{schemes.length} Eligible
                </span>
            </div>

            <div className="space-y-2">
                {schemes.map((scheme) => (
                    <div
                        key={scheme.name}
                        className={`p-3 rounded-xl border transition-all ${scheme.matched
                            ? 'border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5'
                            : 'opacity-40 border-transparent'
                            }`}
                        style={{ background: scheme.matched ? undefined : 'var(--bg-primary)' }}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {scheme.matched && <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />}
                                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                    {scheme.name}
                                </span>
                            </div>
                            {scheme.matched && (
                                <a
                                    href={scheme.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:text-blue-700 p-1"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                            )}
                        </div>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                            {scheme.coverage}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    )
}
