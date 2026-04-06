"use client"

import { useState, useEffect, useRef } from 'react'
import { Search, MapPin, Loader2 } from 'lucide-react'

interface VillageSearchInputProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
}

export default function VillageSearchInput({ value, onChange, placeholder = "Search for a village..." }: VillageSearchInputProps) {
    const [suggestions, setSuggestions] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)
    const wrapperRef = useRef<HTMLDivElement>(null)

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (value.trim().length >= 3 && showSuggestions) {
                setLoading(true)
                setHasSearched(false)
                try {
                    // Append Telangana to the query for better results without strict filtering failures
                    const query = `${value}, Telangana`
                    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5&countrycodes=in`)
                    const data = await res.json()
                    setSuggestions(data)
                } catch (err) {
                    console.error("Failed to fetch villages", err)
                    setSuggestions([])
                } finally {
                    setLoading(false)
                    setHasSearched(true)
                }
            } else {
                setSuggestions([])
                setHasSearched(false)
            }
        }, 500)

        return () => clearTimeout(timer)
    }, [value, showSuggestions])

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [wrapperRef])

    const handleSelect = (place: any) => {
        // Construct a nice display name
        // Use village/suburb/city name
        const name = place.address.village || place.address.suburb || place.address.city || place.address.town || place.display_name.split(',')[0]

        onChange(name) // Just the village name for the form
        setShowSuggestions(false)
    }

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="relative">
                <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value)
                        setShowSuggestions(true)
                    }}
                    onFocus={() => {
                        if (value.length >= 3) setShowSuggestions(true)
                    }}
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                {loading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-500 animate-spin" />
                )}
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && (
                <div className="absolute z-[100] w-full mt-1 rounded-xl shadow-lg border overflow-hidden animate-foldDown"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                    {suggestions.length > 0 ? (
                        <>
                            {suggestions.map((suggestion, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleSelect(suggestion)}
                                    className="w-full text-left px-4 py-3 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors flex items-start gap-3 border-b last:border-0"
                                    style={{ borderColor: 'var(--border-color)' }}
                                >
                                    <MapPin className="h-4 w-4 text-teal-500 mt-1 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                                            {suggestion.address.village || suggestion.address.suburb || suggestion.address.town || suggestion.address.city || suggestion.name}
                                        </p>
                                        <p className="text-xs truncate max-w-[250px]" style={{ color: 'var(--text-muted)' }}>
                                            {suggestion.display_name}
                                        </p>
                                    </div>
                                </button>
                            ))}
                            <div className="bg-gray-50 dark:bg-slate-800/50 px-4 py-2 text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>
                                Powered by OpenStreetMap
                            </div>
                        </>
                    ) : (hasSearched && !loading && value.trim().length >= 3) ? (
                        <div className="p-4 text-center">
                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>No specific village found</p>
                            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                Check spelling or try a nearby town.<br />
                                <span className="italic">"{value}"</span> will be saved as typed.
                            </p>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    )
}
