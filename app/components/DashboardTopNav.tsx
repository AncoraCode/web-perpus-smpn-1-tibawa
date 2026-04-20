'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, LogOut, ChevronDown } from 'lucide-react'
import NProgress from 'nprogress'

interface DashboardTopNavProps {
    user: {
        full_name?: string
        foto_url?: string | null
    }
}

export default function DashboardTopNav({ user }: DashboardTopNavProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [isOpenLogout, setIsOpenLogout] = useState(false)
    const router = useRouter()

    const handleLogout = async () => {
        if (isOpenLogout) {
            try {
                const response = await fetch('/api/auth', {
                    method: 'DELETE'
                })

                if (response.ok) {
                    NProgress.start()
                    router.push('/login')
                }
            } catch (error) {
                console.error('Logout error:', error)
            }
        }
    }

    const initial = user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'

    return (
        <header className="fixed top-0 w-full max-w-mobile z-40 bg-white border-b border-gray-200">
            <div className="px-4 py-3 flex items-center justify-between">

                {/* Kiri: Logo + Title */}
                <div className="flex items-center gap-3">
                    <img
                        src="/assets/img/logo-sekolah.png"
                        alt="Logo SMP Negeri 1 Tibawa"
                        className="w-12 h-12 object-contain"
                    />
                    <div>
                        <h1 className="text-sm font-bold text-gray-900 leading-tight">
                            Perpustakaan Digital
                        </h1>
                        <p className="text-[10px] text-gray-500 leading-tight mt-0.5">
                            SMP NEGERI 1 TIBAWA
                        </p>
                    </div>
                </div>

                {/* Kanan: Dropdown Profile */}
                <div className="relative">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2"
                    >
                        {user?.foto_url ? (
                            <img
                                src={user.foto_url}
                                alt={user.full_name || 'User'}
                                className="w-10 h-10 rounded-full object-cover border-2 border-gray-100"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm border-2 border-gray-100">
                                {initial}
                            </div>
                        )}
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <>
                            {/* Backdrop */}
                            <div
                                className="fixed inset-0 z-30"
                                onClick={() => setIsDropdownOpen(false)}
                            />

                            {/* Menu */}
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-lg border border-gray-100 z-40 overflow-hidden">
                                {/* User Info */}
                                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                        {user?.full_name || 'User'}
                                    </p>
                                </div>

                                {/* Menu Items */}
                                <button
                                    onClick={() => {
                                        setIsDropdownOpen(false)
                                        router.push('/dashboard/profile')
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <User className="w-4 h-4" />
                                    Profile
                                </button>

                                <button
                                    onClick={() => {
                                        let confirmed = confirm("Apakah Anda yakin ingin logout?");

                                        if(confirmed) {
                                            handleLogout()
                                            setIsDropdownOpen(false)
                                        }
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Logout
                                </button>
                            </div>
                        </>
                    )}
                </div>

            </div>
        </header>
    )
}