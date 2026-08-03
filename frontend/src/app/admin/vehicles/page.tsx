"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { adminService } from "@/services/adminService";

type VehicleForm = {
  busCompanyId: string;
  licensePlate: string;
  name: string;
  vehicleType: string;
  capacity: string;
  status: string;
};

const emptyForm: VehicleForm = {
  busCompanyId: "",
  licensePlate: "",
  name: "",
  vehicleType: "",
  capacity: "",
  status: "active",
};

const statusOptions = [
  { value: "active", label: "Dang hoat dong" },
  { value: "maintenance", label: "Dang bao tri" },
  { value: "inactive", label: "Ngung hoat dong" },
];

export default function AdminVehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [busCompanies, setBusCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any | null>(null);
  const [form, setForm] = useState<VehicleForm>(emptyForm);

  const editingSeatCount = useMemo(
    () => editingVehicle?._count?.seats ?? 0,
    [editingVehicle],
  );

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const [vehiclesResponse, busCompaniesResponse] = await Promise.all([
        adminService.getVehicles(),
        adminService.getBusCompanies(),
      ]);

      setVehicles(vehiclesResponse.data.vehicles || []);
      setBusCompanies(busCompaniesResponse.data.busCompanies || []);
    } catch (error: any) {
      alert(error.message || "Khong the tai danh sach xe.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const openEditForm = (vehicle: any) => {
    setEditingVehicle(vehicle);
    setForm({
      busCompanyId: String(vehicle.busCompanyId),
      licensePlate: vehicle.licensePlate || "",
      name: vehicle.name || "",
      vehicleType: vehicle.vehicleType || "",
      capacity: String(vehicle.capacity || ""),
      status: vehicle.status || "active",
    });
  };

  const closeEditForm = () => {
    setEditingVehicle(null);
    setForm(emptyForm);
  };

  const updateField = (field: keyof VehicleForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleStatusChange = async (vehicle: any, status: string) => {
    if (status === vehicle.status) return;
    if (!confirm(`Doi trang thai xe "${vehicle.name}" thanh "${status}"?`)) return;

    try {
      await adminService.updateVehicleStatus(vehicle.id, status);
      await loadVehicles();
    } catch (error: any) {
      alert(error.message || "Khong the cap nhat trang thai xe.");
    }
  };

  const handleUpdateVehicle = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingVehicle) return;

    const capacity = Number(form.capacity);
    if (!form.busCompanyId || !form.licensePlate || !form.name || !form.vehicleType || !capacity) {
      alert("Vui long nhap day du thong tin xe.");
      return;
    }

    if (capacity < editingSeatCount) {
      alert(`Suc chua khong duoc nho hon so ghe da tao (${editingSeatCount}).`);
      return;
    }

    try {
      setSaving(true);
      await adminService.updateVehicle(editingVehicle.id, {
        busCompanyId: Number(form.busCompanyId),
        licensePlate: form.licensePlate.trim(),
        name: form.name.trim(),
        vehicleType: form.vehicleType.trim(),
        capacity,
        status: form.status,
      });

      closeEditForm();
      await loadVehicles();
      alert("Cap nhat xe thanh cong.");
    } catch (error: any) {
      alert(error.message || "Khong the cap nhat xe.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVehicle = async (vehicle: any) => {
    if (
      !confirm(
        `Xoa xe "${vehicle.name}"?\n\nChi xoa duoc xe chua co chuyen xe. Neu xe da co chuyen, hay chuyen sang Ngung hoat dong.`,
      )
    ) {
      return;
    }

    try {
      await adminService.deleteVehicle(vehicle.id);
      await loadVehicles();
      alert("Xoa xe thanh cong.");
    } catch (error: any) {
      alert(error.message || "Khong the xoa xe.");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>Quan ly xe</h1>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="button outline" onClick={loadVehicles} type="button">
            Lam moi
          </button>
          <Link href="/admin/vehicles/create" className="button">
            + Them xe moi
          </Link>
        </div>
      </div>

      {editingVehicle && (
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 18, margin: 0 }}>Cap nhat thong tin xe</h2>
              <div style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>
                Da tao {editingSeatCount}/{editingVehicle.capacity} ghe
              </div>
            </div>
            <button className="button outline" type="button" onClick={closeEditForm}>
              Huy
            </button>
          </div>

          <form
            onSubmit={handleUpdateVehicle}
            style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16 }}
          >
            <label>
              <span style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Nha xe</span>
              <select
                className="input"
                value={form.busCompanyId}
                onChange={(event) => updateField("busCompanyId", event.target.value)}
                required
              >
                <option value="">Chon nha xe</option>
                {busCompanies.map((busCompany) => (
                  <option key={busCompany.id} value={busCompany.id}>
                    {busCompany.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Ten xe</span>
              <input
                className="input"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                required
              />
            </label>

            <label>
              <span style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Bien so</span>
              <input
                className="input"
                value={form.licensePlate}
                onChange={(event) => updateField("licensePlate", event.target.value)}
                required
              />
            </label>

            <label>
              <span style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Loai xe</span>
              <input
                className="input"
                value={form.vehicleType}
                onChange={(event) => updateField("vehicleType", event.target.value)}
                required
              />
            </label>

            <label>
              <span style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Suc chua</span>
              <input
                className="input"
                min={editingSeatCount || 1}
                type="number"
                value={form.capacity}
                onChange={(event) => updateField("capacity", event.target.value)}
                required
              />
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

            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: 12 }}>
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
        {loading && vehicles.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center" }}>Dang tai...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Ten xe</th>
                <th>Bien so</th>
                <th>Nha xe</th>
                <th>Da tao/Suc chua</th>
                <th>Loai xe</th>
                <th>Trang thai</th>
                <th>Thao tac</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => {
                const seatCount = vehicle._count?.seats || 0;
                const hasTrips = (vehicle._count?.trips || 0) > 0;

                return (
                  <tr key={vehicle.id}>
                    <td>{vehicle.id}</td>
                    <td style={{ fontWeight: 600 }}>{vehicle.name}</td>
                    <td>{vehicle.licensePlate}</td>
                    <td>{vehicle.busCompany?.name}</td>
                    <td>
                      <span
                        style={{
                          color: seatCount >= vehicle.capacity ? "var(--red)" : "var(--primary)",
                          fontWeight: 700,
                        }}
                      >
                        {seatCount}
                      </span>
                      /{vehicle.capacity} ghe
                    </td>
                    <td>{vehicle.vehicleType}</td>
                    <td>
                      <select
                        className="input"
                        style={{ height: 32, padding: "0 8px", fontSize: 13, width: 150 }}
                        value={vehicle.status}
                        onChange={(event) => handleStatusChange(vehicle, event.target.value)}
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
                          onClick={() => openEditForm(vehicle)}
                        >
                          Sua
                        </button>
                        <Link
                          href={`/admin/vehicles/${vehicle.id}/seats`}
                          className="button outline"
                          style={{ height: 28, fontSize: 12, padding: "0 12px" }}
                        >
                          Ghe
                        </Link>
                        <button
                          className="button"
                          type="button"
                          disabled={hasTrips}
                          title={hasTrips ? "Xe da co chuyen, chi co the ngung hoat dong." : "Xoa xe"}
                          onClick={() => handleDeleteVehicle(vehicle)}
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

              {vehicles.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
                    Chua co du lieu xe.
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
