import { School, Hash, User, Phone, Mail, MapPin } from 'lucide-react'

export default function DetailSekolahPage() {
    return (
        <div className="flex flex-col bg-gray-50 min-h-screen">

            {/* ── HEADER ── */}
            <header className="relative bg-primary overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src="/assets/img/sekolah2.jpg"
                        alt="SMP Negeri 1 Tibawa"
                        className="w-full h-full object-cover opacity-20"
                    />
                    <div className="absolute inset-0 bg-primary/60" />
                </div>
                <div className="relative z-10 flex flex-col items-center justify-center py-10 px-4 text-center">
                    <div className="rounded-full flex items-center justify-center mb-1 overflow-hidden">
                        <img
                            src="/assets/img/logo-sekolah.png"
                            alt="Logo SMPN 1 Tibawa"
                            className="w-24 h-24 object-contain"
                            // onError={(e) => {
                            //     const el = e.target as HTMLImageElement
                            //     el.style.display = 'none'
                            //     el.parentElement!.innerHTML = '<div class="text-white/50 text-2xl font-bold">S</div>'
                            // }}
                        />
                    </div>
                    <h1 className="text-white font-semibold text-3xl">SMP Negeri 1 Tibawa</h1>
                    <p className="text-white/60 text-xs mt-1">Kecamatan Tibawa, Kabupaten Gorontalo</p>
                </div>
            </header>

            {/* ── KONTEN ── */}
            <div className="px-4 py-5 flex flex-col gap-4">

                {/* Section Header */}
                <div className="flex items-center gap-2">
                    <span className="w-1 h-4 bg-accent rounded-full" />
                    <h2 className="font-semibold text-gray-800 text-sm">Detail Sekolah</h2>
                </div>

                {/* Card Tentang Sekolah */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    {/* Ikon sekolah */}
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center mb-3">
                        <School className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm mb-2">Tentang Sekolah</h3>
                    <p className="text-gray-500 text-xs leading-relaxed text-justify">
                        SMP Negeri 1 Tibawa adalah institusi pendidikan menengah pertama yang berdedikasi untuk
                        menciptakan generasi cerdas, berkarakter, dan berdaya saing di wilayah Kecamatan Tibawa.
                        Terakreditasi A, sekolah kami mengedepankan inovasi pembelajaran dan penguatan nilai-nilai
                        budi pekerti guna mencetak siswa yang unggul dalam prestasi akademik maupun non-akademik.
                    </p>
                </div>

                {/* List Info Sekolah */}
                <div className="flex flex-col gap-3">

                    {/* NPSN */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center flex-shrink-0">
                            <Hash className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold text-accent uppercase tracking-wide">NPSN</p>
                            <p className="text-sm font-medium text-gray-800">40500377</p>
                        </div>
                    </div>

                    {/* Kepala Sekolah */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-wide">Kepala Sekolah</p>
                            <p className="text-sm font-medium text-gray-800">Rosma Isa, M.Pd</p>
                        </div>
                    </div>

                    {/* Telepon */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                            <Phone className="w-5 h-5 text-purple-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold text-purple-500 uppercase tracking-wide">Telepon</p>
                            <a href="tel:+628123456789" className="text-sm font-medium text-gray-800 hover:text-accent transition-colors">
                                +62 812 3456789
                            </a>
                        </div>
                    </div>

                    {/* Email */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                            <Mail className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold text-red-500 uppercase tracking-wide">Email</p>
                            <a href="mailto:smpn1tibawa@gmail.com" className="text-sm font-medium text-gray-800 hover:text-accent transition-colors">
                                smpn01tbw@gmail.com
                            </a>
                        </div>
                    </div>

                    {/* Lokasi + Peta */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-4 py-3 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                                <MapPin className="w-5 h-5 text-accent" />
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold text-accent uppercase tracking-wide">Lokasi</p>
                                <p className="text-sm font-medium text-gray-800 leading-snug">
                                    Jl. Trans Sulawesi No. 1, Kec. Tibawa,<br />Kab. Gorontalo
                                </p>
                            </div>
                        </div>
                        {/* Peta */}
                        <div className="h-44 bg-gray-100">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.566515511985!2d122.8631618!3d0.6437176000000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x32793adfdcf79c89%3A0x7c66393058383b66!2sSMPN%20Negeri%201%20Tibawa!5e0!3m2!1sid!2sid!4v1775615861256!5m2!1sid!2sid"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Lokasi SMPN 1 Tibawa"
                            />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}