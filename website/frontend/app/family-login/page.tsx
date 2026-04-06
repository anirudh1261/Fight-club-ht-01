'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Shield, User, Key, ArrowRight, Phone, AlertCircle, Sparkles } from 'lucide-react'

export default function FamilyLoginPage() {
    const router = useRouter()
    const [patientId, setPatientId] = useState('')
    const [familyCode, setFamilyCode] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    // Mock valid credentials for demo
    const validCredentials = [
        { patientId: 'P-001', familyCode: '1234', patientName: 'Rajesh Kumar' },
        { patientId: 'P-002', familyCode: '5678', patientName: 'Sunita Devi' },
        { patientId: 'P-004', familyCode: '9999', patientName: 'Lakshmi Devi' },
    ]

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500))

        const match = validCredentials.find(
            c => c.patientId.toLowerCase() === patientId.toLowerCase() && c.familyCode === familyCode
        )

        if (match) {
            // Store in sessionStorage for demo
            sessionStorage.setItem('familyAuth', JSON.stringify({
                patientId: match.patientId,
                patientName: match.patientName,
                loginTime: Date.now()
            }))
            router.push(`/family-dashboard/${match.patientId}`)
        } else {
            setError('Invalid Patient ID or Family Code. Please try again.')
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-teal-400 to-emerald-500 shadow-2xl shadow-teal-500/30 mb-4">
                        <Heart className="h-10 w-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-white mb-2">
                        Ayu<span className="text-teal-400">Link</span>
                    </h1>
                    <p className="text-slate-400 flex items-center justify-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-400" />
                        Family Health Monitoring Portal
                    </p>
                </div>

                {/* Login Card */}
                <div className="card p-8 rounded-3xl shadow-2xl" style={{ background: 'rgba(30, 41, 59, 0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div className="text-center mb-6">
                        <h2 className="text-xl font-bold text-white mb-1">Family Login</h2>
                        <p className="text-sm text-slate-400">Access your loved one's health data</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/50 flex items-center gap-2 text-red-300 text-sm">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        {/* Patient ID */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Patient ID
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                <input
                                    type="text"
                                    value={patientId}
                                    onChange={(e) => setPatientId(e.target.value)}
                                    placeholder="e.g., P-001"
                                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {/* Family Code */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Family Access Code
                            </label>
                            <div className="relative">
                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                <input
                                    type="password"
                                    value={familyCode}
                                    onChange={(e) => setFamilyCode(e.target.value)}
                                    placeholder="4-digit code"
                                    maxLength={4}
                                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                    required
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                Provided by ASHA worker during enrollment
                            </p>
                        </div>

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all ${isLoading
                                ? 'bg-slate-600 cursor-not-allowed'
                                : 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 shadow-lg shadow-teal-500/30 hover:scale-[1.02]'
                                }`}
                        >
                            {isLoading ? (
                                <>
                                    <span className="animate-spin">⏳</span>
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    Access Health Dashboard
                                    <ArrowRight className="h-5 w-5" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Demo Credentials */}
                    <div className="mt-6 pt-6 border-t border-slate-700">
                        <p className="text-xs text-slate-500 text-center mb-3">Demo Credentials:</p>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                            {validCredentials.map(cred => (
                                <button
                                    key={cred.patientId}
                                    onClick={() => { setPatientId(cred.patientId); setFamilyCode(cred.familyCode); }}
                                    className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors text-center"
                                >
                                    <span className="block font-mono font-bold text-teal-400">{cred.patientId}</span>
                                    <span className="text-[10px]">{cred.familyCode}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Help Section */}
                <div className="mt-6 text-center">
                    <p className="text-slate-500 text-sm mb-2">Need help accessing the portal?</p>
                    <button className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 text-sm font-medium transition-colors">
                        <Phone className="h-4 w-4" />
                        Contact PHC Helpline: 1800-XXX-XXXX
                    </button>
                </div>

                {/* Security Footer */}
                <div className="mt-8 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700">
                        <Shield className="h-4 w-4 text-emerald-400" />
                        <span className="text-xs text-slate-400">Encrypted & Secure Connection</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
