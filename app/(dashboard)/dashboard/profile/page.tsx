import { redirect } from 'next/navigation'
import { getUserFromCookie } from '@/utils/get-user'
import DashboardProfileClient from '../../../components/DashboardProfileClient'

export default async function ProfilePage() {
    const user = await getUserFromCookie()

    if (!user) {
        redirect('/login')
    }

    const userData = {
        id: user.id,
        username: user.username,
        nama_lengkap: user.nama_lengkap || user.full_name || 'User',
        email: user.email || null,
        telepon: user.telepon || null,
        role: user.role || 'pengelola',
        foto_url: user.foto_url || null,
    }

    return <DashboardProfileClient user={userData} />
}