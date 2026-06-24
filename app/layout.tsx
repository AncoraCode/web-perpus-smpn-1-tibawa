import type { Metadata } from "next";
import "@/app/globals.css";
{/* Libs */ }
import { createClient } from "@/utils/supabase/server";
import { getUserFromCookie } from "@/utils/get-user";
{/* Libs End */ }
{/* Components */ }
import GeneralLayout from "@/app/components/GeneralLayout";
{/* Components End */ }

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUserFromCookie();

  return (
    <GeneralLayout user={user}>
      {children}
    </GeneralLayout>
  );
}
