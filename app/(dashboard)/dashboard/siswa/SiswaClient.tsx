'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import {
    Search, Plus, Edit2, Trash2, GraduationCap,
    MapPin, Phone, Mail, Users, CheckCircle2, XCircle,
} from 'lucide-react'
import Modal from '@/app/components/Modal'
import { createClient } from '@/utils/supabase/client'

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
interface Siswa {
    id: string
    nis: string
    nisn: string | null
    nama_lengkap: string
    jenis_kelamin: 'Laki-laki' | 'Perempuan' | null
    tempat_lahir: string | null
    tanggal_lahir: string | null
    alamat: string | null
    telepon: string | null
    email: string | null
    kelas: string | null
    tahun_ajaran: string | null
    status: 'aktif' | 'lulus' | 'pindah' | 'keluar'
    created_at: string
}

type FormData = {
    nis: string
    nisn: string
    nama_lengkap: string
    jenis_kelamin: 'Laki-laki' | 'Perempuan'
    tempat_lahir: string
    tanggal_lahir: string
    alamat: string
    telepon: string
    email: string
    kelas_tingkat: string   // 'VII' | 'VIII' | 'IX' | ''
    kelas_nomor: string     // '1'-'8' | ''
    tahun_ajaran: string
    status: 'aktif' | 'lulus' | 'pindah' | 'keluar'
}

interface SiswaClientProps {
    siswaData: Siswa[]
    user: { role: string }
}

/* ─────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────── */
const PAGE_SIZE = 30

const TINGKAT_OPTIONS = ['VII', 'VIII', 'IX']
const NOMOR_OPTIONS   = ['1', '2', '3', '4', '5', '6', '7', '8']

const EMPTY_FORM: FormData = {
    nis: '', nisn: '', nama_lengkap: '',
    jenis_kelamin: 'Laki-laki',
    tempat_lahir: '', tanggal_lahir: '',
    alamat: '', telepon: '', email: '',
    kelas_tingkat: '',
    kelas_nomor: '',
    tahun_ajaran: '',
    status: 'aktif',
}

const STATUS_CONFIG = {
    aktif:  { label: 'Aktif',  bg: 'bg-green-100',  text: 'text-green-700'  },
    lulus:  { label: 'Lulus',  bg: 'bg-blue-100',   text: 'text-blue-700'   },
    pindah: { label: 'Pindah', bg: 'bg-yellow-100', text: 'text-yellow-700' },
    keluar: { label: 'Keluar', bg: 'bg-red-100',    text: 'text-red-700'    },
}

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
// Gabungkan tingkat + nomor → "VIII 3"
const buildKelas = (tingkat: string, nomor: string) =>
    tingkat && nomor ? `${tingkat} ${nomor}` : ''

// Pecah "VIII 3" → { tingkat: 'VIII', nomor: '3' }
const parseKelas = (kelas: string | null) => {
    if (!kelas) return { tingkat: '', nomor: '' }
    const parts = kelas.trim().split(' ')
    return { tingkat: parts[0] ?? '', nomor: parts[1] ?? '' }
}

/* ─────────────────────────────────────────
   SKELETON ROW
───────────────────────────────────────── */
function SkeletonRow() {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 animate-pulse">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-gray-200 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
                <div className="w-14 h-6 bg-gray-200 rounded-full" />
            </div>
            <div className="flex gap-2">
                <div className="flex-1 h-8 bg-gray-100 rounded-lg" />
                <div className="flex-1 h-8 bg-gray-100 rounded-lg" />
            </div>
        </div>
    )
}

/* ─────────────────────────────────────────
   FORM FIELDS — di luar komponen utama
   agar tidak re-mount saat state berubah
───────────────────────────────────────── */
interface FormFieldsProps {
    form: FormData
    formError: string
    disabled: boolean
    onChange: (key: keyof FormData, val: string) => void
}

