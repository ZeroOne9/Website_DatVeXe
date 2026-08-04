"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { adminService } from "@/services/adminService";

type RouteForm = {
  departureLocationId: string;
  destinationLocationId: string;
  distanceKm: string;
  estimatedMinutes: string;
  status: string;
};

const emptyForm: RouteForm = {
  departureLocationId: "",
  destinationLocationId: "",
  distanceKm: "",
  estimatedMinutes: "",
  status: "active",
};

const statusOptions = [
  { value: "active", label: "Đang hoạt động" },
  { value: "inactive", label: "Ngừng hoạt động" },
];

export default function AdminRoutesPage() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingRoute, setEditingRoute] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [departureFilter, setDepartureFilter] = useState("");
  const [destinationFilter, setDestinationFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState<RouteForm>(emptyForm);

  const departureOptions = useMemo(
    () => Array.from(new Set(routes.map((route) => route.departureLocation?.name).filter(Boolean))).sort(),
    [routes],
  );

  const destinationOptions = useMemo(
    () => Array.from(new Set(routes.map((route) => route.destinationLocation?.name).filter(Boolean))).sort(),
    [routes],
  );

  const filteredRoutes = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return routes.filter((route) => {
      const departureName = route.departureLocation?.name || "";
      const destinationName = route.destinationLocation?.name || "";
      const searchable = `${route.id} ${departureName} ${route.departureLocation?.province || ""} ${destinationName} ${route.destinationLocation?.province || ""}`.toLowerCase();

      return (
        (!departureFilter || departureName === departureFilter) &&
        (!destinationFilter || destinationName === destinationFilter) &&
        (!statusFilter || route.status === statusFilter) &&
        (!normalizedSearch || searchable.includes(normalizedSearch))
      );
    });
  }, [departureFilter, destinationFilter, routes, searchTerm, statusFilter]);

  const loadRoutes = async () => {
    try {
      setLoading(true);
      const [routesResponse, locationsResponse] = await Promise.all([
        adminService.getRoutes(),
        adminService.getLocations(),
      ]);

      setRoutes(routesResponse.data.routes || []);
      setLocations(locationsResponse.data.locations || []);
    } catch (error: any) {
      alert(error.message || "Không thể tải danh sách tuyến xe.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoutes();
  }, []);

  const updateField = (field: keyof RouteForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const openEditForm = (route: any) => {
    setEditingRoute(route);
    setForm({
      departureLocationId: String(route.departureLocationId || ""),
      destinationLocationId: String(route.destinationLocationId || ""),
      distanceKm: route.distanceKm ? String(route.distanceKm) : "",
      estimatedMinutes: route.estimatedMinutes ? String(route.estimatedMinutes) : "",
      status: route.status || "active",
    });
  };

  const closeEditForm = () => {
    setEditingRoute(null);
    setForm(emptyForm);
  };

  const buildPayload = () => ({
    departureLocationId: Number(form.departureLocationId),
    destinationLocationId: Number(form.destinationLocationId),
    distanceKm: form.distanceKm ? Number(form.distanceKm) : undefined,
    estimatedMinutes: form.estimatedMinutes ? Number(form.estimatedMinutes) : undefined,
    status: form.status,
  });

  const validateForm = () => {
    if (!form.departureLocationId || !form.destinationLocationId) {
      alert("Vui lòng chọn điểm đi và điểm đến.");
      return false;
    }

    if (form.departureLocationId === form.destinationLocationId) {
      alert("Điểm đi và điểm đến phải khác nhau.");
      return false;
    }

    return true;
  };

  const handleUpdateRoute = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingRoute || !validateForm()) return;

    try {
      setSaving(true);
      await adminService.updateRoute(editingRoute.id, buildPayload());
      closeEditForm();
      await loadRoutes();
      alert("Cập nhật tuyến xe thành công.");
    } catch (error: any) {
      alert(error.message || "Không thể cập nhật tuyến xe.");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (route: any, status: string) => {
    if (status === route.status) return;
    if (!confirm(`Đổi trạng thái tuyến xe thành "${status}"?`)) return;

    try {
      await adminService.updateRouteStatus(route.id, status);
      await loadRoutes();
    } catch (error: any) {
      alert(error.message || "Không thể cập nhật trạng thái tuyến xe.");
    }
  };

  const handleDeleteRoute = async (route: any) => {
    const title = `${route.departureLocation?.name || "?"} -> ${route.destinationLocation?.name || "?"}`;
    if (
      !confirm(
        `Xóa tuyến "${title}"?\n\nChỉ xóa được tuyến chưa có chuyến xe. Nếu đã có chuyến, hãy chuyển sang Ngừng hoạt động.`,
      )
    ) {
      return;
    }

    try {
      await adminService.deleteRoute(route.id);
      await loadRoutes();
      alert("Xóa tuyến xe thành công.");
    } catch (error: any) {
      alert(error.message || "Không thể xóa tuyến xe.");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>Quản lý tuyến xe</h1>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/admin/locations" className="button outline">
            + Thêm địa điểm
          </Link>
          <button className="button outline" type="button" onClick={loadRoutes}>
            Làm mới
          </button>
          <Link href="/admin/routes/create" className="button">
            + Tạo tuyến mới
          </Link>
        </div>
      </div>

      {editingRoute && (
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 18, margin: 0 }}>Cập nhật tuyến xe</h2>
              <div style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>
                ID #{editingRoute.id}
              </div>
            </div>
            <button className="button outline" type="button" onClick={closeEditForm}>
              Hủy
            </button>
          </div>

          <form
            onSubmit={handleUpdateRoute}
            style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16 }}
          >
            <label>
              <span style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Điểm đi</span>
              <select
                className="input"
                required
                value={form.departureLocationId}
                onChange={(event) => updateField("departureLocationId", event.target.value)}
              >
                <option value="">Chọn điểm đi</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name} ({location.province})
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Điểm đến</span>
              <select
                className="input"
                required
                value={form.destinationLocationId}
                onChange={(event) => updateField("destinationLocationId", event.target.value)}
              >
                <option value="">Chọn điểm đến</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name} ({location.province})
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Trạng thái</span>
              <select
                className="input"
                value={form.status}
                onChange={(event) => updateField("status", event.target.value)}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Khoảng cách (km)</span>
              <input
                className="input"
                min={0}
                step="0.1"
                type="number"
                value={form.distanceKm}
                onChange={(event) => updateField("distanceKm", event.target.value)}
              />
            </label>

            <label>
              <span style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Thời gian dự kiến (phút)</span>
              <input
                className="input"
                min={0}
                type="number"
                value={form.estimatedMinutes}
                onChange={(event) => updateField("estimatedMinutes", event.target.value)}
              />
            </label>

            <div style={{ display: "flex", alignItems: "end", gap: 12 }}>
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
          gridTemplateColumns: "1.3fr repeat(3, minmax(150px, 1fr)) auto",
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
            placeholder="Tên điểm đi, điểm đến..."
          />
        </label>
        <label>
          <span style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13 }}>Điểm đi</span>
          <select className="input" value={departureFilter} onChange={(event) => setDepartureFilter(event.target.value)}>
            <option value="">Tất cả</option>
            {departureOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13 }}>Điểm đến</span>
          <select className="input" value={destinationFilter} onChange={(event) => setDestinationFilter(event.target.value)}>
            <option value="">Tất cả</option>
            {destinationOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13 }}>Trạng thái</span>
          <select className="input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">Tất cả</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button
          className="button outline"
          type="button"
          onClick={() => {
            setSearchTerm("");
            setDepartureFilter("");
            setDestinationFilter("");
            setStatusFilter("");
          }}
        >
          Xóa lọc
        </button>
      </div>

      <div className="admin-table-container">
        {loading && routes.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center" }}>Đang tải...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Điểm đi</th>
                <th>Điểm đến</th>
                <th>Khoảng cách</th>
                <th>TG dự kiến</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoutes.map((route) => {
                const hasTrips = (route._count?.trips || 0) > 0;

                return (
                  <tr key={route.id}>
                    <td>{route.id}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{route.departureLocation?.name}</div>
                      <div style={{ fontSize: 13, color: "var(--muted)" }}>
                        {route.departureLocation?.province}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{route.destinationLocation?.name}</div>
                      <div style={{ fontSize: 13, color: "var(--muted)" }}>
                        {route.destinationLocation?.province}
                      </div>
                    </td>
                    <td>{route.distanceKm ? `${route.distanceKm} km` : "---"}</td>
                    <td>{route.estimatedMinutes ? `${route.estimatedMinutes} phút` : "---"}</td>
                    <td>
                      <select
                        className="input"
                        style={{ height: 32, padding: "0 8px", fontSize: 13, width: 150 }}
                        value={route.status}
                        onChange={(event) => handleStatusChange(route, event.target.value)}
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          className="button outline"
                          type="button"
                          style={{ height: 28, fontSize: 12, padding: "0 12px" }}
                          onClick={() => openEditForm(route)}
                        >
                          Sửa
                        </button>
                        <button
                          className="button"
                          type="button"
                          disabled={hasTrips}
                          title={hasTrips ? "Tuyến đã có chuyến, chỉ có thể ngừng hoạt động." : "Xóa tuyến"}
                          onClick={() => handleDeleteRoute(route)}
                          style={{
                            height: 28,
                            fontSize: 12,
                            padding: "0 12px",
                            background: hasTrips ? "#cbd5e1" : "#dc2626",
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

              {filteredRoutes.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
                    Chưa có tuyến xe nào.
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
