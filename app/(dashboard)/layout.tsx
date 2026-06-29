import "@/app/globals.css";
import NextTopLoader from 'nextjs-toploader';
import { redirect } from 'next/navigation'
import { getUserFromCookie } from '@/utils/get-user'
import { createClient } from '@/utils/supabase/server'
import DashboardTopNav from '@/app/components/DashboardTopNav'
import DashboardBottomNav from '@/app/components/DashboardBottomNav'
import ForceChangePasswordModal from '@/app/components/ForceChangePasswordModal'

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

  const supabase = await createClient()

  // 1. Cek jika user baru dan wajib ganti password (created_at == updated_at)
  const { data: profile } = await supabase
    .from('profiles')
    .select('created_at, updated_at')
    .eq('id', user.id)
    .maybeSingle()

  const mustChangePassword = profile
    ? Math.abs(new Date(profile.updated_at).getTime() - new Date(profile.created_at).getTime()) < 2000
    : false

  // 2. Fetch detail sekolah untuk header dashboard
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
      <ForceChangePasswordModal isOpen={mustChangePassword} />
      {/* Mobile-constrained container */}
      <div className={`relative w-full max-w-mobile bg-white min-h-screen flex flex-col shadow-2xl overflow-x-hidden dashboard-container mx-auto transition-all duration-300 ${
        mustChangePassword ? 'pointer-events-none select-none filter blur-[3px] opacity-90' : ''
      }`}>
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