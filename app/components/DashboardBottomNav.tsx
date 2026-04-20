'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookMarked, QrCode, History, Menu, Users, BookOpen, Grid3x3, Layers, School } from 'lucide-react'
import { useState } from 'react'

const mainNavItems = [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    { label: 'Peminjaman', href: '/dashboard/peminjaman', icon: BookMarked },
    { label: 'Scan', href: '/dashboard/scan', icon: QrCode, isCenter: true },
    { label: 'Riwayat', href: '/dashboard/riwayat', icon: History },
    { label: 'Menu', href: '#', icon: Menu, isMenu: true },
]

// Menu lainnya - conditional by role
const getOtherMenus = (role: string) => {
    const menus = [
        { label: 'Siswa', href: '/dashboard/siswa', icon: Users, roles: ['admin', 'guru'] },
        { label: 'Rak', href: '/dashboard/rak', icon: Grid3x3, roles: ['admin'] },
        { label: 'Kategori Buku', href: '/dashboard/kategori', icon: Layers, roles: ['admin'] },
        { label: 'Buku', href: '/dashboard/buku', icon: BookOpen, roles: ['admin'] },
        { label: 'Detail Sekolah', href: '/dashboard/sekolah', icon: School, roles: ['admin'] },
        { label: 'Users', href: '/dashboard/users', icon: Users, roles: ['admin'] },
    ]

    return menus.filter(menu => menu.roles.includes(role))
}

interface DashboardBottomNavProps {
    user?: {
        role: string
    }
}

export default function DashboardBottomNav({ user }: DashboardBottomNavProps) {
    const pathname = usePathname()
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const otherMenus = getOtherMenus(user?.role || 'guru')

    const isActive = (href: string) => {
        if (href === '/dashboard') return pathname === '/dashboard'
        return pathname.startsWith(href) && href !== '/dashboard'
    }

    return (
        <>
            {/* Menu Overlay */}
            {isMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={() => setIsMenuOpen(false)}
                />
            )}

            <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-mobile bg-white rounded-t-3xl shadow-2xl z-50 transition-transform duration-300 py-4 ${
                isMenuOpen ? 'translate-y-4' : 'translate-y-[150%]'
            }`}>
                <div className="p-6">
                    {/* Handle */}
                    <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
                    
                    {/* Title */}
                    <h3 className="text-base font-bold text-gray-900 mb-4">Menu Lainnya</h3>
                    
                    {/* Menu Grid */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        {otherMenus.map((item) => {
                            const Icon = item.icon
                            const active = isActive(item.href)
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                        active 
                                            ? 'bg-accent text-white' 
                                            : 'bg-surface text-gray-600'
                                    }`}>
                                        <Icon className="w-5 h-5" strokeWidth={2} />
                                    </div>
                                    <span className={`text-[10px] font-medium text-center leading-tight ${
                                        active ? 'text-accent' : 'text-gray-700'
                                    }`}>
                                        {item.label}
                                    </span>
                                </Link>
                            )
                        })}
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={() => setIsMenuOpen(false)}
                        className="w-full py-2.5 bg-surface text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                        Tutup
                    </button>
                </div>
            </div>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 w-full max-w-mobile bg-white border-t border-gray-100 z-50 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
                <div className="flex items-center justify-around h-16 relative">
                    {mainNavItems.map((item) => {
                        const Icon = item.icon
                        const active = isActive(item.href)

                        // Tombol Scan Barcode (Center)
                        if (item.isCenter) {
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="flex flex-col items-center justify-center flex-1"
                                >
                                    {/* Tombol Bulat Menonjol */}
                                    <div className="absolute -top-6">
                                        <div className="w-14 h-14 rounded-full bg-primary shadow-xl flex items-center justify-center border-4 border-white">
                                            <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                                        </div>
                                    </div>
                                    {/* Label di bawah */}
                                    <span className="text-[10px] font-medium text-primary mt-6">
                                        {item.label}
                                    </span>
                                </Link>
                            )
                        }

                        // Tombol Menu Lainnya
                        if (item.isMenu) {
                            return (
                                <button
                                    key="menu"
                                    onClick={() => setIsMenuOpen(true)}
                                    className="flex flex-col items-center justify-center gap-1 flex-1"
                                >
                                    <div className={`rounded-xl transition-all ${
                                        isMenuOpen ? 'bg-accent/10' : ''
                                    }`}>
                                        <Icon
                                            className={`w-5 h-5 ${
                                                isMenuOpen ? 'text-accent' : 'text-[#909090]'
                                            } transition-colors`}
                                            strokeWidth={2}
                                        />
                                    </div>
                                    <span className={`text-[10px] font-medium ${
                                        isMenuOpen ? 'font-semibold text-accent' : 'opacity-70 text-[#909090]'
                                    } transition-all`}>
                                        {item.label}
                                    </span>
                                </button>
                            )
                        }

                        // Tombol Biasa
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex flex-col items-center justify-center gap-1 flex-1"
                            >
                                <div className={`${active ? "rounded-xl bg-blue-700/10" : ""} transition-all duration-500`}>
                                    <Icon
                                        className={`w-5 h-5 ${
                                            active ? 'text-accent' : 'text-[#909090]'
                                        } transition-all`}
                                        strokeWidth={2}
                                    />
                                </div>
                                <span className={`text-[10px] font-medium ${
                                    active ? 'font-semibold text-accent' : 'opacity-70 text-[#909090]'
                                } transition-all`}>
                                    {item.label}
                                </span>
                            </Link>
                        )
                    })}
                </div>
            </nav>
        </>
    )
}