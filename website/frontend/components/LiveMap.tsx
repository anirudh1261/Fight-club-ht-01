'use client'

import { useEffect, useState, useCallback } from 'react'
import { MapPin, Users, Maximize2, Minimize2, RefreshCw, X } from 'lucide-react'
import dynamic from 'next/dynamic'

interface PatientLocation {
    id: string
    name: string
    lat: number
    lng: number
    status: 'normal' | 'warning' | 'critical'
    village: string
    hr?: number
    spo2?: number
    deviceStatus: 'online' | 'offline'
}

const patientLocations: PatientLocation[] = []

const statusColors: Record<string, string> = {
    normal: '#10b981',
    warning: '#f59e0b',
    critical: '#ef4444'
}

// Internal component for map controls (needs access to map instance)
function MapControls({
    center,
    onThemeChange,
    currentTheme
}: {
    center: [number, number];
    onThemeChange: (theme: string) => void;
    currentTheme: string;
}) {
    const [L, setL] = useState<any>(null)
    const { useMap } = require('react-leaflet') // Dynamic import inside component
    const map = useMap()

    useEffect(() => {
        import('leaflet').then(l => setL(l))
    }, [])

    const handleRecenter = () => {
        map.flyTo(center, 14, { duration: 1.5 })
    }

    // Prevent propagation to map (dragging/clicking through controls)
    const disablePropagation = (e: React.MouseEvent) => {
        e.stopPropagation();
    }

    return (
        <div
            className="leaflet-bottom leaflet-right"
            style={{ marginBottom: '20px', marginRight: '10px', pointerEvents: 'auto', zIndex: 1000 }}
        >
            <div className="leaflet-control flex flex-col gap-2" onMouseDown={disablePropagation} onDoubleClick={disablePropagation}>
                {/* View Type Selector */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden p-1 flex flex-col gap-1">
                    <button
                        onClick={() => onThemeChange('street')}
                        className={`p-2 rounded-md transition-colors ${currentTheme === 'street' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300' : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'}`}
                        title="Street View"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></svg>
                    </button>
                    <button
                        onClick={() => onThemeChange('terrain')}
                        className={`p-2 rounded-md transition-colors ${currentTheme === 'terrain' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300' : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'}`}
                        title="Terrain View"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.54 15H17a2 2 0 0 0-2 2v4.54" /><path d="M7 3.34V5a3 3 0 0 0 3 3h15" /><path d="M11 21.95V18a2 2 0 0 0-2-2a2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05" /><circle cx="12" cy="12" r="10" /></svg>
                    </button>
                    <button
                        onClick={() => onThemeChange('satellite')}
                        className={`p-2 rounded-md transition-colors ${currentTheme === 'satellite' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300' : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'}`}
                        title="Satellite View"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>
                    </button>
                </div>

                {/* Recenter Button */}
                <button
                    onClick={handleRecenter}
                    className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                    title="Re-center Map"
                >
                    <RefreshCw className="h-5 w-5" />
                </button>
            </div>
        </div>
    )
}

function MapComponent({ isFullscreen, onClose, patients }: { isFullscreen: boolean; onClose?: () => void; patients: PatientLocation[] }) {
    const [mapReady, setMapReady] = useState(false)
    const [L, setL] = useState<any>(null)
    const [MapContainer, setMapContainer] = useState<any>(null)
    const [TileLayer, setTileLayer] = useState<any>(null)
    const [Marker, setMarker] = useState<any>(null)
    const [Popup, setPopup] = useState<any>(null)
    const [mapTheme, setMapTheme] = useState('street')

    useEffect(() => {
        // Dynamically import react-leaflet on client side
        const loadLeaflet = async () => {
            const leaflet = await import('leaflet')
            const rl = await import('react-leaflet')

            // Fix default marker icons
            delete (leaflet.Icon.Default.prototype as any)._getIconUrl
            leaflet.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            })

            setL(leaflet)
            setMapContainer(() => rl.MapContainer)
            setTileLayer(() => rl.TileLayer)
            setMarker(() => rl.Marker)
            setPopup(() => rl.Popup)
            setMapReady(true)
        }

        loadLeaflet()
    }, [])

    const getTileUrl = (theme: string) => {
        switch (theme) {
            case 'dark': // Keeping 'dark' for backward compatibility if needed, though not in UI
                return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            case 'terrain':
                return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
            case 'satellite':
                return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            case 'street':
            default:
                // Using CartoDB Positron for a cleaner look than OSM default
                return 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
        }
    }

    const getAttribution = (theme: string) => {
        if (theme === 'satellite') return 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        if (theme === 'terrain') return 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
        return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }

    const createIcon = useCallback((status: string, deviceStatus: string, patientName?: string) => {
        if (!L) return null
        const color = deviceStatus === 'offline' ? '#6b7280' : statusColors[status] || '#10b981'
        const firstName = patientName ? patientName.split(' ')[0] : ''

        return L.divIcon({
            className: 'custom-patient-marker',
            html: `
                <div style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    transform: translateX(-50%);
                    position: relative;
                ">
                    ${deviceStatus === 'online' ? `
                        <div class="telemetry-pulse" style="
                            position: absolute;
                            top: 14px;
                            width: 28px;
                            height: 28px;
                            border: 2px solid ${color};
                            border-radius: 50%;
                            animation: radio-pulse 1.5s infinite;
                            z-index: -1;
                        "></div>
                    ` : ''}
                    <div style="
                        width: 28px; 
                        height: 28px; 
                        background: ${color}; 
                        border-radius: 50%; 
                        border: 3px solid white;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        position: relative;
                        z-index: 10;
                    ">
                        <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
                    </div>
                    ${patientName ? `
                        <div style="
                            margin-top: 4px;
                            padding: 2px 8px;
                            background: ${color};
                            color: white;
                            font-size: 10px;
                            font-weight: 600;
                            border-radius: 10px;
                            white-space: nowrap;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                            font-family: system-ui, -apple-system, sans-serif;
                            position: relative;
                            z-index: 10;
                        ">${firstName}</div>
                    ` : ''}
                </div>
                <style>
                    @keyframes radio-pulse {
                        0% { transform: scale(1); opacity: 0.8; }
                        100% { transform: scale(3); opacity: 0; }
                    }
                </style>
            `,
            iconSize: [80, 50],
            iconAnchor: [40, 14],
            popupAnchor: [0, -14]
        })
    }, [L])

    const createPHCIcon = useCallback(() => {
        if (!L) return null

        return L.divIcon({
            className: 'custom-phc-marker',
            html: `
                <div style="
                    width: 36px; 
                    height: 36px; 
                    background: linear-gradient(135deg, #14b8a6, #0d9488); 
                    border-radius: 8px; 
                    border: 3px solid white;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                ">🏥</div>
            `,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
            popupAnchor: [0, -18]
        })
    }, [L])

    if (!mapReady || !MapContainer || !TileLayer || !Marker || !Popup) {
        return (
            <div className="flex items-center justify-center h-full" style={{ minHeight: isFullscreen ? '80vh' : '350px' }}>
                <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-2" />
                    <p style={{ color: 'var(--text-muted)' }}>Loading map...</p>
                </div>
            </div>
        )
    }

    return (
        <MapContainer
            center={[17.9689, 79.5941]}
            zoom={14}
            style={{ height: isFullscreen ? 'calc(100vh - 160px)' : '350px', width: '100%' }}
            scrollWheelZoom={true}
        >
            <TileLayer
                attribution={getAttribution(mapTheme)}
                url={getTileUrl(mapTheme)}
            />

            <MapControls
                center={[17.9689, 79.5941]}
                onThemeChange={setMapTheme}
                currentTheme={mapTheme}
            />

            {/* PHC Marker */}
            <Marker position={[17.9689, 79.5941]} icon={createPHCIcon()}>
                <Popup>
                    <div className="font-sans">
                        <h3 className="font-bold text-sm">🏥 Warangal District Hospital</h3>
                        <p className="text-xs text-gray-600">Primary Health Center</p>
                    </div>
                </Popup>
            </Marker>

            {/* Patient Markers */}
            {patients.filter(p => p.lat !== undefined && p.lng !== undefined).map((patient) => (
                <Marker
                    key={patient.id}
                    position={[patient.lat, patient.lng]}
                    icon={createIcon(patient.status, patient.deviceStatus, patient.name)}
                >
                    <Popup>
                        <div className="font-sans min-w-[180px]">
                            <div className="flex items-center gap-2 mb-2">
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                                    style={{ background: 'linear-gradient(135deg, #14b8a6, #0d9488)' }}
                                >
                                    {patient.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">{patient.name}</h3>
                                    <p className="text-xs text-gray-500">{patient.id} • {patient.village}</p>
                                </div>
                            </div>
                            {patient.deviceStatus === 'online' ? (
                                <div className="flex gap-3 p-2 bg-gray-100 rounded-lg">
                                    <div className="text-center">
                                        <p className={`text-base font-bold ${patient.hr && patient.hr > 100 ? 'text-red-500' : ''}`}>
                                            ❤️ {patient.hr}
                                        </p>
                                        <p className="text-xs text-gray-500">HR</p>
                                    </div>
                                    <div className="text-center">
                                        <p className={`text-base font-bold ${patient.spo2 && patient.spo2 < 90 ? 'text-red-500' : ''}`}>
                                            💨 {patient.spo2}%
                                        </p>
                                        <p className="text-xs text-gray-500">SpO2</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-2 bg-red-50 rounded-lg text-center">
                                    <p className="text-xs text-red-700">⚠️ Device Offline</p>
                                </div>
                            )}
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    )
}

import { generateDemoPatients } from '@/lib/demo-data'
import { useDemoMode } from '@/lib/demo-context'

// Main component with fullscreen handling
function LiveMapInner() {
    const { isDemoMode } = useDemoMode()
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [patients, setPatients] = useState<PatientLocation[]>([])

    // Initial load for demo patients
    useEffect(() => {
        if (isDemoMode) {
            const demoPatients = generateDemoPatients().map(p => ({
                id: p.id,
                name: p.name,
                lat: p.lat,
                lng: p.lng,
                status: (p.hr > 100 || p.spo2 < 90) ? 'critical' : 'normal',
                village: p.village,
                hr: p.hr,
                spo2: p.spo2,
                deviceStatus: p.deviceStatus
            }))
            setPatients(demoPatients as PatientLocation[])
        }
    }, [isDemoMode])

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen)
    }

    // Handle real-time updates
    useEffect(() => {
        const handleVitalsUpdate = (e: CustomEvent) => {
            const { deviceId, patientName, hr, spo2, lat, lng } = e.detail
            setPatients(prev => {
                const existing = prev.find(p => p.id === deviceId)
                if (existing) {
                    return prev.map(p => p.id === deviceId ? {
                        ...p,
                        hr,
                        spo2,
                        lat: lat || p.lat,
                        lng: lng || p.lng,
                        status: (hr > 100 || spo2 < 90) ? 'critical' : 'normal',
                        deviceStatus: 'online'
                    } : p)
                } else {
                    // Add new patient if not found (e.g. Test Patient)
                    return [...prev, {
                        id: deviceId,
                        name: patientName || 'Unknown Patient',
                        lat: lat || 17.9689, // Default near Warangal if no GPS yet
                        lng: lng || 79.5941,
                        status: (hr > 100 || spo2 < 90) ? 'critical' : 'normal',
                        village: 'LORA MESH',
                        hr,
                        spo2,
                        deviceStatus: 'online'
                    }]
                }
            })
        }

        const handleEmergencyState = (e: CustomEvent) => {
            const { deviceId, patientName, lat, lng, active } = e.detail
            if (!active) return

            setPatients(prev => {
                const existing = prev.find(p => p.id === deviceId)
                if (existing) {
                    return prev.map(p => p.id === deviceId ? {
                        ...p,
                        lat: lat || p.lat,
                        lng: lng || p.lng,
                        status: 'critical',
                        deviceStatus: 'online'
                    } : p)
                } else {
                    return [...prev, {
                        id: deviceId,
                        name: patientName || 'Unknown Patient',
                        lat: lat || 17.9689,
                        lng: lng || 79.5941,
                        status: 'critical',
                        village: 'LORA MESH',
                        deviceStatus: 'online'
                    }]
                }
            })
        }

        window.addEventListener('vitals-update', handleVitalsUpdate as EventListener)
        window.addEventListener('emergency-state', handleEmergencyState as EventListener)

        return () => {
            window.removeEventListener('vitals-update', handleVitalsUpdate as EventListener)
            window.removeEventListener('emergency-state', handleEmergencyState as EventListener)
        }
    }, [])

    // ESC key listener to exit fullscreen
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false)
            }
        }

        if (isFullscreen) {
            document.addEventListener('keydown', handleKeyDown)
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [isFullscreen])

    // Fullscreen overlay
    if (isFullscreen) {
        return (
            <div className="fixed inset-0 z-[9999] bg-black">
                {/* Fullscreen Header */}
                <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
                                <MapPin className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="font-bold text-white">Live Patient Map</h2>
                                <p className="text-xs text-white/70">Real-time GPS locations • Press ESC to exit</p>
                            </div>
                        </div>
                        <button
                            onClick={toggleFullscreen}
                            className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                        >
                            <X className="h-5 w-5 text-white" />
                        </button>
                    </div>
                </div>

                {/* Fullscreen Map */}
                <div className="h-full pt-20 pb-16">
                    <MapComponent isFullscreen={true} onClose={toggleFullscreen} patients={patients} />
                </div>

                {/* Fullscreen Legend */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="flex items-center justify-center gap-6 text-sm text-white">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                            <span>Normal</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-amber-500" />
                            <span>Warning</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                            <span>Critical</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gray-400" />
                            <span>Offline</span>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Normal embedded view
    return (
        <div className="card overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
                        <MapPin className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Live Patient Map</h2>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Real-time GPS locations</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleFullscreen}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
                        title="Fullscreen"
                    >
                        <Maximize2 className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Fullscreen</span>
                    </button>
                </div>
            </div>

            {/* Map Container */}
            <MapComponent isFullscreen={false} patients={patients} />

            {/* Legend */}
            <div className="p-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span style={{ color: 'var(--text-muted)' }}>Normal</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <span style={{ color: 'var(--text-muted)' }}>Warning</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                        <span style={{ color: 'var(--text-muted)' }}>Critical</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-gray-400" />
                        <span style={{ color: 'var(--text-muted)' }}>Offline</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <Users className="h-3 w-3" />
                    <span>{patients.length} patients</span>
                </div>
            </div>
        </div>
    )
}

// Export with dynamic import (no SSR)
const LiveMap = dynamic(() => Promise.resolve(LiveMapInner), {
    ssr: false,
    loading: () => (
        <div className="card h-[420px] flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-2" />
                <p style={{ color: 'var(--text-muted)' }}>Loading map...</p>
            </div>
        </div>
    )
})

export default LiveMap
