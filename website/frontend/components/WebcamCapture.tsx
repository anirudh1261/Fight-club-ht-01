'use client'

import { useRef, useState, useCallback } from 'react'
import Webcam from 'react-webcam'
import { Camera, RefreshCw, Upload, X } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '@/lib/supabaseClient'

interface WebcamCaptureProps {
    onImageCaptured: (url: string) => void
}

export default function WebcamCapture({ onImageCaptured }: WebcamCaptureProps) {
    const webcamRef = useRef<any>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [capturedImage, setCapturedImage] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [mode, setMode] = useState<'camera' | 'upload' | 'preview'>('camera')

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot()
        if (imageSrc) {
            setCapturedImage(imageSrc)
            setMode('preview')

            // Immediately notifying parent with the base64 image for instant preview
            onImageCaptured(imageSrc)
        }
    }, [webcamRef, onImageCaptured])

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                const base64 = reader.result as string
                setCapturedImage(base64)
                setMode('preview')
                onImageCaptured(base64)
            }
            reader.readAsDataURL(file)
        }
    }

    const confirmUpload = async () => {
        if (!capturedImage) return

        setIsUploading(true)
        try {
            // Convert base64 to blob
            const res = await fetch(capturedImage)
            const blob = await res.blob()
            const file = new File([blob], "webcam-photo.jpg", { type: "image/jpeg" })

            const filename = `${uuidv4()}.jpg`
            const { data, error } = await supabase.storage
                .from('patient-avatars')
                .upload(filename, file)

            if (error) {
                console.warn('Upload failed (expected in mock mode):', error)
                // We already updated parent with base64, so we can just close
                return
            }

            if (data) {
                const { data: { publicUrl } } = supabase.storage
                    .from('patient-avatars')
                    .getPublicUrl(data.path)

                // Update with real URL if successful
                onImageCaptured(publicUrl)
            }
        } catch (error) {
            console.error('Error uploading image:', error)
        } finally {
            setIsUploading(false)
        }
    }

    const reset = () => {
        setCapturedImage(null)
        setMode('camera')
        onImageCaptured('')
    }

    // Cast Webcam to any to avoid type issues with different react-webcam versions
    const WebcamComponent = Webcam as any

    return (
        <div className="space-y-4">
            {mode === 'camera' && (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                    <WebcamComponent
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={{ facingMode: "user" }}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-3 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md transition-all"
                            title="Upload from Device"
                        >
                            <Upload className="h-6 w-6 text-white" />
                        </button>
                        <button
                            type="button"
                            onClick={capture}
                            className="p-4 rounded-full bg-red-500 hover:bg-red-600 shadow-lg transition-all transform hover:scale-105"
                            title="Take Photo"
                        >
                            <Camera className="h-8 w-8 text-white" />
                        </button>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*"
                        className="hidden"
                    />
                </div>
            )}

            {mode === 'preview' && capturedImage && (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                    <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
                    <div className="absolute top-2 right-2">
                        <button
                            type="button"
                            onClick={reset}
                            className="p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            )}

            <div className="text-center">
                <p className="text-xs text-muted-foreground font-mono">
                    {mode === 'camera' ? 'Position face in frame' : 'Photo captured. Submitting automatically...'}
                </p>
            </div>
        </div>
    )
}
