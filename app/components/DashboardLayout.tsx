'use client'

import { useRouter } from 'next/navigation'
import NProgress from 'nprogress'
import DashboardTopNav from './DashboardTopNav'
import DashboardBottomNav from './DashboardBottomNav'
import DashboardHeader from './DashboardHeader'

interface DashboardLayoutProps {
    children: React.ReactNode
    user: {
        id: string
        email: string | undefined
        username: string
        full_name: string
        role: string
        foto_url?: string | null
    }
    generalSetting: any
}

export default function DashboardLayout({ children, user, generalSetting }: DashboardLayoutProps) {
    const router = useRouter()

    const handleLogout = async () => {
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

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Desktop Header */}
            <div className="hidden lg:block">
                <DashboardHeader
                    user={user}
                    generalSetting={generalSetting}
                    onLogout={handleLogout}
                />
            </div>

            {/* Mobile Top Nav */}
            <div className="lg:hidden">
                <DashboardTopNav user={user} />
            </div>

            {/* Main Content */}
            <main className="lg:pt-16 pt-16 pb-24 lg:pb-0">
                {children}
            </main>

            {/* Mobile Bottom Nav */}
            <DashboardBottomNav />
        </div>
    )
}