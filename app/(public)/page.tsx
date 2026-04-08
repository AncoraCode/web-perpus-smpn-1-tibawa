import { BookOpen, TrendingUp, Info, Users, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const STATS = {
    totalBuku: 20,
    pengunjungMingguan: 20,
}

const BUKU_TERLARIS = [
    { judul: 'Nama Buku', kode: 'Kode Buku', dipinjam: '200x' },
    { judul: 'Nama Buku', kode: 'Kode Buku', dipinjam: '200x' },
    { judul: 'Nama Buku', kode: 'Kode Buku', dipinjam: '200x' },
]

const PENANGGUNGJAWAB = [
    { nama: 'Dani Huzaima, S.Pd', nip: 'NIP: 112109201921221', foto: null },
    { nama: 'Dani Huzaima, S.Pd', nip: 'NIP: 112109201921221', foto: null },
    { nama: 'Dani Huzaima, S.Pd', nip: 'NIP: 112109201921221', foto: null },
]

const TIM_PENGEMBANG = [
    { nama: 'Moh. Wahyu S Tamuu', nim: 'NIM: 532423033', foto: '/assets/img/tim/532423033.png' },
    { nama: 'Arman Mursali', nim: 'NIM: 532423079', foto: '/assets/img/tim/532423079.png' },
    { nama: 'Yusni Mohamad', nim: 'NIM: 532423034', foto: '/assets/img/tim/532423034.png' },
    { nama: 'Widya Tombo Tomboli', nim: 'NIM: 532423032', foto: '/assets/img/tim/532423032.png' },
]

export default function BerandaPage() {
    return (
        <div className="flex flex-col bg-gray-50 min-h-screen">

            {/* ── HEADER ── */}
            <header className="relative bg-primary overflow-hidden">
                {/* Foto sekolah background */}
                <div className="absolute inset-0">
                    <img
                        src="/assets/img/perpus.jpg"
                        alt="SMP Negeri 1 Tibawa"
                        className="w-full h-full object-cover opacity-15"
                    />
                    {/* <div className="absolute inset-0 bg-primary/10" /> */}
                </div>

                <div className="relative z-10 px-4 pt-4 pb-6">
                    {/* Logo + Bendera kecil di kiri atas */}
                    <div className="flex items-center gap-2 mb-5">
                        <div className="w-10 h-10 rounded-full overflow-hidden">
                            <img
                                src="/assets/img/logo-sekolah.png"
                                alt="Logo"
                                className="w-10 h-10 object-contain"
                            // onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                            />
                        </div>
                    </div>

                    {/* Badge */}
                    <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1 mb-2 mt-12">
                        <BookOpen className="w-3 h-3 text-white/90" />
                        <span className="text-white/90 text-[10px] font-semibold tracking-wider uppercase">
                            Sistem Digital
                        </span>
                    </div>

                    {/* Judul */}
                    <h1 className="text-white font-bold text-2xl leading-snug mb-1">
                        SISTEM PERPUSTAKAAN<br />DIGITAL
                    </h1>
                    <p className="text-white/60 text-xs">
                        SMP Negeri 1 Tibawa – Tibawa, Gorontalo
                    </p>
                </div>
            </header>

            {/* ── KONTEN ── */}
            <div className="flex flex-col gap-0 bg-gray-50">

                 <section className="px-4 pt-5 pb-4">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="w-1 h-4 bg-accent rounded-full" />
                        <h2 className="font-semibold text-gray-800 text-sm">Informasi Sistem</h2>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                        {/* Ikon info */}
                        <div className="p-3 bg-accent/10 rounded-xl flex items-center h-fit w-fit mb-3">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center">
                                <Info className="w-full h-full text-accent" />
                            </div>
                        </div>
                        <h3 className="font-semibold text-gray-800 text-sm mb-2">
                            Digitalisasi Pencatatan Buku
                        </h3>
                        <p className="text-gray-500 text-xs leading-relaxed text-justify mb-4">
                            Sistem ini dirancang untuk membantu pengelolaan perpustakaan sekolah secara digital,
                            menggantikan pencatatan manual yang memakan waktu. Admin dapat mencatat, mencari,
                            dan mengelola koleksi buku dengan cepat dan akurat.
                        </p>
                        <Link
                            href="/#developers"
                            className="inline-flex items-center gap-1.5 bg-surface text-accent text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-accent hover:text-white transition-colors"
                        >
                            Tim Pengembang
                            <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                </section>

                {/* ── STATISTIK ── */}
                <section className="px-4 pb-5">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-primary bg-gradient-to-tl from-primary to-primary2 rounded-2xl px-4 py-4">
                            <p className="text-white font-semibold text-2xl">{STATS.totalBuku} buku</p>
                            <p className="text-white/50 text-xs mt-0.5">Koleksi Buku</p>
                        </div>
                        <div className="bg-primary bg-gradient-to-tl from-primary to-primary2 rounded-2xl px-4 py-4">
                            <p className="text-white font-semibold text-2xl">{STATS.pengunjungMingguan}x</p>
                            <p className="text-white/50 text-xs mt-0.5">Pengunjung Web Mingguan</p>
                        </div>
                    </div>
                </section>

                {/* ── TERLARIS ── */}
                <section className="px-4 pb-5">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="w-1 h-4 bg-accent rounded-full" />
                        <h2 className="font-semibold text-gray-800 text-sm">Terlaris</h2>
                    </div>

                    <div className="flex flex-col gap-3">
                        {BUKU_TERLARIS.map((buku, i) => (
                            <div key={i} className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl p-3 shadow-sm">
                                {/* Thumbnail buku */}
                                <div className="w-14 h-16 bg-gray-200 rounded-xl flex-shrink-0 overflow-hidden">
                                    <img
                                        src={`/assets/img/buku1.jpg`}
                                        alt={buku.judul}
                                        className="w-full h-full object-cover"
                                    // onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 truncate">{buku.judul}</p>
                                    <p className="text-xs text-gray-400 truncate">{buku.kode}</p>
                                </div>
                                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                                    <TrendingUp className="w-4 h-4 text-accent" />
                                    <span className="text-[10px] text-gray-400 text-right leading-tight">
                                        {buku.dipinjam} dipinjam<br />di minggu ini
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── PENANGGUNGJAWAB PERPUSTAKAAN ── */}
                <section className="px-4 pb-5">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="w-1 h-4 bg-accent rounded-full" />
                        <h2 className="font-semibold text-gray-800 text-sm">Penanggungjawab Perpustakaan</h2>
                    </div>

                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                        {PENANGGUNGJAWAB.map((pj, i) => (
                            <div key={i} className="flex-shrink-0 w-32 flex flex-col items-center">
                                <div className="w-full h-36 bg-gray-200 rounded-2xl mb-2 overflow-hidden">
                                    {pj.foto ? (
                                        <img
                                            src={pj.foto}
                                            alt={pj.nama}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : null}
                                </div>
                                <p className="text-xs font-semibold text-gray-800 text-center leading-tight">{pj.nama}</p>
                                <p className="text-[10px] text-gray-400 text-center mt-0.5">{pj.nip}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── TIM PENGEMBANG WEB ── */}
                <section id='developers' className="px-4 pb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="w-1 h-4 bg-accent rounded-full" />
                        <h2 className="font-semibold text-gray-800 text-sm">Tim Pengembang Web</h2>
                    </div>

                    <div className="bg-primary bg-gradient-to-br from-primary to-primary2 rounded-2xl p-4">
                        <p className="text-white/80 text-xs leading-relaxed text-justify mb-1">
                            Website ini merupakan hasil Program Kerja dari{' '}
                            <span className="text-white font-semibold">
                                Mahasiswa UNG Mengajar Batch 9 - Teknik Informatika
                            </span>
                            , dibuat menggunakan teknologi Next.js, dan Supabase.
                        </p>

                        <p className="text-white font-semibold text-sm mt-3 mb-3">Tim Pengembang</p>

                        <div className="grid grid-cols-2 gap-3">
                            {TIM_PENGEMBANG.map((anggota, i) => (
                                <div key={i} className="flex flex-col items-center">
                                    <div className="w-full h-fit bg-white/10 rounded-2xl mb-2 overflow-hidden border border-white/10">
                                        {anggota.foto ? (
                                            <img
                                                src={anggota.foto}
                                                alt={anggota.nama}
                                                className="w-full h-full object-cover object-top"
                                            // onError={(e) => {
                                            //     (e.target as HTMLImageElement).parentElement!.classList.add('bg-white/10')
                                            // }}
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-white/10 flex items-center justify-center">
                                                <Users className="w-8 h-8 text-white/30" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-white text-xs font-semibold text-center leading-tight">{anggota.nama}</p>
                                    <p className="text-white/50 text-[10px] mt-0.5">{anggota.nim}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

            </div>
        </div>
    )
}