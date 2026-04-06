'use client'

import { QRCodeSVG } from 'qrcode.react'
import { Smartphone, X, ExternalLink, Wifi } from 'lucide-react'

interface MobileAccessModalProps {
    isOpen: boolean
    onClose: () => void
    url: string
}

export default function MobileAccessModal({ isOpen, onClose, url }: MobileAccessModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[30000] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-white/10 rounded-3xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-6 text-center relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <Smartphone className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Mobile EMS Console</h2>
                    <p className="text-emerald-100 text-xs font-bold tracking-widest uppercase mt-1">Simulate Ambulance Tablet</p>
                </div>

                {/* Content */}
                <div className="p-8 flex flex-col items-center gap-6">
                    <div className="p-4 bg-white rounded-2xl shadow-inner shadow-black/10">
                        <QRCodeSVG
                            value={url}
                            size={220}
                            level="H"
                            includeMargin={false}
                        />
                    </div>

                    <div className="space-y-4 w-full">
                        <div className="flex items-start gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
                            <Wifi className="h-5 w-5 text-teal-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-slate-400 leading-relaxed uppercase font-bold tracking-tight">
                                Connect phone to <span className="text-white">same WiFi</span> as this computer to access the live stream.
                            </p>
                        </div>

                        <div className="text-center">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Direct Link</p>
                            <code className="text-[10px] bg-black px-3 py-1.5 rounded-lg text-teal-400 font-mono break-all">
                                {url}
                            </code>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-black/40 border-t border-white/5">
                    <button
                        onClick={() => window.open(url, '_blank')}
                        className="w-full flex items-center justify-center gap-2 bg-white text-black font-black py-4 rounded-xl uppercase tracking-tighter hover:bg-teal-400 transition-colors"
                    >
                        <ExternalLink className="h-4 w-4" /> Open in New Tab
                    </button>
                </div>
            </div>
        </div>
    )
}
