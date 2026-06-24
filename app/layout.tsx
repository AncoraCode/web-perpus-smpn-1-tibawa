import type { Metadata } from "next";
import "@/app/globals.css";
{/* Libs */ }
import { createClient } from "@/utils/supabase/server";
import { getUserFromCookie } from "@/utils/get-user";
{/* Libs End */ }
{/* Components */ }
import GeneralLayout from "@/app/components/GeneralLayout";
{/* Components End */ }

export const metadata: Metadata = {
  title: "Perpustakaan Bougenville SMPN 1 Tibawa",
};

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
