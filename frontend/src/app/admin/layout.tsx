"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "admin") {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== "admin") {
    return <div style={{ padding: 40, textAlign: "center" }}>Dang kiem tra quyen truy cap...</div>;
  }

  const menuItems = [
    { label: "Dashboard", href: "/admin", icon: "DB" },
    { label: "Quan ly Booking", href: "/admin/bookings", icon: "BK" },
    { label: "Quan ly Khach hang", href: "/admin/users", icon: "KH" },
    { label: "Quan ly Chuyen xe", href: "/admin/trips", icon: "CX" },
    { label: "Quan ly Tuyen xe", href: "/admin/routes", icon: "TX" },
    { label: "Duyet Ho so", href: "/admin/partner-applications", icon: "HS" },
    { label: "Quan ly Nha xe", href: "/admin/bus-companies", icon: "NX" },
    { label: "Quan ly Xe & Ghe", href: "/admin/vehicles", icon: "XG" },
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Link href="/admin" className="brand">
          Admin Panel
        </Link>
        <div className="admin-sidebar-menu">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/admin");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-sidebar-link ${isActive ? "active" : ""}`}
              >
                <span>{item.icon}</span> {item.label}
              </Link>
            );
          })}
        </div>
      </aside>

      <div className="admin-content">
        <header className="admin-header">
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <span style={{ fontSize: 14 }}>
              Xin chao, <strong>{user.fullName}</strong>
            </span>
            <button className="button outline" style={{ height: 32, fontSize: 13 }} onClick={logout}>
              Dang xuat
            </button>
          </div>
        </header>

        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
