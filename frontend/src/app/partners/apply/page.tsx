"use client";

import Link from "next/link";
import { useState } from "react";

import { ApiError } from "@/services/apiClient";
import { partnerService } from "@/services/partnerService";

const initialForm = {
  companyName: "",
  contactName: "",
  phone: "",
  email: "",
  accountEmail: "",
  password: "",
  address: "",
  description: "",
};

export default function PartnerApplyPage() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const updateField = (field: keyof typeof initialForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const response = await partnerService.apply({
        companyName: form.companyName,
        contactName: form.contactName,
        phone: form.phone,
        email: form.email || undefined,
        accountEmail: form.accountEmail,
        password: form.password,
        address: form.address || undefined,
        description: form.description || undefined,
      });

      setSuccessMessage(
        `${response.message || "Hồ sơ đăng ký đã được gửi thành công."} Mã hồ sơ: #${response.data.application.id}`,
      );
      setForm(initialForm);
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
    <main className="page-shell">
      <section className="card" style={{ maxWidth: 840, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <p style={{ margin: "0 0 8px", color: "var(--primary)", fontWeight: 700 }}>
            Đăng ký mở bán vé
          </p>
          <h1 style={{ margin: "0 0 12px", fontSize: 30 }}>Trở thành nhà xe đối tác</h1>
          <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.6 }}>
            Gửi thông tin nhà xe để admin kiểm tra và phê duyệt. Sau khi được duyệt, nhà xe sẽ
            xuất hiện trong hệ thống và tài khoản đăng ký sẽ được kích hoạt với vai trò nhà xe.
          </p>
        </div>

        {error && (
          <div className="message error" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}
        {successMessage && (
          <div className="message" style={{ marginBottom: 16 }}>
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label htmlFor="companyName">Tên nhà xe *</label>
            <input
              id="companyName"
              required
              minLength={2}
              maxLength={150}
              value={form.companyName}
              onChange={(event) => updateField("companyName", event.target.value)}
              placeholder="Ví dụ: Nhà xe Phương Trang"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="field">
              <label htmlFor="contactName">Người liên hệ *</label>
              <input
                id="contactName"
                required
                minLength={2}
                maxLength={120}
                value={form.contactName}
                onChange={(event) => updateField("contactName", event.target.value)}
                placeholder="Nguyen Van A"
              />
            </div>

            <div className="field">
              <label htmlFor="phone">Số điện thoại *</label>
              <input
                id="phone"
                required
                minLength={8}
                maxLength={20}
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="0901234567"
                type="tel"
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              maxLength={191}
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="contact@example.com"
              type="email"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="field">
              <label htmlFor="accountEmail">Email đăng nhập *</label>
              <input
                id="accountEmail"
                required
                maxLength={191}
                value={form.accountEmail}
                onChange={(event) => updateField("accountEmail", event.target.value)}
                placeholder="partner@example.com"
                type="email"
                autoComplete="email"
              />
            </div>

            <div className="field">
              <label htmlFor="password">Mật khẩu *</label>
              <input
                id="password"
                required
                minLength={6}
                maxLength={72}
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                placeholder="Ít nhất 6 ký tự"
                type="password"
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="address">Địa chỉ</label>
            <input
              id="address"
              maxLength={255}
              value={form.address}
              onChange={(event) => updateField("address", event.target.value)}
              placeholder="Địa chỉ văn phòng hoặc bến xe"
            />
          </div>

          <div className="field">
            <label htmlFor="description">Mô tả thêm</label>
            <textarea
              id="description"
              maxLength={1000}
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              placeholder="Giới thiệu ngắn về nhà xe, khu vực hoạt động, số lượng xe..."
              style={{
                minHeight: 120,
                resize: "vertical",
                border: "1px solid var(--line)",
                borderRadius: "var(--radius)",
                padding: 12,
                font: "inherit",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "space-between", alignItems: "center" }}>
            <Link href="/" style={{ color: "var(--muted)", fontWeight: 600 }}>
              Quay lại trang chủ
            </Link>
            <button type="submit" className="button primary" disabled={loading}>
              {loading ? "Đang gửi..." : "Gửi hồ sơ đăng ký"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
