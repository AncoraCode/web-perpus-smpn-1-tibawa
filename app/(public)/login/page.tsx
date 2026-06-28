'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff, Loader2, User, Lock, Mail, KeyRound, CheckCircle, ArrowLeft } from 'lucide-react'
import NProgress from 'nprogress'
import { createClient } from '@/utils/supabase/client'

export default function LoginPage() {
    const [formData, setFormData] = useState({ username: '', password: '' })
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [sekolah, setSekolah] = useState<{ logo_url: string, foto_header_url: string } | null>(null)

    // Lupa Password States
    const [isForgotPw, setIsForgotPw] = useState(false)
    const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1)
    const [forgotIdentifier, setForgotIdentifier] = useState('')
    const [maskedEmail, setMaskedEmail] = useState('')
    const [forgotEmail, setForgotEmail] = useState('')
    const [forgotCode, setForgotCode] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmNewPassword, setConfirmNewPassword] = useState('')
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false)

    // Percobaan Login Gagal
    const [failedAttempts, setFailedAttempts] = useState<{ username: string; count: number }>({ username: '', count: 0 })

    const resetForgotFields = (presetIdentifier = '') => {
        setForgotIdentifier(presetIdentifier)
        setForgotCode('')
        setNewPassword('')
        setConfirmNewPassword('')
        setForgotEmail('')
        setMaskedEmail('')
        setError('')
    }

    useEffect(() => {
        const fetchSekolah = async () => {
            const supabase = createClient()
            const { data } = await supabase
                .from('detail_sekolah')
                .select('logo_url, foto_header_url')
                .limit(1)
                .maybeSingle()
            setSekolah(data)
        }
        fetchSekolah()
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
        if (error) setError('')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            NProgress.start()
            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })
            const result = await response.json()
            NProgress.done()
            if (!response.ok) {
                setFormData({ username: formData.username, password: '' })
                if (response.status === 401) {
                    setFailedAttempts(prev => {
                        if (prev.username === formData.username) {
                            return { username: formData.username, count: prev.count + 1 }
                        } else {
                            return { username: formData.username, count: 1 }
                        }
                    })
                }
                throw new Error(result.error || 'Login gagal')
            }
            window.location.href = '/dashboard'
        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan, coba lagi')
        } finally {
            setLoading(false)
        }
    }

    // Request Kode Verifikasi Lupa PW
    const handleRequestCode = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!forgotIdentifier.trim()) { setError('Username atau Email wajib diisi'); return }
        setLoading(true)
        setError('')
        try {
            NProgress.start()
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier: forgotIdentifier.trim() })
            })
            const result = await res.json()
            NProgress.done()
            if (!res.ok) {
                throw new Error(result.error || 'Gagal mengirim kode verifikasi')
            }
            setMaskedEmail(result.maskedEmail)
            setForgotEmail(result.email)
            setForgotStep(2)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    // Reset Password dengan Kode Verifikasi
    const handleResetPw = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!forgotCode.trim() || !newPassword.trim() || !confirmNewPassword.trim()) {
            setError('Semua field wajib diisi')
            return
        }
        if (newPassword.length < 6) {
            setError('Password baru minimal 6 karakter')
            return
        }
        if (newPassword !== confirmNewPassword) {
            setError('Konfirmasi password tidak cocok')
            return
        }

        setLoading(true)
        setError('')
        try {
            NProgress.start()
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: forgotEmail,
                    code: forgotCode.trim(),
                    new_password: newPassword
                })
            })
            const result = await res.json()
            NProgress.done()
            if (!res.ok) {
                throw new Error(result.error || 'Gagal mereset password')
            }
            setForgotStep(3) // Berhasil
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        /* Full-screen background foto sekolah + overlay biru primary */
        <div className="relative min-h-screen flex flex-col items-center justify-start overflow-hidden">

            {/* Background foto sekolah */}
            <div className="absolute inset-0">
                <img
                    src={sekolah?.foto_header_url || "/assets/img/sekolah.jpg"}
                    alt="SMP Negeri 1 Tibawa"
                    className="w-full h-full object-cover"
                />
                {/* Overlay biru tua */}
                <div className="absolute inset-0 bg-primary/85" />
            </div>

            {/* Konten */}
            <div className="relative z-10 w-full flex flex-col items-center px-5 pt-14 pb-6">

                {/* Logo + Judul */}
                <div className="flex flex-col items-center mb-8">
                    <img
                        src={sekolah?.logo_url || "/assets/img/logo-sekolah.png"}
                        alt="Logo SMPN 1 Tibawa"
                        className="w-24 h-24 object-contain mb-2"
                    />
                    <h1 className="text-white font-semibold text-2xl mb-1">
                        {isForgotPw ? 'Lupa Password' : 'Login'}
                    </h1>
                    <p className="text-white/60 text-sm">
                        {isForgotPw ? 'Pulihkan password akun Anda' : 'Login untuk akses Dashboard'}
                    </p>
                </div>

                {/* Form Card */}
                <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl px-6 py-8">

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl">
                            <p className="text-sm text-red-600 leading-relaxed">{error}</p>
                        </div>
                    )}

                    {!isForgotPw && failedAttempts.count >= 3 && (
                        <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex flex-col gap-2">
                            <p className="text-xs text-amber-800 leading-relaxed">
                                Anda telah gagal login sebanyak <strong>{failedAttempts.count} kali</strong>. Apakah Anda melupakan password Anda?
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsForgotPw(true)
                                    setForgotStep(1)
                                    resetForgotFields(failedAttempts.username)
                                }}
                                className="text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 py-2 px-3 rounded-lg text-center transition-colors border border-amber-300/30"
                            >
                                Reset / Lupa Password
                            </button>
                        </div>
                    )}

                    {!isForgotPw ? (
                        /* LOGIN FORM */
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                            {/* Username / NIP */}
                            <div>
                                <label htmlFor="username" className="block text-xs font-semibold text-gray-700 mb-1.5">
                                    Username / NIP
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        id="username"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        required
                                        disabled={loading}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:outline-none focus:ring-accent/30 focus:border-accent transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                                        placeholder="Masukkan Username atau NIP"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="password" className="block text-xs font-semibold text-gray-700 mb-1.5">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        disabled={loading}
                                        className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:outline-none focus:ring-accent/30 focus:border-accent transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                                        placeholder="Masukkan Password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        disabled={loading}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                                    >
                                        {showPassword
                                            ? <EyeOff className="w-4 h-4" />
                                            : <Eye className="w-4 h-4" />
                                        }
                                    </button>
                                </div>
                            </div>

                            {/* Lupa Password Link */}
                            <div className="flex justify-end -mt-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsForgotPw(true)
                                        setForgotStep(1)
                                        resetForgotFields('')
                                    }}
                                    className="text-xs font-semibold text-accent hover:underline"
                                >
                                    Lupa Password?
                                </button>
                            </div>

                            {/* Tombol Login */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-accent text-white font-bold rounded-xl hover:bg-accent/90 focus:ring-2 focus:outline-none focus:ring-accent/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm mt-2"
                            >
                                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                <span>{loading ? 'Memproses...' : 'Login'}</span>
                            </button>

                        </form>
                    ) : (
                        /* LUPA PASSWORD FLOW */
                        <div>
                            {forgotStep === 1 && (
                                /* TAHAP 1: KIRIM KODE */
                                <form onSubmit={handleRequestCode} className="flex flex-col gap-4">
                                    <div>
                                        <label htmlFor="forgotIdentifier" className="block text-xs font-semibold text-gray-700 mb-1.5">
                                            Username atau Email
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                id="forgotIdentifier"
                                                value={forgotIdentifier}
                                                onChange={e => { setForgotIdentifier(e.target.value); if (error) setError('') }}
                                                required
                                                disabled={loading}
                                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:outline-none focus:ring-accent/30 focus:border-accent transition-all disabled:bg-gray-50 outline-none"
                                                placeholder="Masukkan Username atau Email"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-3 bg-accent text-white font-bold rounded-xl hover:bg-accent/90 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                                    >
                                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                        <span>Kirim Kode Verifikasi</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => { setIsForgotPw(false); resetForgotFields('') }}
                                        className="w-full py-3 bg-gray-50 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-100 transition-all text-sm flex items-center justify-center gap-1.5"
                                    >
                                        <ArrowLeft className="w-4 h-4" /> Kembali ke Login
                                    </button>
                                </form>
                            )}

                            {forgotStep === 2 && (
                                /* TAHAP 2: VERIFIKASI KODE & PASSWORD BARU */
                                <form onSubmit={handleResetPw} className="flex flex-col gap-4">
                                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 text-xs text-blue-800">
                                        <p className="font-semibold mb-1">Kode Terkirim!</p>
                                        <p>Kami telah mengirimkan 6 digit kode verifikasi ke email: <strong className="font-mono text-sm block mt-0.5">{maskedEmail}</strong></p>
                                    </div>

                                    {/* Kode Verifikasi */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                            Kode Verifikasi (6 Angka)
                                        </label>
                                        <div className="relative">
                                            <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                maxLength={6}
                                                value={forgotCode}
                                                onChange={e => { setForgotCode(e.target.value.replace(/\D/g, '')); if (error) setError('') }}
                                                required
                                                disabled={loading}
                                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm font-mono tracking-widest text-center text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:outline-none focus:ring-accent/30 focus:border-accent transition-all disabled:bg-gray-50 outline-none"
                                                placeholder="------"
                                            />
                                        </div>
                                    </div>

                                    {/* Password Baru */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                            Password Baru
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type={showNewPassword ? 'text' : 'password'}
                                                value={newPassword}
                                                onChange={e => { setNewPassword(e.target.value); if (error) setError('') }}
                                                required
                                                disabled={loading}
                                                className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:outline-none focus:ring-accent/30 focus:border-accent transition-all disabled:bg-gray-50 outline-none"
                                                placeholder="Min. 6 karakter"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Konfirmasi Password Baru */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                            Konfirmasi Password Baru
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type={showConfirmNewPassword ? 'text' : 'password'}
                                                value={confirmNewPassword}
                                                onChange={e => { setConfirmNewPassword(e.target.value); if (error) setError('') }}
                                                required
                                                disabled={loading}
                                                className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:outline-none focus:ring-accent/30 focus:border-accent transition-all disabled:bg-gray-50 outline-none"
                                                placeholder="Ulangi password baru"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-3 bg-accent text-white font-bold rounded-xl hover:bg-accent/90 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                                    >
                                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                        <span>Simpan Password Baru</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => { setForgotStep(1); resetForgotFields(forgotIdentifier) }}
                                        className="w-full py-3 bg-gray-50 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-100 transition-all text-sm flex items-center justify-center gap-1.5"
                                    >
                                        <ArrowLeft className="w-4 h-4" /> Kembali / Kirim Ulang
                                    </button>
                                </form>
                            )}

                            {forgotStep === 3 && (
                                /* TAHAP 3: BERHASIL */
                                <div className="flex flex-col items-center text-center py-4 gap-4">
                                    <CheckCircle className="w-16 h-16 text-green-500" />
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">Password Diperbarui</h3>
                                        <p className="text-sm text-gray-500 mt-1">Password Anda berhasil diubah. Silakan masuk menggunakan password baru.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsForgotPw(false)
                                            setForgotStep(1)
                                            setFormData({ username: '', password: '' })
                                            resetForgotFields('')
                                        }}
                                        className="w-full py-3 bg-accent text-white font-bold rounded-xl hover:bg-accent/90 transition-all text-sm"
                                    >
                                        Masuk Sekarang
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    )
}