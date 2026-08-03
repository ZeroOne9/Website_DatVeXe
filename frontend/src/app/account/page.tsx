"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { authService } from "@/services/authService";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AccountPage() {
  const { user, loading, refresh, logout } = useAuth();
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    phone: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (!user) return;
    setProfileForm({
      fullName: user.fullName,
      phone: user.phone || "",
    });
  }, [user]);

  if (loading) {
    return (
      <section className="page-shell">
        <div className="message">Dang kiem tra phien dang nhap...</div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="page-shell">
        <div className="card panel account-card">
          <h1>Tai khoan</h1>
          <p className="muted">Ban can dang nhap de xem va cap nhat thong tin ca nhan.</p>
          <div className="action-row">
            <Link className="button" href="/login">
              Dang nhap
            </Link>
            <Link className="button secondary" href="/register">
              Dang ky
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setProfileLoading(true);
      await authService.updateMe({
        fullName: profileForm.fullName,
        phone: profileForm.phone || null,
      });
      await refresh();
      alert("Cap nhat thong tin thanh cong.");
    } catch (err: any) {
      alert(err.message || "Khong the cap nhat thong tin.");
    } finally {
      setProfileLoading(false);
    }
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("Xac nhan mat khau moi khong khop.");
      return;
    }

    try {
      setPasswordLoading(true);
      await authService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      alert("Doi mat khau thanh cong.");
    } catch (err: any) {
      alert(err.message || "Khong the doi mat khau.");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <section className="page-shell">
      <div className="page-title">
        <div>
          <h1>Tai khoan</h1>
          <p>Quan ly thong tin ca nhan, mat khau va phien dang nhap.</p>
        </div>
        <div className="action-row">
          <Link className="button secondary" href="/account/tickets">
            Ve cua toi
          </Link>
          <button className="button danger" type="button" onClick={() => void logout()}>
            Dang xuat
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 20 }}>
        <form className="card panel account-card" onSubmit={saveProfile}>
          <h2 style={{ marginTop: 0 }}>Thong tin ca nhan</h2>
          <div style={{ display: "grid", gap: 14 }}>
            <label>
              <span className="muted">Ho ten</span>
              <input
                className="input"
                value={profileForm.fullName}
                onChange={(event) => setProfileForm({ ...profileForm, fullName: event.target.value })}
                minLength={2}
                maxLength={120}
                required
              />
            </label>
            <label>
              <span className="muted">Email</span>
              <input className="input" value={user.email} disabled />
            </label>
            <label>
              <span className="muted">So dien thoai</span>
              <input
                className="input"
                value={profileForm.phone}
                onChange={(event) => setProfileForm({ ...profileForm, phone: event.target.value })}
                placeholder="0900000000"
              />
            </label>
            <button className="button" type="submit" disabled={profileLoading}>
              {profileLoading ? "Dang luu..." : "Cap nhat thong tin"}
            </button>
          </div>
        </form>

        <form className="card panel account-card" onSubmit={changePassword}>
          <h2 style={{ marginTop: 0 }}>Doi mat khau</h2>
          <div style={{ display: "grid", gap: 14 }}>
            <input
              className="input"
              type="password"
              value={passwordForm.currentPassword}
              onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })}
              placeholder="Mat khau hien tai"
              required
            />
            <input
              className="input"
              type="password"
              value={passwordForm.newPassword}
              onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })}
              placeholder="Mat khau moi"
              minLength={6}
              required
            />
            <input
              className="input"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })}
              placeholder="Nhap lai mat khau moi"
              minLength={6}
              required
            />
            <button className="button" type="submit" disabled={passwordLoading}>
              {passwordLoading ? "Dang doi..." : "Doi mat khau"}
            </button>
          </div>
        </form>
      </div>

      <div className="card panel account-card" style={{ marginTop: 20 }}>
        <div className="meta-grid">
          <div className="meta">
            <span>Vai tro</span>
            <strong>{user.role}</strong>
          </div>
          <div className="meta">
            <span>Trang thai</span>
            <strong>{user.status}</strong>
          </div>
          <div className="meta">
            <span>Ngay tao</span>
            <strong>{formatDate(user.createdAt)}</strong>
          </div>
          <div className="meta">
            <span>Cap nhat gan nhat</span>
            <strong>{formatDate(user.updatedAt)}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
