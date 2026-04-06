'use client'

import { useTheme } from '@/lib/theme-context'
import { Sun, Moon, Globe } from 'lucide-react'

const languageNames = {
    en: 'English',
    hi: 'हिंदी',
    te: 'తెలుగు',
}

export default function ThemeLanguageToggle() {
    const { theme, language, setTheme, setLanguage } = useTheme()

    return (
        <div className="flex items-center gap-2">
            {/* Language Selector */}
            <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'en' | 'hi' | 'te')}
                className="bg-transparent border border-teal-400 text-white text-sm rounded-lg px-2 py-1 focus:ring-2 focus:ring-teal-300"
            >
                {Object.entries(languageNames).map(([code, name]) => (
                    <option key={code} value={code} className="text-gray-900">
                        {name}
                    </option>
                ))}
            </select>

            {/* Theme Toggle */}
            <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="p-2 rounded-lg hover:bg-teal-600 transition-colors"
                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
                {theme === 'light' ? (
                    <Moon className="h-5 w-5 text-white" />
                ) : (
                    <Sun className="h-5 w-5 text-yellow-300" />
                )}
            </button>
        </div>
    )
}
