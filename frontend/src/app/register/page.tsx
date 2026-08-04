"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/services/apiClient";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(fullName, email, password, phone || undefined);
      router.push("/");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Không thể kết nối đến máy chủ.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="auth-container">
        <div className="card panel">
          <h1 style={{ margin: "0 0 8px", fontSize: 28 }}>Đăng ký tài khoản</h1>
          <p className="muted" style={{ margin: "0 0 24px" }}>
            Tạo tài khoản mới để đặt vé nhanh hơn.
          </p>

          {error && <div className="message error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="field">
              <label htmlFor="reg-fullname">Họ và tên</label>
              <input
                id="reg-fullname"
                type="text"
                required
                minLength={2}
                maxLength={120}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                autoComplete="name"
              />
            </div>

            <div className="field">
              <label htmlFor="reg-email">Email</label>
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                autoComplete="email"
              />
            </div>

            <div className="field">
              <label htmlFor="reg-phone">Số điện thoại (tùy chọn)</label>
              <input
                id="reg-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0901234567"
                autoComplete="tel"
              />
            </div>

            <div className="field">
              <label htmlFor="reg-password">Mật khẩu</label>
              <input
                id="reg-password"
                type="password"
                required
                minLength={6}
                maxLength={72}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ít nhất 6 ký tự"
                autoComplete="new-password"
              />
            </div>

            <button type="submit" className="button" disabled={loading}>
              {loading ? "Đang xử lý..." : "Đăng ký"}
            </button>
          </form>

          <p style={{ marginTop: 20, textAlign: "center" }} className="muted">
            Đã có tài khoản?{" "}
            <Link href="/login" style={{ color: "var(--primary)", fontWeight: 700 }}>
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
