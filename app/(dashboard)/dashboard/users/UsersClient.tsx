'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Search, Plus, Edit2, Trash2, X,
    Users, Shield, User, Mail, Phone,
    CheckCircle2, XCircle, Eye, EyeOff,
    KeyRound, ShieldCheck, ShieldAlert,
} from 'lucide-react'
import Modal from '@/app/components/Modal'
import { createClient } from '@/utils/supabase/client'
import AnimatedCounter from '@/app/components/AnimatedCounter'

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
interface Profile {
    id: string
    username: string
    nama_lengkap: string
    email: string
    telepon: string | null
    role: 'admin' | 'pengelola'
    foto_url: string | null
    created_at: string
    updated_at: string
    nip: string | null
}

type FormData = {
    username: string
    nama_lengkap: string
    email: string
    telepon: string
    role: 'admin' | 'pengelola'
    password: string
    confirm_password: string
    nip: string
}

type ResetPwData = {
    new_password: string
    confirm_password: string
}

interface UsersClientProps {
    usersData: Profile[]
    currentUser: { id: string; role: string; username: string }
}

/* ─────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────── */
const EMPTY_FORM: FormData = {
    username: '',
    nama_lengkap: '',
    email: '',
    telepon: '',
    role: 'pengelola',
    password: '',
    confirm_password: '',
    nip: '',
}

/* ─────────────────────────────────────────
   FORM FIELDS — di luar komponen utama
───────────────────────────────────────── */
interface FormFieldsProps {
    form: FormData
    formError: string
    disabled: boolean
    isEdit: boolean
    onChange: (key: keyof FormData, val: string) => void
}

