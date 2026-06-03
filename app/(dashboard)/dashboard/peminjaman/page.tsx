import { redirect } from 'next/navigation'
import { getUserFromCookie } from '@/utils/get-user'
import { createClient } from '@/utils/supabase/server'
import PeminjamanClient from './PeminjamanClient'

async function getPeminjamanPageData() {
    try {
        const supabase = await createClient()

        const [peminjamanRes, siswaRes, bukuRes] = await Promise.all([
            // Peminjaman aktif (dipinjam + terlambat)
            supabase
                .from('peminjaman')
                .select(`
                    *,
                    siswa:siswa_id ( id, nis, nama_lengkap, kelas ),
                    buku:buku_id ( id, kode_buku, judul, jumlah_tersedia, jumlah_total ),
                    petugas:petugas_id ( id, nama_lengkap )
                `)
                .in('status', ['dipinjam', 'terlambat'])
                .order('tanggal_pinjam', { ascending: false }),

            // Siswa aktif untuk dropdown
            supabase
                .from('siswa')
                .select('id, nis, nama_lengkap, kelas')
                .eq('status', 'aktif')
                .order('nama_lengkap', { ascending: true }),

            // Buku yang masih tersedia untuk dropdown
            supabase
                .from('buku')
                .select('id, kode_buku, judul, jumlah_tersedia, jumlah_total')
                .gt('jumlah_tersedia', 0)
                .order('judul', { ascending: true }),
        ])

        return {
            peminjaman: peminjamanRes.data || [],
            siswaList:  siswaRes.data   || [],
            bukuList:   bukuRes.data    || [],
        }
    } catch (error) {
        console.error('Error in getPeminjamanPageData:', error)
        return { peminjaman: [], siswaList: [], bukuList: [] }
    }
}

export default async function PeminjamanPage() {
    const user = await getUserFromCookie()
    if (!user) redirect('/login')

    const { peminjaman, siswaList, bukuList } = await getPeminjamanPageData()

    return (
        <PeminjamanClient
            peminjamanData={peminjaman}
            siswaList={siswaList}
            bukuList={bukuList}
            user={user}
        />
    )
}