function SiswaFormFields({ form, formError, disabled, onChange }: FormFieldsProps) {
    return (
        <div className="space-y-4">
            {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-xs text-red-600 font-medium">{formError}</p>
                </div>
            )}

            {/* NIS */}
            <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    NIS <span className="text-red-500">*</span>
                </label>
                <input type="text" value={form.nis} disabled={disabled}
                    onChange={e => onChange('nis', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:bg-gray-50 outline-none"
                    placeholder="Masukkan NIS" />
            </div>

            {/* NISN */}
            <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">NISN</label>
                <input type="text" value={form.nisn} disabled={disabled}
                    onChange={e => onChange('nisn', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:bg-gray-50 outline-none"
                    placeholder="Masukkan NISN (opsional)" />
            </div>

            {/* Nama Lengkap */}
            <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input type="text" value={form.nama_lengkap} disabled={disabled}
                    onChange={e => onChange('nama_lengkap', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:bg-gray-50 outline-none"
                    placeholder="Masukkan nama lengkap" />
            </div>

            {/* Jenis Kelamin */}
            <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Jenis Kelamin</label>
                <div className="flex gap-2">
                    <button type="button" disabled={disabled}
                        onClick={() => onChange('jenis_kelamin', 'Laki-laki')}
                        className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                            form.jenis_kelamin === 'Laki-laki'
                                ? 'bg-accent text-white border-accent'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-accent'
                        }`}>
                        ♂ Laki-laki
                    </button>
                    <button type="button" disabled={disabled}
                        onClick={() => onChange('jenis_kelamin', 'Perempuan')}
                        className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                            form.jenis_kelamin === 'Perempuan'
                                ? 'bg-pink-500 text-white border-pink-500'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-pink-400'
                        }`}>
                        ♀ Perempuan
                    </button>
                </div>
            </div>

            {/* Tempat & Tanggal Lahir */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tempat Lahir</label>
                    <input type="text" value={form.tempat_lahir} disabled={disabled}
                        onChange={e => onChange('tempat_lahir', e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:bg-gray-50 outline-none"
                        placeholder="Kota" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tanggal Lahir</label>
                    <input type="date" value={form.tanggal_lahir} disabled={disabled}
                        onChange={e => onChange('tanggal_lahir', e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:bg-gray-50 outline-none" />
                </div>
            </div>

            {/* Alamat */}
            <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Alamat</label>
                <textarea value={form.alamat} disabled={disabled} rows={2}
                    onChange={e => onChange('alamat', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none disabled:bg-gray-50 outline-none"
                    placeholder="Masukkan alamat lengkap" />
            </div>

            {/* Telepon & Email */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Telepon</label>
                    <input type="tel" value={form.telepon} disabled={disabled}
                        onChange={e => onChange('telepon', e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:bg-gray-50 outline-none"
                        placeholder="08xxx" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email</label>
                    <input type="email" value={form.email} disabled={disabled}
                        onChange={e => onChange('email', e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:bg-gray-50 outline-none"
                        placeholder="email@" />
                </div>
            </div>

            {/* ── KELAS: 2 field select ── */}
            <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Kelas</label>
                <div className="flex gap-2">
                    {/* Field 1: Tingkat */}
                    <select
                        value={form.kelas_tingkat}
                        disabled={disabled}
                        onChange={e => {
                            onChange('kelas_tingkat', e.target.value)
                            // Reset nomor saat tingkat berubah
                            onChange('kelas_nomor', '')
                        }}
                        className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:bg-gray-50 outline-none"
                    >
                        <option value="">-- Tingkat --</option>
                        {TINGKAT_OPTIONS.map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>

                    {/* Field 2: Nomor — aktif hanya jika tingkat sudah dipilih */}
                    <select
                        value={form.kelas_nomor}
                        disabled={disabled || !form.kelas_tingkat}
                        onChange={e => onChange('kelas_nomor', e.target.value)}
                        className={`flex-1 px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-colors ${
                            !form.kelas_tingkat
                                ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                                : 'border-gray-200 disabled:bg-gray-50'
                        }`}
                    >
                        <option value="">-- Nomor --</option>
                        {NOMOR_OPTIONS.map(n => (
                            <option key={n} value={n}>{n}</option>
                        ))}
                    </select>
                </div>
                {/* Preview kelas */}
                {form.kelas_tingkat && form.kelas_nomor && (
                    <p className="text-xs text-accent font-semibold mt-1.5 ml-1">
                        → Kelas: <span className="font-bold">{form.kelas_tingkat} {form.kelas_nomor}</span>
                    </p>
                )}
            </div>

            {/* Tahun Ajaran */}
            <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tahun Ajaran</label>
                <input type="text" value={form.tahun_ajaran} disabled={disabled}
                    onChange={e => onChange('tahun_ajaran', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:bg-gray-50 outline-none"
                    placeholder="2025/2026" />
            </div>

            {/* Status */}
            <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Status</label>
                <select value={form.status} disabled={disabled}
                    onChange={e => onChange('status', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:bg-gray-50 outline-none">
                    <option value="aktif">Aktif</option>
                    <option value="lulus">Lulus</option>
                    <option value="pindah">Pindah</option>
                    <option value="keluar">Keluar</option>
                </select>
            </div>
        </div>
    )
}

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function SiswaClient({ siswaData, user }: SiswaClientProps) {
    const [siswaList, setSiswaList]       = useState<Siswa[]>(siswaData)
    const [searchQuery,  setSearchQuery]  = useState('')
    const [filterStatus, setFilterStatus] = useState('semua')
    const [filterKelas,  setFilterKelas]  = useState('semua')

    // Infinite scroll
    const [visibleCount, setVisibleCount]   = useState(PAGE_SIZE)
    const [loadingMore,  setLoadingMore]    = useState(false)
    const observerRef = useRef<IntersectionObserver | null>(null)
    const sentinelRef = useRef<HTMLDivElement | null>(null)

    // Modals
    const [showAddModal,    setShowAddModal]    = useState(false)
    const [showEditModal,   setShowEditModal]   = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [notif, setNotif] = useState<{ show: boolean; success: boolean; message: string }>({
        show: false, success: true, message: ''
    })

    const [selected,     setSelected]     = useState<Siswa | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDeleting,   setIsDeleting]   = useState(false)
    const [formError,    setFormError]    = useState('')
    const [form,         setForm]         = useState<FormData>({ ...EMPTY_FORM })

    const supabase = createClient()

    /* ── filtered list ── */
    const filtered = useMemo(() => siswaList.filter(s => {
        const q = searchQuery.toLowerCase()
        const matchSearch =
            s.nama_lengkap.toLowerCase().includes(q) ||
            s.nis.toLowerCase().includes(q) ||
            (s.kelas ?? '').toLowerCase().includes(q)
        const matchStatus = filterStatus === 'semua' || s.status === filterStatus
        const matchKelas  = filterKelas  === 'semua' || s.kelas  === filterKelas
        return matchSearch && matchStatus && matchKelas
    }), [siswaList, searchQuery, filterStatus, filterKelas])

    // Reset visible count saat filter/search berubah
    useEffect(() => { setVisibleCount(PAGE_SIZE) }, [searchQuery, filterStatus, filterKelas])

    const visibleSiswa = filtered.slice(0, visibleCount)
    const hasMore      = visibleCount < filtered.length

    /* ── Infinite scroll via IntersectionObserver ── */
    const loadMore = useCallback(() => {
        if (loadingMore || !hasMore) return
        setLoadingMore(true)
        // Simulasi delay loading skeleton ~400ms
        setTimeout(() => {
            setVisibleCount(prev => prev + PAGE_SIZE)
            setLoadingMore(false)
        }, 400)
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

    /* ── Filter kelas options (unik dari data) ── */
    const kelasOptions = useMemo(() => {
        const set = new Set(siswaList.map(s => s.kelas).filter(Boolean)) as Set<string>
        return [...set].sort((a, b) => {
            const tingkatOrder = { VII: 0, VIII: 1, IX: 2 } as Record<string, number>
            const [ta, na] = a.split(' '); const [tb, nb] = b.split(' ')
            const to = (tingkatOrder[ta] ?? 99) - (tingkatOrder[tb] ?? 99)
            return to !== 0 ? to : parseInt(na || '0') - parseInt(nb || '0')
        })
    }, [siswaList])

    const stats = useMemo(() => ({
        total: siswaList.length,
        aktif: siswaList.filter(s => s.status === 'aktif').length,
    }), [siswaList])

    /* ── helpers ── */
    const tahunAjaranDefault = () => {
        const y = new Date().getFullYear()
        return `${y}/${y + 1}`
    }

    const handleFormChange = (key: keyof FormData, val: string) => {
        setForm(prev => ({ ...prev, [key]: val }))
    }

    const showNotif = (success: boolean, message: string) =>
        setNotif({ show: true, success, message })

    const openAdd = () => {
        setForm({ ...EMPTY_FORM, tahun_ajaran: tahunAjaranDefault() })
        setFormError('')
        setShowAddModal(true)
    }

    const openEdit = (s: Siswa) => {
        setSelected(s)
        const { tingkat, nomor } = parseKelas(s.kelas)
        setForm({
            nis:           s.nis,
            nisn:          s.nisn          ?? '',
            nama_lengkap:  s.nama_lengkap,
            jenis_kelamin: s.jenis_kelamin === 'Perempuan' ? 'Perempuan' : 'Laki-laki',
            tempat_lahir:  s.tempat_lahir  ?? '',
            tanggal_lahir: s.tanggal_lahir ?? '',
            alamat:        s.alamat        ?? '',
            telepon:       s.telepon       ?? '',
            email:         s.email         ?? '',
            kelas_tingkat: tingkat,
            kelas_nomor:   nomor,
            tahun_ajaran:  s.tahun_ajaran  ?? tahunAjaranDefault(),
            status:        s.status,
        })
        setFormError('')
        setShowEditModal(true)
    }

    const openDelete = (s: Siswa) => { setSelected(s); setShowDeleteModal(true) }
    const openDetail = (s: Siswa) => { setSelected(s); setShowDetailModal(true) }

    /* ── build payload ── */
    const buildPayload = () => ({
        nis:           form.nis.trim(),
        nisn:          form.nisn.trim()         || null,
        nama_lengkap:  form.nama_lengkap.trim(),
        jenis_kelamin: form.jenis_kelamin,
        tempat_lahir:  form.tempat_lahir.trim() || null,
        tanggal_lahir: form.tanggal_lahir       || null,
        alamat:        form.alamat.trim()       || null,
        telepon:       form.telepon.trim()      || null,
        email:         form.email.trim()        || null,
        kelas:         buildKelas(form.kelas_tingkat, form.kelas_nomor) || null,
        tahun_ajaran:  form.tahun_ajaran.trim() || null,
        status:        form.status,
    })

    const validate = (): string => {
        if (!form.nis.trim())          return 'NIS wajib diisi'
        if (!form.nama_lengkap.trim()) return 'Nama Lengkap wajib diisi'
        if (form.kelas_tingkat && !form.kelas_nomor) return 'Nomor kelas wajib dipilih'
        return ''
    }

    /* ── CRUD ── */
    const handleAdd = async () => {
        // Validasi dulu SEBELUM set loading
        const err = validate()
        if (err) { setFormError(err); return }   // loading tidak pernah aktif jika gagal validasi
        setFormError('')
        setIsSubmitting(true)  // baru set loading setelah validasi lolos

        const { data, error } = await supabase
            .from('siswa').insert([buildPayload()]).select().single()

        if (error) { setFormError('Gagal: ' + error.message); setIsSubmitting(false); return }

        setSiswaList(prev => [data, ...prev])
        setShowAddModal(false)
        setIsSubmitting(false)
        showNotif(true, `Siswa "${data.nama_lengkap}" berhasil ditambahkan`)
    }

    const handleEdit = async () => {
        if (!selected) return
        // Validasi dulu SEBELUM set loading
        const err = validate()
        if (err) { setFormError(err); return }   // loading tidak pernah aktif jika gagal validasi
        setFormError('')
        setIsSubmitting(true)  // baru set loading setelah validasi lolos

        const { data, error } = await supabase
            .from('siswa').update(buildPayload()).eq('id', selected.id).select().single()

        if (error) { setFormError('Gagal: ' + error.message); setIsSubmitting(false); return }

        setSiswaList(prev => prev.map(s => s.id === selected.id ? data : s))
        setShowEditModal(false)
        setIsSubmitting(false)
        showNotif(true, `Data "${data.nama_lengkap}" berhasil diperbarui`)
    }

    const handleDelete = async () => {
        if (!selected) return
        setIsDeleting(true)
        const { error } = await supabase.from('siswa').delete().eq('id', selected.id)

        if (error) {
            setIsDeleting(false)
            showNotif(false, 'Gagal menghapus data siswa')
            return
        }

        const nama = selected.nama_lengkap
        setSiswaList(prev => prev.filter(s => s.id !== selected.id))
        setShowDeleteModal(false)
        setIsDeleting(false)
        showNotif(true, `Siswa "${nama}" berhasil dihapus`)
    }

    /* ── render ── */
    return (
        <div className="px-4 py-6 space-y-5">

            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-gray-900">Data Siswa</h1>
                <p className="text-sm text-gray-500 mt-0.5">Kelola data siswa sekolah</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
                    <Users className="w-7 h-7 opacity-80 mb-2" />
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-xs opacity-80 mt-0.5">Total Siswa</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-white">
                    <GraduationCap className="w-7 h-7 opacity-80 mb-2" />
                    <p className="text-2xl font-bold">{stats.aktif}</p>
                    <p className="text-xs opacity-80 mt-0.5">Siswa Aktif</p>
                </div>
            </div>

            {/* Search + Filter */}
            <div className="space-y-2">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Cari nama atau NIS..."
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none" />
                </div>
                <div className="flex gap-2">
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none">
                        <option value="semua">Semua Status</option>
                        <option value="aktif">Aktif</option>
                        <option value="lulus">Lulus</option>
                        <option value="pindah">Pindah</option>
                        <option value="keluar">Keluar</option>
                    </select>
                    <select value={filterKelas} onChange={e => setFilterKelas(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none">
                        <option value="semua">Semua Kelas</option>
                        {kelasOptions.map(k => (
                            <option key={k} value={k}>{k}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Add Button */}
            <button onClick={openAdd}
                className="w-full py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 text-sm">
                <Plus className="w-4 h-4" />
                Tambah Siswa Baru
            </button>

            {/* List */}
            <div className="space-y-3">
                <p className="text-sm font-bold text-gray-900">
                    Daftar Siswa ({filtered.length}){' '}
                    {visibleCount < filtered.length && (
                        <span className="text-xs font-normal text-gray-400">
                            — menampilkan {visibleSiswa.length}
                        </span>
                    )}
                </p>

                {filtered.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">Tidak ada siswa ditemukan</p>
                    </div>
                ) : (
                    <>
                        {visibleSiswa.map(s => {
                            const st = STATUS_CONFIG[s.status]
                            return (
                                <div key={s.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-1 min-w-0">
                                            <button onClick={() => openDetail(s)}
                                                className="font-semibold text-gray-900 text-sm hover:text-accent transition-colors text-left w-full truncate block">
                                                {s.nama_lengkap}
                                            </button>
                                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                                    {s.nis}
                                                </span>
                                                {s.kelas && (
                                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
                                                        Kelas {s.kelas}
                                                    </span>
                                                )}
                                                <span className="text-xs text-gray-400">
                                                    {s.jenis_kelamin === 'Perempuan' ? '♀' : '♂'}
                                                </span>
                                            </div>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 font-medium ${st.bg} ${st.text}`}>
                                            {st.label}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => openEdit(s)}
                                            className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-1">
                                            <Edit2 className="w-3.5 h-3.5" /> Edit
                                        </button>
                                        <button onClick={() => openDelete(s)}
                                            className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-1">
                                            <Trash2 className="w-3.5 h-3.5" /> Hapus
                                        </button>
                                    </div>
                                </div>
                            )
                        })}

                        {/* Skeleton saat loading more */}
                        {loadingMore && (
                            <>
                                <SkeletonRow />
                                <SkeletonRow />
                                <SkeletonRow />
                            </>
                        )}

                        {/* Sentinel untuk IntersectionObserver */}
                        <div ref={sentinelRef} className="h-4" />

                        {/* End of list */}
                        {!hasMore && filtered.length > PAGE_SIZE && (
                            <p className="text-center text-xs text-gray-400 py-2">
                                Semua data telah ditampilkan
                            </p>
                        )}
                    </>
                )}
            </div>

            {/* ════ MODALS ════ */}

            {/* Add */}
            <Modal isOpen={showAddModal}
                onClose={() => { if (!isSubmitting) { setShowAddModal(false); setFormError('') } }}
                title="Tambah Siswa Baru"
                confirmation={{
                    negativeBtn: 'Batal', positiveBtn: 'Simpan',
                    handlePositiveBtn: handleAdd,
                    loading: { text: 'Menyimpan...', isLoading: isSubmitting, setIsLoading: setIsSubmitting }
                }}>
                <SiswaFormFields form={form} formError={formError} disabled={isSubmitting} onChange={handleFormChange} />
            </Modal>

            {/* Edit */}
            <Modal isOpen={showEditModal}
                onClose={() => { if (!isSubmitting) { setShowEditModal(false); setFormError('') } }}
                title="Edit Data Siswa"
                confirmation={{
                    negativeBtn: 'Batal', positiveBtn: 'Simpan Perubahan',
                    handlePositiveBtn: handleEdit,
                    loading: { text: 'Menyimpan...', isLoading: isSubmitting, setIsLoading: setIsSubmitting }
                }}>
                <SiswaFormFields form={form} formError={formError} disabled={isSubmitting} onChange={handleFormChange} />
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
                <p className="text-sm text-gray-600">
                    Apakah Anda yakin ingin menghapus siswa{' '}
                    <strong className="text-gray-900">{selected?.nama_lengkap}</strong>?{' '}
                    Data yang dihapus tidak dapat dikembalikan.
                </p>
            </Modal>

            {/* Detail */}
            <Modal isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                title="Detail Siswa">
                {selected && (
                    <div className="space-y-4">
                        <div className={`rounded-xl p-4 flex items-center gap-3 ${
                            selected.jenis_kelamin === 'Perempuan' ? 'bg-pink-50' : 'bg-blue-50'
                        }`}>
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0 ${
                                selected.jenis_kelamin === 'Perempuan' ? 'bg-pink-400' : 'bg-blue-400'
                            }`}>
                                {selected.nama_lengkap.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">{selected.nama_lengkap}</p>
                                <p className="text-xs text-gray-500 font-mono">NIS: {selected.nis}</p>
                                {selected.nisn && <p className="text-xs text-gray-500 font-mono">NISN: {selected.nisn}</p>}
                            </div>
                        </div>

                        {[
                            { label: 'Jenis Kelamin', value: selected.jenis_kelamin },
                            { label: 'Kelas',         value: selected.kelas ? `Kelas ${selected.kelas}` : null },
                            { label: 'Tahun Ajaran',  value: selected.tahun_ajaran },
                            { label: 'Tempat Lahir',  value: selected.tempat_lahir },
                            { label: 'Tanggal Lahir', value: selected.tanggal_lahir
                                ? new Date(selected.tanggal_lahir).toLocaleDateString('id-ID', {
                                    day: 'numeric', month: 'long', year: 'numeric'
                                }) : null },
                            { label: 'Status', value: STATUS_CONFIG[selected.status].label },
                        ].filter(r => r.value).map(row => (
                            <div key={row.label} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                                <span className="text-xs text-gray-500">{row.label}</span>
                                <span className="text-sm font-medium text-gray-900">{row.value}</span>
                            </div>
                        ))}

                        {selected.alamat && (
                            <div className="bg-gray-50 rounded-lg p-3 flex gap-2">
                                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-xs text-gray-500 mb-0.5">Alamat</p>
                                    <p className="text-sm text-gray-900">{selected.alamat}</p>
                                </div>
                            </div>
                        )}

                        {selected.telepon && (
                            <a href={`tel:${selected.telepon}`} className="flex items-center gap-2 text-sm text-accent">
                                <Phone className="w-4 h-4" />{selected.telepon}
                            </a>
                        )}
                        {selected.email && (
                            <a href={`mailto:${selected.email}`} className="flex items-center gap-2 text-sm text-accent truncate">
                                <Mail className="w-4 h-4 flex-shrink-0" />{selected.email}
                            </a>
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

        </div>
    )
}