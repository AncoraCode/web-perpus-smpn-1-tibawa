'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import {
    Search, Plus, Edit2, Trash2, BookOpen, FileText,
    CheckCircle2, XCircle, X, Package,
    Layers, Grid3x3, Hash, User, Building2,
    Calendar, Barcode, BookMarked, ImagePlus, Loader2,
} from 'lucide-react'
import Modal from '@/app/components/Modal'
import { createClient } from '@/utils/supabase/client'
import AnimatedCounter from '@/app/components/AnimatedCounter'

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
interface Kategori { id: string; nama: string }
interface Rak { id: string; kode_rak: string; nama_rak: string }

interface Buku {
    id: string
    kode_buku: string
    judul: string
    pengarang: string | null
    penerbit: string | null
    tahun_terbit: number | null
    isbn: string | null
    kategori_id: string | null
    rak_id: string | null
    jumlah_total: number
    jumlah_tersedia: number
    cover_url: string | null
    deskripsi: string | null
    created_at: string
    kategori: Kategori | null
    rak: Rak | null
}

type FormData = {
    kode_buku: string
    judul: string
    pengarang: string
    penerbit: string
    tahun_terbit: string
    isbn: string
    kategori_id: string
    rak_id: string
    jumlah_total: string
    jumlah_tersedia: string
    deskripsi: string
}

interface BukuClientProps {
    bukuData: Buku[]
    kategoriList: Kategori[]
    rakList: Rak[]
    user: { role: string }
}

/* ─────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────── */
const PAGE_SIZE = 15

const EMPTY_FORM: FormData = {
    kode_buku: '', judul: '', pengarang: '', penerbit: '',
    tahun_terbit: '', isbn: '', kategori_id: '', rak_id: '',
    jumlah_total: '1', jumlah_tersedia: '1', deskripsi: '',
}

/* ─────────────────────────────────────────
   SKELETON
───────────────────────────────────────── */
function SkeletonCard() {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex gap-3 animate-pulse">
            <div className="w-14 h-20 bg-gray-200 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
                <div className="flex gap-2 mt-3">
                    <div className="flex-1 h-8 bg-gray-100 rounded-lg" />
                    <div className="flex-1 h-8 bg-gray-100 rounded-lg" />
                </div>
            </div>
        </div>
    )
}

/* ─────────────────────────────────────────
   FORM FIELDS — di luar komponen utama
───────────────────────────────────────── */
interface FormFieldsProps {
    form: FormData
    formError: string
    disabled: boolean
    kategoriList: Kategori[]
    rakList: Rak[]
    coverPreview: string | null
    coverFile: File | null
    isUploadingCover: boolean
    onCoverClick: () => void
    onChange: (key: keyof FormData, val: string) => void
    onDeleteCover: () => void
}

