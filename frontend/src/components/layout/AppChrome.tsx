"use client";

import { usePathname } from "next/navigation";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideFooter = pathname.startsWith("/admin") || pathname.startsWith("/partner");

  return (
    <>
      <Header />
      <main>{children}</main>
      {hideFooter ? null : <Footer />}
    </>
  );
}