function UserFormFields({
    form, formError, disabled, isEdit,
    onChange,
}: FormFieldsProps) {
    return (
        <div className="space-y-4">
            {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-xs text-red-600 font-medium">{formError}</p>
                </div>
            )}

            {/* Nama Lengkap */}
            <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input type="text" value={form.nama_lengkap} disabled={disabled}
                    onChange={e => onChange('nama_lengkap', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:bg-gray-50 outline-none"
                    placeholder="Nama lengkap pengguna" />
            </div>

            {/* Username */}
            <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Username <span className="text-red-500">*</span>
                    {isEdit && <span className="text-xs font-normal text-gray-400 ml-1">(tidak dapat diubah)</span>}
                </label>
                <input type="text" value={form.username} disabled={disabled || isEdit}
                    onChange={e => onChange('username', e.target.value.toLowerCase().replace(/\s/g, '_'))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:bg-gray-50 outline-none font-mono"
                    placeholder="username_pengguna" />
                {!isEdit && (
                    <p className="text-xs text-gray-400 mt-1">Huruf kecil, tanpa spasi (spasi otomatis jadi _)</p>
                )}
            </div>

            {/* NIP */}
            <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    NIP <span className="text-gray-400 font-normal text-[10px] ml-1">(tidak wajib diisi)</span>
                </label>
                <input type="text" value={form.nip} disabled={disabled}
                    onChange={e => onChange('nip', e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:bg-gray-50 outline-none"
                    placeholder="Masukkan NIP (opsional)" />
            </div>

            {/* Email */}
            <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Email <span className="text-red-500">*</span>
                </label>
                <input type="email" value={form.email} disabled={disabled}
                    onChange={e => onChange('email', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:bg-gray-50 outline-none"
                    placeholder="email@smpn1tibawa.sch.id" />
            </div>

            {/* Telepon */}
            <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Telepon</label>
                <input type="tel" value={form.telepon} disabled={disabled}
                    onChange={e => onChange('telepon', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:bg-gray-50 outline-none"
                    placeholder="08123456789" />
            </div>
        </div>
    )
}

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function UsersClient({ usersData, currentUser }: UsersClientProps) {
    const router = useRouter()
    const [usersList, setUsersList] = useState<Profile[]>(usersData)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        setUsersList(usersData)
    }, [usersData])

    // Modals
    const [copiedField, setCopiedField] = useState<'username' | 'password' | null>(null)
    const [showAddModal, setShowAddModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [createdCreds, setCreatedCreds] = useState<{ nama_lengkap: string; username: string; password: string } | null>(null)
    const [notif, setNotif] = useState<{ show: boolean; success: boolean; message: string }>({
        show: false, success: true, message: ''
    })

        const [selected, setSelected] = useState<Profile | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [formError, setFormError] = useState('')
    const [confirmDeleteUsername, setConfirmDeleteUsername] = useState('')

    const [form, setForm] = useState<FormData>({ ...EMPTY_FORM })

    const supabase = createClient()

    /* ── filtered list ── */
    const filtered = useMemo(() => {
        const q = searchQuery.toLowerCase()
        return usersList.filter(u =>
            u.nama_lengkap.toLowerCase().includes(q) ||
            u.username.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            (u.nip && u.nip.toLowerCase().includes(q))
        )
    }, [usersList, searchQuery])

    const stats = useMemo(() => ({
        total: usersList.length,
        admin: usersList.filter(u => u.role === 'admin').length,
        pengelola: usersList.filter(u => u.role === 'pengelola').length,
    }), [usersList])

    /* ── helpers ── */
    const handleFormChange = (key: keyof FormData, val: string) =>
        setForm(prev => ({ ...prev, [key]: val }))

    const showNotif = (success: boolean, message: string) =>
        setNotif({ show: true, success, message })

    const generateRandomPassword = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
        let pass = ''
        for (let i = 0; i < 6; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return pass
    }

    const openAdd = () => {
        setForm({ ...EMPTY_FORM })
        setFormError('')
        setShowAddModal(true)
    }

    const openDelete = (u: Profile) => {
        setSelected(u)
        setConfirmDeleteUsername('')
        setShowDeleteModal(true)
    }
    const openDetail = (u: Profile) => { setSelected(u); setShowDetailModal(true) }

    const validate = (): string => {
        if (!form.nama_lengkap.trim()) return 'Nama lengkap wajib diisi'
        if (!form.username.trim()) return 'Username wajib diisi'
        if (!form.email.trim()) return 'Email wajib diisi'
        if (!form.email.trim().includes('@')) return 'Format email tidak valid'
        return ''
    }

    /* ── Add User ── */
    const handleAdd = async () => {
        const err = validate()
        if (err) { setFormError(err); return }
        setFormError('')
        setIsSubmitting(true)

        const generatedPassword = generateRandomPassword()

        // Buat user via API route (karena perlu hash password)
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: form.username.trim(),
                nama_lengkap: form.nama_lengkap.trim(),
                email: form.email.trim(),
                telepon: form.telepon.trim() || null,
                role: 'pengelola',  // selalu pengelola, tidak bisa pilih admin
                password: generatedPassword,
                nip: form.nip.trim() || null,
            })
        })

        const result = await res.json()
        if (!res.ok) {
            setFormError(result.error || 'Gagal menambahkan user')
            setIsSubmitting(false)
            return
        }

        setUsersList(prev => [...prev, result.user])
        setShowAddModal(false)
        setIsSubmitting(false)
        setCreatedCreds({
            nama_lengkap: result.user.nama_lengkap,
            username: result.user.username,
            password: generatedPassword
        })
        router.refresh()
    }

    /* ── Delete User ── */
    const handleDelete = async () => {
        if (!selected) return
        setIsDeleting(true)

        const { error } = await supabase.from('profiles').delete().eq('id', selected.id)

        if (error) {
            setIsDeleting(false)
            setShowDeleteModal(false)
            showNotif(false, 'Gagal menghapus user: ' + error.message)
            return
        }

        const nama = selected.nama_lengkap
        setUsersList(prev => prev.filter(u => u.id !== selected.id))
        setShowDeleteModal(false)
        setIsDeleting(false)
        showNotif(true, `User "${nama}" berhasil dihapus`)
        router.refresh()
    }



    /* ── render ── */
    return (
        <div className="px-4 py-6 space-y-5">

            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-gray-900">Manajemen User</h1>
                <p className="text-sm text-gray-500 mt-0.5">Kelola akun pengelola dan admin</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-3 text-white">
                    <Users className="w-6 h-6 opacity-80 mb-1" />
                    <p className="text-xl font-bold">
                        <AnimatedCounter value={stats.total} className="text-white font-bold text-xl" delay={0.1} />
                    </p>
                    <p className="text-[10px] opacity-80">Total User</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-3 text-white">
                    <ShieldCheck className="w-6 h-6 opacity-80 mb-1" />
                    <p className="text-xl font-bold">
                        <AnimatedCounter value={stats.admin} className="text-white font-bold text-xl" delay={0.1} />
                    </p>
                    <p className="text-[10px] opacity-80">Admin</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-3 text-white">
                    <User className="w-6 h-6 opacity-80 mb-1" />
                    <p className="text-xl font-bold">
                        <AnimatedCounter value={stats.pengelola} className="text-white font-bold text-xl" delay={0.1} />
                    </p>
                    <p className="text-[10px] opacity-80">Pengelola</p>
                </div>
            </div>

            {/* Search + Filter */}
            <div className="space-y-2">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Cari nama, username, atau email..."
                        className="w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none" />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

            </div>

            {/* Add Button */}
            <button onClick={openAdd}
                className="w-full py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 text-sm">
                <Plus className="w-4 h-4" /> Tambah User Baru
            </button>

            {/* List */}
            <div className="space-y-3">
                <p className="text-sm font-bold text-gray-900">Daftar User ({filtered.length})</p>

                {filtered.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">Tidak ada user ditemukan</p>
                    </div>
                ) : filtered.map(u => {
                    const initial = u.nama_lengkap.charAt(0).toUpperCase()

                    return (
                        <div key={u.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                            <div className="flex items-start gap-3">
                                {/* Avatar */}
                                {u.foto_url ? (
                                    <img src={u.foto_url} alt={u.nama_lengkap}
                                        className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-gray-100" />
                                ) : (
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${u.role === 'admin' ? 'bg-purple-500' : 'bg-primary'
                                        }`}>
                                        {initial}
                                    </div>
                                )}

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <button onClick={() => openDetail(u)}
                                            className="font-semibold text-gray-900 text-sm hover:text-accent transition-colors text-left">
                                            {u.id === currentUser.id
                                                ? <>{u.nama_lengkap} <span className="text-accent font-semibold">(Anda)</span></>
                                                : u.nama_lengkap
                                            }
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 font-mono mt-0.5">@{u.username}</p>
                                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                        <span className={`text-xs px-2 py-0.5 rounded font-semibold ${u.role === 'admin'
                                            ? 'bg-purple-100 text-purple-700'
                                            : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {u.role === 'admin' ? '⚡ Admin' : '📚 Pengelola'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <button onClick={() => openDetail(u)}
                                    className={`py-2 px-3 bg-gray-50 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-1.5 ${u.role === 'admin' ? 'w-full' : 'flex-1'}`}>
                                    <Eye className="w-3.5 h-3.5" /> Detail
                                </button>
                                {u.role !== 'admin' && (
                                    <button onClick={() => openDelete(u)}
                                        className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5">
                                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* ════ MODALS ════ */}

            {/* Add */}
            <Modal isOpen={showAddModal}
                onClose={() => { if (!isSubmitting) { setShowAddModal(false); setFormError('') } }}
                title="Tambah User Baru"
                confirmation={{
                    negativeBtn: 'Batal', positiveBtn: 'Simpan',
                    handlePositiveBtn: handleAdd,
                    loading: { text: 'Menyimpan...', isLoading: isSubmitting, setIsLoading: setIsSubmitting }
                }}>
                <UserFormFields
                    form={form} formError={formError} disabled={isSubmitting} isEdit={false}
                    onChange={handleFormChange}
                />
            </Modal>

            {/* Delete */}
            <Modal isOpen={showDeleteModal}
                onClose={() => !isDeleting && setShowDeleteModal(false)}
                title="Konfirmasi Hapus"
                confirmation={{
                    negativeBtn: 'Batal', positiveBtn: 'Ya, Hapus',
                    handlePositiveBtn: handleDelete,
                    disabled: confirmDeleteUsername !== selected?.username,
                    loading: { text: 'Menghapus...', isLoading: isDeleting, setIsLoading: setIsDeleting }
                }}>
                <div className="space-y-4">
                    <p className="text-sm text-gray-600 leading-relaxed">
                        Apakah Anda yakin ingin menghapus user{' '}
                        <strong className="text-gray-900">{selected?.nama_lengkap}</strong>{' '}
                        <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                            (@{selected?.username})
                        </span>? Tindakan ini tidak dapat dibatalkan.
                    </p>
                    <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-gray-700">
                            Ketik kembali username <span className="font-mono bg-gray-100 px-1 rounded">@{selected?.username}</span> untuk mengonfirmasi:
                        </label>
                        <input
                            type="text"
                            value={confirmDeleteUsername}
                            onChange={e => setConfirmDeleteUsername(e.target.value)}
                            placeholder="Masukkan username"
                            disabled={isDeleting}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
                        />
                    </div>
                </div>
            </Modal>

            {/* Detail */}
            <Modal isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                title="Detail User">
                {selected && (
                    <div className="space-y-4">
                        {/* Hero */}
                        <div className={`rounded-xl p-4 flex items-center gap-3 ${selected.role === 'admin' ? 'bg-purple-50' : 'bg-blue-50'
                            }`}>
                            {selected.foto_url ? (
                                <img src={selected.foto_url} alt={selected.nama_lengkap}
                                    className="w-14 h-14 rounded-full object-cover border-2 border-white shadow flex-shrink-0" />
                            ) : (
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0 ${selected.role === 'admin' ? 'bg-purple-500' : 'bg-primary'
                                    }`}>
                                    {selected.nama_lengkap.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div>
                                <p className="font-bold text-gray-900">{selected.nama_lengkap}</p>
                                <p className="text-xs text-gray-500 font-mono">@{selected.username}</p>
                                <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded font-semibold ${selected.role === 'admin'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-blue-100 text-blue-700'
                                    }`}>
                                    {selected.role === 'admin' ? '⚡ Administrator' : '📚 Pengelola'}
                                </span>
                            </div>
                        </div>

                        {/* Info rows */}
                        {[
                            { label: 'NIP', value: selected.nip },
                            { label: 'Email', value: selected.email },
                            { label: 'Telepon', value: selected.telepon },
                            {
                                label: 'Bergabung', value: new Date(selected.created_at).toLocaleDateString('id-ID', {
                                    day: 'numeric', month: 'long', year: 'numeric'
                                })
                            },
                            {
                                label: 'Diperbarui', value: new Date(selected.updated_at).toLocaleDateString('id-ID', {
                                    day: 'numeric', month: 'long', year: 'numeric'
                                })
                            },
                        ].filter(r => r.value).map(row => (
                            <div key={row.label} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                                <span className="text-xs text-gray-500">{row.label}</span>
                                <span className="text-sm font-medium text-gray-900 text-right">{row.value}</span>
                            </div>
                        ))}
                    </div>
                )}
            </Modal>

            {/* Modal credentials info */}
            <Modal isOpen={!!createdCreds}
                onClose={() => setCreatedCreds(null)}
                title="Akun Berhasil Dibuat"
            >
                <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-green-800">
                            User baru berhasil didaftarkan!
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                            Kredensial ini hanya akan ditampilkan satu kali. Catat atau salin sekarang.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Nama Lengkap</label>
                            <p className="text-sm font-semibold text-gray-800 bg-gray-50 p-2.5 rounded-lg border border-gray-100">{createdCreds?.nama_lengkap}</p>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Username</label>
                            <div className="flex gap-2">
                                <input type="text" readOnly value={createdCreds?.username || ''}
                                    className="flex-1 text-sm font-mono bg-gray-50 p-2.5 rounded-lg border border-gray-100 outline-none" />
                                <button onClick={() => {
                                    navigator.clipboard.writeText(createdCreds?.username || '')
                                    setCopiedField('username')
                                    setTimeout(() => setCopiedField(null), 2000)
                                }}
                                    className={`px-3 rounded-lg text-xs font-medium border transition-colors ${copiedField === 'username'
                                        ? 'bg-green-50 border-green-300 text-green-700'
                                        : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
                                    }`}>
                                    {copiedField === 'username' ? 'Tersalin!' : 'Salin'}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Password Sementara</label>
                            <div className="flex gap-2">
                                <input type="text" readOnly value={createdCreds?.password || ''}
                                    className="flex-1 text-sm font-mono bg-gray-50 p-2.5 rounded-lg border border-gray-100 outline-none" />
                                <button onClick={() => {
                                    navigator.clipboard.writeText(createdCreds?.password || '')
                                    setCopiedField('password')
                                    setTimeout(() => setCopiedField(null), 2000)
                                }}
                                    className={`px-3 rounded-lg text-xs font-medium border transition-colors ${copiedField === 'password'
                                        ? 'bg-green-50 border-green-300 text-green-700'
                                        : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
                                    }`}>
                                    {copiedField === 'password' ? 'Tersalin!' : 'Salin'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 space-y-2">
                        <button onClick={() => {
                            if (!createdCreds) return
                            const loginUrl = `${window.location.origin}/login`
                            const text = `Halo, berikut adalah akun login Perpustakaan Anda:\n\n*Nama Lengkap*: ${createdCreds.nama_lengkap}\n*Username*: ${createdCreds.username}\n*Password*: ${createdCreds.password}\n\nSilakan login ke web perpustakaan di: ${loginUrl} dan ubah password Anda demi keamanan. Terima kasih!`;
                            const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
                            window.open(waUrl, '_blank');
                        }}
                            className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2 shadow-sm">
                            <i className="fa-brands fa-whatsapp text-base"></i>
                            <span>Bagikan ke WhatsApp</span>
                        </button>
                        <button onClick={() => setCreatedCreds(null)}
                            className="w-full py-2.5 bg-accent text-white font-medium hover:bg-accent/90 rounded-lg text-sm transition-colors">
                            Selesai
                        </button>
                    </div>
                </div>
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