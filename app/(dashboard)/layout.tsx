import "@/app/globals.css";
import NextTopLoader from 'nextjs-toploader';
import { redirect } from 'next/navigation'
import { getUserFromCookie } from '@/utils/get-user'
import { createClient } from '@/utils/supabase/server'
import DashboardTopNav from '@/app/components/DashboardTopNav'
import DashboardBottomNav from '@/app/components/DashboardBottomNav'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserFromCookie()

  if (!user) {
    redirect('/login')
  }

  // Fetch detail sekolah untuk header dashboard
  const supabase = await createClient()
  const { data: sekolah } = await supabase
    .from('detail_sekolah')
    .select('nama_sekolah, nama_perpustakaan, logo_url')
    .limit(1)
    .maybeSingle()

  const sekolahInfo = {
    namaSekolah: sekolah?.nama_sekolah || 'SMP Negeri 1 Tibawa',
    namaPerpustakaan: sekolah?.nama_perpustakaan || 'Perpus Bougenville',
    logoUrl: sekolah?.logo_url || null,
  }

  return (
    <>
      {/* Mobile-constrained container */}
      <div className="relative w-full max-w-mobile bg-white min-h-screen flex flex-col shadow-2xl overflow-x-hidden dashboard-container mx-auto">
        {/* Top Nav */}
        <DashboardTopNav user={user} sekolahInfo={sekolahInfo} />

        {/* Main Content */}
        <main className="flex-1 pt-16 pb-20 bg-gray-50">
          {children}
        </main>

        {/* Bottom Nav */}
        <DashboardBottomNav user={user} />
      </div>
    </>
  );
}