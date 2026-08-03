"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { adminService } from "@/services/adminService";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    status: "active",
  });

  const filteredUsers = useMemo(() => {
    if (!statusFilter) return users;
    return users.filter((user) => user.status === statusFilter);
  }, [users, statusFilter]);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.getUsers(statusFilter || undefined);
      setUsers(res.data.users || []);
    } catch (err: any) {
      alert(err.message || "Khong the tai danh sach khach hang.");
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
      alert("Cap nhat khach hang thanh cong.");
      cancelEdit();
      await loadUsers();
    } catch (err: any) {
      alert(err.message || "Khong the cap nhat khach hang.");
    }
  };

  const toggleStatus = async (user: any) => {
    const nextStatus = user.status === "active" ? "locked" : "active";
    if (!confirm(`${nextStatus === "locked" ? "Khoa" : "Mo khoa"} tai khoan ${user.email}?`)) return;

    try {
      await adminService.updateUser(user.id, { status: nextStatus });
      await loadUsers();
    } catch (err: any) {
      alert(err.message || "Khong the cap nhat trang thai tai khoan.");
    }
  };

  const deleteUser = async (user: any) => {
    if (!confirm(`Xoa tai khoan ${user.email}? Chi xoa duoc khach hang chua co booking.`)) return;

    try {
      await adminService.deleteUser(user.id);
      alert("Xoa khach hang thanh cong.");
      await loadUsers();
    } catch (err: any) {
      alert(err.message || "Khong the xoa khach hang.");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, margin: 0 }}>Quan ly Khach hang</h1>
          <p style={{ color: "var(--muted)", marginTop: 6 }}>
            Xem tai khoan passenger, cap nhat thong tin co ban va khoa/mo khoa tai khoan.
          </p>
        </div>
        <button className="button outline" onClick={() => void loadUsers()}>
          Lam moi
        </button>
      </div>

      <div style={{ marginBottom: 16, maxWidth: 220 }}>
        <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Tat ca trang thai</option>
          <option value="active">Dang hoat dong</option>
          <option value="locked">Da khoa</option>
        </select>
      </div>

      {editingId && (
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, marginTop: 0 }}>Sua khach hang #{editingId}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16 }}>
            <input
              className="input"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="Ho ten"
            />
            <input
              className="input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="So dien thoai"
            />
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Dang hoat dong</option>
              <option value="locked">Da khoa</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <button className="button" onClick={() => void saveEdit()}>
              Luu thay doi
            </button>
            <button className="button outline" onClick={cancelEdit}>
              Huy
            </button>
          </div>
        </div>
      )}

      <div className="admin-table-container">
        {loading && users.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center" }}>Dang tai...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Khach hang</th>
                <th>Email</th>
                <th>So dien thoai</th>
                <th>Booking</th>
                <th>Trang thai</th>
                <th>Ngay tao</th>
                <th>Thao tac</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td style={{ fontWeight: 700 }}>{user.fullName}</td>
                  <td>{user.email}</td>
                  <td>{user.phone || "Chua cap nhat"}</td>
                  <td>{user._count?.bookings || 0}</td>
                  <td>{user.status === "active" ? "Dang hoat dong" : "Da khoa"}</td>
                  <td>{new Date(user.createdAt).toLocaleDateString("vi-VN")}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button className="button outline" style={{ height: 32, fontSize: 13 }} onClick={() => startEdit(user)}>
                        Sua
                      </button>
                      <button className="button outline" style={{ height: 32, fontSize: 13 }} onClick={() => void toggleStatus(user)}>
                        {user.status === "active" ? "Khoa" : "Mo khoa"}
                      </button>
                      <button className="button danger" style={{ height: 32, fontSize: 13 }} onClick={() => void deleteUser(user)}>
                        Xoa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
                    Chua co khach hang phu hop
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