function BukuFormFields({
    form, formError, disabled,
    kategoriList, rakList,
    coverPreview, coverFile, isUploadingCover, onCoverClick,
    onChange, onDeleteCover,
}: FormFieldsProps) {
    return (
        <div className="space-y-4">
            {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-xs text-red-600 font-medium">{formError}</p>
                </div>
            )}

            {/* Cover Upload */}
            <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Cover Buku</label>
                <div className="flex items-center gap-3">
                    <div
                        onClick={!disabled ? onCoverClick : undefined}
                        className={`w-16 h-22 rounded-lg border-2 border-dashed flex items-center justify-center flex-shrink-0 overflow-hidden transition-colors ${disabled ? 'cursor-not-allowed border-gray-200 bg-gray-50'
                                : 'cursor-pointer border-gray-300 hover:border-accent bg-gray-50'
                            }`}
                        style={{ height: '88px' }}
                    >
                        {isUploadingCover ? (
                            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                        ) : coverPreview ? (
                            <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex flex-col items-center gap-1">
                                <ImagePlus className="w-5 h-5 text-gray-400" />
                                <span className="text-[9px] text-gray-400 text-center leading-tight">Upload<br />Cover</span>
                            </div>
                        )}
                    </div>
                    <div className="flex-1 text-xs text-gray-500 space-y-1">
                        <p>Klik area kiri untuk upload cover</p>
                        <p className="text-gray-400">JPG/PNG/WebP · maks. 2MB</p>
                        {coverPreview && !isUploadingCover && (
                            <div className="flex flex-col gap-1 items-start mt-1">
                                {coverFile && (
                                    <span className="text-[10px] text-amber-600 font-medium">
                                        Cover baru siap diupload saat simpan
                                    </span>
                                )}
                                <button
                                    type="button"
                                    onClick={onDeleteCover}
                                    className="text-red-500 hover:text-red-600 text-xs font-semibold underline flex items-center gap-1"
                                >
                                    Hapus Cover
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Kode Buku */}
            <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Kode Buku <span className="text-red-500">*</span>
                </label>
                <input type="text" value={form.kode_buku} disabled={disabled}
                    onChange={e => onChange('kode_buku', e.target.value.toUpperCase())}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:bg-gray-50 outline-none font-mono"
                    placeholder="Contoh: BK021" />
            </div>

            {/* Judul */}
            <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Judul Buku <span className="text-red-500">*</span>
                </label>
                <input type="text" value={form.judul} disabled={disabled}
                    onChange={e => onChange('judul', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:bg-gray-50 outline-none"
                    placeholder="Masukkan judul buku" />
            </div>

            {/* Pengarang & Penerbit */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Pengarang</label>
                    <input type="text" value={form.pengarang} disabled={disabled}
                        onChange={e => onChange('pengarang', e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:bg-gray-50 outline-none"
                        placeholder="Nama pengarang" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Penerbit</label>
                    <input type="text" value={form.penerbit} disabled={disabled}
                        onChange={e => onChange('penerbit', e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:bg-gray-50 outline-none"
                        placeholder="Nama penerbit" />
                </div>
            </div>

            {/* Tahun & ISBN */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tahun Terbit</label>
                    <input type="number" value={form.tahun_terbit} disabled={disabled}
                        onChange={e => onChange('tahun_terbit', e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:bg-gray-50 outline-none"
                        placeholder="2024" min="1900" max="2099" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">ISBN</label>
                    <input type="text" value={form.isbn} disabled={disabled}
                        onChange={e => onChange('isbn', e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:bg-gray-50 outline-none"
                        placeholder="978xxxxxxxxxx" />
                </div>
            </div>

            {/* Kategori */}
            <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Kategori</label>
                <select value={form.kategori_id} disabled={disabled}
                    onChange={e => onChange('kategori_id', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:bg-gray-50 outline-none">
                    <option value="">-- Pilih Kategori --</option>
                    {kategoriList.map(k => (
                        <option key={k.id} value={k.id}>{k.nama}</option>
                    ))}
                </select>
            </div>

            {/* Rak */}
            <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Rak & Lemari Buku</label>
                <select value={form.rak_id} disabled={disabled}
                    onChange={e => onChange('rak_id', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:bg-gray-50 outline-none">
                    <option value="">-- Pilih Rak & Lemari Buku --</option>
                    {rakList.map(r => (
                        <option key={r.id} value={r.id}>{r.kode_rak} — {r.nama_rak}</option>
                    ))}
                </select>
            </div>

            {/* Jumlah Total & Tersedia */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Jumlah Total <span className="text-red-500">*</span>
                    </label>
                    <input type="number" value={form.jumlah_total} disabled={disabled}
                        onChange={e => onChange('jumlah_total', e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:bg-gray-50 outline-none"
                        min="0" placeholder="0" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Jumlah Tersedia <span className="text-red-500">*</span>
                    </label>
                    <input type="number" value={form.jumlah_tersedia} disabled={disabled}
                        onChange={e => onChange('jumlah_tersedia', e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:bg-gray-50 outline-none"
                        min="0" placeholder="0" />
                </div>
            </div>
            <p className="text-xs text-gray-400 -mt-2">
                Tersedia tidak boleh melebihi total
            </p>

            {/* Deskripsi */}
            <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Deskripsi</label>
                <textarea value={form.deskripsi} disabled={disabled} rows={3}
                    onChange={e => onChange('deskripsi', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none disabled:bg-gray-50 outline-none"
                    placeholder="Deskripsi singkat buku..." />
            </div>
        </div>
    )
}

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function BukuClient({ bukuData, kategoriList, rakList, user }: BukuClientProps) {
    const [bukuList, setBukuList] = useState<Buku[]>(bukuData)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterKategori, setFilterKategori] = useState('')
    const [filterRak, setFilterRak] = useState('')

    // Infinite scroll
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
    const [loadingMore, setLoadingMore] = useState(false)
    const sentinelRef = useRef<HTMLDivElement>(null)
    const observerRef = useRef<IntersectionObserver | null>(null)

    // Modals
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [notif, setNotif] = useState<{ show: boolean; success: boolean; message: string }>({
        show: false, success: true, message: ''
    })

    const [selected, setSelected] = useState<Buku | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [formError, setFormError] = useState('')
    const [form, setForm] = useState<FormData>({ ...EMPTY_FORM })

    // Cover upload
    const coverInputRef = useRef<HTMLInputElement>(null)
    const [coverFile, setCoverFile] = useState<File | null>(null)
    const [coverPreview, setCoverPreview] = useState<string | null>(null)
    const [isUploadingCover, setIsUploadingCover] = useState(false)
    const [previewCoverUrl, setPreviewCoverUrl] = useState<string | null>(null)

    const supabase = createClient()

    /* ── filter ── */
    const filtered = useMemo(() => {
        const q = searchQuery.toLowerCase()
        return bukuList.filter(b => {
            const matchSearch =
                b.judul.toLowerCase().includes(q) ||
                b.kode_buku.toLowerCase().includes(q) ||
                (b.pengarang ?? '').toLowerCase().includes(q) ||
                (b.isbn ?? '').toLowerCase().includes(q)
            const matchKategori = !filterKategori || b.kategori_id === filterKategori
            const matchRak = !filterRak || b.rak_id === filterRak
            return matchSearch && matchKategori && matchRak
        })
    }, [bukuList, searchQuery, filterKategori, filterRak])

    useEffect(() => { setVisibleCount(PAGE_SIZE) }, [searchQuery, filterKategori, filterRak])

    const visibleBuku = filtered.slice(0, visibleCount)
    const hasMore = visibleCount < filtered.length

    /* ── Infinite scroll ── */
    const loadMore = useCallback(() => {
        if (loadingMore || !hasMore) return
        setLoadingMore(true)
        setTimeout(() => { setVisibleCount(p => p + PAGE_SIZE); setLoadingMore(false) }, 350)
    }, [loadingMore, hasMore])

    useEffect(() => {
        if (observerRef.current) observerRef.current.disconnect()
        observerRef.current = new IntersectionObserver(
            entries => { if (entries[0].isIntersecting) loadMore() },
            { threshold: 0.1 }
        )
        if (sentinelRef.current) observerRef.current.observe(sentinelRef.current)
        return () => observerRef.current?.disconnect()
    }, [loadMore])

    const stats = useMemo(() => ({
        total: bukuList.length,
        tersedia: bukuList.reduce((s, b) => s + (b.jumlah_tersedia || 0), 0),
        dipinjam: bukuList.reduce((s, b) => s + Math.max(0, (b.jumlah_total || 0) - (b.jumlah_tersedia || 0)), 0),
    }), [bukuList])

    /* ── helpers ── */
    const handleFormChange = (key: keyof FormData, val: string) =>
        setForm(prev => ({ ...prev, [key]: val }))

    const showNotif = (success: boolean, message: string) =>
        setNotif({ show: true, success, message })

    const handleCoverClick = () => coverInputRef.current?.click()

    const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 2 * 1024 * 1024) { showNotif(false, 'Cover maks. 2MB'); return }
        setCoverFile(file)
        setCoverPreview(URL.createObjectURL(file))
        if (coverInputRef.current) coverInputRef.current.value = ''
    }

    /* ── Upload cover ke Supabase Storage ── */
    const uploadCover = async (bukuId: string): Promise<string | null> => {
        if (!coverFile) return null
        setIsUploadingCover(true)
        const ext = coverFile.name.split('.').pop()
        const filePath = `covers/${bukuId}_${Date.now()}.${ext}`

        const { error } = await supabase.storage
            .from('buku-covers')
            .upload(filePath, coverFile, { upsert: true })

        if (error) {
            showNotif(false, 'Gagal upload cover: ' + error.message)
            setIsUploadingCover(false)
            return null
        }

        const { data } = supabase.storage.from('buku-covers').getPublicUrl(filePath)
        setIsUploadingCover(false)
        return data.publicUrl
    }

    const resetCover = () => {
        setCoverFile(null)
        setCoverPreview(null)
    }

    const handleDeleteCover = () => {
        setCoverFile(null)
        setCoverPreview(null)
    }

    const openAdd = () => {
        setForm({ ...EMPTY_FORM })
        resetCover()
        setFormError('')
        setShowAddModal(true)
    }

    const openEdit = (b: Buku) => {
        setSelected(b)
        setForm({
            kode_buku: b.kode_buku,
            judul: b.judul,
            pengarang: b.pengarang ?? '',
            penerbit: b.penerbit ?? '',
            tahun_terbit: b.tahun_terbit?.toString() ?? '',
            isbn: b.isbn ?? '',
            kategori_id: b.kategori_id ?? '',
            rak_id: b.rak_id ?? '',
            jumlah_total: b.jumlah_total?.toString() ?? '0',
            jumlah_tersedia: b.jumlah_tersedia?.toString() ?? '0',
            deskripsi: b.deskripsi ?? '',
        })
        setCoverPreview(b.cover_url)
        setCoverFile(null)
        setFormError('')
        setShowEditModal(true)
    }

    const openDelete = (b: Buku) => { setSelected(b); setShowDeleteModal(true) }
    const openDetail = (b: Buku) => { setSelected(b); setShowDetailModal(true) }

    /* ── build payload ── */
    const buildPayload = (coverUrl?: string | null) => ({
        kode_buku: form.kode_buku.trim().toUpperCase(),
        judul: form.judul.trim(),
        pengarang: form.pengarang.trim() || null,
        penerbit: form.penerbit.trim() || null,
        tahun_terbit: form.tahun_terbit ? parseInt(form.tahun_terbit) : null,
        isbn: form.isbn.trim() || null,
        kategori_id: form.kategori_id || null,
        rak_id: form.rak_id || null,
        jumlah_total: parseInt(form.jumlah_total) || 0,
        jumlah_tersedia: parseInt(form.jumlah_tersedia) || 0,
        deskripsi: form.deskripsi.trim() || null,
        ...(coverUrl !== undefined ? { cover_url: coverUrl } : {}),
    })

    const validate = (): string => {
        if (!form.kode_buku.trim()) return 'Kode Buku wajib diisi'
        if (!form.judul.trim()) return 'Judul Buku wajib diisi'
        const total = parseInt(form.jumlah_total) || 0
        const tersedia = parseInt(form.jumlah_tersedia) || 0
        if (tersedia > total) return 'Jumlah tersedia tidak boleh melebihi jumlah total'
        return ''
    }

    /* ── CRUD ── */
    const handleAdd = async () => {
        const err = validate()
        if (err) { setFormError(err); return }
        setFormError('')
        setIsSubmitting(true)

        // Insert dulu untuk dapat ID
        const { data, error } = await supabase
            .from('buku').insert([buildPayload()]).select(`
                *, kategori:kategori_id(id,nama), rak:rak_id(id,kode_rak,nama_rak)
            `).single()

        if (error) {
            setFormError(error.code === '23505' ? 'Kode buku sudah digunakan' : 'Gagal: ' + error.message)
            setIsSubmitting(false)
            return
        }

        // Upload cover jika ada
        let finalData = data
        if (coverFile) {
            const coverUrl = await uploadCover(data.id)
            if (coverUrl) {
                const { data: updated } = await supabase
                    .from('buku').update({ cover_url: coverUrl }).eq('id', data.id)
                    .select('*, kategori:kategori_id(id,nama), rak:rak_id(id,kode_rak,nama_rak)').single()
                if (updated) finalData = updated
            }
        }

        setBukuList(prev => [finalData, ...prev].sort((a, b) => a.kode_buku.localeCompare(b.kode_buku)))
        setShowAddModal(false)
        setIsSubmitting(false)
        resetCover()
        showNotif(true, `Buku "${finalData.judul}" berhasil ditambahkan`)
    }

    const handleEdit = async () => {
        if (!selected) return
        const err = validate()
        if (err) { setFormError(err); return }
        setFormError('')
        setIsSubmitting(true)

        // Upload cover baru jika ada file baru, atau hapus cover jika dipilih hapus
        let newCoverUrl: string | null | undefined = undefined
        if (coverFile) {
            // Hapus cover lama dari storage jika ada
            if (selected.cover_url) {
                const path = selected.cover_url.split('/buku-covers/')[1]
                if (path) await supabase.storage.from('buku-covers').remove([path])
            }
            const url = await uploadCover(selected.id)
            if (url) newCoverUrl = url
        } else if (!coverPreview && selected.cover_url) {
            // Cover dihapus
            const path = selected.cover_url.split('/buku-covers/')[1]
            if (path) await supabase.storage.from('buku-covers').remove([path])
            newCoverUrl = null
        }

        const { data, error } = await supabase
            .from('buku').update(buildPayload(newCoverUrl)).eq('id', selected.id)
            .select('*, kategori:kategori_id(id,nama), rak:rak_id(id,kode_rak,nama_rak)').single()

        if (error) {
            setFormError(error.code === '23505' ? 'Kode buku sudah digunakan' : 'Gagal: ' + error.message)
            setIsSubmitting(false)
            return
        }

        setBukuList(prev =>
            prev.map(b => b.id === selected.id ? data : b)
                .sort((a, b) => a.kode_buku.localeCompare(b.kode_buku))
        )
        setShowEditModal(false)
        setIsSubmitting(false)
        resetCover()
        showNotif(true, `Buku "${data.judul}" berhasil diperbarui`)
    }

    const handleDelete = async () => {
        if (!selected) return
        setIsDeleting(true)

        // Hapus cover dari storage jika ada
        if (selected.cover_url) {
            const path = selected.cover_url.split('/buku-covers/')[1]
            if (path) await supabase.storage.from('buku-covers').remove([path])
        }

        const { error } = await supabase.from('buku').delete().eq('id', selected.id)
        if (error) {
            setIsDeleting(false)
            setShowDeleteModal(false)
            showNotif(false, 'Gagal menghapus buku')
            return
        }

        const judul = selected.judul
        setBukuList(prev => prev.filter(b => b.id !== selected.id))
        setShowDeleteModal(false)
        setIsDeleting(false)
        showNotif(true, `Buku "${judul}" berhasil dihapus`)
    }

    const activeFilterCount = [filterKategori, filterRak].filter(Boolean).length

    /* ── render ── */
    return (
        <div className="px-4 py-6 space-y-5">

            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-gray-900">Koleksi Buku</h1>
                <p className="text-sm text-gray-500 mt-0.5">Kelola data koleksi buku perpustakaan</p>
            </div>
            
            {/* Hidden cover input */}
            <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                className="hidden" onChange={handleCoverFileChange} />

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-3 text-white">
                    <BookOpen className="w-6 h-6 opacity-80 mb-1" />
                    <p className="text-xl font-bold">
                        <AnimatedCounter value={stats.total} className="text-white font-bold text-xl" delay={0.1} />
                    </p>
                    <p className="text-[10px] opacity-80">Total Judul</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-3 text-white">
                    <Package className="w-6 h-6 opacity-80 mb-1" />
                    <p className="text-xl font-bold">
                        <AnimatedCounter value={stats.tersedia} className="text-white font-bold text-xl" delay={0.1} />
                    </p>
                    <p className="text-[10px] opacity-80">Tersedia</p>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-3 text-white">
                    <BookMarked className="w-6 h-6 opacity-80 mb-1" />
                    <p className="text-xl font-bold">
                        <AnimatedCounter value={stats.dipinjam} className="text-white font-bold text-xl" delay={0.1} />
                    </p>
                    <p className="text-[10px] opacity-80">Dipinjam</p>
                </div>
            </div>

            {/* Search + Filter Toggle */}
            <div className="space-y-2">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Cari judul, kode, pengarang, ISBN..."
                        className="w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none" />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Filter Panel — selalu tampil */}
                <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-700">Filter</p>
                        {activeFilterCount > 0 && (
                            <button onClick={() => { setFilterKategori(''); setFilterRak('') }}
                                className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1">
                                <X className="w-3 h-3" /> Reset
                            </button>
                        )}
                    </div>
                    <select value={filterKategori} onChange={e => setFilterKategori(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-accent">
                        <option value="">Semua Kategori</option>
                        {kategoriList.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
                    </select>
                    <select value={filterRak} onChange={e => setFilterRak(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-accent">
                        <option value="">Semua Rak & Lemari</option>
                        {rakList.map(r => <option key={r.id} value={r.id}>{r.kode_rak} — {r.nama_rak}</option>)}
                    </select>
                </div>
            </div>

            {/* Add Button */}
            <button onClick={openAdd}
                className="w-full py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 text-sm">
                <Plus className="w-4 h-4" /> Tambah Buku Baru
            </button>

            {/* List */}
            <div className="space-y-3">
                <p className="text-sm font-bold text-gray-900">
                    Daftar Buku ({filtered.length})
                    {visibleCount < filtered.length && (
                        <span className="text-xs font-normal text-gray-400"> — menampilkan {visibleBuku.length}</span>
                    )}
                </p>

                {filtered.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                        <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">
                            {searchQuery || activeFilterCount > 0 ? 'Tidak ada buku ditemukan' : 'Belum ada buku. Tambahkan sekarang!'}
                        </p>
                    </div>
                ) : (
                    <>
                        {visibleBuku.map(b => {
                            const dipinjam = (b.jumlah_total || 0) - (b.jumlah_tersedia || 0)
                            return (
                                <div key={b.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                                    <div className="flex gap-3">
                                        {/* Cover */}
                                        <div
                                            onClick={() => openDetail(b)}
                                            className="w-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                                            style={{ height: '80px' }}
                                        >
                                            {b.cover_url ? (
                                                <img src={b.cover_url} alt={b.judul}
                                                    className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <BookOpen className="w-6 h-6 text-gray-300" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <button onClick={() => openDetail(b)}
                                                className="font-semibold text-gray-900 text-sm hover:text-accent transition-colors text-left w-full line-clamp-2 block leading-snug">
                                                {b.judul}
                                            </button>
                                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                                                {b.pengarang || '—'}
                                            </p>
                                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                <span className="text-xs font-mono bg-accent/10 text-accent px-1.5 py-0.5 rounded font-semibold">
                                                    {b.kode_buku}
                                                </span>
                                                {b.kategori && (
                                                    <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                                                        {b.kategori.nama}
                                                    </span>
                                                )}
                                            </div>
                                            {/* Stok indicator */}
                                            <div className="flex items-center gap-1.5 mt-1.5">
                                                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${b.jumlah_tersedia === 0 ? 'bg-red-400'
                                                                : b.jumlah_tersedia < (b.jumlah_total / 2) ? 'bg-amber-400'
                                                                    : 'bg-green-400'
                                                            }`}
                                                        style={{ width: `${b.jumlah_total > 0 ? (b.jumlah_tersedia / b.jumlah_total) * 100 : 0}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-gray-500 flex-shrink-0">
                                                    {b.jumlah_tersedia}/{b.jumlah_total}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <button onClick={() => openDetail(b)}
                                            className="px-3 py-2 bg-gray-50 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors flex items-center justify-center"
                                            title="Detail"
                                        >
                                            <FileText className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => openEdit(b)}
                                            className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-1">
                                            <Edit2 className="w-3.5 h-3.5" /> Edit
                                        </button>
                                        <button onClick={() => openDelete(b)}
                                            className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-1">
                                            <Trash2 className="w-3.5 h-3.5" /> Hapus
                                        </button>
                                    </div>
                                </div>
                            )
                        })}

                        {loadingMore && <><SkeletonCard /><SkeletonCard /></>}
                        <div ref={sentinelRef} className="h-4" />
                        {!hasMore && filtered.length > PAGE_SIZE && (
                            <p className="text-center text-xs text-gray-400 py-2">Semua data telah ditampilkan</p>
                        )}
                    </>
                )}
            </div>

            {/* ════ MODALS ════ */}

            {/* Add */}
            <Modal isOpen={showAddModal}
                onClose={() => { if (!isSubmitting) { setShowAddModal(false); setFormError(''); resetCover() } }}
                title="Tambah Buku Baru"
                confirmation={{
                    negativeBtn: 'Batal', positiveBtn: 'Simpan',
                    handlePositiveBtn: handleAdd,
                    loading: { text: 'Menyimpan...', isLoading: isSubmitting, setIsLoading: setIsSubmitting }
                }}>
                <BukuFormFields
                    form={form} formError={formError} disabled={isSubmitting}
                    kategoriList={kategoriList} rakList={rakList}
                    coverPreview={coverPreview} coverFile={coverFile} isUploadingCover={isUploadingCover}
                    onCoverClick={handleCoverClick}
                    onChange={handleFormChange}
                    onDeleteCover={handleDeleteCover}
                />
            </Modal>

            {/* Edit */}
            <Modal isOpen={showEditModal}
                onClose={() => { if (!isSubmitting) { setShowEditModal(false); setFormError(''); resetCover() } }}
                title="Edit Buku"
                confirmation={{
                    negativeBtn: 'Batal', positiveBtn: 'Simpan Perubahan',
                    handlePositiveBtn: handleEdit,
                    loading: { text: 'Menyimpan...', isLoading: isSubmitting, setIsLoading: setIsSubmitting }
                }}>
                <BukuFormFields
                    form={form} formError={formError} disabled={isSubmitting}
                    kategoriList={kategoriList} rakList={rakList}
                    coverPreview={coverPreview} coverFile={coverFile} isUploadingCover={isUploadingCover}
                    onCoverClick={handleCoverClick}
                    onChange={handleFormChange}
                    onDeleteCover={handleDeleteCover}
                />
            </Modal>

            {/* Delete */}
            <Modal isOpen={showDeleteModal}
                onClose={() => !isDeleting && setShowDeleteModal(false)}
                title="Konfirmasi Hapus"
                confirmation={{
                    negativeBtn: 'Batal', positiveBtn: 'Ya, Hapus',
                    handlePositiveBtn: handleDelete,
                    loading: { text: 'Menghapus...', isLoading: isDeleting, setIsLoading: setIsDeleting }
                }}>
                <div className="flex gap-3 items-start">
                    {selected?.cover_url && (
                        <img src={selected.cover_url} alt="" className="w-12 h-16 object-cover rounded-lg flex-shrink-0" />
                    )}
                    <p className="text-sm text-gray-600">
                        Apakah Anda yakin ingin menghapus buku{' '}
                        <strong className="text-gray-900">"{selected?.judul}"</strong>{' '}
                        <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">({selected?.kode_buku})</span>?
                        Data yang dihapus tidak dapat dikembalikan.
                    </p>
                </div>
            </Modal>

            {/* Detail */}
            <Modal isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                title="Detail Buku">
                {selected && (
                    <div className="space-y-4">
                        {/* Hero */}
                        <div className="flex gap-4">
                            <div className="w-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 shadow-md" style={{ height: '112px' }}>
                                {selected.cover_url ? (
                                    <img src={selected.cover_url} alt={selected.judul} 
                                        onClick={() => setPreviewCoverUrl(selected.cover_url)}
                                        className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <BookOpen className="w-8 h-8 text-gray-300" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900 leading-snug">{selected.judul}</h3>
                                <p className="text-sm text-gray-500 mt-0.5">{selected.pengarang || '—'}</p>
                                <span className="inline-block mt-1.5 text-xs font-mono bg-accent/10 text-accent px-2 py-0.5 rounded font-semibold">
                                    {selected.kode_buku}
                                </span>
                            </div>
                        </div>

                        {/* Stok */}
                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-xs font-semibold text-gray-700 mb-2">Stok Buku</p>
                            <div className="flex gap-3">
                                {[
                                    { label: 'Total', val: selected.jumlah_total, color: 'text-gray-900' },
                                    { label: 'Tersedia', val: selected.jumlah_tersedia, color: 'text-green-600' },
                                    { label: 'Dipinjam', val: (selected.jumlah_total || 0) - (selected.jumlah_tersedia || 0), color: 'text-amber-600' },
                                ].map(s => (
                                    <div key={s.label} className="flex-1 text-center bg-white rounded-lg py-2 border border-gray-100">
                                        <p className={`text-lg font-bold ${s.color}`}>{s.val}</p>
                                        <p className="text-[10px] text-gray-500">{s.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Info rows */}
                        {[
                            { label: 'Penerbit', value: selected.penerbit },
                            { label: 'Tahun Terbit', value: selected.tahun_terbit?.toString() },
                            { label: 'ISBN', value: selected.isbn },
                            { label: 'Kategori', value: selected.kategori?.nama },
                            { label: 'Rak / Lemari', value: selected.rak ? `${selected.rak.kode_rak} — ${selected.rak.nama_rak}` : null },
                        ].filter(r => r.value).map(row => (
                            <div key={row.label} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                                <span className="text-xs text-gray-500">{row.label}</span>
                                <span className="text-sm font-medium text-gray-900 text-right max-w-[60%]">{row.value}</span>
                            </div>
                        ))}

                        {selected.deskripsi && (
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-500 mb-1">Deskripsi</p>
                                <p className="text-sm text-gray-700 leading-relaxed">{selected.deskripsi}</p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Notifikasi */}
            <Modal isOpen={notif.show}
                onClose={() => setNotif(n => ({ ...n, show: false }))}
                title={notif.success ? 'Berhasil' : 'Gagal'}>
                <div className="flex flex-col items-center py-2 gap-3">
                    {notif.success
                        ? <CheckCircle2 className="w-14 h-14 text-green-500" />
                        : <XCircle className="w-14 h-14 text-red-500" />
                    }
                    <p className="text-sm text-gray-700 text-center">{notif.message}</p>
                </div>
            </Modal>

            {/* Cover Preview Modal */}
            <Modal isOpen={!!previewCoverUrl}
                onClose={() => setPreviewCoverUrl(null)}
                title="Sampul Buku">
                <div className="flex justify-center p-2 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                    {previewCoverUrl && (
                        <img
                            src={previewCoverUrl}
                            alt="Sampul Buku"
                            className="max-w-full max-h-[60vh] object-contain rounded-xl"
                        />
                    )}
                </div>
            </Modal>
        </div>
    )
}