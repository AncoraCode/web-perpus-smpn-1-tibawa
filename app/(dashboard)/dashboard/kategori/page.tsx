import { redirect } from 'next/navigation'
import { getUserFromCookie } from '@/utils/get-user'
import { createClient } from '@/utils/supabase/server'
import KategoriClient from './KategoriClient'

async function getKategoriData() {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('kategori_buku')
            .select(`
                *,
                buku_count:buku(count)
            `)
            .order('nama', { ascending: true })

        if (error) {
            console.error('Error fetching kategori:', error)
            return []
        }

        // Flatten count
        return (data || []).map((k: any) => ({
            ...k,
            buku_count: k.buku_count?.[0]?.count ?? 0,
        }))
    } catch (error) {
        console.error('Error in getKategoriData:', error)
        return []
    }
}

export default async function KategoriPage() {
    const user = await getUserFromCookie()

    if (!user) redirect('/login')

    // Admin & Pengelola bisa akses
    if (!['admin', 'pengelola'].includes(user.role)) redirect('/dashboard')

    const kategoriData = await getKategoriData()

    return <KategoriClient kategoriData={kategoriData} user={user} />
}