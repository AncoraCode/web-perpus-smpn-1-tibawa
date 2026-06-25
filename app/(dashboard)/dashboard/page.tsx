import { BookOpen, Users, BookMarked, AlertTriangle, TrendingUp, Clock, QrCode, UserPlus, BookCheck } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { getUserFromCookie } from '@/utils/get-user'
import AnimatedCounter from '@/app/components/AnimatedCounter'

async function getDashboardData() {
    try {
        const supabase = await createClient()

        // Statistik - Total Buku
        const { count: totalBuku } = await supabase
            .from('buku')
            .select('*', { count: 'exact', head: true })

        // Statistik - Total Siswa Aktif
        const { count: totalSiswa } = await supabase
            .from('siswa')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'aktif')

        // Statistik - Peminjaman Aktif
        const { count: peminjamanAktif } = await supabase
            .from('peminjaman')
            .select('*', { count: 'exact', head: true })
            .in('status', ['dipinjam', 'terlambat'])

        // Statistik - Buku Terlambat
        const today = new Date().toISOString().split('T')[0]
        const { count: bukuTerlambat } = await supabase
            .from('peminjaman')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'terlambat')
            .or(`tanggal_jatuh_tempo.lt.${today}`)

        // Peminjaman Terbaru (5 terakhir)
        const { data: peminjamanTerbaru } = await supabase
            .from('peminjaman')
            .select(`
                id,
                tanggal_pinjam,
                tanggal_jatuh_tempo,
                status,
                siswa:siswa_id (nama_lengkap, kelas),
                buku:buku_id (judul, kode_buku)
            `)
            .in('status', ['dipinjam', 'terlambat'])
            .order('tanggal_pinjam', { ascending: false })
            .limit(5)

        // Buku Terlaris (dari function)
        const { data: bukuTerlaris } = await supabase
            .rpc('get_buku_terlaris', { limit_count: 3 })

        return {
            stats: {
                totalBuku: totalBuku || 0,
                totalSiswa: totalSiswa || 0,
                peminjamanAktif: peminjamanAktif || 0,
                bukuTerlambat: bukuTerlambat || 0,
            },
            peminjamanTerbaru: peminjamanTerbaru || [],
            bukuTerlaris: bukuTerlaris || [],
        }
    } catch (error) {
        console.error('Error fetching dashboard data:', error)
        return {
            stats: { totalBuku: 0, totalSiswa: 0, peminjamanAktif: 0, bukuTerlambat: 0 },
            peminjamanTerbaru: [],
            bukuTerlaris: [],
        }
    }
}

