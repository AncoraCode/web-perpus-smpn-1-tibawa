'use client'

import { useState, useMemo, useRef } from 'react'
import {
    Search, Printer, Users, X, CreditCard,
    CheckSquare, Square, ChevronDown,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
interface Siswa {
    id: string
    nis: string
    nama_lengkap: string
    kelas: string | null
    status: string
}

interface KartuSiswaClientProps {
    siswaData: Siswa[]
}

/* ─────────────────────────────────────────
   KARTU SISWA — ukuran KTP landscape (85.6mm x 54mm)
───────────────────────────────────────── */
function KartuSiswa({ siswa }: { siswa: Siswa }) {
    return (
        <div
            className="kartu-siswa bg-white border border-gray-300 rounded-lg overflow-hidden flex flex-col"
            style={{
                width: '85.6mm',
                height: '54mm',
                fontFamily: "'Rubik', sans-serif",
                pageBreakInside: 'avoid',
            }}
        >
            {/* Kop */}
            <div className="bg-primary px-3 py-2 flex items-center gap-2 flex-shrink-0">
                <img src="/assets/img/logo-sekolah.png" alt="Logo"
                    className="w-7 h-7 object-contain flex-shrink-0" />
                <div className="leading-none">
                    <p className="text-white font-bold" style={{ fontSize: '8.5pt' }}>
                        Perpustakaan Digital
                    </p>
                    <p className="text-white/80" style={{ fontSize: '6pt' }}>
                        SMP Negeri 1 Tibawa
                    </p>
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 flex items-center px-3 py-2 gap-3">
                {/* Info siswa */}
                <div className="flex-1 min-w-0">
                    <p className="text-gray-400 uppercase tracking-wide" style={{ fontSize: '5.5pt' }}>
                        Nama Siswa
                    </p>
                    <p className="font-bold text-gray-900 leading-tight" style={{ fontSize: '9.5pt' }}>
                        {siswa.nama_lengkap}
                    </p>

                    <div className="flex gap-3 mt-1.5">
                        <div>
                            <p className="text-gray-400 uppercase tracking-wide" style={{ fontSize: '5.5pt' }}>NIS</p>
                            <p className="font-semibold text-gray-700 font-mono" style={{ fontSize: '8pt' }}>
                                {siswa.nis}
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-400 uppercase tracking-wide" style={{ fontSize: '5.5pt' }}>Kelas</p>
                            <p className="font-semibold text-gray-700" style={{ fontSize: '8pt' }}>
                                {siswa.kelas || '-'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* QR Code */}
                <div className="flex-shrink-0 bg-white p-1 border border-gray-200 rounded">
                    <QRCodeSVG value={siswa.nis} size={68} level="M" />
                </div>
            </div>

            {/* Footer line */}
            <div className="bg-gray-50 px-3 py-1 border-t border-gray-100 flex-shrink-0">
                <p className="text-center text-gray-400" style={{ fontSize: '5pt' }}>
                    Kartu ini milik perpustakaan sekolah · Scan untuk peminjaman buku
                </p>
            </div>
        </div>
    )
}

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function KartuSiswaClient({ siswaData }: KartuSiswaClientProps) {
    const [mode, setMode] = useState<'siswa' | 'kelas'>('siswa')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [selectedKelas, setSelectedKelas] = useState<string>('')
    const printRef = useRef<HTMLDivElement>(null)

    /* ── kelas options ── */
    const kelasOptions = useMemo(() => {
        const set = new Set(siswaData.map(s => s.kelas).filter(Boolean)) as Set<string>
        return [...set].sort((a, b) => {
            const order = { VII: 0, VIII: 1, IX: 2 } as Record<string, number>
            const [ta, na] = a.split(' '); const [tb, nb] = b.split(' ')
            const to = (order[ta] ?? 99) - (order[tb] ?? 99)
            return to !== 0 ? to : parseInt(na || '0') - parseInt(nb || '0')
        })
    }, [siswaData])

    /* ── filtered siswa (mode: per siswa) ── */
    const filteredSiswa = useMemo(() => {
        const q = searchQuery.toLowerCase()
        return siswaData.filter(s =>
            s.nama_lengkap.toLowerCase().includes(q) ||
            s.nis.toLowerCase().includes(q)
        )
    }, [siswaData, searchQuery])

    /* ── siswa dalam kelas terpilih (mode: per kelas) ── */
    const siswaDiKelas = useMemo(() =>
        siswaData.filter(s => s.kelas === selectedKelas)
    , [siswaData, selectedKelas])

    /* ── siswa yang akan dicetak ── */
    const siswaToPrint = useMemo(() => {
        if (mode === 'kelas') return siswaDiKelas
        return siswaData.filter(s => selectedIds.has(s.id))
    }, [mode, siswaDiKelas, siswaData, selectedIds])

    /* ── toggle select ── */
    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredSiswa.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(filteredSiswa.map(s => s.id)))
        }
    }

    const handlePrint = () => {
        if (siswaToPrint.length === 0) return
        window.print()
    }

    return (
        <div className="px-4 py-6 space-y-5">

            {/* Print-only styles */}
            <style jsx global>{`
                @media print {
                    body * { visibility: hidden; }
                    #print-area, #print-area * { visibility: visible; }
                    #print-area {
                        position: absolute;
                        left: 0; top: 0;
                        width: 100%;
                    }
                    .kartu-siswa {
                        break-inside: avoid;
                    }
                    @page {
                        size: landscape;
                        margin: 8mm;
                    }
                }
            `}</style>

            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-gray-900">Cetak Kartu Siswa</h1>
                <p className="text-sm text-gray-500 mt-0.5">Kartu identitas dengan QR Code untuk peminjaman buku</p>
            </div>

            {/* Mode Tabs */}
            <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
                <button
                    onClick={() => { setMode('siswa'); setSelectedIds(new Set()) }}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                        mode === 'siswa' ? 'bg-white text-accent shadow-sm' : 'text-gray-500'
                    }`}
                >
                    <CreditCard className="w-4 h-4" /> Per Siswa
                </button>
                <button
                    onClick={() => { setMode('kelas'); setSelectedKelas('') }}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                        mode === 'kelas' ? 'bg-white text-accent shadow-sm' : 'text-gray-500'
                    }`}
                >
                    <Users className="w-4 h-4" /> Per Kelas
                </button>
            </div>

            {/* ── MODE: PER SISWA ── */}
            {mode === 'siswa' && (
                <>
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Cari nama atau NIS..."
                            className="w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none" />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Select all */}
                    <button onClick={toggleSelectAll}
                        className="w-full flex items-center justify-between px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm">
                        <span className="flex items-center gap-2 text-gray-700">
                            {selectedIds.size === filteredSiswa.length && filteredSiswa.length > 0
                                ? <CheckSquare className="w-4 h-4 text-accent" />
                                : <Square className="w-4 h-4 text-gray-400" />
                            }
                            Pilih Semua
                        </span>
                        <span className="text-xs text-gray-400">
                            {selectedIds.size} dipilih
                        </span>
                    </button>

                    {/* List siswa */}
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {filteredSiswa.length === 0 ? (
                            <div className="text-center py-8 bg-white rounded-xl border border-gray-200">
                                <p className="text-sm text-gray-400">Tidak ada siswa ditemukan</p>
                            </div>
                        ) : filteredSiswa.map(s => {
                            const checked = selectedIds.has(s.id)
                            return (
                                <button key={s.id} onClick={() => toggleSelect(s.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors ${
                                        checked ? 'bg-accent/5 border-accent' : 'bg-white border-gray-200'
                                    }`}>
                                    {checked
                                        ? <CheckSquare className="w-4 h-4 text-accent flex-shrink-0" />
                                        : <Square className="w-4 h-4 text-gray-300 flex-shrink-0" />
                                    }
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{s.nama_lengkap}</p>
                                        <p className="text-xs text-gray-400">{s.nis} {s.kelas && `· Kelas ${s.kelas}`}</p>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </>
            )}

            {/* ── MODE: PER KELAS ── */}
            {mode === 'kelas' && (
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Pilih Kelas</label>
                    <select value={selectedKelas} onChange={e => setSelectedKelas(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-accent">
                        <option value="">-- Pilih Kelas --</option>
                        {kelasOptions.map(k => {
                            const count = siswaData.filter(s => s.kelas === k).length
                            return <option key={k} value={k}>Kelas {k} ({count} siswa)</option>
                        })}
                    </select>

                    {selectedKelas && (
                        <div className="mt-3 bg-accent/5 border border-accent/20 rounded-xl p-3">
                            <p className="text-sm font-semibold text-accent">
                                {siswaDiKelas.length} siswa di Kelas {selectedKelas}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                Semua siswa di kelas ini akan dicetak kartunya
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Tombol Cetak */}
            <button
                onClick={handlePrint}
                disabled={siswaToPrint.length === 0}
                className="w-full py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
                <Printer className="w-4 h-4" />
                Cetak {siswaToPrint.length > 0 ? `${siswaToPrint.length} Kartu` : 'Kartu'}
            </button>

            {/* ── PREVIEW & PRINT AREA ── */}
            {siswaToPrint.length > 0 && (
                <div className="space-y-3">
                    <p className="text-sm font-bold text-gray-900">Preview Kartu</p>
                    <div id="print-area" ref={printRef}
                        className="bg-gray-100 rounded-xl p-4 overflow-x-auto">
                        <div className="flex flex-wrap gap-3 justify-center" style={{ minWidth: 'fit-content' }}>
                            {siswaToPrint.map(s => (
                                <KartuSiswa key={s.id} siswa={s} />
                            ))}
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}