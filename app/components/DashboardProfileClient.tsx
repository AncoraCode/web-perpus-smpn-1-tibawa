'use client'

import { useState, useRef, useCallback } from 'react'
import {
    User, Mail, Phone, Shield, Edit2, Save, X, Lock,
    Eye, EyeOff, CheckCircle2, XCircle, Camera, Loader2, Trash2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Modal from '@/app/components/Modal'
import { createClient } from '@/utils/supabase/client'
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
interface ProfileUser {
    id: string
    username: string
    nama_lengkap: string
    email: string | null
    telepon: string | null
    role: string
    foto_url: string | null
}

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
function centerAspectCrop(mediaWidth: number, mediaHeight: number): Crop {
    return centerCrop(
        makeAspectCrop({ unit: '%', width: 80 }, 1, mediaWidth, mediaHeight),
        mediaWidth,
        mediaHeight
    )
}

// Canvas crop → Blob
async function getCroppedBlob(
    image: HTMLImageElement,
    crop: PixelCrop,
    fileName: string
): Promise<Blob> {
    const canvas = document.createElement('canvas')
    const scaleX  = image.naturalWidth  / image.width
    const scaleY  = image.naturalHeight / image.height
    const size    = 400 // output 400x400px

    canvas.width  = size
    canvas.height = size

    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(
        image,
        crop.x * scaleX, crop.y * scaleY,
        crop.width * scaleX, crop.height * scaleY,
        0, 0, size, size
    )

    return new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
            if (blob) resolve(blob)
            else reject(new Error('Canvas empty'))
        }, 'image/jpeg', 0.92)
    })
}

/* ─────────────────────────────────────────
   PASSWORD FIELDS — di luar komponen utama
───────────────────────────────────────── */
interface PasswordFieldsProps {
    data: { old_password: string; new_password: string; confirm_password: string }
    error: string; disabled: boolean
    showOld: boolean; showNew: boolean; showConfirm: boolean
    onToggleOld: () => void; onToggleNew: () => void; onToggleConfirm: () => void
    onChange: (key: string, val: string) => void
}

