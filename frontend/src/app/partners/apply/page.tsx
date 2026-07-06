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
        `${response.message || "Ho so dang ky da duoc gui thanh cong."} Ma ho so: #${response.data.application.id}`,
      );
      setForm(initialForm);
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
    <main className="page-shell">
      <section className="card" style={{ maxWidth: 840, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <p style={{ margin: "0 0 8px", color: "var(--primary)", fontWeight: 700 }}>
            Dang ky mo ban ve
          </p>
          <h1 style={{ margin: "0 0 12px", fontSize: 30 }}>Tro thanh nha xe doi tac</h1>
          <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.6 }}>
            Gui thong tin nha xe de admin kiem tra va phe duyet. Sau khi duoc duyet, nha xe se
            xuat hien trong he thong va tai khoan dang ky se duoc kich hoat voi vai tro nha xe.
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
            <label htmlFor="companyName">Ten nha xe *</label>
            <input
              id="companyName"
              required
              minLength={2}
              maxLength={150}
              value={form.companyName}
              onChange={(event) => updateField("companyName", event.target.value)}
              placeholder="Vi du: Nha xe Phuong Trang"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="field">
              <label htmlFor="contactName">Nguoi lien he *</label>
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
              <label htmlFor="phone">So dien thoai *</label>
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
              <label htmlFor="accountEmail">Email dang nhap *</label>
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
              <label htmlFor="password">Mat khau *</label>
              <input
                id="password"
                required
                minLength={6}
                maxLength={72}
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                placeholder="It nhat 6 ky tu"
                type="password"
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="address">Dia chi</label>
            <input
              id="address"
              maxLength={255}
              value={form.address}
              onChange={(event) => updateField("address", event.target.value)}
              placeholder="Dia chi van phong hoac ben xe"
            />
          </div>

          <div className="field">
            <label htmlFor="description">Mo ta them</label>
            <textarea
              id="description"
              maxLength={1000}
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              placeholder="Gioi thieu ngan ve nha xe, khu vuc hoat dong, so luong xe..."
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
              Quay lai trang chu
            </Link>
            <button type="submit" className="button primary" disabled={loading}>
              {loading ? "Dang gui..." : "Gui ho so dang ky"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
