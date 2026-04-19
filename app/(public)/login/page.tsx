'use client'

import { useState } from 'react'
import { Eye, EyeOff, Loader2, User, Lock } from 'lucide-react'
import NProgress from 'nprogress'

export default function LoginPage() {
    const [formData, setFormData] = useState({ username: '', password: '' })
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

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
                throw new Error(result.error || 'Login gagal')
            }
            window.location.href = '/dashboard'
        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan, coba lagi')
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
                    src="/assets/img/sekolah.jpg"
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
                    <div className="rounded-full flex items-center justify-center mb-2 overflow-hidden">
                        <img
                            src="/assets/img/logo-sekolah.png"
                            alt="Logo SMPN 1 Tibawa"
                            className="w-24 h-24 object-contain"
                        // onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                    </div>
                    <h1 className="text-white font-semibold text-2xl mb-1">Login</h1>
                    <p className="text-white/60 text-sm">Login untuk akses Dashboard</p>
                </div>

                {/* Form Card */}
                <div className="w-full bg-white rounded-3xl shadow-2xl px-6 py-8">

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

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

                        {/* Tombol Login */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-accent text-white font-bold rounded-xl hover:bg-accent/90 focus:ring-2 focus:outline-none focus:ring-accent/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm mt-4"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            <span>{loading ? 'Memproses...' : 'Login'}</span>
                        </button>

                    </form>
                </div>

            </div>
        </div>
    )
}