'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import {
    Search, Trash2, X, History,
    BookOpen, CheckCircle2, XCircle,
    Clock, AlertTriangle, CalendarDays,
    User, FileText, ChevronDown, ChevronUp,
} from 'lucide-react'
import Modal from '@/app/components/Modal'
import { createClient } from '@/utils/supabase/client'

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
interface Riwayat {
    id: string
    peminjaman_id: string | null
    siswa_id: string | null
    buku_id: string | null
    petugas_id: string | null
    tanggal_pinjam: string
    tanggal_jatuh_tempo: string
    tanggal_kembali: string
    status: 'dikembalikan' | 'terlambat'
    denda: number
    catatan: string | null
    created_at: string
    siswa: { id: string; nis: string; nama_lengkap: string; kelas: string | null } | null
    buku: { id: string; kode_buku: string; judul: string } | null
    petugas: { id: string; nama_lengkap: string } | null
}

interface RiwayatClientProps {
    riwayatData: Riwayat[]
    user: { id: string; role: string; nama_lengkap: string }
}

/* ─────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────── */
const PAGE_SIZE = 10

const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

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
                <div className="w-20 h-6 bg-gray-200 rounded-full" />
            </div>
            <div className="h-3 bg-gray-100 rounded w-3/4" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
    )
}

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function RiwayatClient({ riwayatData, user }: RiwayatClientProps) {
    const [list, setList] = useState<Riwayat[]>(riwayatData)
    const [searchQuery, setSearch] = useState('')
    const [filterStatus, setFilter] = useState('')
    const [filterBulan, setBulan] = useState('')

    // Infinite scroll
    const [visibleCount, setVisible] = useState(PAGE_SIZE)
    const [loadingMore, setLoadMore] = useState(false)
    const sentinelRef = useRef<HTMLDivElement>(null)
    const observerRef = useRef<IntersectionObserver | null>(null)

    // Modals
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [notif, setNotif] = useState<{ show: boolean; success: boolean; message: string }>({
        show: false, success: true, message: ''
    })

    const [selected, setSelected] = useState<Riwayat | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const supabase = createClient()

    /* ── bulan options dari data ── */
    const bulanOptions = useMemo(() => {
        const set = new Set(
            list.map(r => r.tanggal_kembali.substring(0, 7)) // YYYY-MM
        )
        return [...set].sort((a, b) => b.localeCompare(a)) // terbaru dulu
    }, [list])

    /* ── filtered ── */
    const filtered = useMemo(() => {
        const q = searchQuery.toLowerCase()
        return list.filter(r => {
            const matchSearch =
                (r.siswa?.nama_lengkap ?? '').toLowerCase().includes(q) ||
                (r.siswa?.nis ?? '').toLowerCase().includes(q) ||
                (r.buku?.judul ?? '').toLowerCase().includes(q) ||
                (r.buku?.kode_buku ?? '').toLowerCase().includes(q)
            const matchStatus = !filterStatus || r.status === filterStatus
            const matchBulan = !filterBulan || r.tanggal_kembali.startsWith(filterBulan)
            return matchSearch && matchStatus && matchBulan
        })
    }, [list, searchQuery, filterStatus, filterBulan])

    useEffect(() => { setVisible(PAGE_SIZE) }, [searchQuery, filterStatus, filterBulan])

    const visibleList = filtered.slice(0, visibleCount)
    const hasMore = visibleCount < filtered.length

    /* ── infinite scroll ── */
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
    const stats = useMemo(() => ({
        total: list.length,
        dikembalikan: list.filter(r => r.status === 'dikembalikan').length,
        terlambat: list.filter(r => r.status === 'terlambat').length,
    }), [list])

    /* ── helpers ── */
    const showNotif = (success: boolean, message: string) =>
        setNotif({ show: true, success, message })

    const openDetail = (r: Riwayat) => { setSelected(r); setShowDetailModal(true) }
    const openDelete = (r: Riwayat) => { setSelected(r); setShowDeleteModal(true) }

    const activeFilterCount = [filterStatus, filterBulan].filter(Boolean).length

    /* ── Hapus riwayat ── */
    const handleDelete = async () => {
        if (!selected) return
        setIsDeleting(true)

        const { error } = await supabase
            .from('riwayat_peminjaman')
            .delete()
            .eq('id', selected.id)

        if (error) {
            setIsDeleting(false)
            setShowDeleteModal(false)
            showNotif(false, 'Gagal menghapus riwayat')
            return
        }

        const nama = selected.siswa?.nama_lengkap ?? '—'
        setList(prev => prev.filter(r => r.id !== selected.id))
        setShowDeleteModal(false)
        setIsDeleting(false)
        showNotif(true, `Riwayat peminjaman "${nama}" berhasil dihapus`)
    }

    /* ── render ── */
    return (
        <div className="px-4 py-6 space-y-5">

            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-gray-900">Riwayat Peminjaman</h1>
                <p className="text-sm text-gray-500 mt-0.5">Histori pengembalian buku</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-3 text-white">
                    <History className="w-6 h-6 opacity-80 mb-1" />
                    <p className="text-xl font-bold">{stats.total}</p>
                    <p className="text-[10px] opacity-80">Total Riwayat</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-3 text-white">
                    <CheckCircle2 className="w-6 h-6 opacity-80 mb-1" />
                    <p className="text-xl font-bold">{stats.dikembalikan}</p>
                    <p className="text-[10px] opacity-80">Tepat Waktu</p>
                </div>
                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-3 text-white">
                    <AlertTriangle className="w-6 h-6 opacity-80 mb-1" />
                    <p className="text-xl font-bold">{stats.terlambat}</p>
                    <p className="text-[10px] opacity-80">Terlambat</p>
                </div>
            </div>

            {/* Search */}
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

            {/* Filter Panel */}
            <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-700">Filter</p>
                    {activeFilterCount > 0 && (
                        <button onClick={() => { setFilter(''); setBulan('') }}
                            className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1">
                            <X className="w-3 h-3" /> Reset
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <select value={filterStatus} onChange={e => setFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-accent">
                        <option value="">Semua Status</option>
                        <option value="dikembalikan">Tepat Waktu</option>
                        <option value="terlambat">Terlambat</option>
                    </select>
                    <select value={filterBulan} onChange={e => setBulan(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-accent">
                        <option value="">Semua Bulan</option>
                        {bulanOptions.map(b => {
                            const [year, month] = b.split('-')
                            const label = new Date(`${b}-01`).toLocaleDateString('id-ID', {
                                month: 'long', year: 'numeric'
                            })
                            return <option key={b} value={b}>{label}</option>
                        })}
                    </select>
                </div>
            </div>

            {/* List */}
            <div className="space-y-3">
                <p className="text-sm font-bold text-gray-900">
                    Riwayat ({filtered.length})
                    {visibleCount < filtered.length && (
                        <span className="text-xs font-normal text-gray-400"> — menampilkan {visibleList.length}</span>
                    )}
                </p>

                {filtered.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                        <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">
                            {searchQuery || activeFilterCount > 0
                                ? 'Tidak ada riwayat ditemukan'
                                : 'Belum ada riwayat peminjaman'}
                        </p>
                    </div>
                ) : (
                    <>
                        {visibleList.map(r => (
                            <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                                {/* Top row */}
                                <div className="flex items-start gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${r.status === 'terlambat' ? 'bg-red-400' : 'bg-green-500'
                                        }`}>
                                        {r.siswa?.nama_lengkap?.charAt(0).toUpperCase() ?? '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <button onClick={() => openDetail(r)}
                                            className="font-semibold text-gray-900 text-sm hover:text-accent transition-colors text-left block truncate w-full">
                                            {r.siswa?.nama_lengkap ?? '—'}
                                        </button>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {r.siswa?.nis}
                                            {r.siswa?.kelas && ` · Kelas ${r.siswa.kelas}`}
                                        </p>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full font-semibold flex-shrink-0 ${r.status === 'terlambat'
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-green-100 text-green-700'
                                        }`}>
                                        {r.status === 'terlambat' ? '⚠ Terlambat' : '✓ Tepat Waktu'}
                                    </span>
                                </div>

                                {/* Buku info */}
                                <div className="bg-gray-50 rounded-lg px-3 py-2 flex items-center gap-2">
                                    <BookOpen className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                    <p className="text-xs text-gray-700 truncate font-medium flex-1">
                                        {r.buku?.judul ?? '—'}
                                    </p>
                                    <span className="text-xs font-mono text-gray-400 flex-shrink-0">
                                        {r.buku?.kode_buku}
                                    </span>
                                </div>

                                {/* Tanggal row */}
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <CalendarDays className="w-3.5 h-3.5" />
                                        <span>Pinjam: {formatDate(r.tanggal_pinjam)}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-green-600 font-medium">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>Kembali: {formatDate(r.tanggal_kembali)}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button onClick={() => openDetail(r)}
                                        className="flex-1 py-2 bg-gray-50 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-1">
                                        <FileText className="w-3.5 h-3.5" /> Detail
                                    </button>
                                    {user.role === 'admin' && (
                                        <button onClick={() => openDelete(r)}
                                            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors flex items-center justify-center">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        {loadingMore && <><SkeletonCard /><SkeletonCard /></>}
                        <div ref={sentinelRef} className="h-4" />
                        {!hasMore && filtered.length > PAGE_SIZE && (
                            <p className="text-center text-xs text-gray-400 py-2">
                                Semua data telah ditampilkan
                            </p>
                        )}
                    </>
                )}
            </div>

            {/* ════ MODALS ════ */}

            {/* Detail */}
            <Modal isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                title="Detail Riwayat">
                {selected && (
                    <div className="space-y-4">
                        {/* Status hero */}
                        <div className={`rounded-xl p-4 ${selected.status === 'terlambat'
                                ? 'bg-red-50 border border-red-100'
                                : 'bg-green-50 border border-green-100'
                            }`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${selected.status === 'terlambat'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-green-100 text-green-700'
                                    }`}>
                                    {selected.status === 'terlambat' ? '⚠ Terlambat' : '✓ Tepat Waktu'}
                                </span>
                                <span className="text-xs text-gray-500 font-mono">
                                    {selected.buku?.kode_buku}
                                </span>
                            </div>
                            <p className="font-bold text-gray-900 leading-snug">
                                {selected.buku?.judul}
                            </p>
                        </div>

                        {/* Info rows */}
                        {[
                            { label: 'Peminjam', value: selected.siswa?.nama_lengkap },
                            { label: 'NIS', value: selected.siswa?.nis },
                            { label: 'Kelas', value: selected.siswa?.kelas ? `Kelas ${selected.siswa.kelas}` : null },
                            { label: 'Tgl. Pinjam', value: formatDate(selected.tanggal_pinjam) },
                            { label: 'Jatuh Tempo', value: formatDate(selected.tanggal_jatuh_tempo) },
                            { label: 'Tgl. Kembali', value: formatDate(selected.tanggal_kembali) },
                            { label: 'Petugas', value: selected.petugas?.nama_lengkap },
                        ].filter(r => r.value).map(row => (
                            <div key={row.label} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                                <span className="text-xs text-gray-500">{row.label}</span>
                                <span className={`text-sm font-medium text-right ${row.label === 'Tgl. Kembali'
                                        ? selected.status === 'terlambat' ? 'text-red-600' : 'text-green-600'
                                        : 'text-gray-900'
                                    }`}>
                                    {row.value}
                                </span>
                            </div>
                        ))}

                        {/* Catatan */}
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">Catatan</p>
                            <p className="text-sm text-gray-700">
                                {selected.catatan || (
                                    <span className="text-gray-400 italic">Tidak ada catatan</span>
                                )}
                            </p>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Hapus — admin only */}
            <Modal isOpen={showDeleteModal}
                onClose={() => !isDeleting && setShowDeleteModal(false)}
                title="Hapus Riwayat"
                confirmation={{
                    negativeBtn: 'Batal', positiveBtn: 'Ya, Hapus',
                    handlePositiveBtn: handleDelete,
                    loading: { text: 'Menghapus...', isLoading: isDeleting, setIsLoading: setIsDeleting }
                }}>
                <p className="text-sm text-gray-600">
                    Apakah Anda yakin ingin menghapus riwayat peminjaman buku{' '}
                    <strong className="text-gray-900">"{selected?.buku?.judul}"</strong> oleh{' '}
                    <strong className="text-gray-900">{selected?.siswa?.nama_lengkap}</strong>?
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