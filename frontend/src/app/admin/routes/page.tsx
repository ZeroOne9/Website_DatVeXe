"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
  { value: "active", label: "Dang hoat dong" },
  { value: "inactive", label: "Ngung hoat dong" },
];

export default function AdminRoutesPage() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingRoute, setEditingRoute] = useState<any | null>(null);
  const [form, setForm] = useState<RouteForm>(emptyForm);

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
      alert(error.message || "Khong the tai danh sach tuyen xe.");
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
      alert("Vui long chon diem di va diem den.");
      return false;
    }

    if (form.departureLocationId === form.destinationLocationId) {
      alert("Diem di va diem den phai khac nhau.");
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
      alert("Cap nhat tuyen xe thanh cong.");
    } catch (error: any) {
      alert(error.message || "Khong the cap nhat tuyen xe.");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (route: any, status: string) => {
    if (status === route.status) return;
    if (!confirm(`Doi trang thai tuyen xe thanh "${status}"?`)) return;

    try {
      await adminService.updateRouteStatus(route.id, status);
      await loadRoutes();
    } catch (error: any) {
      alert(error.message || "Khong the cap nhat trang thai tuyen xe.");
    }
  };

  const handleDeleteRoute = async (route: any) => {
    const title = `${route.departureLocation?.name || "?"} -> ${route.destinationLocation?.name || "?"}`;
    if (
      !confirm(
        `Xoa tuyen "${title}"?\n\nChi xoa duoc tuyen chua co chuyen xe. Neu da co chuyen, hay chuyen sang Ngung hoat dong.`,
      )
    ) {
      return;
    }

    try {
      await adminService.deleteRoute(route.id);
      await loadRoutes();
      alert("Xoa tuyen xe thanh cong.");
    } catch (error: any) {
      alert(error.message || "Khong the xoa tuyen xe.");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>Quan ly tuyen xe</h1>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="button outline" type="button" onClick={loadRoutes}>
            Lam moi
          </button>
          <Link href="/admin/routes/create" className="button">
            + Tao tuyen moi
          </Link>
        </div>
      </div>

      {editingRoute && (
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 18, margin: 0 }}>Cap nhat tuyen xe</h2>
              <div style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>
                ID #{editingRoute.id}
              </div>
            </div>
            <button className="button outline" type="button" onClick={closeEditForm}>
              Huy
            </button>
          </div>

          <form
            onSubmit={handleUpdateRoute}
            style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16 }}
          >
            <label>
              <span style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Diem di</span>
              <select
                className="input"
                required
                value={form.departureLocationId}
                onChange={(event) => updateField("departureLocationId", event.target.value)}
              >
                <option value="">Chon diem di</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name} ({location.province})
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Diem den</span>
              <select
                className="input"
                required
                value={form.destinationLocationId}
                onChange={(event) => updateField("destinationLocationId", event.target.value)}
              >
                <option value="">Chon diem den</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name} ({location.province})
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Trang thai</span>
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
              <span style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Khoang cach (km)</span>
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
              <span style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Thoi gian du kien (phut)</span>
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
                Huy
              </button>
              <button className="button" type="submit" disabled={saving}>
                {saving ? "Dang luu..." : "Luu thay doi"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-table-container">
        {loading && routes.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center" }}>Dang tai...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Diem di</th>
                <th>Diem den</th>
                <th>Khoang cach</th>
                <th>TG du kien</th>
                <th>Trang thai</th>
                <th>Thao tac</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((route) => {
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
                    <td>{route.estimatedMinutes ? `${route.estimatedMinutes} phut` : "---"}</td>
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
                          Sua
                        </button>
                        <button
                          className="button"
                          type="button"
                          disabled={hasTrips}
                          title={hasTrips ? "Tuyen da co chuyen, chi co the ngung hoat dong." : "Xoa tuyen"}
                          onClick={() => handleDeleteRoute(route)}
                          style={{
                            height: 28,
                            fontSize: 12,
                            padding: "0 12px",
                            background: hasTrips ? "#cbd5e1" : "#dc2626",
                            color: "white",
                          }}
                        >
                          Xoa
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {routes.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
                    Chua co tuyen xe nao.
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
