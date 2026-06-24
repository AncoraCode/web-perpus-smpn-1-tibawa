'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, CheckCircle2, AlertCircle, Loader2, User } from 'lucide-react'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'
import { createClient } from '@/utils/supabase/client'
import Modal from '@/app/components/Modal'

export default function ScanPage() {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const [error, setError] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [hasPermission, setHasPermission] = useState<boolean | null>(null)

    // Barcode/QR detection
    const [isScanning, setIsScanning] = useState(false)
    const isScanningRef = useRef(false)
    const [detectedNis, setDetectedNis] = useState<string>('')
    const [siswaPreview, setSiswaPreview] = useState<{ nama_lengkap: string; nis: string; kelas: string | null } | null>(null)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
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
            codeReaderRef.current = new BrowserMultiFormatReader()
        }

        codeReaderRef.current.decodeFromVideoElementContinuously(
            videoRef.current,
            async (result, err) => {
                // Ignore scanning callbacks if scanner is currently paused
                if (!isScanningRef.current) return

                if (result) {
                    const scannedText = result.getText().trim()
                    setIsScanningState(false) // Pause scanner actions
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
        setDetectedNis(scannedNis)

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

        setSiswaPreview(siswa)
        setShowSuccessModal(true)
    }

    const handleSuccessClose = () => {
        setShowSuccessModal(false)
        setDetectedNis('')
        setSiswaPreview(null)
        setTimeout(() => setIsScanningState(true), 300)
    }

    const handleErrorClose = () => {
        setShowErrorModal(false)
        setTimeout(() => setIsScanningState(true), 300)
    }

    /* ── Redirect ke Peminjaman dengan NIS auto-select ── */
    const handleProcessToPeminjaman = () => {
        window.location.href = `/dashboard/peminjaman?nis=${encodeURIComponent(detectedNis)}`
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
                    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 10 }}>
                        <div className="absolute inset-0 bg-black/50" />
                        <div className="relative w-64 h-64 z-20">
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
                                Arahkan kamera ke QR Code kartu siswa
                            </p>
                            <p className="text-white/60 text-center text-xs">
                                Pastikan QR Code terlihat jelas di dalam frame
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

            {/* Success Modal — Siswa Ditemukan */}
            <Modal
                isOpen={showSuccessModal}
                onClose={handleSuccessClose}
                title="Siswa Terdeteksi!"
                confirmation={{
                    negativeBtn: 'Scan Lagi',
                    positiveBtn: 'Lanjut ke Peminjaman',
                    handlePositiveBtn: handleProcessToPeminjaman,
                }}
            >
                <div className="flex flex-col items-center py-2">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <User className="w-8 h-8 text-green-600" />
                    </div>
                    {siswaPreview && (
                        <div className="text-center">
                            <p className="font-bold text-gray-900 text-base">{siswaPreview.nama_lengkap}</p>
                            <div className="flex items-center justify-center gap-2 mt-1.5">
                                <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                    {siswaPreview.nis}
                                </span>
                                {siswaPreview.kelas && (
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
                                        Kelas {siswaPreview.kelas}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                    <p className="text-gray-500 text-xs mt-4 text-center">
                        Klik "Lanjut ke Peminjaman" untuk mencatat peminjaman buku
                    </p>
                </div>
            </Modal>

            {/* Error Modal */}
            <Modal isOpen={showErrorModal} onClose={handleErrorClose} title="QR Code Tidak Valid">
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
            `}</style>
        </div>
    )
}