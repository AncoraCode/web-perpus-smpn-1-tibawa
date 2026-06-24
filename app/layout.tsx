import type { Metadata } from "next";
import "@/app/globals.css";
import { createClient } from "@/utils/supabase/server";
import NextTopLoader from 'nextjs-toploader';
import AOSInit from "@/app/components/AOSInit";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('detail_sekolah')
      .select('nama_perpustakaan, nama_sekolah')
      .limit(1)
      .maybeSingle()

    const namaPerpustakaan = data?.nama_perpustakaan || 'Perpustakaan Bougenville'
    const namaSekolah = data?.nama_sekolah || 'SMPN 1 Tibawa'

    return {
      title: `${namaPerpustakaan} - ${namaSekolah}`,
    }
  } catch {
    return {
      title: 'Perpustakaan Bougenville SMPN 1 Tibawa',
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
