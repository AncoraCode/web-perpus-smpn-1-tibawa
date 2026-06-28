'use client'

import { useState } from 'react'
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react'

interface ForceChangePasswordModalProps {
    isOpen: boolean
}

export default function ForceChangePasswordModal({ isOpen }: ForceChangePasswordModalProps) {
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    if (!isOpen || success) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (newPassword.length < 6) {
            setError('Password minimal 6 karakter')
            return
        }
        if (newPassword !== confirmPassword) {
            setError('Konfirmasi password tidak cocok')
            return
        }

        setLoading(true)
        setError('')

        try {
            const res = await fetch('/api/auth/force-change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ new_password: newPassword })
            })
            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.error || 'Gagal mengubah password')
            }
            setSuccess(true)
            // Reload page to reflect updated_at changes and lift the block
            window.location.reload()
        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <div className="w-full max-w-md bg-white rounded-3xl border border-gray-100 shadow-2xl p-6 flex flex-col gap-4">
                <div className="text-center">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3 text-amber-600">
                        <Lock className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Ubah Password Default Anda</h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        Demi keamanan akun Anda, silakan ubah password sementara Anda terlebih dahulu untuk dapat mengakses dashboard.
                    </p>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                        <p className="text-xs text-red-600 font-medium leading-relaxed">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                                onChange={e => { setNewPassword(e.target.value); setError('') }}
                                required
                                disabled={loading}
                                className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 focus:ring-2 focus:outline-none focus:ring-accent/30 focus:border-accent outline-none"
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

                    {/* Konfirmasi Password */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            Konfirmasi Password Baru
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={e => { setConfirmPassword(e.target.value); setError('') }}
                                required
                                disabled={loading}
                                className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 focus:ring-2 focus:outline-none focus:ring-accent/30 focus:border-accent outline-none"
                                placeholder="Ulangi password baru"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-accent text-white font-bold rounded-xl hover:bg-accent/90 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 mt-2"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        <span>Simpan Password</span>
                    </button>
                </form>
            </div>
        </div>
    )
}
