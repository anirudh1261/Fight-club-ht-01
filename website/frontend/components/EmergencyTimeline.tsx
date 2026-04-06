
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Play, Pause, Square, SkipBack, FastForward, Clock } from 'lucide-react'

interface TimelineSnapshot {
    timestamp: number
    lat: number
    lng: number
    hr: number
    spo2: number
    status: 'normal' | 'warning' | 'critical'
}

interface EmergencyTimelineProps {
    history: TimelineSnapshot[]
    onTimeUpdate: (snapshot: TimelineSnapshot) => void
    isActive: boolean
}

export default function EmergencyTimeline({ history, onTimeUpdate, isActive }: EmergencyTimelineProps) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(history.length - 1)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)

    // Reset when improved history arrives
    useEffect(() => {
        if (history.length > 0 && !isPlaying && isActive) {
            setCurrentIndex(history.length - 1)
        }
    }, [history.length, isActive])

    // Handle Playback
    useEffect(() => {
        if (isPlaying) {
            intervalRef.current = setInterval(() => {
                setCurrentIndex(prev => {
                    if (prev >= history.length - 1) {
                        setIsPlaying(false)
                        return prev
                    }
                    return prev + 1
                })
            }, 1000) // 1 second per step
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [isPlaying, history.length])

    // Update parent when index changes
    useEffect(() => {
        if (history[currentIndex]) {
            onTimeUpdate(history[currentIndex])
        }
    }, [currentIndex, history, onTimeUpdate])

    const formatTime = (ts: number) => {
        return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const index = parseInt(e.target.value)
        setCurrentIndex(index)
        setIsPlaying(false)
    }

    if (!isActive || history.length === 0) return null

    const currentSnapshot = history[currentIndex]

    return (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-[95%] max-w-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 ring-1 ring-black/5 p-5 animate-slideUp z-[500]">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                        <Clock className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Replay Mode</p>
                        <p className="text-sm font-bold font-mono">{formatTime(currentSnapshot.timestamp)}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentIndex(0)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <SkipBack className="h-4 w-4" />
                    </button>

                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className={`p-3 rounded-full text-white shadow-lg transition-transform active:scale-95 ${isPlaying ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
                    </button>

                    <button
                        onClick={() => {
                            setIsPlaying(false)
                            setCurrentIndex(history.length - 1)
                        }}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <FastForward className="h-4 w-4" />
                    </button>
                </div>

                <div className="text-right">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vitals Snapshot</p>
                    <div className="flex items-center gap-3 text-sm font-mono font-bold">
                        <span className={currentSnapshot.hr > 100 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}>
                            HR: {currentSnapshot.hr || '--'}
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className={currentSnapshot.spo2 < 90 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}>
                            SpO2: {currentSnapshot.spo2 || '--'}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Timeline Slider */}
            <div className="relative h-6 flex items-center">
                <div className="absolute w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${(currentIndex / (history.length - 1)) * 100}%` }}
                    />
                </div>
                <input
                    type="range"
                    min={0}
                    max={history.length - 1}
                    value={currentIndex}
                    onChange={handleSliderChange}
                    className="absolute w-full h-full opacity-0 cursor-pointer"
                />

                {/* Event Markers (Mock) */}
                <div className="absolute top-1/2 -translate-y-1/2 left-[20%] w-2 h-2 rounded-full bg-yellow-500 border border-white shadow-sm" title="Vitals Warning" />
                <div className="absolute top-1/2 -translate-y-1/2 left-[60%] w-2 h-2 rounded-full bg-red-600 border border-white shadow-sm animate-ping" title="Critical Alert" />
            </div>
        </div>
    )
}
