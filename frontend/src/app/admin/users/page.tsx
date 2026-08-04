"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { adminService } from "@/services/adminService";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    status: "active",
  });

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return users.filter((user) => {
      const searchable = `${user.id} ${user.fullName || ""} ${user.email || ""} ${user.phone || ""}`.toLowerCase();
      return (!statusFilter || user.status === statusFilter) && (!normalizedSearch || searchable.includes(normalizedSearch));
    });
  }, [searchTerm, users, statusFilter]);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.getUsers(statusFilter || undefined);
      setUsers(res.data.users || []);
    } catch (err: any) {
      alert(err.message || "Không thể tải danh sách khách hàng.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const startEdit = (user: any) => {
    setEditingId(user.id);
    setForm({
      fullName: user.fullName,
      phone: user.phone || "",
      status: user.status,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ fullName: "", phone: "", status: "active" });
  };

  const saveEdit = async () => {
    if (!editingId) return;

    try {
      await adminService.updateUser(editingId, {
        fullName: form.fullName,
        phone: form.phone || null,
        status: form.status,
      });
      alert("Cập nhật khách hàng thành công.");
      cancelEdit();
      await loadUsers();
    } catch (err: any) {
      alert(err.message || "Không thể cập nhật khách hàng.");
    }
  };

  const toggleStatus = async (user: any) => {
    const nextStatus = user.status === "active" ? "locked" : "active";
    if (!confirm(`${nextStatus === "locked" ? "Khóa" : "Mở khóa"} tài khoản ${user.email}?`)) return;

    try {
      await adminService.updateUser(user.id, { status: nextStatus });
      await loadUsers();
    } catch (err: any) {
      alert(err.message || "Không thể cập nhật trạng thái tài khoản.");
    }
  };

  const deleteUser = async (user: any) => {
    if (!confirm(`Xóa tài khoản ${user.email}? Chỉ xóa được khách hàng chưa có booking.`)) return;

    try {
      await adminService.deleteUser(user.id);
      alert("Xóa khách hàng thành công.");
      await loadUsers();
    } catch (err: any) {
      alert(err.message || "Không thể xóa khách hàng.");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, margin: 0 }}>Quản lý Khách hàng</h1>
          <p style={{ color: "var(--muted)", marginTop: 6 }}>
            Xem tài khoản passenger, cập nhật thông tin cơ bản và khóa/mở khóa tài khoản.
          </p>
        </div>
        <button className="button outline" onClick={() => void loadUsers()}>
          Làm mới
        </button>
      </div>

      <div
        className="card"
        style={{
          padding: 16,
          marginBottom: 16,
          display: "grid",
          gridTemplateColumns: "1.4fr minmax(180px, 0.8fr) auto",
          gap: 12,
          alignItems: "end",
        }}
      >
        <label>
          <span style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13 }}>Tìm kiếm</span>
          <input
            className="input"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tên, email, số điện thoại..."
          />
        </label>
        <label>
          <span style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13 }}>Trạng thái</span>
          <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="locked">Đã khóa</option>
          </select>
        </label>
        <button
          className="button outline"
          type="button"
          onClick={() => {
            setSearchTerm("");
            setStatusFilter("");
          }}
        >
          Xóa lọc
        </button>
      </div>

      {editingId && (
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, marginTop: 0 }}>Sửa khách hàng #{editingId}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16 }}>
            <input
              className="input"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="Họ tên"
            />
            <input
              className="input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Số điện thoại"
            />
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Đang hoạt động</option>
              <option value="locked">Đã khóa</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <button className="button" onClick={() => void saveEdit()}>
              Lưu thay đổi
            </button>
            <button className="button outline" onClick={cancelEdit}>
              Hủy
            </button>
          </div>
        </div>
      )}

      <div className="admin-table-container">
        {loading && users.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center" }}>Đang tải...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Khách hàng</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th>Booking</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td style={{ fontWeight: 700 }}>{user.fullName}</td>
                  <td>{user.email}</td>
                  <td>{user.phone || "Chưa cập nhật"}</td>
                  <td>{user._count?.bookings || 0}</td>
                  <td>{user.status === "active" ? "Đang hoạt động" : "Đã khóa"}</td>
                  <td>{new Date(user.createdAt).toLocaleDateString("vi-VN")}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button className="button outline" style={{ height: 32, fontSize: 13 }} onClick={() => startEdit(user)}>
                        Sửa
                      </button>
                      <button className="button outline" style={{ height: 32, fontSize: 13 }} onClick={() => void toggleStatus(user)}>
                        {user.status === "active" ? "Khóa" : "Mở khóa"}
                      </button>
                      <button className="button danger" style={{ height: 32, fontSize: 13 }} onClick={() => void deleteUser(user)}>
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
                    Chưa có khách hàng phù hợp
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
