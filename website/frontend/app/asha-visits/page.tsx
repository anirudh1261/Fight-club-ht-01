'use client'

import { UserCheck, MapPin, Clock, CheckCircle, AlertCircle, Phone } from 'lucide-react'
import ASHAVerification from '@/components/ASHAVerification'

export default function ASHAVisitsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600">
                    <UserCheck className="h-8 w-8 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>ASHA Visits</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Track and manage ASHA worker patient visits</p>
                </div>
            </div>

            <ASHAVerification />
        </div>
    )
}
