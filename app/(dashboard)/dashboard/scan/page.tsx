'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, AlertCircle, Loader2, Flashlight } from 'lucide-react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { createClient } from '@/utils/supabase/client'
import Modal from '@/app/components/Modal'
import { useRouter } from 'next/navigation'

const SCANNER_ELEMENT_ID = 'qr-reader-element'

export default function ScanPage() {
    const router = useRouter()
    const [error, setError] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [isScanning, setIsScanning] = useState(false)
    const [isVerifying, setIsVerifying] = useState(false)
    const [showErrorModal, setShowErrorModal] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')

    const scannerRef = useRef<Html5Qrcode | null>(null)
    const isScanningRef = useRef(false)
    const supabase = createClient()

    useEffect(() => {
        startScanner()
        return () => {
            stopScanner()
        }
    }, [])

    const startScanner = async () => {
        try {
            setLoading(true)
            setError('')

            // Cek secure context
            if (typeof window !== 'undefined' && (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)) {
                throw new Error('SecureContextRequired')
            }

            // Beri waktu agar DOM element siap
            await new Promise(resolve => setTimeout(resolve, 100))

            const html5Qrcode = new Html5Qrcode(SCANNER_ELEMENT_ID, {
                formatsToSupport: [
                    Html5QrcodeSupportedFormats.CODE_128,
                    Html5QrcodeSupportedFormats.CODE_39,
                    Html5QrcodeSupportedFormats.EAN_13,
                    Html5QrcodeSupportedFormats.EAN_8,
                    Html5QrcodeSupportedFormats.UPC_A,
                    Html5QrcodeSupportedFormats.QR_CODE,
                    Html5QrcodeSupportedFormats.DATA_MATRIX,
                    Html5QrcodeSupportedFormats.PDF_417,
                ],
                verbose: false,
            })
            scannerRef.current = html5Qrcode

            await html5Qrcode.start(
                { facingMode: 'environment' },
                {
                    fps: 15,
                    qrbox: { width: 270, height: 270 },
                    aspectRatio: 1.0,
                },
                async (decodedText) => {
                    if (isScanningRef.current) return
                    isScanningRef.current = true
                    setIsScanning(false)
                    
                    // Efek getar ketika barcode berhasil terbaca (jika didukung oleh perangkat/browser)
                    if (typeof window !== 'undefined' && navigator.vibrate) {
                        try {
                            navigator.vibrate(200)
                        } catch (e) {
                            console.warn('Vibration API error:', e)
                        }
                    }

                    await handleScanResult(decodedText.trim())
                },
                () => {
                    // NotFoundException diabaikan — normal saat tidak ada barcode di frame
                }
            )

            setIsScanning(true)
        } catch (err: any) {
            console.error('Error starting scanner:', err)

            if (err.message === 'SecureContextRequired') {
                setError('Kamera hanya dapat diakses melalui HTTPS. Jika sedang uji coba di jaringan lokal, aktifkan flag "Insecure origins treated as secure" di Chrome atau gunakan ngrok.')
            } else if (err.name === 'NotAllowedError' || (typeof err === 'string' && err.includes('NotAllowedError'))) {
                setError('Akses kamera ditolak. Silakan izinkan akses kamera di pengaturan browser Anda, lalu muat ulang halaman.')
            } else if (typeof err === 'string' && err.includes('No cameras found')) {
                setError('Kamera tidak ditemukan pada perangkat ini.')
            } else {
                setError('Gagal memulai scanner. Pastikan browser Anda mendukung akses kamera.')
            }
        } finally {
            setLoading(false)
        }
    }

    const stopScanner = async () => {
        isScanningRef.current = false
        if (scannerRef.current) {
            try {
                if (scannerRef.current.isScanning) {
                    await scannerRef.current.stop()
                }
                scannerRef.current.clear()
            } catch {}
            scannerRef.current = null
        }
    }

    const handleRetry = async () => {
        await stopScanner()
        isScanningRef.current = false
        setIsScanning(false)
        setError('')
        await startScanner()
    }

    /* ── Verifikasi NIS ke database ── */
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
            setErrorMessage(`Siswa "${siswa.nama_lengkap}" berstatus tidak aktif (${siswa.status}).`)
            setShowErrorModal(true)
            return
        }

        // Langsung arahkan ke halaman peminjaman — siswa akan otomatis terpilih
        router.push(`/dashboard/peminjaman?nis=${encodeURIComponent(siswa.nis)}`)
    }

    const handleErrorClose = () => {
        setShowErrorModal(false)
        isScanningRef.current = false
        setIsScanning(true)
    }

    return (
        <div className="fixed inset-0 bg-black" style={{ marginTop: '-4rem' }}>

            {/* ── Loading ── */}
            {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-30">
                    <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
                    <p className="text-white text-sm">Memulai kamera...</p>
                </div>
            )}

            {/* ── Error ── */}
            {error && !loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-30 px-6">
                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 max-w-sm w-full">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-white font-semibold text-center mb-2">Gagal Mengakses Kamera</h3>
                        <p className="text-white/70 text-sm text-center mb-6 leading-relaxed">{error}</p>
                        <button onClick={handleRetry}
                            className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors">
                            Coba Lagi
                        </button>
                    </div>
                </div>
            )}

            {/* ── Elemen video (dikelola oleh html5-qrcode) ── */}
            <div
                id={SCANNER_ELEMENT_ID}
                className="absolute inset-0 w-full h-full"
                style={{ zIndex: 1 }}
            />

            {/* ── Overlay UI di atas video ── */}
            {!loading && !error && (
                <>
                    {/* Kotak panduan scan — persegi dengan sudut rounded dan bayangan luar */}
                    <div className="fixed inset-0 flex items-center justify-center z-20 pointer-events-none">
                        <div
                            className="relative rounded-2xl"
                            style={{
                                width: 270,
                                height: 270,
                                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.65)'
                            }}
                        >
                            {/* Sudut kiri atas */}
                            <div className="absolute top-0 left-0 w-10 h-10 border-t-[3px] border-l-[3px] border-white rounded-tl-2xl" />
                            {/* Sudut kanan atas */}
                            <div className="absolute top-0 right-0 w-10 h-10 border-t-[3px] border-r-[3px] border-white rounded-tr-2xl" />
                            {/* Sudut kiri bawah */}
                            <div className="absolute bottom-0 left-0 w-10 h-10 border-b-[3px] border-l-[3px] border-white rounded-bl-2xl" />
                            {/* Sudut kanan bawah */}
                            <div className="absolute bottom-0 right-0 w-10 h-10 border-b-[3px] border-r-[3px] border-white rounded-br-2xl" />

                            {/* Garis scan animasi */}
                            {(isScanning && !isVerifying) && (
                                <div className="absolute left-2 right-2 h-0.5 bg-primary rounded shadow-[0_0_8px_2px] shadow-primary/60 animate-scan" />
                            )}
                        </div>
                    </div>

                    {/* Status badge */}
                    <div className="fixed top-6 left-0 right-0 px-6 z-20 flex justify-center">
                        <div className={`backdrop-blur-sm rounded-xl px-4 py-2 border inline-flex items-center gap-2 ${
                            isVerifying ? 'bg-blue-500/20 border-blue-500/30'
                            : isScanning ? 'bg-green-500/20 border-green-500/30'
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
                                        {isScanning ? 'Scanner Aktif' : 'Mempersiapkan...'}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Petunjuk bawah */}
                    <div className="fixed bottom-24 left-0 right-0 px-6 z-20">
                        <div className="bg-black/70 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                            <p className="text-white text-center text-sm font-medium mb-1">
                                Arahkan kamera ke Barcode kartu siswa
                            </p>
                            <p className="text-white/50 text-center text-xs">
                                Pastikan Barcode terlihat jelas dan pas di dalam kotak
                            </p>
                        </div>
                    </div>
                </>
            )}

            {/* ── Error Modal ── */}
            <Modal isOpen={showErrorModal} onClose={handleErrorClose} title="Barcode Tidak Valid">
                <div className="flex flex-col items-center py-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <p className="text-gray-700 text-sm text-center">{errorMessage}</p>
                </div>
            </Modal>

            <style jsx global>{`
                /* Sembunyikan UI bawaan html5-qrcode */
                #${SCANNER_ELEMENT_ID} video {
                    width: 100% !important;
                    height: 100% !important;
                    object-fit: cover !important;
                    position: absolute !important;
                    inset: 0 !important;
                }
                #${SCANNER_ELEMENT_ID} img,
                #${SCANNER_ELEMENT_ID} canvas {
                    display: none !important;
                }
                #${SCANNER_ELEMENT_ID} > div:not(:has(video)) {
                    display: none !important;
                }

                @keyframes scan {
                    0%   { top: 10px; }
                    50%  { top: calc(100% - 10px); }
                    100% { top: 10px; }
                }
                .animate-scan {
                    animation: scan 2.5s ease-in-out infinite;
                    position: absolute;
                }
            `}</style>
        </div>
    )
}