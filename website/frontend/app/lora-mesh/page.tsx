'use client'

import { Wifi, Radio, Signal, MapPin, Activity, Zap } from 'lucide-react'

const meshNodes = [
    { id: 'GW-001', type: 'Gateway', location: 'PHC Rampur', status: 'online', signal: -45, hops: 0, devices: 12 },
    { id: 'MB-001', type: 'Medicine Box', location: 'Arjun Sharma Home', status: 'online', signal: -62, hops: 1, devices: 0 },
    { id: 'MB-002', type: 'Medicine Box', location: 'Priya Verma Home', status: 'online', signal: -58, hops: 1, devices: 0 },
    { id: 'WB-001', type: 'Wearable', location: 'Arjun Sharma', status: 'online', signal: -71, hops: 2, devices: 0 },
    { id: 'WB-002', type: 'Wearable', location: 'Priya Verma', status: 'online', signal: -65, hops: 1, devices: 0 },
    { id: 'WB-003', type: 'Wearable', location: 'Rohan Patel', status: 'offline', signal: -90, hops: 3, devices: 0 },
    { id: 'RP-001', type: 'Repeater', location: 'Village Square', status: 'online', signal: -52, hops: 1, devices: 5 },
]

export default function LoRaMeshPage() {
    const onlineNodes = meshNodes.filter(n => n.status === 'online').length

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600">
                    <Wifi className="h-8 w-8 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>LoRa Mesh Network</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Self-healing mesh for extended rural coverage</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card p-4 text-center">
                    <p className="text-3xl font-bold text-emerald-500">{onlineNodes}/{meshNodes.length}</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nodes Online</p>
                </div>
                <div className="card p-4 text-center">
                    <p className="text-3xl font-bold text-blue-500">50km+</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Coverage Range</p>
                </div>
                <div className="card p-4 text-center">
                    <p className="text-3xl font-bold text-purple-500">3</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Max Hops</p>
                </div>
                <div className="card p-4 text-center">
                    <p className="text-3xl font-bold text-amber-500">99.2%</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Uptime</p>
                </div>
            </div>

            {/* Network Nodes */}
            <div className="card">
                <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Network Topology</h2>
                </div>
                <div className="p-4 space-y-3">
                    {meshNodes.map(node => (
                        <div key={node.id} className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--bg-primary)' }}>
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-xl ${node.type === 'Gateway' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                                        node.type === 'Medicine Box' ? 'bg-purple-100 dark:bg-purple-900/30' :
                                            node.type === 'Repeater' ? 'bg-amber-100 dark:bg-amber-900/30' :
                                                'bg-blue-100 dark:bg-blue-900/30'
                                    }`}>
                                    {node.type === 'Gateway' ? <Radio className="h-5 w-5 text-emerald-500" /> :
                                        node.type === 'Medicine Box' ? <Activity className="h-5 w-5 text-purple-500" /> :
                                            node.type === 'Repeater' ? <Zap className="h-5 w-5 text-amber-500" /> :
                                                <Signal className="h-5 w-5 text-blue-500" />}
                                </div>
                                <div>
                                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{node.id}</p>
                                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{node.location}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{node.signal} dBm</p>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{node.hops} hops</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${node.status === 'online' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-red-100 text-red-600 dark:bg-red-900/30'
                                    }`}>
                                    {node.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
