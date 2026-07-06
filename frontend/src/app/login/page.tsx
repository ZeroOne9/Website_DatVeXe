"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/services/apiClient";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login(email, password);
      const redirect = searchParams.get("redirect");
      if (redirect) {
        router.push(redirect);
      } else if (user.role === "admin") {
        router.push("/admin");
      } else if (user.role === "partner") {
        router.push("/partner");
      } else {
        router.push("/");
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Khong the ket noi den may chu.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="auth-container">
        <div className="card panel">
          <h1 style={{ margin: "0 0 8px", fontSize: 28 }}>Dang nhap</h1>
          <p className="muted" style={{ margin: "0 0 24px" }}>
            Nhap email va mat khau de tiep tuc.
          </p>

          {error && <div className="message error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="field">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                autoComplete="email"
              />
            </div>

            <div className="field">
              <label htmlFor="login-password">Mat khau</label>
              <input
                id="login-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="It nhat 6 ky tu"
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="button" disabled={loading}>
              {loading ? "Dang xu ly..." : "Dang nhap"}
            </button>
          </form>

          <p style={{ marginTop: 20, textAlign: "center" }} className="muted">
            Chua co tai khoan?{" "}
            <Link href="/register" style={{ color: "var(--primary)", fontWeight: 700 }}>
              Dang ky ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="page-shell"><div className="message">Dang tai...</div></div>}>
      <LoginContent />
    </Suspense>
  );
}
