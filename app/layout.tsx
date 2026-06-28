import type { Metadata } from "next";
import "@/app/globals.css";
import { createClient } from "@/utils/supabase/server";
import NextTopLoader from 'nextjs-toploader';
import AOSInit from "@/app/components/AOSInit";

export async function generateMetadata(): Promise<Metadata> {
  const defaultTitle = 'Perpustakaan Bougenville - SMPN 1 Tibawa';
  const defaultDescription = 'Sistem Informasi Perpustakaan Terintegrasi untuk mengelola peminjaman, pengembalian, dan katalog buku secara digital.';
  const defaultBanner = '/assets/img/perpus.jpg';
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '') ||
                  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
                  'http://localhost:3000';

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('detail_sekolah')
      .select('nama_perpustakaan, nama_sekolah, tentang_sekolah, logo_url, foto_header_url, foto_sekolah_url')
      .limit(1)
      .maybeSingle()

    const namaPerpustakaan = data?.nama_perpustakaan || 'Perpustakaan Bougenville'
    const namaSekolah = data?.nama_sekolah || 'SMPN 1 Tibawa'
    const title = `${namaPerpustakaan} - ${namaSekolah}`
    const description = data?.tentang_sekolah || defaultDescription
    const bannerUrl = data?.foto_header_url || data?.foto_sekolah_url || data?.logo_url || defaultBanner

    return {
      title,
      description,
      metadataBase: new URL(baseUrl),
      openGraph: {
        title,
        description,
        url: '/',
        siteName: namaPerpustakaan,
        images: [
          {
            url: bannerUrl,
            width: 1200,
            height: 630,
            alt: title,
          }
        ],
        locale: 'id_ID',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [bannerUrl],
      },
    }
  } catch {
    return {
      title: defaultTitle,
      description: defaultDescription,
      metadataBase: new URL(baseUrl),
      openGraph: {
        title: defaultTitle,
        description: defaultDescription,
        url: '/',
        images: [
          {
            url: defaultBanner,
            width: 1200,
            height: 630,
            alt: defaultTitle,
          }
        ],
        locale: 'id_ID',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: defaultTitle,
        description: defaultDescription,
        images: [defaultBanner],
      },
    }
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Rubik:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body
        className="antialiased bg-gray-200 min-h-screen flex justify-center"
        style={{ fontFamily: "'Rubik', sans-serif" }}
      >
        <NextTopLoader
          color="#2C4EEE"
          initialPosition={0.08}
          crawlSpeed={200}
          height={2}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #2C4EEE,0 0 5px #2C4EEE"
          showForHashAnchor={false}
        />
        <AOSInit />
        
        {children}
      </body>
    </html>
  );
}
