"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/lib/auth-context";

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login?redirect=/partner");
      return;
    }
    if (user.role !== "partner") {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== "partner") {
    return <div style={{ padding: 40, textAlign: "center" }}>Đang kiểm tra quyền nhà xe...</div>;
  }

  const menuItems = [
    { label: "Tổng quan", href: "/partner" },
    { label: "Xe của tôi", href: "/partner/vehicles" },
    { label: "Chuyến xe", href: "/partner/trips" },
    { label: "Booking", href: "/partner/bookings" },
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Link href="/partner" className="brand">
          Nhà xe
        </Link>
        <div className="admin-sidebar-menu">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-sidebar-link ${isActive ? "active" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </aside>

      <div className="admin-content">
        <header className="admin-header">
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <span style={{ fontSize: 14 }}>
              Xin chào, <strong>{user.fullName}</strong>
            </span>
            <button className="button outline" style={{ height: 32, fontSize: 13 }} onClick={logout}>
              Đăng xuất
            </button>
          </div>
        </header>
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
