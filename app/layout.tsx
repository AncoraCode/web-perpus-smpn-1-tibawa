import type { Metadata } from "next";
import "@/app/globals.css";
{/* Libs */ }
import { createClient } from "@/utils/supabase/server";
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
  return (
    <GeneralLayout>
      {children}
    </GeneralLayout>
  );
}
