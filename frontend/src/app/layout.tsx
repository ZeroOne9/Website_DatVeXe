import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppChrome } from "@/components/layout/AppChrome";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
  title: "Đặt Vé Xe - Hỗ Trợ Đặt Vé Xe Khách Trực Tuyến",
  description: "Nền tảng hỗ trợ đặt vé xe khách trực tuyến. Tìm chuyến, chọn ghế, đặt vé dễ dàng.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <AuthProvider>
          <AppChrome>{children}</AppChrome>
        </AuthProvider>
      </body>
    </html>
  );
}
