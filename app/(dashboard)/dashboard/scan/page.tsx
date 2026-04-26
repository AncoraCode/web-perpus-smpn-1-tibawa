'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'
import Modal from '@/app/components/Modal'

export default function ScanPage() {
    const videoRef = useRef<HTMLVideoElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [error, setError] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [hasPermission, setHasPermission] = useState<boolean | null>(null)
    
    // Barcode detection
    const [isScanning, setIsScanning] = useState(false)
    const [detectedCode, setDetectedCode] = useState<string>('')
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const [showErrorModal, setShowErrorModal] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)
    const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        startCamera()

        return () => {
            stopCamera()
            stopScanning()
        }
    }, [])

    const startCamera = async () => {
        try {
            setLoading(true)
            setError('')

            // Check if getUserMedia is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Browser tidak mendukung akses kamera. Gunakan browser modern seperti Chrome atau Safari.')
            }

            // Request camera dengan constraints yang lebih compatible
            const constraints = {
                video: {
                    facingMode: { ideal: 'environment' },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            }

            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)

            setStream(mediaStream)
            setHasPermission(true)

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream
                
                // Tunggu video ready
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play().then(() => {
                        console.log('Camera started successfully')
                        setTimeout(() => {
                            startScanning()
                        }, 500)
                    }).catch(err => {
                        console.error('Error playing video:', err)
                        setError('Gagal memutar video kamera.')
                        setLoading(false)
                    })
                }
            }

        } catch (err: any) {
            console.error('Error accessing camera:', err)
            setHasPermission(false)
            setLoading(false)

            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError('Akses kamera ditolak. Silakan izinkan akses kamera di pengaturan browser Anda.')
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                setError('Kamera tidak ditemukan pada perangkat ini.')
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                setError('Kamera sedang digunakan oleh aplikasi lain.')
            } else if (err.name === 'OverconstrainedError') {
                setError('Kamera tidak mendukung resolusi yang diminta.')
            } else if (err.name === 'SecurityError') {
                setError('Akses kamera diblokir karena alasan keamanan. Pastikan menggunakan HTTPS.')
            } else {
                setError(err.message || 'Gagal mengakses kamera. Pastikan browser Anda mendukung akses kamera.')
            }
        }
    }

    const startScanning = async () => {
        if (!videoRef.current || isScanning) return

        try {
            setIsScanning(true)
            setLoading(false)
            const codeReader = new BrowserMultiFormatReader()
            codeReaderRef.current = codeReader

            // Continuous scanning dengan interval
            const scanContinuously = async () => {
                if (!videoRef.current) return

                try {
                    const result = await codeReader.decodeOnceFromVideoDevice(undefined, videoRef.current)
                    
                    if (result) {
                        const scannedCode = result.getText()
                        console.log('Barcode detected:', scannedCode)
                        
                        // Stop scanning
                        stopScanning()
                        
                        // Set detected code dan tampilkan modal
                        setDetectedCode(scannedCode)
                        setShowSuccessModal(true)
                    }
                } catch (err) {
                    // Ignore NotFoundException - ini normal saat belum ada barcode
                    if (!(err instanceof NotFoundException)) {
                        console.error('Scan error:', err)
                    }
                    
                    // Continue scanning
                    if (isScanning && videoRef.current) {
                        scanIntervalRef.current = setTimeout(scanContinuously, 100)
                    }
                }
            }

            // Mulai continuous scan
            scanContinuously()

        } catch (err) {
            console.error('Error starting barcode scanner:', err)
            setErrorMessage('Gagal memulai scanner barcode. Silakan coba lagi.')
            setShowErrorModal(true)
            setIsScanning(false)
        }
    }

    const stopScanning = () => {
        setIsScanning(false)
        
        if (scanIntervalRef.current) {
            clearTimeout(scanIntervalRef.current)
            scanIntervalRef.current = null
        }
        
        if (codeReaderRef.current) {
            codeReaderRef.current.reset()
            codeReaderRef.current = null
        }
    }

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop())
            setStream(null)
        }
    }

    const handleRetry = () => {
        setError('')
        setLoading(true)
        startCamera()
    }

    const handleSuccessClose = () => {
        setShowSuccessModal(false)
        setDetectedCode('')
        // Lanjutkan scanning
        setTimeout(() => {
            startScanning()
        }, 300)
    }

    const handleProcessBarcode = async () => {
        console.log('Processing barcode:', detectedCode)
        window.location.href = `/dashboard/peminjaman?kode=${detectedCode}`
    }

    return (
        <div ref={containerRef} className="relative w-full h-full bg-black overflow-hidden">

            {/* Loading State */}
            {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-20">
                    <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
                    <p className="text-white text-sm">Meminta izin akses kamera...</p>
                </div>
            )}

            {/* Error State */}
            {error && !loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-20 px-6">
                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 max-w-sm w-full">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-white font-semibold text-center mb-2">
                            Gagal Mengakses Kamera
                        </h3>
                        <p className="text-white/70 text-sm text-center mb-6 leading-relaxed">
                            {error}
                        </p>
                        <button
                            onClick={handleRetry}
                            className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
                        >
                            Coba Lagi
                        </button>
                    </div>
                </div>
            )}

            {/* Camera Preview */}
            {!loading && !error && (
                <>
                    {/* Video Element - Full container */}
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="absolute inset-0 w-full h-full object-cover"
                    />

                    {/* Scan Frame Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        {/* Dark overlay with transparent center */}
                        <div className="absolute inset-0 bg-black/50" />

                        {/* Scan frame */}
                        <div className="relative w-72 h-48 z-20">
                            {/* Corner borders */}
                            <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white rounded-tl-2xl" />
                            <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white rounded-tr-2xl" />
                            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white rounded-bl-2xl" />
                            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white rounded-br-2xl" />

                            {/* Scanning line animation */}
                            {isScanning && (
                                <div className="absolute inset-x-0 top-0 h-1 bg-primary shadow-lg shadow-primary/50 animate-scan" />
                            )}
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="absolute bottom-24 left-0 right-0 px-6 z-20">
                        <div className="bg-black/70 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                            <p className="text-white text-center text-sm font-medium mb-1">
                                Arahkan kamera ke barcode buku
                            </p>
                            <p className="text-white/60 text-center text-xs">
                                Pastikan barcode terlihat jelas dan tidak buram
                            </p>
                        </div>
                    </div>

                    {/* Camera Status */}
                    <div className="absolute top-4 left-0 right-0 px-6 z-20 flex justify-center">
                        <div className={`backdrop-blur-sm rounded-xl px-4 py-2 border inline-flex items-center gap-2 ${
                            isScanning 
                                ? 'bg-green-500/20 border-green-500/30' 
                                : 'bg-yellow-500/20 border-yellow-500/30'
                        }`}>
                            <Camera className={`w-4 h-4 ${isScanning ? 'text-green-400' : 'text-yellow-400'}`} />
                            <span className={`text-xs font-medium ${isScanning ? 'text-green-400' : 'text-yellow-400'}`}>
                                {isScanning ? 'Scanner Aktif' : 'Menginisialisasi...'}
                            </span>
                        </div>
                    </div>
                </>
            )}

            {/* Success Modal - Barcode Detected */}
            <Modal
                isOpen={showSuccessModal}
                onClose={handleSuccessClose}
                title="Barcode Terdeteksi!"
                confirmation={{
                    negativeBtn: 'Scan Lagi',
                    positiveBtn: 'Proses Buku',
                    handlePositiveBtn: handleProcessBarcode
                }}
            >
                <div className="flex flex-col items-center py-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-gray-700 text-sm mb-2">Kode Buku:</p>
                    <div className="bg-gray-100 rounded-xl px-4 py-3 w-full">
                        <p className="text-center font-mono font-bold text-lg text-gray-900">
                            {detectedCode}
                        </p>
                    </div>
                    <p className="text-gray-500 text-xs mt-4 text-center">
                        Klik "Proses Buku" untuk melanjutkan peminjaman/pengembalian
                    </p>
                </div>
            </Modal>

            {/* Error Modal */}
            <Modal
                isOpen={showErrorModal}
                onClose={() => setShowErrorModal(false)}
                title="Error Scanner"
            >
                <div className="flex flex-col items-center py-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <p className="text-gray-700 text-sm text-center">
                        {errorMessage}
                    </p>
                </div>
            </Modal>

            {/* CSS for scanning animation */}
            <style jsx>{`
                @keyframes scan {
                    0%, 100% {
                        top: 0;
                    }
                    50% {
                        top: calc(100% - 4px);
                    }
                }
                .animate-scan {
                    animation: scan 2s ease-in-out infinite;
                }
            `}</style>
        </div>
    )
}