'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { X, AlertTriangle, Navigation, Phone, Locate, Maximize, Minimize, Ambulance, Layers, Mountain, Map as MapIcon, ShieldCheck } from 'lucide-react'
import dynamic from 'next/dynamic'
import EmergencyTimeline from './EmergencyTimeline'
import ParamedicQRModal from './ParamedicQRModal'
import { supabase } from '@/lib/supabaseClient'

// Leaflet map only runs client-side
// Helper to resize map when container size changes
// Helper to resize map when container size changes
function MapInvalidator({ useMap, isFullScreen }: { useMap: any, isFullScreen: boolean }) {
    const map = useMap()

    useEffect(() => {
        if (map) {
            setTimeout(() => {
                map.invalidateSize()
            }, 100)
            setTimeout(() => {
                map.invalidateSize()
            }, 300) // Double check for animation end
        }
    }, [isFullScreen, map])

    return null
}

function MapInner({ lat, lng, patientName, historyPath, mapType, isFullScreen }: { lat: number; lng: number; patientName: string, historyPath?: { lat: number, lng: number }[], mapType: string, isFullScreen: boolean }) {
    const [mapReady, setMapReady] = useState(false)
    const [L, setL] = useState<any>(null)
    const [MapContainer, setMapContainer] = useState<any>(null)
    const [TileLayer, setTileLayer] = useState<any>(null)
    const [Marker, setMarker] = useState<any>(null)
    const [Popup, setPopup] = useState<any>(null)
    const [Polyline, setPolyline] = useState<any>(null)
    const mapRef = useRef<any>(null)
    const [useLeaflet, setUseLeaflet] = useState<any>(null)

    // New: Hook to update map view when props change
    function MapUpdater({ center }: { center: [number, number] }) {
        const map = useLeaflet?.useMap()
        useEffect(() => {
            if (map) {
                map.flyTo(center, map.getZoom())
            }
        }, [map, center])
        return null
    }

    useEffect(() => {
        const loadLeaflet = async () => {
            const leaflet = await import('leaflet')
            const rl = await import('react-leaflet')

            // Fix marker icons
            delete (leaflet.Icon.Default.prototype as any)._getIconUrl
            leaflet.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            })

            setL(leaflet)
            setMarker(() => rl.Marker)
            setPopup(() => rl.Popup)
            setPolyline(() => rl.Polyline)
            setMapContainer(() => rl.MapContainer)
            setTileLayer(() => rl.TileLayer)
            setUseLeaflet(() => ({ useMap: rl.useMap }))
            setMapReady(true)
        }
        loadLeaflet()
    }, [])

    const createIcon = useCallback(() => {
        if (!L) return null
        return L.divIcon({
            className: 'emergency-pulse-marker',
            html: `
                <div style="position: relative; display: flex; justify-content: center; align-items: center;">
                    <div style="
                        width: 40px; 
                        height: 40px; 
                        background: rgba(239, 68, 68, 0.4); 
                        border-radius: 50%; 
                        animation: pulse 1.5s infinite;
                        position: absolute;
                    "></div>
                    <div style="
                        width: 20px; 
                        height: 20px; 
                        background: #ef4444; 
                        border: 3px solid white; 
                        border-radius: 50%; 
                        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                        z-index: 10;
                    "></div>
                </div>
                <style>
                    @keyframes pulse {
                        0% { transform: scale(1); opacity: 0.8; }
                        100% { transform: scale(3); opacity: 0; }
                    }
                </style>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
        })
    }, [L])




    if (!mapReady || !MapContainer || !useLeaflet) {
        return <div className="h-64 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">Loading Map...</div>
    }

    return (
        <MapContainer
            center={[lat, lng]}

            zoom={16}
            style={{ height: '100%', width: '100%', borderRadius: 'inherit' }}
        >
            <MapInvalidator useMap={useLeaflet.useMap} isFullScreen={isFullScreen} />
            <MapUpdater center={[lat, lng]} />
            <TileLayer
                attribution='&copy; OpenStreetMap & contributors'
                url={
                    mapType === 'satellite'
                        ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        : mapType === 'terrain'
                            ? "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                            : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                }
            />
            <Marker position={[lat, lng]} icon={createIcon()}>
                <Popup>
                    <div className="text-center font-bold">
                        {patientName} <br /> SOS LOCATION
                    </div>
                </Popup>
            </Marker>
            {historyPath && Polyline && (
                <Polyline
                    positions={historyPath.map(h => [h.lat, h.lng])}
                    pathOptions={{ color: 'blue', weight: 4, opacity: 0.6, dashArray: '10, 10' }}
                />
            )}
        </MapContainer>
    )
}

const DynamicMap = dynamic(() => Promise.resolve(MapInner), { ssr: false })

interface EmergencyMapModalProps {
    isOpen: boolean
    onClose: () => void
    data: {
        patientName: string
        lat: number
        lng: number
        timestamp: string
        history?: any[]
        hr?: number
        spo2?: number
    } | null
}

export default function EmergencyMapModal({ isOpen, onClose, data }: EmergencyMapModalProps) {
    const [currentLat, setCurrentLat] = useState(data?.lat || 0)
    const [currentLng, setCurrentLng] = useState(data?.lng || 0)
    const [viewHistory, setViewHistory] = useState(false)
    const [isFullScreen, setIsFullScreen] = useState(false)
    const [showQR, setShowQR] = useState(false)
    const [mapType, setMapType] = useState('street')
    const [viewMode, setViewMode] = useState<'map' | 'info'>('map') // Mobile toggle

    useEffect(() => {
        if (data) {
            setCurrentLat(data.lat)
            setCurrentLng(data.lng)
        }

        // Listen for live demo location updates
        const handler = (e: any) => {
            if (data && data.patientName === e.detail.patientName) {
                setCurrentLat(e.detail.lat)
                setCurrentLng(e.detail.lng)
            }
        }
        window.addEventListener('location-update', handler)
        return () => window.removeEventListener('location-update', handler)
    }, [data])

    if (!isOpen || !data) return null

    const handleTimeUpdate = (snapshot: any) => {
        setCurrentLat(snapshot.lat)
        setCurrentLng(snapshot.lng)
    }

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className={`bg-white dark:bg-slate-900 shadow-2xl overflow-hidden border-0 md:border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 relative transition-all flex flex-col ${isFullScreen ? 'fixed inset-0 w-screen h-screen rounded-none z-[10001]' : 'max-w-4xl w-full h-full md:h-[80vh] md:rounded-3xl'}`}>

                {/* Header */}
                <div className="bg-slate-900 text-white px-4 md:px-6 py-3 md:py-4 flex items-center justify-between shadow-lg z-20 shrink-0">
                    <div className="flex items-center gap-2 md:gap-4">
                        <div className="bg-red-500 p-1.5 md:p-2 rounded-xl animate-pulse shadow-red-500/50 shadow-lg">
                            <AlertTriangle className="h-5 w-5 md:h-6 md:h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-base md:text-xl font-bold tracking-tight">EMERGENCY RESPONSE</h2>
                            <p className="hidden xs:block text-[10px] text-slate-400 font-mono tracking-wider uppercase">Live Satellite Link Established</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 md:gap-3">
                        {/* Mobile Toggle */}
                        <div className="md:hidden flex bg-white/10 rounded-lg p-1 mr-2">
                            <button
                                onClick={() => setViewMode('map')}
                                className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${viewMode === 'map' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}
                            >
                                MAP
                            </button>
                            <button
                                onClick={() => setViewMode('info')}
                                className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${viewMode === 'info' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}
                            >
                                INFO
                            </button>
                        </div>
                        <button
                            onClick={() => setIsFullScreen(!isFullScreen)}
                            className="p-2 hover:bg-white/10 rounded-full transition-all active:scale-95"
                            title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
                        >
                            {isFullScreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-full transition-all active:scale-95"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>


                {/* Content Container */}
                <div className="flex-1 relative flex flex-col md:flex-row overflow-hidden">

                    {/* Sidebar Info */}
                    <div className={`p-6 bg-slate-50 dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-700 flex flex-col gap-6 overflow-y-auto w-full md:w-80 shrink-0 ${viewMode === 'info' ? 'flex' : 'hidden md:flex'}`}>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Patient Identity</p>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{data.patientName}</h3>
                            <p className="text-sm text-slate-500 mt-1">ID: #SOS-{Math.floor(Math.random() * 1000)}</p>
                        </div>

                        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Location Coordinates</p>
                            <div className="flex items-center gap-2 font-mono text-lg font-bold text-blue-600">
                                <Locate className="h-5 w-5" />
                                {currentLat.toFixed(6)}, {currentLng.toFixed(6)}
                            </div>
                        </div>

                        <div className="mt-auto space-y-3">
                            <a
                                href={`https://maps.google.com/?q=${data.lat},${data.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-blue-600 hover:bg-blue-700 text-white w-full py-4 rounded-xl font-bold text-center flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/30"
                            >
                                <Navigation className="h-5 w-5" />
                                Open Google Maps
                            </a>
                            <button
                                onClick={() => alert(`Calling ${data.patientName}...`)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white w-full py-4 rounded-xl font-bold text-center flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/30"
                            >
                                <Phone className="h-5 w-5" />
                                Call Patient
                            </button>
                            <button
                                onClick={() => setShowQR(true)}
                                className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 w-full py-4 rounded-xl font-bold text-center flex items-center justify-center gap-2 transition-all border border-blue-200 dark:border-blue-900/30"
                            >
                                <ShieldCheck className="h-5 w-5" />
                                View Patient QR
                            </button>
                            <button
                                onClick={async () => {
                                    // 1. Supabase Broadcast (Global)
                                    await supabase.channel('ayulink_emergency').send({
                                        type: 'broadcast',
                                        event: 'dispatch',
                                        payload: { ...data, timestamp: new Date().toISOString() }
                                    })

                                    // 2. Local Fallback (Tab to Tab)
                                    const bc = new BroadcastChannel('ayulink-dispatch')
                                    bc.postMessage({ ...data, timestamp: new Date().toISOString() })

                                    alert(`🚑 MOUNTING DISPATCH OPERATION...\n\nTarget: ${data.patientName}\nCoordinates: ${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}\n\nSignal sent to all active units.`)
                                }}
                                className="group relative overflow-hidden bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white w-full py-5 rounded-xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-[0_0_20px_rgba(220,38,38,0.6)] border border-red-500/50 hover:shadow-[0_0_30px_rgba(220,38,38,0.8)]"
                            >
                                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shine" />
                                <Ambulance className="h-6 w-6 animate-bounce" />
                                <span>Dispatch Ambulance</span>
                            </button>
                        </div>
                    </div>

                    {/* Map Area */}
                    <div className={`flex-1 relative bg-slate-100 dark:bg-slate-900 ${viewMode === 'map' ? 'flex' : 'hidden md:flex'}`}>
                        <DynamicMap
                            lat={currentLat}
                            lng={currentLng}
                            patientName={data.patientName}
                            historyPath={viewHistory && data.history ? data.history.map(h => ({ lat: h.lat, lng: h.lng })) : undefined}
                            mapType={mapType}
                            isFullScreen={isFullScreen}
                        />

                        {/* Map Controls */}
                        <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2">
                            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1 rounded-xl shadow-xl border border-white/20 flex flex-col gap-1">
                                <button
                                    onClick={() => setMapType('street')}
                                    className={`p-2 rounded-lg transition-all ${mapType === 'street' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-slate-800 text-slate-500'}`}
                                    title="Street View"
                                >
                                    <MapIcon className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={() => setMapType('satellite')}
                                    className={`p-2 rounded-lg transition-all ${mapType === 'satellite' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-slate-800 text-slate-500'}`}
                                    title="Satellite View"
                                >
                                    <Layers className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={() => setMapType('terrain')}
                                    className={`p-2 rounded-lg transition-all ${mapType === 'terrain' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-slate-800 text-slate-500'}`}
                                    title="Terrain View"
                                >
                                    <Mountain className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Map Overlays */}
                        <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
                            {data.history && (
                                <button
                                    onClick={() => setViewHistory(!viewHistory)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold shadow-xl transition-all border border-white/10 backdrop-blur-md ${viewHistory ? 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-transparent' : 'bg-white/90 text-slate-800 hover:bg-white'}`}
                                >
                                    {viewHistory ? 'Exit Time Machine' : 'Replay Event'}
                                </button>
                            )}
                        </div>

                        <EmergencyTimeline
                            history={data.history || []}
                            isActive={viewHistory}
                            onTimeUpdate={handleTimeUpdate}
                        />
                    </div>
                </div>
            </div>

            {/* Integrated QR Modal */}
            <ParamedicQRModal
                isOpen={showQR}
                onClose={() => setShowQR(false)}
                data={data ? {
                    patientName: data.patientName,
                    hr: data.hr || 0,
                    spo2: data.spo2 || 0,
                    lat: data.lat,
                    lng: data.lng
                } : undefined}
            />
        </div>
    )
}
