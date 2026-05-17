'use client'

import { useState, useMemo } from 'react'
import {
    Search, Plus, Edit2, Trash2, X,
    Layers, BookOpen, CheckCircle2, XCircle,
} from 'lucide-react'
import Modal from '@/app/components/Modal'
import { createClient } from '@/utils/supabase/client'

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
interface Kategori {
    id: string
    nama: string
    deskripsi: string | null
    buku_count: number
    created_at: string
}

type FormData = {
    nama: string
    deskripsi: string
}

interface KategoriClientProps {
    kategoriData: Kategori[]
    user: { role: string }
}

/* ─────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────── */
const EMPTY_FORM: FormData = {
    nama: '',
    deskripsi: '',
}

/* ─────────────────────────────────────────
   FORM FIELDS — di luar komponen utama
───────────────────────────────────────── */
interface FormFieldsProps {
    form: FormData
    formError: string
    disabled: boolean
    onChange: (key: keyof FormData, val: string) => void
}

function KategoriFormFields({ form, formError, disabled, onChange }: FormFieldsProps) {
    return (
        <div className="space-y-4">
            {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-xs text-red-600 font-medium">{formError}</p>
                </div>
            )}

            {/* Nama Kategori */}
            <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Nama Kategori <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={form.nama}
                    disabled={disabled}
                    onChange={e => onChange('nama', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:bg-gray-50 outline-none"
                    placeholder="Contoh: Fiksi, Sains, Sejarah..."
                />
            </div>

            {/* Deskripsi */}
            <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Deskripsi
                </label>
                <textarea
                    value={form.deskripsi}
                    disabled={disabled}
                    rows={3}
                    onChange={e => onChange('deskripsi', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none disabled:bg-gray-50 outline-none"
                    placeholder="Keterangan singkat tentang kategori ini..."
                />
            </div>
        </div>
    )
}

/* ─────────────────────────────────────────
   WARNA BADGE per kategori (cycle)
───────────────────────────────────────── */
const BADGE_COLORS = [
    { bg: 'bg-blue-100', text: 'text-blue-700', icon: 'bg-blue-200' },
    { bg: 'bg-green-100', text: 'text-green-700', icon: 'bg-green-200' },
    { bg: 'bg-purple-100', text: 'text-purple-700', icon: 'bg-purple-200' },
    { bg: 'bg-orange-100', text: 'text-orange-700', icon: 'bg-orange-200' },
    { bg: 'bg-pink-100', text: 'text-pink-700', icon: 'bg-pink-200' },
    { bg: 'bg-teal-100', text: 'text-teal-700', icon: 'bg-teal-200' },
    { bg: 'bg-amber-100', text: 'text-amber-700', icon: 'bg-amber-200' },
    { bg: 'bg-cyan-100', text: 'text-cyan-700', icon: 'bg-cyan-200' },
]

const getBadgeColor = (index: number) => BADGE_COLORS[index % BADGE_COLORS.length]

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function KategoriClient({ kategoriData, user }: KategoriClientProps) {
    const [kategoriList, setKategoriList] = useState<Kategori[]>(kategoriData)
    const [searchQuery, setSearchQuery] = useState('')

    // Modals
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [notif, setNotif] = useState<{ show: boolean; success: boolean; message: string }>({
        show: false, success: true, message: ''
    })

    const [selected, setSelected] = useState<Kategori | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [formError, setFormError] = useState('')
    const [form, setForm] = useState<FormData>({ ...EMPTY_FORM })

    const supabase = createClient()

    /* ── filtered list ── */
    const filtered = useMemo(() => {
        const q = searchQuery.toLowerCase()
        return kategoriList.filter(k =>
            k.nama.toLowerCase().includes(q) ||
            (k.deskripsi ?? '').toLowerCase().includes(q)
        )
    }, [kategoriList, searchQuery])

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

    const openEdit = (k: Kategori) => {
        setSelected(k)
        setForm({
            nama: k.nama,
            deskripsi: k.deskripsi ?? '',
        })
        setFormError('')
        setShowEditModal(true)
    }

    const openDelete = (k: Kategori) => { setSelected(k); setShowDeleteModal(true) }

    /* ── build payload ── */
    const buildPayload = () => ({
        nama: form.nama.trim(),
        deskripsi: form.deskripsi.trim() || null,
    })

    const validate = (): string => {
        if (!form.nama.trim()) return 'Nama Kategori wajib diisi'
        return ''
    }

    /* ── CRUD ── */
    const handleAdd = async () => {
        const err = validate()
        if (err) { setFormError(err); return }
        setFormError('')
        setIsSubmitting(true)

        const { data, error } = await supabase
            .from('kategori_buku').insert([buildPayload()]).select().single()

        if (error) {
            setFormError('Gagal: ' + error.message)
            setIsSubmitting(false)
            return
        }

        setKategoriList(prev =>
            [...prev, { ...data, buku_count: 0 }]
                .sort((a, b) => a.nama.localeCompare(b.nama))
        )
        setShowAddModal(false)
        setIsSubmitting(false)
        showNotif(true, `Kategori "${data.nama}" berhasil ditambahkan`)
    }

    const handleEdit = async () => {
        if (!selected) return
        const err = validate()
        if (err) { setFormError(err); return }
        setFormError('')
        setIsSubmitting(true)

        const { data, error } = await supabase
            .from('kategori_buku').update(buildPayload()).eq('id', selected.id).select().single()

        if (error) {
            setFormError('Gagal: ' + error.message)
            setIsSubmitting(false)
            return
        }

        setKategoriList(prev =>
            prev.map(k => k.id === selected.id
                ? { ...data, buku_count: selected.buku_count }
                : k
            ).sort((a, b) => a.nama.localeCompare(b.nama))
        )
        setShowEditModal(false)
        setIsSubmitting(false)
        showNotif(true, `Kategori "${data.nama}" berhasil diperbarui`)
    }

    const handleDelete = async () => {
        if (!selected) return
        setIsDeleting(true)

        const { error } = await supabase
            .from('kategori_buku').delete().eq('id', selected.id)

        if (error) {
            setIsDeleting(false)
            setShowDeleteModal(false)
            showNotif(false,
                error.code === '23503'
                    ? `Kategori "${selected.nama}" tidak dapat dihapus karena masih digunakan oleh data buku`
                    : 'Gagal menghapus kategori'
            )
            return
        }

        const nama = selected.nama
        setKategoriList(prev => prev.filter(k => k.id !== selected.id))
        setShowDeleteModal(false)
        setIsDeleting(false)
        showNotif(true, `Kategori "${nama}" berhasil dihapus`)
    }

    /* ── render ── */
    return (
        <div className="px-4 py-6 space-y-5">

            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-gray-900">Kategori Buku</h1>
                <p className="text-sm text-gray-500 mt-0.5">Kelola kategori koleksi buku perpustakaan</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
                    <Layers className="w-7 h-7 opacity-80 mb-2" />
                    <p className="text-2xl font-bold">{kategoriList.length}</p>
                    <p className="text-xs opacity-80 mt-0.5">Total Kategori</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-white">
                    <BookOpen className="w-7 h-7 opacity-80 mb-2" />
                    <p className="text-2xl font-bold">
                        {kategoriList.reduce((sum, k) => sum + (k.buku_count || 0), 0)}
                    </p>
                    <p className="text-xs opacity-80 mt-0.5">Total Buku</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Cari nama kategori..."
                    className="w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
                />
                {searchQuery && (
                    <button onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Add Button */}
            <button
                onClick={openAdd}
                className="w-full py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 text-sm"
            >
                <Plus className="w-4 h-4" />
                Tambah Kategori Baru
            </button>

            {/* List */}
            <div className="space-y-3">
                <p className="text-sm font-bold text-gray-900">
                    Daftar Kategori ({filtered.length})
                </p>

                {filtered.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                        <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">
                            {searchQuery ? 'Tidak ada kategori ditemukan' : 'Belum ada kategori. Tambahkan sekarang!'}
                        </p>
                    </div>
                ) : filtered.map((k, index) => {
                    const color = getBadgeColor(index)
                    return (
                        <div key={k.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                            <div className="flex items-start gap-3">
                                {/* Icon dengan warna unik per kategori */}
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color.icon}`}>
                                    <Layers className={`w-5 h-5 ${color.text}`} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 text-sm truncate">
                                        {k.nama}
                                    </p>
                                    {k.deskripsi && (
                                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                                            {k.deskripsi}
                                        </p>
                                    )}
                                </div>

                                {/* Jumlah buku badge */}
                                <div className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${color.bg} ${color.text}`}>
                                    <BookOpen className="w-3 h-3" />
                                    {k.buku_count ?? 0}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => openEdit(k)}
                                    className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                                >
                                    <Edit2 className="w-3.5 h-3.5" /> Edit
                                </button>
                                <button
                                    onClick={() => openDelete(k)}
                                    className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
                                >
                                    <Trash2 className="w-3.5 h-3.5" /> Hapus
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* ════ MODALS ════ */}

            {/* Add */}
            <Modal
                isOpen={showAddModal}
                onClose={() => { if (!isSubmitting) { setShowAddModal(false); setFormError('') } }}
                title="Tambah Kategori Baru"
                confirmation={{
                    negativeBtn: 'Batal',
                    positiveBtn: 'Simpan',
                    handlePositiveBtn: handleAdd,
                    loading: { text: 'Menyimpan...', isLoading: isSubmitting, setIsLoading: setIsSubmitting }
                }}
            >
                <KategoriFormFields
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
                title="Edit Kategori"
                confirmation={{
                    negativeBtn: 'Batal',
                    positiveBtn: 'Simpan Perubahan',
                    handlePositiveBtn: handleEdit,
                    loading: { text: 'Menyimpan...', isLoading: isSubmitting, setIsLoading: setIsSubmitting }
                }}
            >
                <KategoriFormFields
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
                    Apakah Anda yakin ingin menghapus kategori{' '}
                    <strong className="text-gray-900">"{selected?.nama}"</strong>?
                </p>
                {selected && selected.buku_count > 0 && (
                    <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 flex items-start gap-2">
                        <span className="text-amber-500 text-sm flex-shrink-0">⚠️</span>
                        <p className="text-xs text-amber-700">
                            Kategori ini memiliki{' '}
                            <strong>{selected.buku_count} buku</strong>.
                            Menghapus kategori akan membuat buku-buku tersebut tidak berkategori.
                        </p>
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