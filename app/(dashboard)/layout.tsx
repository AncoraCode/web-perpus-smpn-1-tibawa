import "@/app/globals.css";
import NextTopLoader from 'nextjs-toploader';
import { redirect } from 'next/navigation'
import { getUserFromCookie } from '@/utils/get-user'
import DashboardTopNav from '@/app/components/DashboardTopNav'
import DashboardBottomNav from '@/app/components/DashboardBottomNav'

export const metadata = {
  title: "Dashboard - Perpustakaan Digital SMP Negeri 1 Tibawa",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserFromCookie()

  if (!user) {
    redirect('/login')
  }

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

        {/* Mobile-constrained container */}
        <div className="relative w-full max-w-mobile bg-white min-h-screen flex flex-col shadow-2xl overflow-x-hidden dashboard-container">
          {/* Top Nav */}
          <DashboardTopNav user={user} />

          {/* Main Content */}
          <main className="flex-1 pt-16 pb-20 bg-gray-50">
            {children}
          </main>

          {/* Bottom Nav */}
          <DashboardBottomNav user={user} />
        </div>
      </body>
    </html>
  );
}