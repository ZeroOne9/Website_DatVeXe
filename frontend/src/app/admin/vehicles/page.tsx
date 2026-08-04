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
  { value: "active", label: "Đang hoạt động" },
  { value: "maintenance", label: "Đang bảo trì" },
  { value: "inactive", label: "Ngừng hoạt động" },
];

export default function AdminVehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [busCompanies, setBusCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [busCompanyFilter, setBusCompanyFilter] = useState("");
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState<VehicleForm>(emptyForm);

  const editingSeatCount = useMemo(
    () => editingVehicle?._count?.seats ?? 0,
    [editingVehicle],
  );

  const vehicleTypeOptions = useMemo(
    () => Array.from(new Set(vehicles.map((vehicle) => vehicle.vehicleType).filter(Boolean))).sort(),
    [vehicles],
  );

  const filteredVehicles = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return vehicles.filter((vehicle) => {
      const searchable = `${vehicle.id} ${vehicle.name || ""} ${vehicle.licensePlate || ""} ${vehicle.busCompany?.name || ""} ${vehicle.vehicleType || ""}`.toLowerCase();

      return (
        (!busCompanyFilter || String(vehicle.busCompanyId) === busCompanyFilter) &&
        (!vehicleTypeFilter || vehicle.vehicleType === vehicleTypeFilter) &&
        (!statusFilter || vehicle.status === statusFilter) &&
        (!normalizedSearch || searchable.includes(normalizedSearch))
      );
    });
  }, [busCompanyFilter, searchTerm, statusFilter, vehicleTypeFilter, vehicles]);

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
      alert(error.message || "Không thể tải danh sách xe.");
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
    if (!confirm(`Đổi trạng thái xe "${vehicle.name}" thành "${status}"?`)) return;

    try {
      await adminService.updateVehicleStatus(vehicle.id, status);
      await loadVehicles();
    } catch (error: any) {
      alert(error.message || "Không thể cập nhật trạng thái xe.");
    }
  };

  const handleUpdateVehicle = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingVehicle) return;

    const capacity = Number(form.capacity);
    if (!form.busCompanyId || !form.licensePlate || !form.name || !form.vehicleType || !capacity) {
      alert("Vui lòng nhập đầy đủ thông tin xe.");
      return;
    }

    if (capacity < editingSeatCount) {
      alert(`Sức chứa không được nhỏ hơn số ghế đã tạo (${editingSeatCount}).`);
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
      alert("Cập nhật xe thành công.");
    } catch (error: any) {
      alert(error.message || "Không thể cập nhật xe.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVehicle = async (vehicle: any) => {
    if (
      !confirm(
        `Xóa xe "${vehicle.name}"?\n\nChỉ xóa được xe chưa có chuyến xe. Nếu xe đã có chuyến, hãy chuyển sang Ngừng hoạt động.`,
      )
    ) {
      return;
    }

    try {
      await adminService.deleteVehicle(vehicle.id);
      await loadVehicles();
      alert("Xóa xe thành công.");
    } catch (error: any) {
      alert(error.message || "Không thể xóa xe.");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>Quản lý xe</h1>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="button outline" onClick={loadVehicles} type="button">
            Làm mới
          </button>
          <Link href="/admin/vehicles/create" className="button">
            + Thêm xe mới
          </Link>
        </div>
      </div>

      {editingVehicle && (
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 18, margin: 0 }}>Cập nhật thông tin xe</h2>
              <div style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>
                Đã tạo {editingSeatCount}/{editingVehicle.capacity} ghế
              </div>
            </div>
            <button className="button outline" type="button" onClick={closeEditForm}>
              Hủy
            </button>
          </div>

          <form
            onSubmit={handleUpdateVehicle}
            style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16 }}
          >
            <label>
              <span style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Nhà xe</span>
              <select
                className="input"
                value={form.busCompanyId}
                onChange={(event) => updateField("busCompanyId", event.target.value)}
                required
              >
                <option value="">Chọn nhà xe</option>
                {busCompanies.map((busCompany) => (
                  <option key={busCompany.id} value={busCompany.id}>
                    {busCompany.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Tên xe</span>
              <input
                className="input"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                required
              />
            </label>

            <label>
              <span style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Biển số</span>
              <input
                className="input"
                value={form.licensePlate}
                onChange={(event) => updateField("licensePlate", event.target.value)}
                required
              />
            </label>

            <label>
              <span style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Loại xe</span>
              <input
                className="input"
                value={form.vehicleType}
                onChange={(event) => updateField("vehicleType", event.target.value)}
                required
              />
            </label>

            <label>
              <span style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Sức chứa</span>
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
            placeholder="Tên xe, biển số..."
          />
        </label>
        <label>
          <span style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13 }}>Nhà xe</span>
          <select className="input" value={busCompanyFilter} onChange={(event) => setBusCompanyFilter(event.target.value)}>
            <option value="">Tất cả</option>
            {busCompanies.map((busCompany) => (
              <option key={busCompany.id} value={busCompany.id}>
                {busCompany.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13 }}>Loại xe</span>
          <select className="input" value={vehicleTypeFilter} onChange={(event) => setVehicleTypeFilter(event.target.value)}>
            <option value="">Tất cả</option>
            {vehicleTypeOptions.map((vehicleType) => (
              <option key={vehicleType} value={vehicleType}>
                {vehicleType}
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
            setBusCompanyFilter("");
            setVehicleTypeFilter("");
            setStatusFilter("");
          }}
        >
          Xóa lọc
        </button>
      </div>

      <div className="admin-table-container">
        {loading && vehicles.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center" }}>Đang tải...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên xe</th>
                <th>Biển số</th>
                <th>Nhà xe</th>
                <th>Đã tạo/Sức chứa</th>
                <th>Loại xe</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((vehicle) => {
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
                      /{vehicle.capacity} ghế
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
                          Sửa
                        </button>
                        <Link
                          href={`/admin/vehicles/${vehicle.id}/seats`}
                          className="button outline"
                          style={{ height: 28, fontSize: 12, padding: "0 12px" }}
                        >
                          Ghế
                        </Link>
                        <button
                          className="button"
                          type="button"
                          disabled={hasTrips}
                          title={hasTrips ? "Xe đã có chuyến, chỉ có thể ngừng hoạt động." : "Xóa xe"}
                          onClick={() => handleDeleteVehicle(vehicle)}
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

              {filteredVehicles.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
                    Chưa có dữ liệu xe.
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
