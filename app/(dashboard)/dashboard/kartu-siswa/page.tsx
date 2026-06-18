import { redirect } from 'next/navigation'
import { getUserFromCookie } from '@/utils/get-user'
import { createClient } from '@/utils/supabase/server'
import KartuSiswaClient from './KartuSiswaClient'

async function getSiswaData() {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('siswa')
            .select('id, nis, nama_lengkap, kelas, status')
            .eq('status', 'aktif')
            .order('kelas', { ascending: true })
            .order('nama_lengkap', { ascending: true })

        if (error) {
            console.error('Error fetching siswa:', error)
            return []
        }

        return data || []
    } catch (error) {
        console.error('Error in getSiswaData:', error)
        return []
    }
}

export default async function KartuSiswaPage() {
    const user = await getUserFromCookie()
    if (!user) redirect('/login')

    const siswaData = await getSiswaData()

    return <KartuSiswaClient siswaData={siswaData} />
}