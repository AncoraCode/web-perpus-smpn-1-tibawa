import { redirect } from 'next/navigation'
import { getUserFromCookie } from '@/utils/get-user'
import { createClient } from '@/utils/supabase/server'
import SiswaClient from './SiswaClient'

async function getSiswaData() {
    try {
        const supabase = await createClient()

        // Fetch semua siswa dengan sorting
        const { data: siswa, error } = await supabase
            .from('siswa')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching siswa:', error)
            return []
        }

        return siswa || []
    } catch (error) {
        console.error('Error in getSiswaData:', error)
        return []
    }
}

export default async function SiswaPage() {
    const user = await getUserFromCookie()

    if (!user) {
        redirect('/login')
    }

    // Role check: Admin & Guru bisa akses
    if (!['admin', 'guru'].includes(user.role)) {
        redirect('/dashboard')
    }

    const siswaData = await getSiswaData()

    return <SiswaClient siswaData={siswaData} user={user} />
}