'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import {
    Search, Plus, BookMarked, CheckCircle2, XCircle,
    Clock, AlertTriangle, BookOpen, User, X,
    CalendarDays, RotateCcw, ChevronDown, Filter, FileText, Trash2,
} from 'lucide-react'
import Modal from '@/app/components/Modal'
import { createClient } from '@/utils/supabase/client'

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
interface SiswaOption {
    id: string
    nis: string
    nama_lengkap: string
    kelas: string | null
}

interface BukuOption {
    id: string
    kode_buku: string
    judul: string
    jumlah_tersedia: number
    jumlah_total: number
}

interface Peminjaman {
    id: string
    siswa_id: string | null
    buku_id: string | null
    petugas_id: string | null
    tanggal_pinjam: string
    tanggal_jatuh_tempo: string
    tanggal_kembali: string | null
    status: 'dipinjam' | 'terlambat' | 'dikembalikan'
    jumlah: number
    denda: number
    catatan: string | null
    created_at: string
    siswa: { id: string; nis: string; nama_lengkap: string; kelas: string | null } | null
    buku: { id: string; kode_buku: string; judul: string; jumlah_tersedia: number; jumlah_total: number } | null
    petugas: { id: string; nama_lengkap: string } | null
}

type FormData = {
    siswa_id: string
    buku_id: string
    jumlah: string
    tanggal_pinjam: string
    tanggal_jatuh_tempo: string
    catatan: string
}

interface PeminjamanClientProps {
    peminjamanData: Peminjaman[]
    siswaList: SiswaOption[]
    bukuList: BukuOption[]
    user: { id: string; nama_lengkap: string; role: string }
}

/* ─────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────── */
const PAGE_SIZE = 10

const today = () => new Date().toISOString().split('T')[0]
const addDays = (date: string, days: number) => {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    return d.toISOString().split('T')[0]
}
const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

const isOverdue = (jatuhTempo: string) => new Date(jatuhTempo) < new Date(today())

/* ─────────────────────────────────────────
   SKELETON
───────────────────────────────────────── */
function SkeletonCard() {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 animate-pulse">
            <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-gray-200 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
                <div className="w-16 h-6 bg-gray-200 rounded-full" />
            </div>
            <div className="h-3 bg-gray-100 rounded w-3/4" />
            <div className="h-8 bg-gray-100 rounded-lg" />
        </div>
    )
}

/* ─────────────────────────────────────────
   SEARCHABLE SELECT — untuk siswa & buku
───────────────────────────────────────── */
interface SearchableSelectProps {
    value: string
    placeholder: string
    options: { value: string; label: string; sub?: string }[]
    disabled?: boolean
    onChange: (val: string) => void
}

