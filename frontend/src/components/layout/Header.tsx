"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

const headerLinkStyle = {
  marginRight: 16,
  fontWeight: 500,
  color: "white",
  textDecoration: "none",
} as const;

export function Header() {
  const { user, loading, logout } = useAuth();

  return (
    <div className="header-container">
      <header className="site-header">
        <Link className="brand" href="/">
          Đặt Vé Xe
        </Link>

        <nav className="nav-links" aria-label="Điều hướng chính">
          <Link href="/tickets/lookup">Tra cứu vé</Link>
          <Link href="/partners/apply">Mở bán vé</Link>
        </nav>

        <div className="auth-links">
          {loading ? null : user ? (
            <>
              <Link href="/account" style={headerLinkStyle}>
                Tài khoản của tôi
              </Link>
              <Link href="/account/tickets" style={headerLinkStyle}>
                Vé của tôi
              </Link>
              {user.role === "partner" && (
                <Link href="/partner" style={headerLinkStyle}>
                  Khu nhà xe
                </Link>
              )}
              {user.role === "admin" && (
                <Link href="/admin" style={headerLinkStyle}>
                  Admin
                </Link>
              )}
              <span style={{ fontSize: 14, marginRight: 16 }}>
                Xin chào, <strong>{user.fullName}</strong>
              </span>
              <button className="button outline" onClick={logout} type="button">
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="button outline">
                Đăng nhập
              </Link>
              <Link href="/register" className="button secondary">
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </header>
    </div>
  );
}
