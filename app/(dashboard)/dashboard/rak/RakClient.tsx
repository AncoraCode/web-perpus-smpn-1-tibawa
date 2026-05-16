'use client'

import { useState, useMemo } from 'react'
import {
    Search, Plus, Edit2, Trash2,
    Grid3x3, MapPin, CheckCircle2, XCircle, Package,
} from 'lucide-react'
import Modal from '@/app/components/Modal'
import { createClient } from '@/utils/supabase/client'

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
interface Rak {
    id: string
    kode_rak: string
    nama_rak: string
    lokasi: string | null
    deskripsi: string | null
    created_at: string
}

type FormData = {
    kode_rak: string
    nama_rak: string
    lokasi: string
    deskripsi: string
}

interface RakClientProps {
    rakData: Rak[]
    user: { role: string }
}

/* ─────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────── */
const EMPTY_FORM: FormData = {
    kode_rak: '',
    nama_rak: '',
    lokasi: '',
    deskripsi: '',
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

function RakFormFields({ form, formError, disabled, onChange }: FormFieldsProps) {
    return (
        <div className="space-y-4">
            {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-xs text-red-600 font-medium">{formError}</p>
                </div>
            )}

            {/* Kode Rak */}
            <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Kode Rak <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={form.kode_rak}
                    disabled={disabled}
                    onChange={e => onChange('kode_rak', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:bg-gray-50 outline-none"
                    placeholder="Contoh: RAK-A1"
                />
                <p className="text-xs text-gray-400 mt-1">Kode unik untuk identifikasi rak</p>
            </div>

            {/* Nama Rak */}
            <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Nama Rak <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={form.nama_rak}
                    disabled={disabled}
                    onChange={e => onChange('nama_rak', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:bg-gray-50 outline-none"
                    placeholder="Contoh: Rak Fiksi Remaja"
                />
            </div>

            {/* Lokasi */}
            <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Lokasi</label>
                <input
                    type="text"
                    value={form.lokasi}
                    disabled={disabled}
                    onChange={e => onChange('lokasi', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:bg-gray-50 outline-none"
                    placeholder="Contoh: Sudut kanan ruang baca"
                />
            </div>

            {/* Deskripsi */}
            <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Deskripsi</label>
                <textarea
                    value={form.deskripsi}
                    disabled={disabled}
                    rows={3}
                    onChange={e => onChange('deskripsi', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none disabled:bg-gray-50 outline-none"
                    placeholder="Keterangan tambahan tentang rak ini..."
                />
            </div>
        </div>
    )
}

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function RakClient({ rakData, user }: RakClientProps) {
    const [rakList, setRakList]           = useState<Rak[]>(rakData)
    const [searchQuery, setSearchQuery]   = useState('')

    // Modals
    const [showAddModal,    setShowAddModal]    = useState(false)
    const [showEditModal,   setShowEditModal]   = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [notif, setNotif] = useState<{ show: boolean; success: boolean; message: string }>({
        show: false, success: true, message: ''
    })

    const [selected,     setSelected]     = useState<Rak | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDeleting,   setIsDeleting]   = useState(false)
    const [formError,    setFormError]    = useState('')
    const [form,         setForm]         = useState<FormData>({ ...EMPTY_FORM })

    const supabase = createClient()

    /* ── filtered list ── */
    const filtered = useMemo(() => {
        const q = searchQuery.toLowerCase()
        return rakList.filter(r =>
            r.kode_rak.toLowerCase().includes(q) ||
            r.nama_rak.toLowerCase().includes(q) ||
            (r.lokasi ?? '').toLowerCase().includes(q)
        )
    }, [rakList, searchQuery])

    /* ── helpers ── */
    const handleFormChange = (key: keyof FormData, val: string) =>
        setForm(prev => ({ ...prev, [key]: val }))

    const showNotif = (success: boolean, message: string) =>
        setNotif({ show: true, success, message })

    const openAdd = () => {
        setForm({ ...EMPTY_FORM })
        setFormError('')
        setShowAddModal(true)
    }

    const openEdit = (r: Rak) => {
        setSelected(r)
        setForm({
            kode_rak:  r.kode_rak,
            nama_rak:  r.nama_rak,
            lokasi:    r.lokasi    ?? '',
            deskripsi: r.deskripsi ?? '',
        })
        setFormError('')
        setShowEditModal(true)
    }

    const openDelete = (r: Rak) => { setSelected(r); setShowDeleteModal(true) }
    const openDetail = (r: Rak) => { setSelected(r); setShowDetailModal(true) }

    /* ── build payload ── */
    const buildPayload = () => ({
        kode_rak:  form.kode_rak.trim().toUpperCase(),
        nama_rak:  form.nama_rak.trim(),
        lokasi:    form.lokasi.trim()    || null,
        deskripsi: form.deskripsi.trim() || null,
    })

    const validate = (): string => {
        if (!form.kode_rak.trim()) return 'Kode Rak wajib diisi'
        if (!form.nama_rak.trim()) return 'Nama Rak wajib diisi'
        return ''
    }

    /* ── CRUD ── */
    const handleAdd = async () => {
        const err = validate()
        if (err) { setFormError(err); return }
        setFormError('')
        setIsSubmitting(true)

        const { data, error } = await supabase
            .from('rak').insert([buildPayload()]).select().single()

        if (error) {
            setFormError(
                error.code === '23505'
                    ? 'Kode Rak sudah digunakan, gunakan kode lain'
                    : 'Gagal: ' + error.message
            )
            setIsSubmitting(false)
            return
        }

        setRakList(prev => [...prev, data].sort((a, b) =>
            a.kode_rak.localeCompare(b.kode_rak)
        ))
        setShowAddModal(false)
        setIsSubmitting(false)
        showNotif(true, `Rak "${data.nama_rak}" berhasil ditambahkan`)
    }

    const handleEdit = async () => {
        if (!selected) return
        const err = validate()
        if (err) { setFormError(err); return }
        setFormError('')
        setIsSubmitting(true)

        const { data, error } = await supabase
            .from('rak').update(buildPayload()).eq('id', selected.id).select().single()

        if (error) {
            setFormError(
                error.code === '23505'
                    ? 'Kode Rak sudah digunakan, gunakan kode lain'
                    : 'Gagal: ' + error.message
            )
            setIsSubmitting(false)
            return
        }

        setRakList(prev =>
            prev.map(r => r.id === selected.id ? data : r)
               .sort((a, b) => a.kode_rak.localeCompare(b.kode_rak))
        )
        setShowEditModal(false)
        setIsSubmitting(false)
        showNotif(true, `Rak "${data.nama_rak}" berhasil diperbarui`)
    }

    const handleDelete = async () => {
        if (!selected) return
        setIsDeleting(true)

        const { error } = await supabase.from('rak').delete().eq('id', selected.id)

        if (error) {
            setIsDeleting(false)
            // Cek apakah rak masih dipakai oleh buku
            showNotif(false,
                error.code === '23503'
                    ? 'Rak tidak dapat dihapus karena masih digunakan oleh data buku'
                    : 'Gagal menghapus rak'
            )
            setShowDeleteModal(false)
            return
        }

        const nama = selected.nama_rak
        setRakList(prev => prev.filter(r => r.id !== selected.id))
        setShowDeleteModal(false)
        setIsDeleting(false)
        showNotif(true, `Rak "${nama}" berhasil dihapus`)
    }

    /* ── render ── */
    return (
        <div className="px-4 py-6 space-y-5">

            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-gray-900">Kelola Rak</h1>
                <p className="text-sm text-gray-500 mt-0.5">Manajemen rak penyimpanan buku</p>
            </div>

            {/* Stats */}
            <div className="bg-gradient-to-br from-primary to-accent rounded-2xl p-4 text-white flex items-center justify-between">
                <div>
                    <p className="text-3xl font-bold">{rakList.length}</p>
                    <p className="text-xs opacity-80 mt-0.5">Total Rak Terdaftar</p>
                </div>
                <Grid3x3 className="w-12 h-12 opacity-20" />
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Cari kode, nama, atau lokasi..."
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
                />
            </div>

            {/* Add Button */}
            <button
                onClick={openAdd}
                className="w-full py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 text-sm"
            >
                <Plus className="w-4 h-4" />
                Tambah Rak Baru
            </button>

            {/* List */}
            <div className="space-y-3">
                <p className="text-sm font-bold text-gray-900">
                    Daftar Rak ({filtered.length})
                </p>

                {filtered.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                        <Grid3x3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">
                            {searchQuery ? 'Tidak ada rak ditemukan' : 'Belum ada rak. Tambahkan sekarang!'}
                        </p>
                    </div>
                ) : filtered.map(r => (
                    <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                        {/* Info */}
                        <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Grid3x3 className="w-5 h-5 text-primary" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <button
                                    onClick={() => openDetail(r)}
                                    className="font-semibold text-gray-900 text-sm hover:text-accent transition-colors text-left block w-full truncate"
                                >
                                    {r.nama_rak}
                                </button>
                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                    <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded font-semibold">
                                        {r.kode_rak}
                                    </span>
                                    {r.lokasi && (
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {r.lokasi}
                                        </span>
                                    )}
                                </div>
                                {r.deskripsi && (
                                    <p className="text-xs text-gray-400 mt-1.5 line-clamp-1">
                                        {r.deskripsi}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => openEdit(r)}
                                className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                            >
                                <Edit2 className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button
                                onClick={() => openDelete(r)}
                                className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
                            >
                                <Trash2 className="w-3.5 h-3.5" /> Hapus
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* ════ MODALS ════ */}

            {/* Add */}
            <Modal
                isOpen={showAddModal}
                onClose={() => { if (!isSubmitting) { setShowAddModal(false); setFormError('') } }}
                title="Tambah Rak Baru"
                confirmation={{
                    negativeBtn: 'Batal',
                    positiveBtn: 'Simpan',
                    handlePositiveBtn: handleAdd,
                    loading: { text: 'Menyimpan...', isLoading: isSubmitting, setIsLoading: setIsSubmitting }
                }}
            >
                <RakFormFields
                    form={form}
                    formError={formError}
                    disabled={isSubmitting}
                    onChange={handleFormChange}
                />
            </Modal>

            {/* Edit */}
            <Modal
                isOpen={showEditModal}
                onClose={() => { if (!isSubmitting) { setShowEditModal(false); setFormError('') } }}
                title="Edit Rak"
                confirmation={{
                    negativeBtn: 'Batal',
                    positiveBtn: 'Simpan Perubahan',
                    handlePositiveBtn: handleEdit,
                    loading: { text: 'Menyimpan...', isLoading: isSubmitting, setIsLoading: setIsSubmitting }
                }}
            >
                <RakFormFields
                    form={form}
                    formError={formError}
                    disabled={isSubmitting}
                    onChange={handleFormChange}
                />
            </Modal>

            {/* Delete */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => !isDeleting && setShowDeleteModal(false)}
                title="Konfirmasi Hapus"
                confirmation={{
                    negativeBtn: 'Batal',
                    positiveBtn: 'Ya, Hapus',
                    handlePositiveBtn: handleDelete,
                    loading: { text: 'Menghapus...', isLoading: isDeleting, setIsLoading: setIsDeleting }
                }}
            >
                <p className="text-sm text-gray-600">
                    Apakah Anda yakin ingin menghapus rak{' '}
                    <strong className="text-gray-900">{selected?.nama_rak}</strong>{' '}
                    <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                        ({selected?.kode_rak})
                    </span>?
                </p>

            </Modal>

            {/* Detail */}
            <Modal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                title="Detail Rak"
            >
                {selected && (
                    <div className="space-y-4">
                        {/* Hero */}
                        <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Grid3x3 className="w-7 h-7 text-primary" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 text-base">{selected.nama_rak}</p>
                                <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded font-semibold">
                                    {selected.kode_rak}
                                </span>
                            </div>
                        </div>

                        {/* Info rows */}
                        {[
                            { label: 'Kode Rak', value: selected.kode_rak, mono: true },
                            { label: 'Nama Rak', value: selected.nama_rak },
                            { label: 'Lokasi',   value: selected.lokasi },
                            { label: 'Dibuat',   value: new Date(selected.created_at).toLocaleDateString('id-ID', {
                                day: 'numeric', month: 'long', year: 'numeric'
                            }) },
                        ].filter(r => r.value).map(row => (
                            <div key={row.label} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                                <span className="text-xs text-gray-500">{row.label}</span>
                                <span className={`text-sm font-medium text-gray-900 ${row.mono ? 'font-mono' : ''}`}>
                                    {row.value}
                                </span>
                            </div>
                        ))}

                        {/* Deskripsi */}
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
            <Modal
                isOpen={notif.show}
                onClose={() => setNotif(n => ({ ...n, show: false }))}
                title={notif.success ? 'Berhasil' : 'Gagal'}
            >
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