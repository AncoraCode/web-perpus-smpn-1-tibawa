import { getUserFromCookie } from "@/utils/get-user";
import BottomNav from "@/app/components/BottomNav";

export default async function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getUserFromCookie();

    return (
        <div className="relative w-full max-w-mobile bg-white min-h-screen flex flex-col shadow-2xl overflow-x-hidden">
            {/* pb-16 untuk memberi ruang bottom nav */}
            <main className="flex-1 pb-16">
                {children}
            </main>
            <BottomNav user={user} />
        </div>
    );
}
