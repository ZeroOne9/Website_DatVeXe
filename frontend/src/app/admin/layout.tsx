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
      router.push("/"); // redirect non-admins
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== "admin") {
    return <div style={{ padding: 40, textAlign: "center" }}>Đang kiểm tra quyền truy cập...</div>;
  }

  const menuItems = [
    { label: "Dashboard", href: "/admin", icon: "📊" },
    { label: "Quản lý Booking", href: "/admin/bookings", icon: "🎟️" },
    { label: "Quản lý Chuyến xe", href: "/admin/trips", icon: "🚌" },
    { label: "Quản lý Tuyến xe", href: "/admin/routes", icon: "🛣️" },
    { label: "Duyệt Hồ sơ", href: "/admin/partner-applications", icon: "📑" },
    { label: "Quản lý Nhà xe", href: "/admin/bus-companies", icon: "🏢" },
    { label: "Quản lý Xe & Ghế", href: "/admin/vehicles", icon: "🚐" },
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
            <span style={{ fontSize: 14 }}>Xin chào, <strong>{user.fullName}</strong></span>
            <button className="button outline" style={{ height: 32, fontSize: 13 }} onClick={logout}>Đăng xuất</button>
          </div>
        </header>
        
        <main className="admin-main">
          {children}
        </main>
      </div>
    </div>
  );
}
