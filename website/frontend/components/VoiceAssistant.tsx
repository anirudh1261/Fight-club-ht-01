'use client'

import { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Settings, Volume2, Search, AlertCircle, Phone } from 'lucide-react'

// TypeScript definitions for SpeechRecognition
interface SpeechRecognitionEvent {
    resultIndex: number;
    results: {
        [index: number]: {
            [index: number]: {
                transcript: string;
            };
            isFinal: boolean;
        };
        length: number;
    };
}

interface SpeechRecognitionError {
    error: string;
    message: string;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    abort: () => void;
    onstart: (() => void) | null;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionError) => void) | null;
    onend: (() => void) | null;
}

declare global {
    interface Window {
        SpeechRecognition: { new(): SpeechRecognition };
        webkitSpeechRecognition: { new(): SpeechRecognition };
    }
}

export default function VoiceAssistant() {
    const [isListening, setIsListening] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [commandResult, setCommandResult] = useState<{ type: string, text: string } | null>(null)
    const [showBubble, setShowBubble] = useState(false)
    const recognitionRef = useRef<SpeechRecognition | null>(null)
    
    // Hide bubble timeout
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        // Initialize SpeechRecognition on mount
        if (typeof window !== 'undefined') {
            const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition
            if (SpeechRecognitionConstructor) {
                const recognition = new SpeechRecognitionConstructor()
                recognition.continuous = true
                recognition.interimResults = true
                recognition.lang = 'en-US' // For India: 'en-IN' or 'hi-IN' can be swapped

                recognition.onresult = (event: SpeechRecognitionEvent) => {
                    let currentTranscript = ''
                    let finalTranscript = ''

                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript
                        } else {
                            currentTranscript += event.results[i][0].transcript
                        }
                    }

                    if (finalTranscript) {
                        setTranscript(finalTranscript)
                        processCommand(finalTranscript.toLowerCase())
                    } else if (currentTranscript) {
                        setTranscript(currentTranscript)
                    }
                }

                recognition.onerror = (event: SpeechRecognitionError) => {
                    console.error('Speech recognition error', event.error)
                    setIsListening(false)
                }

                recognition.onend = () => {
                    setIsListening(false)
                }

                recognitionRef.current = recognition
            }
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort()
            }
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
        }
    }, [])

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert('Your browser does not support Speech Recognition. Try Chrome.')
            return
        }

        if (isListening) {
            recognitionRef.current.stop()
            setIsListening(false)
        } else {
            setTranscript('')
            setCommandResult(null)
            setShowBubble(true)
            recognitionRef.current.start()
            setIsListening(true)
        }
    }

    const processCommand = (text: string) => {
        let matched = false
        
        if (text.includes('emergency') || text.includes('help') || text.includes('sos') || text.includes('critical')) {
            matched = true
            setCommandResult({ type: 'error', text: 'Initiating System-Wide SOS Protocol!' })
            
            // Trigger the global emergency event for demo purposes
            window.dispatchEvent(new CustomEvent('emergency-state', {
                detail: {
                    type: 'sos',
                    active: true,
                    deviceId: 'VOICE-CMD-01',
                    patientName: 'Unknown (Voice Trigger)',
                    hr: 145,
                    spo2: 82,
                    lat: 18.0019,
                    lng: 79.5664,
                    history: []
                }
            }))
        }
        else if (text.includes('demo') || text.includes('start simulation')) {
            matched = true
            setCommandResult({ type: 'success', text: 'Turning on live Wearable Demo Mode...' })
            window.dispatchEvent(new CustomEvent('trigger-jury-demo'))
        }
        else if (text.includes('find') || text.includes('search')) {
            matched = true
            setCommandResult({ type: 'info', text: 'Activating search filters via voice.' })
        }
        
        if (matched) {
            // Stop listening immediately after a command is caught
            if (recognitionRef.current) recognitionRef.current.stop()
            
            // Hide the bubble after 4 seconds
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            timeoutRef.current = setTimeout(() => {
                setShowBubble(false)
                setTranscript('')
                setCommandResult(null)
            }, 5000)
        }
    }

    // Hide manual close
    const closeBubble = () => {
        setIsListening(false)
        setShowBubble(false)
        if (recognitionRef.current) recognitionRef.current.stop()
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 pointer-events-none">
            
            {/* Visual Chat Bubble */}
            <div className={`transition-all duration-300 transform origin-bottom-right pointer-events-auto shadow-2xl ${
                showBubble ? 'scale-100 opacity-100 translate-y-0' : 'scale-75 opacity-0 translate-y-8 pointer-events-none'
            }`}>
                <div className="w-72 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl p-4 shadow-xl">
                    <div className="flex items-center gap-3 mb-3 pb-3 border-b border-black/5 dark:border-white/5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isListening ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-500'}`}>
                            <Volume2 className="h-4 w-4 text-white" />
                        </div>
                        <h3 className="font-bold text-sm text-slate-800 dark:text-white flex-1">
                            AyuLink Assistant
                        </h3>
                        <button onClick={closeBubble} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            &times;
                        </button>
                    </div>

                    <div className="min-h-[60px] flex items-center justify-center text-center">
                        {commandResult ? (
                            <div className="flex flex-col items-center gap-2 animate-fadeIn w-full">
                                {commandResult.type === 'error' && <AlertCircle className="h-8 w-8 text-rose-500 animate-bounce" />}
                                {commandResult.type === 'success' && <Settings className="h-8 w-8 text-emerald-500 animate-spin-slow" />}
                                {commandResult.type === 'info' && <Search className="h-8 w-8 text-blue-500" />}
                                <p className="font-bold text-sm text-slate-700 dark:text-slate-200">{commandResult.text}</p>
                            </div>
                        ) : (
                            <p className="text-sm font-medium italic text-slate-600 dark:text-slate-400 w-full text-center">
                                {transcript || (isListening ? 'Listening... say "Emergency" or "Demo"' : 'Microphone off')}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Glowing Action Button */}
            <button
                onClick={toggleListening}
                className="relative group pointer-events-auto"
            >
                {isListening && (
                    <>
                        <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-75"></div>
                        <div className="absolute -inset-4 bg-emerald-400/20 rounded-full animate-pulse blur-xl"></div>
                    </>
                )}
                <div className={`relative flex items-center justify-center w-14 h-14 rounded-full shadow-lg border-2 transition-all duration-300 ${
                    isListening 
                        ? 'bg-gradient-to-br from-emerald-400 to-teal-500 border-emerald-300 scale-110 shadow-emerald-500/50' 
                        : 'bg-gradient-to-br from-indigo-500 to-violet-600 border-indigo-400 hover:scale-105 shadow-indigo-500/40'
                }`}>
                    {isListening ? (
                        <Mic className="h-6 w-6 text-white drop-shadow-md" />
                    ) : (
                        <MicOff className="h-6 w-6 text-indigo-100 group-hover:text-white transition-colors" />
                    )}
                </div>
            </button>
        </div>
    )
}
