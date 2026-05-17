import { redirect } from 'next/navigation'
import { getUserFromCookie } from '@/utils/get-user'
import { createClient } from '@/utils/supabase/server'
import BukuClient from './BukuClient'

async function getBukuPageData() {
    try {
        const supabase = await createClient()

        const [bukuRes, kategoriRes, rakRes] = await Promise.all([
            supabase
                .from('buku')
                .select(`
                    *,
                    kategori:kategori_id ( id, nama ),
                    rak:rak_id ( id, kode_rak, nama_rak )
                `)
                .order('kode_buku', { ascending: true }),

            supabase
                .from('kategori_buku')
                .select('id, nama')
                .order('nama', { ascending: true }),

            supabase
                .from('rak')
                .select('id, kode_rak, nama_rak')
                .order('kode_rak', { ascending: true }),
        ])

        return {
            buku: bukuRes.data || [],
            kategori: kategoriRes.data || [],
            rak: rakRes.data || [],
        }
    } catch (error) {
        console.error('Error in getBukuPageData:', error)
        return { buku: [], kategori: [], rak: [] }
    }
}

export default async function BukuPage() {
    const user = await getUserFromCookie()
    if (!user) redirect('/login')
    if (user.role !== 'admin') redirect('/dashboard')

    const { buku, kategori, rak } = await getBukuPageData()

    return <BukuClient bukuData={buku} kategoriList={kategori} rakList={rak} user={user} />
}