function SearchableSelect({ value, placeholder, options, disabled, onChange }: SearchableSelectProps) {
    const [open, setOpen]       = useState(false)
    const [query, setQuery]     = useState('')
    const ref                   = useRef<HTMLDivElement>(null)
    const selected              = options.find(o => o.value === value)

    const filtered = useMemo(() =>
        options.filter(o =>
            o.label.toLowerCase().includes(query.toLowerCase()) ||
            (o.sub ?? '').toLowerCase().includes(query.toLowerCase())
        ).slice(0, 50)
    , [options, query])

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false)
                setQuery('')
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                disabled={disabled}
                onClick={() => { if (!disabled) setOpen(p => !p) }}
                className={`w-full px-3 py-2.5 border rounded-lg text-sm text-left flex items-center justify-between transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed outline-none ${
                    open ? 'border-accent ring-2 ring-accent/20' : 'border-gray-200'
                }`}
            >
                <span className={selected ? 'text-gray-900' : 'text-gray-400'}>
                    {selected ? selected.label : placeholder}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    {/* Search input */}
                    <div className="p-2 border-b border-gray-100">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input
                                autoFocus
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Cari..."
                                className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-accent"
                            />
                        </div>
                    </div>
                    {/* Options */}
                    <div className="max-h-44 overflow-y-auto">
                        {filtered.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-4">Tidak ditemukan</p>
                        ) : filtered.map(o => (
                            <button
                                key={o.value}
                                type="button"
                                onClick={() => { onChange(o.value); setOpen(false); setQuery('') }}
                                className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                                    o.value === value ? 'bg-accent/5' : ''
                                }`}
                            >
                                <p className={`text-sm ${o.value === value ? 'text-accent font-semibold' : 'text-gray-900'}`}>
                                    {o.label}
                                </p>
                                {o.sub && <p className="text-xs text-gray-400 mt-0.5">{o.sub}</p>}
                            </button>
                        ))}
                    </div>
                </div>
            )}
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
    siswaOptions: { value: string; label: string; sub?: string }[]
    bukuOptions: { value: string; label: string; sub?: string }[]
    onChange: (key: keyof FormData, val: string) => void
}

function PeminjamanFormFields({ form, formError, disabled, siswaOptions, bukuOptions, onChange }: FormFieldsProps) {
    return (
        <div className="space-y-4">
            {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-xs text-red-600 font-medium">{formError}</p>
                </div>
            )}

            {/* Siswa */}
            <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Siswa <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                    value={form.siswa_id}
                    placeholder="Pilih siswa..."
                    options={siswaOptions}
                    disabled={disabled}
                    onChange={val => onChange('siswa_id', val)}
                />
            </div>

            {/* Buku */}
            <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Buku <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                    value={form.buku_id}
                    placeholder="Pilih buku..."
                    options={bukuOptions}
                    disabled={disabled}
                    onChange={val => onChange('buku_id', val)}
                />
            </div>

            {/* Jumlah */}
            <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Jumlah Dipinjam <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                    <button type="button" disabled={disabled}
                        onClick={() => {
                            const cur = parseInt(form.jumlah) || 1
                            if (cur > 1) onChange('jumlah', String(cur - 1))
                        }}
                        className="w-10 h-10 flex-shrink-0 rounded-lg border border-gray-200 flex items-center justify-center text-lg font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                        −
                    </button>
                    <input type="number" value={form.jumlah} disabled={disabled}
                        onChange={e => {
                            const val = Math.max(1, parseInt(e.target.value) || 1)
                            onChange('jumlah', String(val))
                        }}
                        min="1"
                        className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-center focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:bg-gray-50 outline-none font-semibold" />
                    <button type="button" disabled={disabled}
                        onClick={() => {
                            const cur = parseInt(form.jumlah) || 1
                            onChange('jumlah', String(cur + 1))
                        }}
                        className="w-10 h-10 flex-shrink-0 rounded-lg border border-gray-200 flex items-center justify-center text-lg font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                        +
                    </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Jumlah eksemplar yang dipinjam</p>
            </div>

            {/* Tanggal Pinjam & Jatuh Tempo */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Tgl. Pinjam <span className="text-red-500">*</span>
                    </label>
                    <input type="date" value={form.tanggal_pinjam} disabled={disabled}
                        onChange={e => {
                            onChange('tanggal_pinjam', e.target.value)
                            // Auto update jatuh tempo = tanggal pinjam + 1 hari
                            onChange('tanggal_jatuh_tempo', addDays(e.target.value, 1))
                        }}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:bg-gray-50 outline-none" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Jatuh Tempo <span className="text-red-500">*</span>
                    </label>
                    <input type="date" value={form.tanggal_jatuh_tempo} disabled={disabled}
                        min={form.tanggal_pinjam}
                        onChange={e => onChange('tanggal_jatuh_tempo', e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:bg-gray-50 outline-none" />
                </div>
            </div>

            {/* Catatan */}
            <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Catatan</label>
                <textarea value={form.catatan} disabled={disabled} rows={2}
                    onChange={e => onChange('catatan', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none disabled:bg-gray-50 outline-none"
                    placeholder="Catatan tambahan (opsional)" />
            </div>
        </div>
    )
}

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function PeminjamanClient({
    peminjamanData, siswaList, bukuList, user
}: PeminjamanClientProps) {
    const [list, setList]             = useState<Peminjaman[]>(peminjamanData)
    const [searchQuery, setSearch]    = useState('')
    const [filterStatus, setFilter]   = useState('')

    // Infinite scroll
    const [visibleCount, setVisible]  = useState(PAGE_SIZE)
    const [loadingMore, setLoadMore]  = useState(false)
    const sentinelRef = useRef<HTMLDivElement>(null)
    const observerRef = useRef<IntersectionObserver | null>(null)

    // Modals
    const [showAddModal,      setShowAddModal]      = useState(false)
    const [showKembaliModal,  setShowKembaliModal]  = useState(false)
    const [showDetailModal,   setShowDetailModal]   = useState(false)
    const [showDeleteModal,   setShowDeleteModal]   = useState(false)
    const [notif, setNotif] = useState<{ show: boolean; success: boolean; message: string }>({
        show: false, success: true, message: ''
    })

    const [selected,     setSelected]     = useState<Peminjaman | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDeleting,   setIsDeleting]   = useState(false)
    const [formError,    setFormError]    = useState('')

    // Tanggal kembali untuk pengembalian
    const [tanggalKembali, setTanggalKembali] = useState(today())

    const [form, setForm] = useState<FormData>({
        siswa_id: '', buku_id: '',
        jumlah: '1',
        tanggal_pinjam: today(),
        tanggal_jatuh_tempo: addDays(today(), 1),
        catatan: '',
    })

    const supabase = createClient()

    /* ── options untuk SearchableSelect ── */
    const siswaOptions = useMemo(() =>
        siswaList.map(s => ({
            value: s.id,
            label: s.nama_lengkap,
            sub:   `${s.nis}${s.kelas ? ` · Kelas ${s.kelas}` : ''}`,
        }))
    , [siswaList])

    const bukuOptions = useMemo(() =>
        bukuList.map(b => ({
            value: b.id,
            label: b.judul,
            sub:   `${b.kode_buku} · Tersedia: ${b.jumlah_tersedia}`,
        }))
    , [bukuList])

    /* ── filter ── */
    const filtered = useMemo(() => {
        // Auto-update status terlambat secara lokal
        const withStatus = list.map(p => ({
            ...p,
            status: (p.status === 'dipinjam' && isOverdue(p.tanggal_jatuh_tempo))
                ? 'terlambat' as const
                : p.status
        }))

        const q = searchQuery.toLowerCase()
        return withStatus.filter(p => {
            const matchSearch =
                (p.siswa?.nama_lengkap ?? '').toLowerCase().includes(q) ||
                (p.siswa?.nis ?? '').toLowerCase().includes(q) ||
                (p.buku?.judul ?? '').toLowerCase().includes(q) ||
                (p.buku?.kode_buku ?? '').toLowerCase().includes(q)
            const matchStatus = !filterStatus || p.status === filterStatus
            return matchSearch && matchStatus
        })
    }, [list, searchQuery, filterStatus])

    useEffect(() => { setVisible(PAGE_SIZE) }, [searchQuery, filterStatus])

    const visibleList = filtered.slice(0, visibleCount)
    const hasMore     = visibleCount < filtered.length

    /* ── Infinite scroll ── */
    const loadMore = useCallback(() => {
        if (loadingMore || !hasMore) return
        setLoadMore(true)
        setTimeout(() => { setVisible(p => p + PAGE_SIZE); setLoadMore(false) }, 300)
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

    /* ── stats ── */
    const stats = useMemo(() => {
        const withStatus = list.map(p => ({
            ...p,
            status: (p.status === 'dipinjam' && isOverdue(p.tanggal_jatuh_tempo))
                ? 'terlambat' as const : p.status
        }))
        return {
            total:    list.length,
            dipinjam: withStatus.filter(p => p.status === 'dipinjam').length,
            terlambat: withStatus.filter(p => p.status === 'terlambat').length,
        }
    }, [list])

    /* ── helpers ── */
    const handleFormChange = (key: keyof FormData, val: string) =>
        setForm(prev => ({ ...prev, [key]: val }))

    const showNotif = (success: boolean, message: string) =>
        setNotif({ show: true, success, message })

    const openAdd = () => {
        setForm({
            siswa_id: '', buku_id: '',
            jumlah: '1',
            tanggal_pinjam: today(),
            tanggal_jatuh_tempo: addDays(today(), 1),
            catatan: '',
        })
        setFormError('')
        setShowAddModal(true)
    }

    const openKembali = (p: Peminjaman) => {
        setSelected(p)
        setTanggalKembali(today())
        setShowKembaliModal(true)
    }

    const openDetail = (p: Peminjaman) => { setSelected(p); setShowDetailModal(true) }
    const openDelete = (p: Peminjaman) => { setSelected(p); setShowDeleteModal(true) }

    /* ── Tambah Peminjaman ── */
    const handleAdd = async () => {
        if (!form.siswa_id) { setFormError('Pilih siswa terlebih dahulu'); return }
        if (!form.buku_id)  { setFormError('Pilih buku terlebih dahulu'); return }
        if (!form.tanggal_pinjam || !form.tanggal_jatuh_tempo) {
            setFormError('Tanggal wajib diisi'); return
        }
        const jumlahPinjam = parseInt(form.jumlah) || 1
        const bukuDipilih  = bukuList.find(b => b.id === form.buku_id)
        if (bukuDipilih && jumlahPinjam > bukuDipilih.jumlah_tersedia) {
            setFormError(`Stok tidak cukup. Tersedia: ${bukuDipilih.jumlah_tersedia} eksemplar`)
            return
        }
        setFormError('')
        setIsSubmitting(true)

        const { data, error } = await supabase
            .from('peminjaman')
            .insert([{
                siswa_id:           form.siswa_id,
                buku_id:            form.buku_id,
                petugas_id:         user.id,
                tanggal_pinjam:     form.tanggal_pinjam,
                tanggal_jatuh_tempo: form.tanggal_jatuh_tempo,
                catatan:            form.catatan || null,
                jumlah:             parseInt(form.jumlah) || 1,
                status:             'dipinjam',
            }])
            .select(`
                *,
                siswa:siswa_id ( id, nis, nama_lengkap, kelas ),
                buku:buku_id ( id, kode_buku, judul, jumlah_tersedia, jumlah_total ),
                petugas:petugas_id ( id, nama_lengkap )
            `)
            .single()

        if (error) {
            setFormError('Gagal: ' + error.message)
            setIsSubmitting(false)
            return
        }

        // Kurangi jumlah_tersedia buku sesuai jumlah yang dipinjam
        await supabase
            .from('buku')
            .update({ jumlah_tersedia: (data.buku?.jumlah_tersedia ?? 1) - (parseInt(form.jumlah) || 1) })
            .eq('id', form.buku_id)

        setList(prev => [data, ...prev])
        setShowAddModal(false)
        setIsSubmitting(false)
        showNotif(true, `Peminjaman "${data.buku?.judul}" atas nama "${data.siswa?.nama_lengkap}" berhasil dicatat`)
    }

    /* ── Kembalikan Buku ── */
    const handleKembali = async () => {
        if (!selected) return
        setIsSubmitting(true)

        const isLate = new Date(tanggalKembali) > new Date(selected.tanggal_jatuh_tempo)
        const newStatus = isLate ? 'terlambat' : 'dikembalikan'

        const { data, error } = await supabase
            .from('peminjaman')
            .update({
                tanggal_kembali: tanggalKembali,
                status:          newStatus,
            })
            .eq('id', selected.id)
            .select(`
                *,
                siswa:siswa_id ( id, nis, nama_lengkap, kelas ),
                buku:buku_id ( id, kode_buku, judul, jumlah_tersedia, jumlah_total ),
                petugas:petugas_id ( id, nama_lengkap )
            `)
            .single()

        if (error) {
            setIsSubmitting(false)
            showNotif(false, 'Gagal mencatat pengembalian')
            return
        }

        // Kembalikan jumlah_tersedia buku sesuai jumlah yang dipinjam
        await supabase
            .from('buku')
            .update({ jumlah_tersedia: (data.buku?.jumlah_tersedia ?? 0) + (selected.jumlah || 1) })
            .eq('id', selected.buku_id!)

        // Hapus dari list aktif (sudah pindah ke riwayat via trigger)
        setList(prev => prev.filter(p => p.id !== selected.id))
        setShowKembaliModal(false)
        setIsSubmitting(false)
        showNotif(true,
            isLate
                ? `Buku "${data.buku?.judul}" dikembalikan (terlambat)`
                : `Buku "${data.buku?.judul}" berhasil dikembalikan`
        )
    }

    /* ── Hapus Peminjaman ── */
    const handleDelete = async () => {
        if (!selected) return
        setIsDeleting(true)

        // Kembalikan stok dulu
        if (selected.buku_id && selected.buku) {
            await supabase
                .from('buku')
                .update({ jumlah_tersedia: (selected.buku.jumlah_tersedia ?? 0) + (selected.jumlah || 1) })
                .eq('id', selected.buku_id)
        }

        const { error } = await supabase.from('peminjaman').delete().eq('id', selected.id)

        if (error) {
            setIsDeleting(false)
            setShowDeleteModal(false)
            showNotif(false, 'Gagal menghapus data peminjaman')
            return
        }

        setList(prev => prev.filter(p => p.id !== selected.id))
        setShowDeleteModal(false)
        setIsDeleting(false)
        showNotif(true, 'Data peminjaman berhasil dihapus')
    }

    /* ── render ── */
    return (
        <div className="px-4 py-6 space-y-5">

            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-gray-900">Peminjaman Buku</h1>
                <p className="text-sm text-gray-500 mt-0.5">Kelola peminjaman buku aktif</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-3 text-white">
                    <BookMarked className="w-6 h-6 opacity-80 mb-1" />
                    <p className="text-xl font-bold">{stats.total}</p>
                    <p className="text-[10px] opacity-80">Total Aktif</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-3 text-white">
                    <BookOpen className="w-6 h-6 opacity-80 mb-1" />
                    <p className="text-xl font-bold">{stats.dipinjam}</p>
                    <p className="text-[10px] opacity-80">Dipinjam</p>
                </div>
                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-3 text-white">
                    <AlertTriangle className="w-6 h-6 opacity-80 mb-1" />
                    <p className="text-xl font-bold">{stats.terlambat}</p>
                    <p className="text-[10px] opacity-80">Terlambat</p>
                </div>
            </div>

            {/* Search + Filter */}
            <div className="space-y-2">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={searchQuery}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Cari siswa, NIS, atau judul buku..."
                        className="w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none" />
                    {searchQuery && (
                        <button onClick={() => setSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Filter */}
                <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-700">Filter</p>
                        {filterStatus && (
                            <button onClick={() => setFilter('')}
                                className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1">
                                <X className="w-3 h-3" /> Reset
                            </button>
                        )}
                    </div>
                    <select value={filterStatus} onChange={e => setFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-accent">
                        <option value="">Semua Status</option>
                        <option value="dipinjam">Dipinjam</option>
                        <option value="terlambat">Terlambat</option>
                    </select>
                </div>
            </div>

            {/* Tambah Button */}
            <button onClick={openAdd}
                className="w-full py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 text-sm">
                <Plus className="w-4 h-4" /> Catat Peminjaman Baru
            </button>

            {/* List */}
            <div className="space-y-3">
                <p className="text-sm font-bold text-gray-900">
                    Peminjaman Aktif ({filtered.length})
                    {visibleCount < filtered.length && (
                        <span className="text-xs font-normal text-gray-400"> — menampilkan {visibleList.length}</span>
                    )}
                </p>

                {filtered.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                        <BookMarked className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">
                            {searchQuery || filterStatus ? 'Tidak ada peminjaman ditemukan' : 'Belum ada peminjaman aktif'}
                        </p>
                    </div>
                ) : (
                    <>
                        {visibleList.map(p => {
                            const overdue = isOverdue(p.tanggal_jatuh_tempo)
                            const status  = (p.status === 'dipinjam' && overdue) ? 'terlambat' : p.status

                            return (
                                <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                                    {/* Top row */}
                                    <div className="flex items-start gap-3">
                                        {/* Avatar siswa */}
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                                            status === 'terlambat' ? 'bg-red-400' : 'bg-primary'
                                        }`}>
                                            {p.siswa?.nama_lengkap?.charAt(0).toUpperCase() ?? '?'}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <button onClick={() => openDetail(p)}
                                                className="font-semibold text-gray-900 text-sm hover:text-accent transition-colors text-left block truncate w-full">
                                                {p.siswa?.nama_lengkap ?? '—'}
                                            </button>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {p.siswa?.nis}
                                                {p.siswa?.kelas && ` · Kelas ${p.siswa.kelas}`}
                                            </p>
                                        </div>

                                        {/* Status badge */}
                                        <span className={`text-xs px-2 py-1 rounded-full font-semibold flex-shrink-0 ${
                                            status === 'terlambat'
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {status === 'terlambat' ? '⚠ Terlambat' : 'Dipinjam'}
                                        </span>
                                    </div>

                                    {/* Buku info */}
                                    <div className="bg-gray-50 rounded-lg px-3 py-2 flex items-center gap-2">
                                        <BookOpen className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                        <p className="text-xs text-gray-700 truncate font-medium flex-1">{p.buku?.judul ?? '—'}</p>
                                        <span className="text-xs font-mono text-gray-400 flex-shrink-0">{p.buku?.kode_buku}</span>
                                        <span className="text-xs bg-accent/10 text-accent font-semibold px-1.5 py-0.5 rounded flex-shrink-0">
                                            ×{p.jumlah || 1}
                                        </span>
                                    </div>

                                    {/* Tanggal */}
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <CalendarDays className="w-3.5 h-3.5" />
                                            <span>Pinjam: {formatDate(p.tanggal_pinjam)}</span>
                                        </div>
                                        <div className={`flex items-center gap-1 ${
                                            overdue ? 'text-red-600 font-semibold' : ''
                                        }`}>
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>Tempo: {formatDate(p.tanggal_jatuh_tempo)}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <button onClick={() => openKembali(p)}
                                            className="flex-1 py-2 bg-green-50 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-100 transition-colors flex items-center justify-center gap-1">
                                            <RotateCcw className="w-3.5 h-3.5" /> Kembalikan
                                        </button>
                                        <button onClick={() => openDetail(p)}
                                            className="px-3 py-2 bg-gray-50 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors flex items-center justify-center">
                                            <FileText className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => openDelete(p)}
                                            className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors flex items-center justify-center">
                                            <X className="w-3.5 h-3.5" />
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

            {/* Tambah Peminjaman */}
            <Modal isOpen={showAddModal}
                onClose={() => { if (!isSubmitting) { setShowAddModal(false); setFormError('') } }}
                title="Catat Peminjaman Baru"
                confirmation={{
                    negativeBtn: 'Batal', positiveBtn: 'Simpan',
                    handlePositiveBtn: handleAdd,
                    loading: { text: 'Menyimpan...', isLoading: isSubmitting, setIsLoading: setIsSubmitting }
                }}>
                <PeminjamanFormFields
                    form={form} formError={formError} disabled={isSubmitting}
                    siswaOptions={siswaOptions} bukuOptions={bukuOptions}
                    onChange={handleFormChange}
                />
            </Modal>

            {/* Kembalikan Buku */}
            <Modal isOpen={showKembaliModal}
                onClose={() => { if (!isSubmitting) setShowKembaliModal(false) }}
                title="Kembalikan Buku"
                confirmation={{
                    negativeBtn: 'Batal', positiveBtn: 'Konfirmasi Pengembalian',
                    handlePositiveBtn: handleKembali,
                    loading: { text: 'Memproses...', isLoading: isSubmitting, setIsLoading: setIsSubmitting }
                }}>
                {selected && (
                    <div className="space-y-4">
                        {/* Info peminjaman */}
                        <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <p className="text-sm font-semibold text-gray-900">{selected.siswa?.nama_lengkap}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <p className="text-sm text-gray-700 line-clamp-1">{selected.buku?.judul}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <p className="text-xs text-gray-500">
                                    Jatuh tempo: <span className={`font-semibold ${
                                        isOverdue(selected.tanggal_jatuh_tempo) ? 'text-red-600' : 'text-gray-700'
                                    }`}>
                                        {formatDate(selected.tanggal_jatuh_tempo)}
                                    </span>
                                    {isOverdue(selected.tanggal_jatuh_tempo) && (
                                        <span className="text-red-500 ml-1">⚠ Terlambat</span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Tanggal kembali */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                Tanggal Kembali <span className="text-red-500">*</span>
                            </label>
                            <input type="date" value={tanggalKembali}
                                onChange={e => setTanggalKembali(e.target.value)}
                                max={today()}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none" />
                        </div>

                        {/* Warning terlambat */}
                        {tanggalKembali > selected.tanggal_jatuh_tempo && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-amber-700">
                                    Pengembalian terlambat. Status akan dicatat sebagai <strong>Terlambat</strong>.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Detail */}
            <Modal isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                title="Detail Peminjaman">
                {selected && (() => {
                    const overdue = isOverdue(selected.tanggal_jatuh_tempo)
                    const status  = (selected.status === 'dipinjam' && overdue) ? 'terlambat' : selected.status
                    return (
                        <div className="space-y-4">
                            {/* Status hero */}
                            <div className={`rounded-xl p-4 ${
                                status === 'terlambat' ? 'bg-red-50 border border-red-100' : 'bg-blue-50 border border-blue-100'
                            }`}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                        status === 'terlambat' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                        {status === 'terlambat' ? '⚠ Terlambat' : 'Dipinjam'}
                                    </span>
                                    <span className="text-xs text-gray-500 font-mono">
                                        {selected.buku?.kode_buku}
                                    </span>
                                </div>
                                <p className="font-bold text-gray-900">{selected.buku?.judul}</p>
                            </div>

                            {/* Info rows */}
                            {[
                                { label: 'Peminjam',     value: selected.siswa?.nama_lengkap },
                                { label: 'NIS',          value: selected.siswa?.nis },
                                { label: 'Kelas',        value: selected.siswa?.kelas ? `Kelas ${selected.siswa.kelas}` : null },
                                { label: 'Jumlah',       value: `${selected.jumlah || 1} eksemplar` },
                                { label: 'Tgl. Pinjam',  value: formatDate(selected.tanggal_pinjam) },
                                { label: 'Jatuh Tempo',  value: formatDate(selected.tanggal_jatuh_tempo) },
                                { label: 'Petugas',      value: selected.petugas?.nama_lengkap },
                            ].filter(r => r.value).map(row => (
                                <div key={row.label} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                                    <span className="text-xs text-gray-500">{row.label}</span>
                                    <span className="text-sm font-medium text-gray-900">{row.value}</span>
                                </div>
                            ))}

                            {/* Catatan — selalu tampil */}
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-500 mb-1">Catatan</p>
                                <p className="text-sm text-gray-700">
                                    {selected.catatan || <span className="text-gray-400 italic">Tidak ada catatan</span>}
                                </p>
                            </div>

                            {/* Tombol aksi di dalam detail modal */}
                            <div className="flex gap-2 pt-1">
                                <button
                                    onClick={() => {
                                        setShowDetailModal(false)
                                        setTimeout(() => openKembali(selected), 150)
                                    }}
                                    className="flex-1 py-2.5 bg-green-50 text-green-700 rounded-xl text-sm font-semibold hover:bg-green-100 transition-colors flex items-center justify-center gap-1.5">
                                    <RotateCcw className="w-4 h-4" /> Kembalikan
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDetailModal(false)
                                        setTimeout(() => openDelete(selected), 150)
                                    }}
                                    className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )
                })()}
            </Modal>

            {/* Hapus */}
            <Modal isOpen={showDeleteModal}
                onClose={() => !isDeleting && setShowDeleteModal(false)}
                title="Hapus Data Peminjaman"
                confirmation={{
                    negativeBtn: 'Batal', positiveBtn: 'Ya, Hapus',
                    handlePositiveBtn: handleDelete,
                    loading: { text: 'Menghapus...', isLoading: isDeleting, setIsLoading: setIsDeleting }
                }}>
                <p className="text-sm text-gray-600">
                    Apakah Anda yakin ingin menghapus data peminjaman buku{' '}
                    <strong className="text-gray-900">"{selected?.buku?.judul}"</strong> oleh{' '}
                    <strong className="text-gray-900">{selected?.siswa?.nama_lengkap}</strong>?
                </p>
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Stok buku akan dikembalikan secara otomatis.
                </p>
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

        </div>
    )
}