export default async function DashboardPage() {
    const user = await getUserFromCookie()
    const { stats, peminjamanTerbaru, bukuTerlaris } = await getDashboardData()

    return (
        <div className="px-4 py-6 space-y-6">

            {/* Welcome Section */}
            <div>
                <h1 className="text-xl font-bold text-gray-900">
                    Selamat Datang, {user?.nama_lengkap}!
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Kelola perpustakaan dengan mudah dan efisien
                </p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 gap-3">
                {/* Total Buku */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <BookOpen className="w-8 h-8 opacity-80" />
                    </div>
                    <p className="text-2xl font-bold">
                        <AnimatedCounter value={stats.totalBuku} className="text-white font-bold text-2xl" delay={0.1} />
                    </p>
                    <p className="text-xs opacity-80 mt-1">Total Buku</p>
                </div>

                {/* Total Siswa */}
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <Users className="w-8 h-8 opacity-80" />
                    </div>
                    <p className="text-2xl font-bold">
                        <AnimatedCounter value={stats.totalSiswa} className="text-white font-bold text-2xl" delay={0.1} />
                    </p>
                    <p className="text-xs opacity-80 mt-1">Siswa Aktif</p>
                </div>

                {/* Peminjaman Aktif */}
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <BookMarked className="w-8 h-8 opacity-80" />
                    </div>
                    <p className="text-2xl font-bold">
                        <AnimatedCounter value={stats.peminjamanAktif} className="text-white font-bold text-2xl" delay={0.1} />
                    </p>
                    <p className="text-xs opacity-80 mt-1">Sedang Dipinjam</p>
                </div>

                {/* Buku Terlambat */}
                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-4 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <AlertTriangle className="w-8 h-8 opacity-80" />
                    </div>
                    <p className="text-2xl font-bold">
                        <AnimatedCounter value={stats.bukuTerlambat} className="text-white font-bold text-2xl" delay={0.1} />
                    </p>
                    <p className="text-xs opacity-80 mt-1">Terlambat</p>
                </div>
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-base font-bold text-gray-900 mb-3">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-3">
                    {/* Scan Barcode */}
                    <Link
                        href="/dashboard/scan"
                        className="bg-white border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors"
                    >
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                            <QrCode className="w-5 h-5 text-primary" />
                        </div>
                        <p className="text-sm font-semibold text-gray-900">Scan Barcode</p>
                        <p className="text-xs text-gray-500 mt-1">Pinjam/Kembalikan</p>
                    </Link>

                    {/* Data Siswa */}
                    <Link
                        href="/dashboard/siswa"
                        className="bg-white border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors"
                    >
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                            <UserPlus className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-sm font-semibold text-gray-900">Data Siswa</p>
                        <p className="text-xs text-gray-500 mt-1">Kelola siswa</p>
                    </Link>

                    {/* Peminjaman */}
                    <Link
                        href="/dashboard/peminjaman"
                        className="bg-white border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors"
                    >
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                            <BookCheck className="w-5 h-5 text-purple-600" />
                        </div>
                        <p className="text-sm font-semibold text-gray-900">Peminjaman</p>
                        <p className="text-xs text-gray-500 mt-1">Lihat semua</p>
                    </Link>

                    {/* Riwayat */}
                    <Link
                        href="/dashboard/riwayat"
                        className="bg-white border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors"
                    >
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mb-3">
                            <Clock className="w-5 h-5 text-amber-600" />
                        </div>
                        <p className="text-sm font-semibold text-gray-900">Riwayat</p>
                        <p className="text-xs text-gray-500 mt-1">History pinjam</p>
                    </Link>
                </div>
            </div>

            {/* Buku Terlaris */}
            {bukuTerlaris && bukuTerlaris.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-base font-bold text-gray-900">Buku Terlaris</h2>
                        <TrendingUp className="w-5 h-5 text-accent" />
                    </div>
                    <div className="space-y-2">
                        {bukuTerlaris.map((buku: any, i: number) => (
                            <div key={i} className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3">
                                <div className="w-12 h-14 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                                    {buku.cover_url ? (
                                        <img
                                            src={buku.cover_url}
                                            alt={buku.judul}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <BookOpen className="w-5 h-5 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{buku.judul}</p>
                                    <p className="text-xs text-gray-500 truncate">{buku.kode_buku}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-accent">{buku.total_dipinjam}x</p>
                                    <p className="text-xs text-gray-400">dipinjam</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Peminjaman Terbaru */}
            {peminjamanTerbaru && peminjamanTerbaru.length > 0 && (
                <div>
                    <h2 className="text-base font-bold text-gray-900 mb-3">Peminjaman Terbaru</h2>
                    <div className="space-y-2">
                        {peminjamanTerbaru.map((item: any) => (
                            <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-3">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                            {item.siswa?.nama_lengkap}
                                        </p>
                                        <p className="text-xs text-gray-500">{item.siswa?.kelas}</p>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                                        item.status === 'dipinjam' 
                                            ? 'bg-blue-100 text-blue-700' 
                                            : 'bg-red-100 text-red-700'
                                    }`}>
                                        {item.status === 'dipinjam' ? 'Dipinjam' : 'Terlambat'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <p className="text-xs text-gray-600 truncate">{item.buku?.judul}</p>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <p className="text-xs text-gray-500">
                                        Jatuh tempo: {new Date(item.tanggal_jatuh_tempo).toLocaleDateString('id-ID', { 
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    )
}