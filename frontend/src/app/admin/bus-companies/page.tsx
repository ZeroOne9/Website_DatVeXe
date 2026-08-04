"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { adminService } from "@/services/adminService";

type BusCompanyForm = {
  name: string;
  phone: string;
  email: string;
  address: string;
  description: string;
};

const emptyForm: BusCompanyForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  description: "",
};

export default function AdminBusCompaniesPage() {
  const [busCompanies, setBusCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingBusCompany, setEditingBusCompany] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState<BusCompanyForm>(emptyForm);

  const filteredBusCompanies = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return busCompanies.filter((busCompany) => {
      const searchable = `${busCompany.id} ${busCompany.name || ""} ${busCompany.phone || ""} ${busCompany.email || ""} ${busCompany.address || ""}`.toLowerCase();
      return !normalizedSearch || searchable.includes(normalizedSearch);
    });
  }, [busCompanies, searchTerm]);

  const loadBusCompanies = async () => {
    try {
      setLoading(true);
      const res = await adminService.getBusCompanies();
      setBusCompanies(res.data.busCompanies || []);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Lỗi tải danh sách nhà xe");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBusCompanies();
  }, []);

  const openEditForm = (busCompany: any) => {
    setEditingBusCompany(busCompany);
    setForm({
      name: busCompany.name || "",
      phone: busCompany.phone || "",
      email: busCompany.email || "",
      address: busCompany.address || "",
      description: busCompany.description || "",
    });
  };

  const closeEditForm = () => {
    setEditingBusCompany(null);
    setForm(emptyForm);
  };

  const updateField = (field: keyof BusCompanyForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleUpdateBusCompany = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingBusCompany) return;

    if (!form.name.trim()) {
      alert("Vui lòng nhập tên nhà xe.");
      return;
    }

    try {
      setSaving(true);
      await adminService.updateBusCompany(editingBusCompany.id, {
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        description: form.description.trim() || undefined,
      });

      closeEditForm();
      await loadBusCompanies();
      alert("Cập nhật nhà xe thành công.");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Không thể cập nhật nhà xe.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBusCompany = async (busCompany: any) => {
    const vehicleCount = busCompany._count?.vehicles || 0;
    if (vehicleCount > 0) {
      alert("Không thể xóa nhà xe đã có xe. Bạn có thể sửa thông tin nhà xe thay vì xóa.");
      return;
    }

    if (!confirm(`Xóa nhà xe "${busCompany.name}"?`)) return;

    try {
      await adminService.deleteBusCompany(busCompany.id);
      await loadBusCompanies();
      alert("Xóa nhà xe thành công.");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Không thể xóa nhà xe.");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>Quản lý Nhà xe</h1>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="button outline" onClick={loadBusCompanies} type="button">
            Làm mới
          </button>
          <Link href="/admin/bus-companies/create" className="button">
            + Thêm nhà xe
          </Link>
        </div>
      </div>

      {editingBusCompany && (
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 18, margin: 0 }}>Sửa nhà xe #{editingBusCompany.id}</h2>
              <div style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>
                Đang quản lý {editingBusCompany._count?.vehicles || 0} xe
              </div>
            </div>
            <button className="button outline" type="button" onClick={closeEditForm}>
              Hủy
            </button>
          </div>

          <form onSubmit={handleUpdateBusCompany} style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 }}>
            <label>
              <span style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Tên nhà xe *</span>
              <input className="input" value={form.name} onChange={(event) => updateField("name", event.target.value)} required />
            </label>

            <label>
              <span style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Số điện thoại</span>
              <input className="input" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} />
            </label>

            <label>
              <span style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Email</span>
              <input className="input" type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} />
            </label>

            <label>
              <span style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Địa chỉ</span>
              <input className="input" value={form.address} onChange={(event) => updateField("address", event.target.value)} />
            </label>

            <label style={{ gridColumn: "1 / -1" }}>
              <span style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Mô tả</span>
              <textarea
                className="input"
                value={form.description}
                onChange={(event) => updateField("description", event.target.value)}
                rows={3}
              />
            </label>

            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button className="button outline" type="button" onClick={closeEditForm}>
                Hủy
              </button>
              <button className="button" type="submit" disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div
        className="card"
        style={{
          padding: 16,
          marginBottom: 16,
          display: "grid",
          gridTemplateColumns: "1fr auto",
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
            placeholder="Tên nhà xe, số điện thoại, email..."
          />
        </label>
        <button className="button outline" type="button" onClick={() => setSearchTerm("")}>
          Xóa lọc
        </button>
      </div>

      <div className="admin-table-container">
        {loading && busCompanies.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center" }}>Đang tải...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên Nhà Xe</th>
                <th>Số Điện Thoại</th>
                <th>Email</th>
                <th>Địa Chỉ</th>
                <th>Tổng Số Xe</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredBusCompanies.map((busCompany) => {
                const vehicleCount = busCompany._count?.vehicles || 0;

                return (
                  <tr key={busCompany.id}>
                    <td>{busCompany.id}</td>
                    <td style={{ fontWeight: 600 }}>{busCompany.name}</td>
                    <td>{busCompany.phone || "---"}</td>
                    <td>{busCompany.email || "---"}</td>
                    <td>{busCompany.address || "---"}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: "var(--primary)" }}>{vehicleCount}</span> xe
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          className="button outline"
                          type="button"
                          style={{ height: 28, fontSize: 12, padding: "0 12px" }}
                          onClick={() => openEditForm(busCompany)}
                        >
                          Sửa
                        </button>
                        <button
                          className="button"
                          type="button"
                          disabled={vehicleCount > 0}
                          title={vehicleCount > 0 ? "Nhà xe đã có xe, không thể xóa." : "Xóa nhà xe"}
                          onClick={() => handleDeleteBusCompany(busCompany)}
                          style={{
                            height: 28,
                            fontSize: 12,
                            padding: "0 12px",
                            background: vehicleCount > 0 ? "#cbd5e1" : "#dc2626",
                            color: "white",
                          }}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredBusCompanies.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
                    Chưa có dữ liệu nhà xe nào
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
