'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, LogOut, User as UserIcon, Menu, X } from 'lucide-react'
import LogoKM2 from "@/public/assets/img/kampus-merdeka-2.png"
import LogoUNG from "@/public/assets/img/ung.png"
import LogoKemen from "@/public/assets/img/kemendikbud.png"

interface DashboardNavbarProps {
    user: {
        id: string
        email: string | undefined
        username: string
        full_name: string
        role: string
        avatar_url: string | null
    } | any
    generalSetting: any
    onLogout: () => void
}

export default function DashboardNavbar({ user, generalSetting, onLogout }: DashboardNavbarProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const pathname = usePathname()

    const navLinks = [
        { name: 'Dashboard', href: '/dashboard', roles: ['user', 'superadmin'] },
        { name: 'Blog', href: '/dashboard/blog', roles: ['user', 'superadmin'] },
        { name: 'User', href: '/dashboard/user', roles: ['superadmin'] },
    ]

    const filteredNavLinks = navLinks.filter(link =>
        link.roles.includes(user.role)
    )

    const isActive = (href: string) => pathname === href

    return (
        <header className="fixed top-0 w-full z-50 bg-white shadow-md">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Link href='/dashboard' className="flex items-center justify-center gap-2">
                            <img src={generalSetting?.mbkm_icon || LogoKemen.src} alt="Logo Kemendikbud" className="h-10 w-10" />
                            <img src={LogoUNG.src} alt="Logo UNG" className="h-[38px] w-[38px] mr-[2px]" />
                            <img src={LogoKM2.src} alt="Logo Kampus Merdeka" className="h-10" />
                        </Link>
                    </div>

                    <ul className="hidden lg:flex items-center gap-8">
                        {filteredNavLinks.map((link) => (
                            <li key={link.name}>
                                <Link
                                    href={link.href}
                                    className={`text-sm font-medium transition-colors relative group ${isActive(link.href)
                                            ? 'text-orange-500'
                                            : 'text-gray-700 hover:text-orange-500'
                                        }`}
                                >
                                    {link.name}
                                    <span
                                        className={`absolute -bottom-1 left-0 h-0.5 bg-orange-500 transition-all duration-300 ${isActive(link.href) ? 'w-full' : 'w-0 group-hover:w-full'
                                            }`}
                                    />
                                </Link>
                            </li>
                        ))}
                    </ul>

                    <div className="hidden lg:flex items-center gap-4">
                        <div className="relative">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-3 px-4 py-2 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200"
                            >
                                {user.avatar_url ? (
                                    <img
                                        src={user.avatar_url}
                                        alt={user.full_name}
                                        className="w-8 h-8 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                                        {user.full_name?.charAt(0)}
                                    </div>
                                )}
                                <div className="text-left">
                                    <p className="text-sm font-medium text-gray-700">{user.full_name}</p>
                                    <p className="text-xs text-gray-500">@{user.username}</p>
                                </div>
                                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-2">
                                    <div className="px-4 py-3 border-b border-gray-100">
                                        <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                                        <p className="text-xs text-gray-500 mt-1">@{user.username}</p>
                                    </div>
                                    <Link
                                        href="/dashboard/profile"
                                        onClick={() => setIsDropdownOpen(false)}
                                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        <UserIcon className="h-4 w-4" />
                                        Profile
                                    </Link>
                                    <button
                                        onClick={() => {
                                            setIsDropdownOpen(false)
                                            onLogout()
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="lg:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                        aria-label="Toggle menu"
                    >
                        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>

                {isMobileMenuOpen && (
                    <div className="lg:hidden mt-4 pb-4 border-t border-gray-200 pt-4">
                        <ul className="flex flex-col space-y-2">
                            {filteredNavLinks.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        href={link.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`block px-4 py-2 text-sm font-medium rounded-lg transition-colors ${isActive(link.href)
                                                ? 'text-orange-500 bg-orange-50'
                                                : 'text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>

                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center gap-3 px-4 py-2 mb-2">
                                {user.avatar_url ? (
                                    <img
                                        src={user.avatar_url}
                                        alt={user.full_name}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold">
                                        {user.full_name?.charAt(0)}
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                                    <p className="text-xs text-gray-500">@{user.username}</p>
                                </div>
                            </div>
                            <Link
                                href="/dashboard/profile"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                <UserIcon className="h-4 w-4" />
                                Profile
                            </Link>
                            <button
                                onClick={() => {
                                    setIsMobileMenuOpen(false)
                                    onLogout()
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <LogOut className="h-4 w-4" />
                                Logout
                            </button>
                        </div>
                    </div>
                )}
            </nav>
        </header>
    )
}