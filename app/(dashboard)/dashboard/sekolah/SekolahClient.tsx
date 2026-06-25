'use client'

import { useState, useRef } from 'react'
import {
    School, Hash, User, Phone, Mail, MapPin, Info,
    CheckCircle2, XCircle, Save, Loader2, Image, Upload, Map
} from 'lucide-react'
import Modal from '@/app/components/Modal'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

interface Sekolah {
    id: string
    nama_sekolah: string
    nama_perpustakaan: string | null
    alamat: string | null
    kecamatan_kabupaten: string | null
    npsn: string | null
    kepala_sekolah: string | null
    telepon: string | null
    email: string | null
    tentang_sekolah: string | null
    map_iframe_url: string | null
    logo_url: string | null
    foto_header_url: string | null
    foto_sekolah_url: string | null
}

interface SekolahClientProps {
    initialData: Sekolah | null
    user: { role: string }
}

export default function SekolahClient({ initialData }: SekolahClientProps) {
    const supabase = createClient()
    const router = useRouter()

    // Form states
    const [namaSekolah, setNamaSekolah] = useState(initialData?.nama_sekolah || '')
    const [namaPerpustakaan, setNamaPerpustakaan] = useState(initialData?.nama_perpustakaan || '')
    const [npsn, setNpsn] = useState(initialData?.npsn || '')
    const [kepalaSekolah, setKepalaSekolah] = useState(initialData?.kepala_sekolah || '')
    const [telepon, setTelepon] = useState(initialData?.telepon || '')
    const [email, setEmail] = useState(initialData?.email || '')
    const [kecamatanKabupaten, setKecamatanKabupaten] = useState(initialData?.kecamatan_kabupaten || '')
    const [alamat, setAlamat] = useState(initialData?.alamat || '')
    const [tentangSekolah, setTentangSekolah] = useState(initialData?.tentang_sekolah || '')
    const [mapIframeUrl, setMapIframeUrl] = useState(initialData?.map_iframe_url || '')

    // Image upload states
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [logoPreview, setLogoPreview] = useState<string | null>(initialData?.logo_url || null)
    const [headerFile, setHeaderFile] = useState<File | null>(null)
    const [headerPreview, setHeaderPreview] = useState<string | null>(initialData?.foto_header_url || null)
    const [sekolahFile, setSekolahFile] = useState<File | null>(null)
    const [sekolahPreview, setSekolahPreview] = useState<string | null>(initialData?.foto_sekolah_url || null)

    // Image preview modal states
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
    const [previewImageTitle, setPreviewImageTitle] = useState<string>('')

    const handlePreviewImage = (url: string | null, title: string) => {
        if (url) {
            setPreviewImageUrl(url)
            setPreviewImageTitle(title)
        }
    }

    // UI States
    const [loading, setLoading] = useState(false)
    const [formError, setFormError] = useState('')
    const [notif, setNotif] = useState<{ show: boolean; success: boolean; message: string }>({
        show: false,
        success: false,
        message: ''
    })

    const logoInputRef = useRef<HTMLInputElement>(null)
    const headerInputRef = useRef<HTMLInputElement>(null)
    const sekolahInputRef = useRef<HTMLInputElement>(null)

    const showNotif = (success: boolean, message: string) => {
        setNotif({ show: true, success, message })
    }

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setLogoFile(file)
            setLogoPreview(URL.createObjectURL(file))
        }
    }

    const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setHeaderFile(file)
            setHeaderPreview(URL.createObjectURL(file))
        }
    }

    const handleSekolahChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSekolahFile(file)
            setSekolahPreview(URL.createObjectURL(file))
        }
    }

    const uploadImage = async (file: File, type: string): Promise<string | null> => {
        const ext = file.name.split('.').pop()
        const filePath = `sekolah/${type}_${Date.now()}.${ext}`

        const { error } = await supabase.storage
            .from('buku-covers')
            .upload(filePath, file, { upsert: true })

        if (error) {
            throw new Error(`Gagal mengunggah ${type}: ${error.message}`)
        }

        const { data } = supabase.storage.from('buku-covers').getPublicUrl(filePath)
        return data.publicUrl
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormError('')

        if (!namaSekolah.trim()) {
            setFormError('Nama Sekolah wajib diisi!')
            return
        }

        setLoading(true)

        try {
            let currentLogoUrl = logoPreview
            let currentHeaderUrl = headerPreview
            let currentSekolahUrl = sekolahPreview

            // 1. Upload Logo jika ada file baru
            if (logoFile) {
                const uploadedLogo = await uploadImage(logoFile, 'logo')
                if (uploadedLogo) currentLogoUrl = uploadedLogo
            }

            // 2. Upload Header jika ada file baru
            if (headerFile) {
                const uploadedHeader = await uploadImage(headerFile, 'header')
                if (uploadedHeader) currentHeaderUrl = uploadedHeader
            }

            // 3. Upload Sekolah Banner jika ada file baru
            if (sekolahFile) {
                const uploadedSekolah = await uploadImage(sekolahFile, 'sekolah_banner')
                if (uploadedSekolah) currentSekolahUrl = uploadedSekolah
            }

            const payload = {
                nama_sekolah: namaSekolah.trim(),
                nama_perpustakaan: namaPerpustakaan.trim() || null,
                npsn: npsn.trim() || null,
                kepala_sekolah: kepalaSekolah.trim() || null,
                telepon: telepon.trim() || null,
                email: email.trim() || null,
                kecamatan_kabupaten: kecamatanKabupaten.trim() || null,
                alamat: alamat.trim() || null,
                tentang_sekolah: tentangSekolah.trim() || null,
                map_iframe_url: mapIframeUrl.trim() || null,
                logo_url: currentLogoUrl,
                foto_header_url: currentHeaderUrl,
                foto_sekolah_url: currentSekolahUrl,
                updated_at: new Date().toISOString()
            }

            if (initialData?.id) {
                // Update existing record
                const { data, error } = await supabase
                    .from('detail_sekolah')
                    .update(payload)
                    .eq('id', initialData.id)
                    .select()
                    .single()

                if (error) throw error
                showNotif(true, 'Detail Sekolah berhasil diperbarui!')
            } else {
                // Insert new record
                const { data, error } = await supabase
                    .from('detail_sekolah')
                    .insert([payload])
                    .select()
                    .single()

                if (error) throw error
                showNotif(true, 'Detail Sekolah berhasil ditambahkan!')
            }

            // Memaksa Next.js untuk mereload data server komponen (seperti header layout)
            router.refresh()

            // Reset file states so they don't upload again unless changed
            setLogoFile(null)
            setHeaderFile(null)
            setSekolahFile(null)

        } catch (error: any) {
            console.error('Error saving detail sekolah:', error)
            showNotif(false, 'Gagal menyimpan perubahan: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container mx-auto px-4 py-6 max-w-xl">
            {/* Header Title */}
            <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-900">Pengaturan Sekolah</h1>
                <p className="text-sm text-gray-500 mt-0.5">Sesuaikan informasi detail sekolah untuk dipajang di landing page</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {formError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-red-600 font-medium leading-relaxed">{formError}</p>
                    </div>
                )}

                {/* Card Media (Logo & Banner) */}
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide flex items-center gap-1.5 border-b border-gray-50 pb-2">
                        <Image className="w-4 h-4 text-accent" />
                        Media Sekolah
                    </h3>

                    {/* Logo Upload */}
                    <div className="flex items-center gap-4">
                        <div className="relative w-20 h-20 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0">
                            {logoPreview ? (
                                <img src={logoPreview} alt="Logo Sekolah" onClick={() => handlePreviewImage(logoPreview, 'Logo Sekolah')} className="w-full h-full object-contain cursor-pointer hover:opacity-90 transition-opacity" />
                            ) : (
                                <School className="w-8 h-8 text-gray-300" />
                            )}
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-800 mb-1">Logo Sekolah</p>
                            <input
                                type="file"
                                ref={logoInputRef}
                                accept="image/*"
                                onChange={handleLogoChange}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => logoInputRef.current?.click()}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                            >
                                <Upload className="w-3.5 h-3.5" />
                                Pilih Logo
                            </button>
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Banner Utama Upload */}
                    <div>
                        <p className="text-xs font-semibold text-gray-800 mb-1.5">Banner Utama (Landing Page)</p>
                        <div className="relative w-full h-32 bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden mb-3">
                            {headerPreview ? (
                                <img src={headerPreview} alt="Banner Utama" onClick={() => handlePreviewImage(headerPreview, 'Banner Utama (Landing Page)')} className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                    <Image className="w-8 h-8 mb-1" />
                                    <span className="text-[10px]">Belum ada banner utama terpilih</span>
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={headerInputRef}
                            accept="image/*"
                            onChange={handleHeaderChange}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => headerInputRef.current?.click()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                            <Upload className="w-3.5 h-3.5" />
                            Pilih Banner Utama
                        </button>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Banner Sekolah Upload */}
                    <div>
                        <p className="text-xs font-semibold text-gray-800 mb-1.5">Banner Sekolah (Detail Sekolah)</p>
                        <div className="relative w-full h-32 bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden mb-3">
                            {sekolahPreview ? (
                                <img src={sekolahPreview} alt="Banner Sekolah" onClick={() => handlePreviewImage(sekolahPreview, 'Banner Sekolah (Detail Sekolah)')} className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                    <Image className="w-8 h-8 mb-1" />
                                    <span className="text-[10px]">Belum ada banner sekolah terpilih</span>
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={sekolahInputRef}
                            accept="image/*"
                            onChange={handleSekolahChange}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => sekolahInputRef.current?.click()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                            <Upload className="w-3.5 h-3.5" />
                            Pilih Banner Sekolah
                        </button>
                    </div>
                </div>

                {/* Card Informasi Utama */}
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide flex items-center gap-1.5 border-b border-gray-50 pb-2">
                        <Info className="w-4 h-4 text-accent" />
                        Informasi Utama
                    </h3>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            Nama Sekolah <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={namaSekolah}
                            onChange={e => setNamaSekolah(e.target.value)}
                            disabled={loading}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:bg-gray-50 outline-none"
                            placeholder="Contoh: SMP Negeri 1 Tibawa"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            Nama Perpustakaan / Website
                        </label>
                        <input
                            type="text"
                            value={namaPerpustakaan}
                            onChange={e => setNamaPerpustakaan(e.target.value)}
                            disabled={loading}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:bg-gray-50 outline-none"
                            placeholder="Contoh: Perpustakaan Bougenville"
                        />
                        <p className="text-[10px] text-gray-400 mt-1">Nama ini akan tampil di header website, judul browser, dan landing page.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">NPSN</label>
                            <input
                                type="text"
                                value={npsn}
                                onChange={e => setNpsn(e.target.value)}
                                disabled={loading}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:bg-gray-50 outline-none"
                                placeholder="Contoh: 40500377"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Kepala Sekolah</label>
                            <input
                                type="text"
                                value={kepalaSekolah}
                                onChange={e => setKepalaSekolah(e.target.value)}
                                disabled={loading}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:bg-gray-50 outline-none"
                                placeholder="Contoh: Rosma Isa, M.Pd"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tentang Sekolah</label>
                        <textarea
                            value={tentangSekolah}
                            onChange={e => setTentangSekolah(e.target.value)}
                            disabled={loading}
                            rows={4}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none disabled:bg-gray-50 outline-none leading-relaxed"
                            placeholder="Deskripsi singkat sekolah..."
                        />
                    </div>
                </div>

                {/* Card Kontak & Alamat */}
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide flex items-center gap-1.5 border-b border-gray-50 pb-2">
                        <Mail className="w-4 h-4 text-accent" />
                        Kontak & Alamat
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Telepon</label>
                            <input
                                type="text"
                                value={telepon}
                                onChange={e => setTelepon(e.target.value)}
                                disabled={loading}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:bg-gray-50 outline-none"
                                placeholder="Contoh: +62 812 3456789"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                disabled={loading}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:bg-gray-50 outline-none"
                                placeholder="Contoh: smpn1tibawa@gmail.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Kecamatan & Kabupaten</label>
                        <input
                            type="text"
                            value={kecamatanKabupaten}
                            onChange={e => setKecamatanKabupaten(e.target.value)}
                            disabled={loading}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:bg-gray-50 outline-none"
                            placeholder="Contoh: Kecamatan Tibawa, Kabupaten Gorontalo"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Alamat Lengkap</label>
                        <textarea
                            value={alamat}
                            onChange={e => setAlamat(e.target.value)}
                            disabled={loading}
                            rows={2}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none disabled:bg-gray-50 outline-none leading-relaxed"
                            placeholder="Contoh: Jl. Trans Sulawesi No. 1, Kec. Tibawa, Kab. Gorontalo"
                        />
                    </div>
                </div>

                {/* Card Peta Lokasi */}
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide flex items-center gap-1.5 border-b border-gray-50 pb-2">
                        <Map className="w-4 h-4 text-accent" />
                        Peta Lokasi
                    </h3>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Link Google Maps Embed (iframe src)</label>
                        <textarea
                            value={mapIframeUrl}
                            onChange={e => setMapIframeUrl(e.target.value)}
                            disabled={loading}
                            rows={3}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none disabled:bg-gray-50 outline-none leading-relaxed"
                            placeholder="Masukkan src iframe saja dari opsi 'Embed a map' di Google Maps..."
                        />
                    </div>

                    {mapIframeUrl && (
                        <div className="h-40 rounded-xl overflow-hidden border border-gray-200">
                            <iframe
                                src={mapIframeUrl}
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                title="Preview Maps"
                            />
                        </div>
                    )}
                </div>

                {/* Submit Button */}
                <div className="flex gap-3">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-3 px-4 bg-primary text-white rounded-xl font-medium hover:bg-primary/95 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Menyimpan...</span>
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                <span>Simpan Perubahan</span>
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* Notifikasi Modal */}
            <Modal
                isOpen={notif.show}
                onClose={() => setNotif(n => ({ ...n, show: false }))}
                title={notif.success ? 'Berhasil' : 'Gagal'}
            >
                <div className="flex flex-col items-center py-4">
                    {notif.success ? (
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                        </div>
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
                            <XCircle className="w-6 h-6 text-red-600" />
                        </div>
                    )}
                    <p className="text-sm text-gray-700 text-center">{notif.message}</p>
                </div>
            </Modal>

            {/* Image Preview Modal */}
            <Modal
                isOpen={!!previewImageUrl}
                onClose={() => setPreviewImageUrl(null)}
                title={previewImageTitle}
            >
                <div className="flex justify-center p-2 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                    {previewImageUrl && (
                        <img
                            src={previewImageUrl}
                            alt={previewImageTitle}
                            className="max-w-full max-h-[60vh] object-contain rounded-xl"
                        />
                    )}
                </div>
            </Modal>
        </div>
    )
}
