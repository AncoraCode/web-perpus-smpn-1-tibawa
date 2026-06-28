import { MetadataRoute } from 'next'
import { createClient } from '@/utils/supabase/server'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let namaPerpustakaan = 'Perpus Bougenville'
  let namaSekolah = 'SMPN 1 Tibawa'
  let logoUrl = '/assets/img/logo-sekolah.png'

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('detail_sekolah')
      .select('nama_perpustakaan, nama_sekolah, logo_url')
      .limit(1)
      .maybeSingle()

    if (data) {
      if (data.nama_perpustakaan) namaPerpustakaan = data.nama_perpustakaan
      if (data.nama_sekolah) namaSekolah = data.nama_sekolah
      if (data.logo_url) logoUrl = data.logo_url
    }
  } catch (error) {
    console.error('Error fetching dynamic manifest data:', error)
  }

  const name = `${namaPerpustakaan} - ${namaSekolah}`.trim()
  const shortName = namaPerpustakaan.trim()

  return {
    name: name,
    short_name: shortName,
    description: `Sistem Informasi Perpustakaan Terintegrasi untuk ${name}.`,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2C4EEE',
    orientation: 'portrait',
    icons: [
      {
        src: logoUrl,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: logoUrl,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      }
    ]
  }
}
