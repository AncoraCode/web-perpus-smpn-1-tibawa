'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, School, LogIn, LayoutDashboard } from 'lucide-react'

interface BottomNavProps {
    user?: any
}

export default function BottomNav({ user }: BottomNavProps) {
    const pathname = usePathname()

    const navItems = [
        { label: 'Beranda', href: '/', icon: Home },
        { label: 'Detail Sekolah', href: '/detail', icon: School },
        { 
            label: user ? 'Dashboard' : 'Login', 
            href: user ? '/dashboard' : '/login', 
            icon: user ? LayoutDashboard : LogIn 
        },
    ]

    const isActive = (href: string) => {
        if (href === '/') return pathname === '/'
        return pathname.startsWith(href)
    }

    return (
        <nav className="fixed bottom-0 w-full max-w-mobile bg-white border-t border-gray-100 z-50 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
            <div className="flex items-stretch h-16">
                {navItems.map((item) => {
                    const active = isActive(item.href)
                    const Icon = item.icon
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex-1 flex flex-col items-center justify-center gap-1 transition-all"
                        >
                            <div className={`px-3 py-1 ${active ? "rounded-xl bg-blue-700/10" : ""} transition-all duration-500`}>
                                <Icon
                                    className={`w-5 h-5 ${active ? "text-accent" : "text-[#909090]"} transition-all`}
                                    strokeWidth={2}
                                />
                            </div>
                            <span className={`text-[10px] font-medium ${active ? 'font-semibold text-accent' : 'opacity-70 text-[#909090]'} transition-all`}>
                                {item.label}
                            </span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}