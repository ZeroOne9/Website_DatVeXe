"use client";

import { useEffect, useMemo, useState } from "react";

import { adminService } from "@/services/adminService";

type LocationForm = {
  name: string;
  province: string;
  address: string;
};

const emptyForm: LocationForm = {
  name: "",
  province: "",
  address: "",
};

export default function AdminLocationsPage() {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingLocation, setEditingLocation] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("");
  const [form, setForm] = useState<LocationForm>(emptyForm);

  const provinceOptions = useMemo(
    () => Array.from(new Set(locations.map((location) => location.province).filter(Boolean))).sort(),
    [locations],
  );

  const filteredLocations = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return locations.filter((location) => {
      const searchable = `${location.name || ""} ${location.province || ""} ${location.address || ""}`.toLowerCase();
      return (
        (!provinceFilter || location.province === provinceFilter) &&
        (!normalizedSearch || searchable.includes(normalizedSearch))
      );
    });
  }, [locations, provinceFilter, searchTerm]);

  const loadLocations = async () => {
    try {
      setLoading(true);
      const response = await adminService.getLocations();
      setLocations(response.data.locations || []);
    } catch (error: any) {
      alert(error.message || "Không thể tải danh sách địa điểm.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  const updateField = (field: keyof LocationForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const openEditForm = (location: any) => {
    setEditingLocation(location);
    setForm({
      name: location.name || "",
      province: location.province || "",
      address: location.address || "",
    });
  };

  const closeEditForm = () => {
    setEditingLocation(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.name.trim() || !form.province.trim()) {
      alert("Vui lòng nhập tên địa điểm và tỉnh/thành.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      province: form.province.trim(),
      address: form.address.trim() || undefined,
    };

    try {
      setSaving(true);
      if (editingLocation) {
        await adminService.updateLocation(editingLocation.id, payload);
        alert("Cập nhật địa điểm thành công.");
      } else {
        await adminService.createLocation(payload);
        alert("Thêm địa điểm thành công.");
      }

      closeEditForm();
      await loadLocations();
    } catch (error: any) {
      alert(error.message || "Không thể lưu địa điểm.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLocation = async (location: any) => {
    const routeCount = (location._count?.departureRoutes || 0) + (location._count?.destinationRoutes || 0);
    if (routeCount > 0) {
      alert("Không thể xóa địa điểm đã được sử dụng trong tuyến xe.");
      return;
    }

    if (!confirm(`Xóa địa điểm "${location.name}"?`)) return;

    try {
      await adminService.deleteLocation(location.id);
      await loadLocations();
      alert("Xóa địa điểm thành công.");
    } catch (error: any) {
      alert(error.message || "Không thể xóa địa điểm.");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, margin: 0 }}>Quản lý Địa điểm</h1>
          <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>
            Khai báo bến xe, trạm đón hoặc địa điểm để dùng khi tạo tuyến xe.
          </p>
        </div>
        <button className="button outline" onClick={loadLocations} type="button">
          Làm mới
        </button>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, marginTop: 0 }}>
          {editingLocation ? `Sửa địa điểm #${editingLocation.id}` : "Thêm địa điểm mới"}
        </h2>
        <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16 }}>
          <label>
            <span style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Tên địa điểm *</span>
            <input
              className="input"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="VD: Bến xe Miền Đông"
              required
            />
          </label>

          <label>
            <span style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Tỉnh/Thành *</span>
            <input
              className="input"
              value={form.province}
              onChange={(event) => updateField("province", event.target.value)}
              placeholder="VD: TP.HCM"
              required
            />
          </label>

          <label>
            <span style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Địa chỉ</span>
            <input
              className="input"
              value={form.address}
              onChange={(event) => updateField("address", event.target.value)}
              placeholder="VD: 292 Đinh Bộ Lĩnh"
            />
          </label>

          <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: 12 }}>
            {editingLocation && (
              <button className="button outline" type="button" onClick={closeEditForm}>
                Hủy
              </button>
            )}
            <button className="button" type="submit" disabled={saving}>
              {saving ? "Đang lưu..." : editingLocation ? "Lưu thay đổi" : "Thêm địa điểm"}
            </button>
          </div>
        </form>
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
            placeholder="Tên địa điểm, địa chỉ..."
          />
        </label>
        <label>
          <span style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13 }}>Tỉnh/Thành</span>
          <select className="input" value={provinceFilter} onChange={(event) => setProvinceFilter(event.target.value)}>
            <option value="">Tất cả tỉnh/thành</option>
            {provinceOptions.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
        </label>
        <button
          className="button outline"
          type="button"
          onClick={() => {
            setSearchTerm("");
            setProvinceFilter("");
          }}
        >
          Xóa lọc
        </button>
      </div>

      <div className="admin-table-container">
        {loading && locations.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center" }}>Đang tải...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên địa điểm</th>
                <th>Tỉnh/Thành</th>
                <th>Địa chỉ</th>
                <th>Đang dùng</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredLocations.map((location) => {
                const routeCount = (location._count?.departureRoutes || 0) + (location._count?.destinationRoutes || 0);

                return (
                  <tr key={location.id}>
                    <td>{location.id}</td>
                    <td style={{ fontWeight: 600 }}>{location.name}</td>
                    <td>{location.province}</td>
                    <td>{location.address || "---"}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: routeCount > 0 ? "var(--primary)" : "var(--muted)" }}>
                        {routeCount}
                      </span>{" "}
                      tuyến
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          className="button outline"
                          type="button"
                          style={{ height: 28, fontSize: 12, padding: "0 12px" }}
                          onClick={() => openEditForm(location)}
                        >
                          Sửa
                        </button>
                        <button
                          className="button"
                          type="button"
                          disabled={routeCount > 0}
                          title={routeCount > 0 ? "Địa điểm đã được sử dụng trong tuyến xe." : "Xóa địa điểm"}
                          onClick={() => handleDeleteLocation(location)}
                          style={{
                            height: 28,
                            fontSize: 12,
                            padding: "0 12px",
                            background: routeCount > 0 ? "#cbd5e1" : "#dc2626",
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

              {filteredLocations.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
                    Chưa có địa điểm nào
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
