'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, AlertCircle, Loader2 } from 'lucide-react'
import { BrowserMultiFormatReader, NotFoundException, BarcodeFormat, DecodeHintType } from '@zxing/library'
import { createClient } from '@/utils/supabase/client'
import Modal from '@/app/components/Modal'
import { useRouter } from 'next/navigation'

export default function ScanPage() {
    const router = useRouter()
    const videoRef = useRef<HTMLVideoElement>(null)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const [error, setError] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [hasPermission, setHasPermission] = useState<boolean | null>(null)

    // Barcode/QR detection
    const [isScanning, setIsScanning] = useState(false)
    const isScanningRef = useRef(false)
    const [showErrorModal, setShowErrorModal] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [isVerifying, setIsVerifying] = useState(false)

    const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)
    const supabase = createClient()

    const setIsScanningState = (value: boolean) => {
        setIsScanning(value)
        isScanningRef.current = value
    }

    const setStreamState = (newStream: MediaStream | null) => {
        setStream(newStream)
        streamRef.current = newStream
    }

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

            // Check if secure context/mediaDevices API is available
            if (typeof window !== 'undefined' && (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)) {
                throw new Error('SecureContextRequired')
            }

            // Wait a brief moment to make sure videoRef is rendered
            if (!videoRef.current) {
                await new Promise(resolve => setTimeout(resolve, 100))
            }

            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            })

            setStreamState(mediaStream)
            setHasPermission(true)

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream

                // iOS Safari/Chrome requirements
                videoRef.current.setAttribute('playsinline', 'true')
                videoRef.current.setAttribute('muted', 'true')
                videoRef.current.muted = true
                videoRef.current.playsInline = true

                videoRef.current.onloadedmetadata = async () => {
                    try {
                        await videoRef.current?.play()
                    } catch (playError) {
                        console.warn('Play error on loadedmetadata, retrying:', playError)
                        setTimeout(async () => {
                            try { await videoRef.current?.play() } catch {}
                        }, 500)
                    }
                    startScanning()
                }

                // In case it was already loaded
                if (videoRef.current.readyState >= 2) {
                    try {
                        await videoRef.current.play()
                    } catch {}
                    startScanning()
                }
            }
        } catch (err: any) {
            console.error('Error accessing camera:', err)
            setHasPermission(false)

            if (err.message === 'SecureContextRequired') {
                setError('Kamera hanya dapat diakses melalui koneksi aman (HTTPS) atau localhost. Jika Anda menguji di perangkat mobile secara lokal, silakan gunakan tunnel HTTPS (seperti ngrok) atau aktifkan flag secure origin pada browser Chrome.')
            } else if (err.name === 'NotAllowedError') {
                setError('Akses kamera ditolak. Silakan izinkan akses kamera di pengaturan browser Anda.')
            } else if (err.name === 'NotFoundError') {
                setError('Kamera tidak ditemukan pada perangkat ini.')
            } else if (err.name === 'NotReadableError') {
                setError('Kamera sedang digunakan oleh aplikasi lain.')
            } else {
                setError('Gagal mengakses kamera. Pastikan browser Anda mendukung akses kamera.')
            }
        } finally {
            setLoading(false)
        }
    }

    const startScanning = () => {
        if (!videoRef.current || isScanningRef.current) return

        setIsScanningState(true)

        if (!codeReaderRef.current) {
            // Konfigurasi hints untuk mempercepat & meningkatkan sensitivitas scan barcode
            const hints = new Map()
            hints.set(DecodeHintType.POSSIBLE_FORMATS, [
                BarcodeFormat.CODE_128,
                BarcodeFormat.CODE_39,
                BarcodeFormat.EAN_13,
                BarcodeFormat.EAN_8,
                BarcodeFormat.UPC_A,
                BarcodeFormat.QR_CODE
            ])
            hints.set(DecodeHintType.TRY_HARDER, true) // Menginstruksikan decoder mencari barcode secara lebih mendalam

            // Parameter kedua: jeda antar percobaan scan (200ms agar pemindaian lebih responsif)
            codeReaderRef.current = new BrowserMultiFormatReader(hints, 200)
        }

        codeReaderRef.current.decodeFromVideoElementContinuously(
            videoRef.current,
            async (result, err) => {
                // Abaikan jika pemindaian sedang di-pause
                if (!isScanningRef.current) return

                if (result) {
                    const scannedText = result.getText().trim()
                    setIsScanningState(false) // Pause scanner
                    await handleScanResult(scannedText)
                }

                if (err && !(err instanceof NotFoundException)) {
                    console.error('Scan error:', err)
                }
            }
        )
    }

    const stopScanning = () => {
        setIsScanningState(false)
        if (codeReaderRef.current) {
            codeReaderRef.current.reset()
            codeReaderRef.current = null
        }
    }

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
        }
        setStream(null)
    }

    const handleRetry = () => {
        stopCamera()
        stopScanning()
        startCamera()
    }

    /* ── Verifikasi hasil scan ke database ── */
    const handleScanResult = async (scannedNis: string) => {
        setIsVerifying(true)

        const { data: siswa, error: fetchError } = await supabase
            .from('siswa')
            .select('nis, nama_lengkap, kelas, status')
            .eq('nis', scannedNis)
            .single()

        setIsVerifying(false)

        if (fetchError || !siswa) {
            setErrorMessage(`NIS "${scannedNis}" tidak ditemukan dalam data siswa.`)
            setShowErrorModal(true)
            return
        }

        if (siswa.status !== 'aktif') {
            setErrorMessage(`Siswa "${siswa.nama_lengkap}" berstatus tidak aktif.`)
            setShowErrorModal(true)
            return
        }

        // Langsung arahkan ke halaman peminjaman dengan siswa yang terpilih secara otomatis
        router.push(`/dashboard/peminjaman?nis=${encodeURIComponent(siswa.nis)}`)
    }

    const handleErrorClose = () => {
        setShowErrorModal(false)
        setTimeout(() => setIsScanningState(true), 300)
    }

    return (
        <div className="fixed inset-0 bg-black" style={{ marginTop: '-4rem', paddingBottom: '0' }}>

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
                        <button onClick={handleRetry}
                            className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors">
                            Coba Lagi
                        </button>
                    </div>
                </div>
            )}

            {/* Camera Preview */}
            <video ref={videoRef} autoPlay playsInline muted
                className={`fixed inset-0 w-full h-full object-cover ${loading || error ? 'hidden' : ''}`}
                style={{ zIndex: 1 }} />

            {!loading && !error && (
                <>
                    <div className="fixed inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 10 }}>
                        {/* Area box pemindai persegi panjang (cocok untuk barcode & QR code) */}
                        <div className="relative w-80 h-40 z-20 scanner-overlay">
                            <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white rounded-tl-2xl" />
                            <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white rounded-tr-2xl" />
                            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white rounded-bl-2xl" />
                            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white rounded-br-2xl" />
                            {isScanning && (
                                <div className="absolute inset-x-0 top-0 h-1 bg-primary shadow-lg shadow-primary/50 animate-scan" />
                            )}
                        </div>
                    </div>

                    <div className="fixed bottom-24 left-0 right-0 px-6 z-20">
                        <div className="bg-black/70 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                            <p className="text-white text-center text-sm font-medium mb-1">
                                Arahkan kamera ke Barcode kartu siswa
                            </p>
                            <p className="text-white/60 text-center text-xs">
                                Pastikan Barcode terlihat jelas di dalam frame
                            </p>
                        </div>
                    </div>

                    <div className="fixed top-6 left-0 right-0 px-6 z-20 flex justify-center">
                        <div className={`backdrop-blur-sm rounded-xl px-4 py-2 border inline-flex items-center gap-2 ${
                            isVerifying
                                ? 'bg-blue-500/20 border-blue-500/30'
                                : isScanning
                                ? 'bg-green-500/20 border-green-500/30'
                                : 'bg-yellow-500/20 border-yellow-500/30'
                        }`}>
                            {isVerifying ? (
                                <>
                                    <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                                    <span className="text-xs font-medium text-blue-400">Memverifikasi...</span>
                                </>
                            ) : (
                                <>
                                    <Camera className={`w-4 h-4 ${isScanning ? 'text-green-400' : 'text-yellow-400'}`} />
                                    <span className={`text-xs font-medium ${isScanning ? 'text-green-400' : 'text-yellow-400'}`}>
                                        {isScanning ? 'Scanner Aktif' : 'Scanner Siap'}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Error Modal */}
            <Modal isOpen={showErrorModal} onClose={handleErrorClose} title="Barcode Tidak Valid">
                <div className="flex flex-col items-center py-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <p className="text-gray-700 text-sm text-center">{errorMessage}</p>
                </div>
            </Modal>

            <style jsx>{`
                @keyframes scan {
                    0%, 100% { top: 0; }
                    50% { top: calc(100% - 4px); }
                }
                .animate-scan {
                    animation: scan 2s ease-in-out infinite;
                }
                .scanner-overlay {
                    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.6);
                }
            `}</style>
        </div>
    )
}