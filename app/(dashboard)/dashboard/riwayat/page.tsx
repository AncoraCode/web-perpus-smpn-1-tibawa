import { redirect } from 'next/navigation'
import { getUserFromCookie } from '@/utils/get-user'
import { createClient } from '@/utils/supabase/server'
import RiwayatClient from './RiwayatClient'

async function getRiwayatData() {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('riwayat_peminjaman')
            .select(`
                *,
                siswa:siswa_id ( id, nis, nama_lengkap, kelas ),
                buku:buku_id ( id, kode_buku, judul ),
                petugas:petugas_id ( id, nama_lengkap )
            `)
            .order('tanggal_kembali', { ascending: false })

        if (error) {
            console.error('Error fetching riwayat:', error)
            return []
        }

        return data || []
    } catch (error) {
        console.error('Error in getRiwayatData:', error)
        return []
    }
}

export default async function RiwayatPage() {
    const user = await getUserFromCookie()
    if (!user) redirect('/login')

    const riwayatData = await getRiwayatData()

    return <RiwayatClient riwayatData={riwayatData} user={user} />
}