function PasswordFields({ data, error, disabled, showOld, showNew, showConfirm, onToggleOld, onToggleNew, onToggleConfirm, onChange }: PasswordFieldsProps) {
    return (
        <div className="space-y-4">
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-xs text-red-600 font-medium">{error}</p>
                </div>
            )}
            {[
                { key: 'old_password',     label: 'Password Lama',            show: showOld,     toggle: onToggleOld,     ph: 'Masukkan password lama' },
                { key: 'new_password',     label: 'Password Baru',            show: showNew,     toggle: onToggleNew,     ph: 'Min. 6 karakter' },
                { key: 'confirm_password', label: 'Konfirmasi Password Baru', show: showConfirm, toggle: onToggleConfirm, ph: 'Ulangi password baru' },
            ].map(field => (
                <div key={field.key}>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        {field.label} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <input
                            type={field.show ? 'text' : 'password'}
                            value={(data as any)[field.key]} disabled={disabled}
                            onChange={e => onChange(field.key, e.target.value)}
                            className={`w-full px-3 py-2.5 pr-10 border rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:bg-gray-50 outline-none transition-colors ${
                                field.key === 'confirm_password' && data.confirm_password
                                    ? data.new_password === data.confirm_password ? 'border-green-300' : 'border-red-300 bg-red-50'
                                    : 'border-gray-200'
                            }`}
                            placeholder={field.ph}
                        />
                        <button type="button" onClick={field.toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {field.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    {field.key === 'new_password' && data.new_password && (
                        <div className="flex items-center gap-1 mt-1.5">
                            {[1,2,3].map(i => (
                                <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                                    data.new_password.length >= i * 3
                                        ? i===1 ? 'bg-red-400' : i===2 ? 'bg-amber-400' : 'bg-green-400'
                                        : 'bg-gray-200'
                                }`} />
                            ))}
                            <span className="text-xs text-gray-400 ml-1 flex-shrink-0">
                                {data.new_password.length < 3 ? 'Lemah' : data.new_password.length < 6 ? 'Sedang' : 'Kuat'}
                            </span>
                        </div>
                    )}
                    {field.key === 'confirm_password' && data.confirm_password && (
                        data.new_password === data.confirm_password
                            ? <p className="text-xs text-green-500 mt-1">✓ Password cocok</p>
                            : <p className="text-xs text-red-500 mt-1">Password tidak cocok</p>
                    )}
                </div>
            ))}
        </div>
    )
}

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function DashboardProfileClient({ user }: { user: ProfileUser }) {
    const router   = useRouter()
    const supabase = createClient()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const imgRef       = useRef<HTMLImageElement>(null)

    const [isEditing,        setIsEditing]        = useState(false)
    const [isSaving,         setIsSaving]         = useState(false)
    const [isChangingPw,     setIsChangingPw]     = useState(false)
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)

    const [fotoUrl, setFotoUrl] = useState<string | null>(user.foto_url)

    // Crop modal state
    const [showCropModal,       setShowCropModal]       = useState(false)
    const [showDeletePhotoModal,setShowDeletePhotoModal] = useState(false)
    const [rawImageSrc,         setRawImageSrc]         = useState<string>('')
    const [rawFileName,         setRawFileName]         = useState<string>('')
    const [crop,                setCrop]                = useState<Crop>()
    const [completedCrop,       setCompletedCrop]       = useState<PixelCrop>()

    const [showPasswordModal, setShowPasswordModal] = useState(false)
    const [notif, setNotif] = useState<{ show: boolean; success: boolean; message: string }>({
        show: false, success: true, message: ''
    })

    // Profile form
    const [profileForm, setProfileForm] = useState({
        nama_lengkap: user.nama_lengkap,
        email:        user.email   ?? '',
        telepon:      user.telepon ?? '',
    })
    const [profileError, setProfileError] = useState('')

    // Password form
    const [pwForm,      setPwForm]      = useState({ old_password: '', new_password: '', confirm_password: '' })
    const [pwError,     setPwError]     = useState('')
    const [showOld,     setShowOld]     = useState(false)
    const [showNew,     setShowNew]     = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    const showNotif = (success: boolean, message: string) =>
        setNotif({ show: true, success, message })

    /* ── Pilih file → tampilkan crop modal ── */
    const handleFotoClick = () => {
        if (!isUploadingPhoto) fileInputRef.current?.click()
    }

    const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
            showNotif(false, 'Format tidak didukung. Gunakan JPG, PNG, atau WebP')
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            showNotif(false, 'Ukuran foto maksimal 5MB')
            return
        }

        // Baca file → buka crop modal
        const reader = new FileReader()
        reader.onload = () => {
            setRawImageSrc(reader.result as string)
            setRawFileName(file.name)
            setCrop(undefined)
            setCompletedCrop(undefined)
            setShowCropModal(true)
        }
        reader.readAsDataURL(file)

        // Reset input agar file yang sama bisa dipilih ulang
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget
        setCrop(centerAspectCrop(width, height))
    }, [])

    /* ── Upload setelah crop ── */
    const handleUploadCropped = async () => {
        if (!imgRef.current || !completedCrop) {
            showNotif(false, 'Selesaikan crop terlebih dahulu')
            return
        }

        setIsUploadingPhoto(true)
        setShowCropModal(false)

        try {
            // Crop → blob
            const blob = await getCroppedBlob(imgRef.current, completedCrop, rawFileName)

            // Hapus foto lama
            if (fotoUrl) {
                const oldPath = fotoUrl.split('/avatars/')[1]
                if (oldPath) await supabase.storage.from('avatars').remove([oldPath])
            }

            // Upload
            const ext      = 'jpg'
            const filePath = `${user.id}/avatar_${Date.now()}.${ext}`

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true })

            if (uploadError) {
                showNotif(false, 'Gagal upload: ' + uploadError.message)
                setIsUploadingPhoto(false)
                return
            }

            // Public URL
            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
            const publicUrl = urlData.publicUrl

            // Simpan ke DB
            const { error: dbError } = await supabase
                .from('profiles')
                .update({ foto_url: publicUrl })
                .eq('id', user.id)

            if (dbError) {
                showNotif(false, 'Gagal simpan ke DB: ' + dbError.message)
                setIsUploadingPhoto(false)
                return
            }

            // Update cookie → TopNav ikut berubah
            await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nama_lengkap: profileForm.nama_lengkap,
                    email:        profileForm.email   || null,
                    telepon:      profileForm.telepon || null,
                    foto_url:     publicUrl,
                })
            })

            // Update UI langsung
            setFotoUrl(publicUrl)
            showNotif(true, 'Foto profil berhasil diperbarui!')

            // Hard refresh agar TopNav server component ikut reload
            router.refresh()

        } catch (err: any) {
            showNotif(false, 'Terjadi kesalahan: ' + err.message)
        } finally {
            setIsUploadingPhoto(false)
        }
    }

    /* ── Hapus Foto ── */
    const handleDeletePhoto = async () => {
        if (!fotoUrl) return
        setIsUploadingPhoto(true)

        try {
            const oldPath = fotoUrl.split('/avatars/')[1]
            if (oldPath) await supabase.storage.from('avatars').remove([oldPath])

            await supabase.from('profiles').update({ foto_url: null }).eq('id', user.id)

            await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nama_lengkap: profileForm.nama_lengkap,
                    email:        profileForm.email   || null,
                    telepon:      profileForm.telepon || null,
                    foto_url:     null,
                })
            })

            setFotoUrl(null)
            setShowDeletePhotoModal(false)
            showNotif(true, 'Foto profil berhasil dihapus')
            router.refresh()
        } catch (err: any) {
            showNotif(false, 'Gagal menghapus foto')
        } finally {
            setIsUploadingPhoto(false)
        }
    }

    /* ── Update Profile ── */
    const handleSaveProfile = async () => {
        if (!profileForm.nama_lengkap.trim()) { setProfileError('Nama lengkap tidak boleh kosong'); return }
        setProfileError('')
        setIsSaving(true)

        const res = await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nama_lengkap: profileForm.nama_lengkap.trim(),
                email:        profileForm.email.trim()   || null,
                telepon:      profileForm.telepon.trim() || null,
            })
        })

        const result = await res.json()
        if (!res.ok) { setProfileError(result.error || 'Gagal menyimpan'); setIsSaving(false); return }

        setIsSaving(false)
        setIsEditing(false)
        showNotif(true, 'Profil berhasil diperbarui!')
        router.refresh()
    }

    const handleCancelEdit = () => {
        setProfileForm({ nama_lengkap: user.nama_lengkap, email: user.email ?? '', telepon: user.telepon ?? '' })
        setProfileError('')
        setIsEditing(false)
    }

    /* ── Ganti Password ── */
    const handleChangePassword = async () => {
        if (!pwForm.old_password || !pwForm.new_password || !pwForm.confirm_password) { setPwError('Semua field wajib diisi'); return }
        if (pwForm.new_password.length < 6) { setPwError('Password baru minimal 6 karakter'); return }
        if (pwForm.new_password !== pwForm.confirm_password) { setPwError('Konfirmasi password tidak cocok'); return }

        setPwError('')
        setIsChangingPw(true)

        const res = await fetch('/api/auth/password', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id, old_password: pwForm.old_password, new_password: pwForm.new_password })
        })

        const result = await res.json()
        if (!res.ok) { setPwError(result.error || 'Gagal mengubah password'); setIsChangingPw(false); return }

        setIsChangingPw(false)
        setShowPasswordModal(false)
        setPwForm({ old_password: '', new_password: '', confirm_password: '' })
        showNotif(true, 'Password berhasil diubah!')
    }

    const handlePwChange = (key: string, val: string) => {
        setPwForm(prev => ({ ...prev, [key]: val }))
        if (pwError) setPwError('')
    }

    const initial = user.nama_lengkap.charAt(0).toUpperCase()

    return (
        <div className="px-4 py-6 space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Profil Saya</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Kelola informasi akun Anda</p>
                </div>
                {!isEditing && (
                    <button onClick={() => setIsEditing(true)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-accent text-white rounded-xl text-xs font-medium hover:bg-accent/90 transition-colors">
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                )}
            </div>

            {/* Avatar */}
            <div className="flex flex-col items-center py-4">
                <div className="relative">
                    {fotoUrl ? (
                        <img src={fotoUrl} alt={user.nama_lengkap}
                            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-3xl font-bold shadow-lg border-4 border-white">
                            {initial}
                        </div>
                    )}
                    {isUploadingPhoto && (
                        <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                        </div>
                    )}
                    <button onClick={handleFotoClick} disabled={isUploadingPhoto}
                        title="Ganti foto profil"
                        className="absolute bottom-0 right-0 w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center shadow-md hover:bg-accent/90 transition-colors border-2 border-white disabled:opacity-50">
                        <Camera className="w-3.5 h-3.5" />
                    </button>
                </div>

                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                    className="hidden" onChange={handleFotoChange} />

                <h2 className="text-lg font-bold text-gray-900 mt-3">{user.nama_lengkap}</h2>
                <p className="text-sm text-gray-500">@{user.username}</p>
                <span className={`mt-2 text-xs px-3 py-1 rounded-full font-semibold ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}>
                    {user.role === 'admin' ? '⚡ Administrator' : '📚 Guru'}
                </span>

                {fotoUrl && !isUploadingPhoto && (
                    <button onClick={() => setShowDeletePhotoModal(true)}
                        className="mt-2 flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors">
                        <Trash2 className="w-3 h-3" /> Hapus foto
                    </button>
                )}
                <p className="text-xs text-gray-400 mt-1">JPG/PNG/WebP · maks. 5MB</p>
            </div>

            {/* Profile Error */}
            {profileError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-xs text-red-600 font-medium">{profileError}</p>
                </div>
            )}

            {/* Form */}
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Nama Lengkap {isEditing && <span className="text-red-500">*</span>}
                    </label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" value={profileForm.nama_lengkap}
                            disabled={!isEditing || isSaving}
                            onChange={e => { setProfileForm(p => ({ ...p, nama_lengkap: e.target.value })); setProfileError('') }}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:bg-gray-50 outline-none"
                            placeholder="Nama lengkap" />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="email" value={profileForm.email}
                            disabled={!isEditing || isSaving}
                            onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:bg-gray-50 outline-none"
                            placeholder="email@example.com" />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Telepon</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="tel" value={profileForm.telepon}
                            disabled={!isEditing || isSaving}
                            onChange={e => setProfileForm(p => ({ ...p, telepon: e.target.value }))}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:bg-gray-50 outline-none"
                            placeholder="08123456789" />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Username <span className="text-xs font-normal text-gray-400">(tidak dapat diubah)</span>
                    </label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" value={user.username} disabled
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-500 cursor-not-allowed outline-none" />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Role <span className="text-xs font-normal text-gray-400">(tidak dapat diubah)</span>
                    </label>
                    <div className="relative">
                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" value={user.role === 'admin' ? 'Administrator' : 'Guru'} disabled
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-500 cursor-not-allowed outline-none" />
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            {isEditing ? (
                <div className="flex gap-3">
                    <button onClick={handleCancelEdit} disabled={isSaving}
                        className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
                        <X className="w-4 h-4" /> Batal
                    </button>
                    <button onClick={handleSaveProfile} disabled={isSaving}
                        className="flex-1 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => { setPwForm({ old_password: '', new_password: '', confirm_password: '' }); setPwError(''); setShowPasswordModal(true) }}
                    className="w-full py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors flex items-center justify-center gap-2 text-sm">
                    <Lock className="w-4 h-4" /> Ubah Password
                </button>
            )}

            {/* ════ MODALS ════ */}

            {/* ── Crop Modal ── */}
            <Modal
                isOpen={showCropModal}
                onClose={() => { if (!isUploadingPhoto) setShowCropModal(false) }}
                title="Crop Foto Profil"
                confirmation={{
                    negativeBtn: 'Batal',
                    positiveBtn: 'Gunakan Foto Ini',
                    handlePositiveBtn: handleUploadCropped,
                    loading: { text: 'Mengupload...', isLoading: isUploadingPhoto, setIsLoading: setIsUploadingPhoto }
                }}
            >
                <div className="space-y-3">
                    <p className="text-xs text-gray-500 text-center">
                        Geser dan resize area crop. Hasil akhir akan berupa foto persegi (1:1).
                    </p>
                    <div className="flex justify-center bg-gray-50 rounded-xl overflow-hidden p-2">
                        {rawImageSrc && (
                            <ReactCrop
                                crop={crop}
                                onChange={(_, pct) => setCrop(pct)}
                                onComplete={c => setCompletedCrop(c)}
                                aspect={1}
                                circularCrop
                                keepSelection
                                className="max-h-72 w-full object-contain"
                            >
                                <img
                                    ref={imgRef}
                                    src={rawImageSrc}
                                    alt="Crop preview"
                                    onLoad={onImageLoad}
                                    className="max-h-72 w-full object-contain"
                                />
                            </ReactCrop>
                        )}
                    </div>
                    <p className="text-xs text-gray-400 text-center">
                        💡 Lingkaran crop hanya preview — hasil akhir berbentuk lingkaran di profil
                    </p>
                </div>
            </Modal>

            {/* Hapus Foto */}
            <Modal
                isOpen={showDeletePhotoModal}
                onClose={() => !isUploadingPhoto && setShowDeletePhotoModal(false)}
                title="Hapus Foto Profil"
                confirmation={{
                    negativeBtn: 'Batal',
                    positiveBtn: 'Ya, Hapus',
                    handlePositiveBtn: handleDeletePhoto,
                    loading: { text: 'Menghapus...', isLoading: isUploadingPhoto, setIsLoading: setIsUploadingPhoto }
                }}
            >
                <p className="text-sm text-gray-600">
                    Apakah Anda yakin ingin menghapus foto profil? Avatar akan kembali ke inisial nama.
                </p>
            </Modal>

            {/* Ubah Password */}
            <Modal
                isOpen={showPasswordModal}
                onClose={() => { if (!isChangingPw) { setShowPasswordModal(false); setPwError('') } }}
                title="Ubah Password"
                confirmation={{
                    negativeBtn: 'Batal',
                    positiveBtn: 'Ubah Password',
                    handlePositiveBtn: handleChangePassword,
                    loading: { text: 'Mengubah...', isLoading: isChangingPw, setIsLoading: setIsChangingPw }
                }}
            >
                <PasswordFields
                    data={pwForm} error={pwError} disabled={isChangingPw}
                    showOld={showOld} showNew={showNew} showConfirm={showConfirm}
                    onToggleOld={() => setShowOld(p => !p)}
                    onToggleNew={() => setShowNew(p => !p)}
                    onToggleConfirm={() => setShowConfirm(p => !p)}
                    onChange={handlePwChange}
                />
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