'use client'

import { QRCodeSVG } from 'qrcode.react'
import { FileText, Printer, ShieldCheck, X } from 'lucide-react'

interface ParamedicQRModalProps {
    isOpen: boolean
    onClose: () => void
    data?: {
        patientName: string
        age?: number // Optional
        bloodType?: string // Optional
        conditions?: string[] // "Diabetes", "Hypertension"
        medications?: string[] // "Metformin", "Aspirin"
        hr: number
        spo2: number
        lat: number
        lng: number
    }
}

export default function ParamedicQRModal({ isOpen, onClose, data }: ParamedicQRModalProps) {
    if (!isOpen || !data) return null

    // Create a compact JSON for scanning
    const qrPayload = JSON.stringify({
        n: data.patientName || "Unknown",
        a: data.age || 75,
        b: data.bloodType || "O+",
        c: data.conditions || [],
        m: data.medications || [],
        v: { hr: data.hr, o2: data.spo2 },
        l: { lat: data.lat, lng: data.lng },
        ts: new Date().toISOString()
    })

    return (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-slate-200 dark:border-slate-700">
                {/* Header */}
                <div className="bg-blue-600 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <ShieldCheck className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Paramedic Quick Scan</h2>
                            <p className="text-blue-100 text-xs">VitaLink EMS Integration Protocol</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 flex flex-col items-center gap-6">
                    {/* QR Code */}
                    <div className="p-4 bg-white rounded-xl shadow-lg border border-slate-100">
                        <QRCodeSVG
                            value={qrPayload}
                            size={200}
                            level="M"
                            includeMargin={true}
                        />
                    </div>

                    <p className="text-sm text-center text-slate-500 max-w-xs">
                        Scan with EMS Tablet to import Vitals, Allergies & History instantly.
                    </p>

                    {/* Quick Vitals View */}
                    <div className="w-full grid grid-cols-2 gap-4">
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl text-center border border-red-100 dark:border-red-800/30">
                            <p className="text-xs text-red-600 dark:text-red-400 font-bold uppercase">Heart Rate</p>
                            <p className="text-3xl font-black text-red-700 dark:text-red-300">{data.hr || '--'}<span className="text-sm font-medium ml-1">bpm</span></p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-center border border-blue-100 dark:border-blue-800/30">
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase">SpO2 Level</p>
                            <p className="text-3xl font-black text-blue-700 dark:text-blue-300">{data.spo2 || '--'}<span className="text-sm font-medium ml-1">%</span></p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center border-t border-slate-100 dark:border-slate-700">
                    <span className="text-xs font-mono text-slate-400">ID: {Math.random().toString(36).substr(2, 6).toUpperCase()}</span>
                    <button className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity">
                        <Printer className="h-4 w-4" />
                        Print Report
                    </button>
                </div>
            </div>
        </div>
    )
}
