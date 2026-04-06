"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

interface DemoContextType {
    isDemoMode: boolean
    toggleDemoMode: () => void
}

const DemoContext = createContext<DemoContextType | undefined>(undefined)

export function DemoProvider({ children }: { children: React.ReactNode }) {
    const [isDemoMode, setIsDemoMode] = useState(true)

    // Persist demo mode preference
    useEffect(() => {
        try {
            const saved = localStorage.getItem('ayulink_demo_mode')
            if (saved) {
                setIsDemoMode(JSON.parse(saved))
            }
        } catch {
            // Ignore corrupted localStorage
        }
    }, [])

    const toggleDemoMode = () => {
        setIsDemoMode(prev => {
            const newState = !prev
            localStorage.setItem('ayulink_demo_mode', JSON.stringify(newState))
            // Reload page to ensure clean state reset when toggling
            if (typeof window !== 'undefined') {
                setTimeout(() => window.location.reload(), 100)
            }
            return newState
        })
    }

    return (
        <DemoContext.Provider value={{ isDemoMode, toggleDemoMode }}>
            {children}
        </DemoContext.Provider>
    )
}

export function useDemoMode() {
    const context = useContext(DemoContext)
    if (context === undefined) {
        throw new Error('useDemoMode must be used within a DemoProvider')
    }
    return context
}
