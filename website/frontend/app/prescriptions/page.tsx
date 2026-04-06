'use client'

import { useState } from 'react'
import { Pill, Activity, ChevronRight, History, PlusCircle, ShoppingBag, ClipboardList } from 'lucide-react'
import { useTheme } from '@/lib/theme-context'
import Link from 'next/link'
import MedicineScheduleManager from '@/components/MedicineScheduleManager'

export default function PrescriptionsPage() {
    const { t } = useTheme()
    const [activeTab, setActiveTab] = useState('protocols')

    const menuItems = [
        { id: 'protocols', label: 'Medical Protocols', icon: ClipboardList },
        { id: 'history', label: 'History & Logs', icon: History },
        { id: 'new', label: 'Issue New RX', icon: PlusCircle },
        { id: 'pharmacy', label: 'Pharmacy Inventory', icon: ShoppingBag },
    ]

    return (
        <div className="flex -m-8 h-[calc(100vh-4rem)] bg-slate-950">
            {/* Left Sub-Menu */}
            <aside className="w-64 border-r border-white/5 bg-slate-900/50 p-6 space-y-2">
                <div className="mb-8">
                    <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                        <Pill className="text-teal-400 h-5 w-5" />
                        {t('prescriptions')}
                    </h1>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Warangal Central Unit</p>
                </div>
                
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                            activeTab === item.id 
                            ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-[0_0_15px_-5px_rgba(20,184,166,0.3)]' 
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                    </button>
                ))}

                <div className="mt-auto pt-8">
                    <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-widest group">
                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        Back to Command
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-10 bg-[#0a0e17]">
                <div className="max-w-6xl mx-auto space-y-8">
                    {activeTab === 'protocols' ? (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-white/5 pb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-white tracking-tight">Active Medical Protocols</h2>
                                    <p className="text-sm text-slate-400 mt-1">Configure automated dispensing intervals and dosages</p>
                                </div>
                            </div>
                            
                            {/* Medicine Schedule Manager - Full Width */}
                            <div className="bg-slate-900/30 rounded-3xl border border-white/5 shadow-xl p-2">
                                <MedicineScheduleManager />
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-500 italic py-20 border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.02]">
                            <p>Select a patient to view {activeTab.replace('_', ' ')} logs</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
