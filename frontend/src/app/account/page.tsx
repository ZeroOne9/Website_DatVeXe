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

function roleLabel(role: string) {
  if (role === "admin") return "Quản trị viên";
  if (role === "partner") return "Nhà xe đối tác";
  return "Khách hàng";
}

function statusLabel(status: string) {
  return status === "active" ? "Đang hoạt động" : "Đã khóa";
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
        <div className="message">Đang kiểm tra phiên đăng nhập...</div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="page-shell">
        <div className="card panel account-card">
          <h1>Thông tin tài khoản</h1>
          <p className="muted">Bạn cần đăng nhập để xem và cập nhật thông tin cá nhân.</p>
          <div className="action-row">
            <Link className="button" href="/login">
              Đăng nhập
            </Link>
            <Link className="button secondary" href="/register">
              Đăng ký
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
      alert("Cập nhật thông tin thành công.");
    } catch (err: any) {
      alert(err.message || "Không thể cập nhật thông tin.");
    } finally {
      setProfileLoading(false);
    }
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("Xác nhận mật khẩu mới không khớp.");
      return;
    }

    try {
      setPasswordLoading(true);
      await authService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      alert("Đổi mật khẩu thành công.");
    } catch (err: any) {
      alert(err.message || "Không thể đổi mật khẩu.");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <section className="page-shell">
      <div className="page-title">
        <div>
          <h1>Thông tin cá nhân</h1>
          <p>Hiển thị đầy đủ thông tin đang có trong bảng User và cho phép cập nhật các trường được phép sửa.</p>
        </div>
        <div className="action-row">
          <Link className="button secondary" href="/account/tickets">
            Vé của tôi
          </Link>
        </div>
      </div>

      <div className="card panel account-card" style={{ marginBottom: 20 }}>
        <h2 style={{ marginTop: 0 }}>Hồ sơ tài khoản</h2>
        <div className="meta-grid">
          <div className="meta">
            <span>Mã tài khoản: </span>
            <strong>#{user.id}</strong>
          </div>
          <div className="meta">
            <span>Họ tên: </span>
            <strong>{user.fullName}</strong>
          </div>
          <div className="meta">
            <span>Email đăng nhập: </span>
            <strong>{user.email}</strong>
          </div>
          <div className="meta">
            <span>Số điện thoại: </span>
            <strong>{user.phone || "Chưa cập nhật"}</strong>
          </div>
          <div className="meta">
            <span>Vai trò: </span>
            <strong>{roleLabel(user.role)}</strong>
          </div>
          <div className="meta">
            <span>Trạng thái: </span>
            <strong>{statusLabel(user.status)}</strong>
          </div>
          <div className="meta">
            <span>Ngày tạo: </span>
            <strong>{formatDate(user.createdAt)}</strong>
          </div>
          <div className="meta">
            <span>Cập nhật gần nhất: </span>
            <strong>{formatDate(user.updatedAt)}</strong>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(320px, 0.8fr)", gap: 20 }}>
        <form className="card panel account-card" onSubmit={saveProfile}>
          <h2 style={{ marginTop: 0 }}>Cập nhật thông tin liên hệ</h2>
          <div style={{ display: "grid", gap: 14 }}>
            <label>
              <span className="muted">Họ tên * </span>
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
              <span className="muted">Email đăng nhập * </span>
              <input className="input" value={user.email} disabled />
            </label>
            <label>
              <span className="muted">Số điện thoại * </span>
              <input
                className="input"
                value={profileForm.phone}
                onChange={(event) => setProfileForm({ ...profileForm, phone: event.target.value })}
                placeholder="0900000000"
              />
            </label>
            <div className="action-row">
              <button className="button" type="submit" disabled={profileLoading}>
                {profileLoading ? "Đang lưu..." : "Lưu thông tin"}
              </button>
              <button className="button outline" type="button" onClick={() => void refresh()}>
                Tải lại getMe
              </button>
            </div>
          </div>
        </form>

        <form className="card panel account-card" onSubmit={changePassword}>
          <h2 style={{ marginTop: 0 }}>Đổi mật khẩu</h2>
          <div style={{ display: "grid", gap: 14 }}>
            <label>
              <span className="muted">Mật khẩu hiện tại </span>
              <input
                className="input"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })}
                required
              />
            </label>
            <label>
              <span className="muted">Mật khẩu mới </span>
              <input
                className="input"
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })}
                minLength={6}
                required
              />
            </label>
            <label>
              <span className="muted">Nhập lại mật khẩu mới</span>
              <input
                className="input"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })}
                minLength={6}
                required
              />
            </label>
            <button className="button" type="submit" disabled={passwordLoading}>
              {passwordLoading ? "Đang đổi..." : "Đổi mật khẩu"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
