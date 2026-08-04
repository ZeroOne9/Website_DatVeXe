"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { adminService } from "@/services/adminService";
import { formatMoney } from "@/lib/format";

const statusOptions = [
  { value: "scheduled", label: "Chưa khởi hành" },
  { value: "departed", label: "Đã khởi hành" },
  { value: "completed", label: "Hoàn thành" },
  { value: "cancelled", label: "Đã hủy" },
];

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function buildTripPayload(form: Record<string, string>) {
  return {
    routeId: Number(form.routeId),
    vehicleId: Number(form.vehicleId),
    departureTime: new Date(form.departureTime).toISOString(),
    arrivalTime: form.arrivalTime ? new Date(form.arrivalTime).toISOString() : undefined,
    priceVnd: Number(form.priceVnd),
    status: form.status,
  };
}

export default function AdminTripsPage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [departureFilter, setDepartureFilter] = useState("");
  const [destinationFilter, setDestinationFilter] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    routeId: "",
    vehicleId: "",
    departureTime: "",
    arrivalTime: "",
    priceVnd: "",
    status: "scheduled",
  });

  const filteredTrips = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return trips.filter((trip) => {
      const departureName = trip.route?.departureLocation?.name || "";
      const destinationName = trip.route?.destinationLocation?.name || "";
      const companyName = trip.vehicle?.busCompany?.name || "";
      const vehicleName = trip.vehicle?.name || "";
      const licensePlate = trip.vehicle?.licensePlate || "";
      const searchable = `${trip.id} ${departureName} ${destinationName} ${companyName} ${vehicleName} ${licensePlate}`.toLowerCase();

      return (
        (!statusFilter || trip.status === statusFilter) &&
        (!departureFilter || departureName === departureFilter) &&
        (!destinationFilter || destinationName === destinationFilter) &&
        (!normalizedSearch || searchable.includes(normalizedSearch))
      );
    });
  }, [departureFilter, destinationFilter, searchTerm, statusFilter, trips]);

  const departureOptions = useMemo(
    () => Array.from(new Set(trips.map((trip) => trip.route?.departureLocation?.name).filter(Boolean))).sort(),
    [trips],
  );

  const destinationOptions = useMemo(
    () => Array.from(new Set(trips.map((trip) => trip.route?.destinationLocation?.name).filter(Boolean))).sort(),
    [trips],
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const [tripsRes, routesRes, vehiclesRes] = await Promise.all([
        adminService.getTrips(),
        adminService.getRoutes(),
        adminService.getVehicles(),
      ]);
      setTrips(tripsRes.data.trips || []);
      setRoutes(routesRes.data.routes || []);
      setVehicles(vehiclesRes.data.vehicles || []);
    } catch (err: any) {
      alert(err.message || "Không thể tải dữ liệu chuyến xe.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const startEdit = (trip: any) => {
    setEditingId(trip.id);
    setForm({
      routeId: String(trip.routeId),
      vehicleId: String(trip.vehicleId),
      departureTime: toDateTimeLocal(trip.departureTime),
      arrivalTime: toDateTimeLocal(trip.arrivalTime),
      priceVnd: String(trip.priceVnd),
      status: trip.status,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({
      routeId: "",
      vehicleId: "",
      departureTime: "",
      arrivalTime: "",
      priceVnd: "",
      status: "scheduled",
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    if (!form.routeId || !form.vehicleId || !form.departureTime || !form.priceVnd) {
      alert("Vui lòng nhập đủ tuyến, xe, giờ khởi hành và giá vé.");
      return;
    }

    try {
      await adminService.updateTrip(editingId, buildTripPayload(form));
      alert("Cập nhật chuyến xe thành công.");
      cancelEdit();
      await loadData();
    } catch (err: any) {
      alert(err.message || "Không thể cập nhật chuyến xe.");
    }
  };

  const deleteTrip = async (trip: any) => {
    if (!confirm(`Xóa chuyến #${trip.id}? Chỉ xóa được chuyến chưa có vé đặt.`)) return;

    try {
      await adminService.deleteTrip(trip.id);
      alert("Xóa chuyến xe thành công.");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Không thể xóa chuyến xe.");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, margin: 0 }}>Quản lý Chuyến xe</h1>
          <p style={{ color: "var(--muted)", marginTop: 6 }}>
            Tạo, cập nhật, hủy hoặc xóa chuyến xe chưa phát sinh vé.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="button outline" onClick={() => void loadData()}>
            Làm mới
          </button>
          <Link href="/admin/trips/create" className="button">
            + Tạo chuyến mới
          </Link>
        </div>
      </div>

      <div
        className="card"
        style={{
          padding: 16,
          marginBottom: 16,
          display: "grid",
          gridTemplateColumns: "1.4fr repeat(3, minmax(160px, 1fr)) auto",
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
            placeholder="Mã chuyến, nhà xe, biển số..."
          />
        </label>
        <label>
          <span style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13 }}>Nơi xuất phát</span>
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
          <span style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13 }}>Nơi đến</span>
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
            <option value="">Tất cả trạng thái</option>
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

      {editingId && (
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, marginTop: 0 }}>Sửa chuyến #{editingId}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 }}>
            <select className="input" value={form.routeId} onChange={(e) => setForm({ ...form, routeId: e.target.value })}>
              <option value="">Chọn tuyến xe</option>
              {routes.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.departureLocation?.name} - {route.destinationLocation?.name}
                </option>
              ))}
            </select>
            <select className="input" value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
              <option value="">Chọn xe</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.name} - {vehicle.licensePlate} ({vehicle.busCompany?.name})
                </option>
              ))}
            </select>
            <input
              className="input"
              type="datetime-local"
              value={form.departureTime}
              onChange={(e) => setForm({ ...form, departureTime: e.target.value })}
            />
            <input
              className="input"
              type="datetime-local"
              value={form.arrivalTime}
              onChange={(e) => setForm({ ...form, arrivalTime: e.target.value })}
            />
            <input
              className="input"
              type="number"
              min="1000"
              step="1000"
              value={form.priceVnd}
              onChange={(e) => setForm({ ...form, priceVnd: e.target.value })}
              placeholder="Giá vé"
            />
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
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
        {loading && trips.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center" }}>Đang tải...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tuyến</th>
                <th>Xe & Nhà xe</th>
                <th>Khởi hành</th>
                <th>Giá vé</th>
                <th>Vé đã đặt</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrips.map((trip) => (
                <tr key={trip.id}>
                  <td>{trip.id}</td>
                  <td>
                    <strong>
                      {trip.route?.departureLocation?.name} - {trip.route?.destinationLocation?.name}
                    </strong>
                  </td>
                  <td>
                    <div>{trip.vehicle?.name} ({trip.vehicle?.licensePlate})</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{trip.vehicle?.busCompany?.name}</div>
                  </td>
                  <td>{new Date(trip.departureTime).toLocaleString("vi-VN")}</td>
                  <td style={{ fontWeight: 700, color: "var(--primary)" }}>{formatMoney(trip.priceVnd)}</td>
                  <td>{trip._count?.bookingSeats || 0}</td>
                  <td>{statusOptions.find((option) => option.value === trip.status)?.label || trip.status}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button className="button outline" style={{ height: 32, fontSize: 13 }} onClick={() => startEdit(trip)}>
                        Sửa
                      </button>
                      <button className="button danger" style={{ height: 32, fontSize: 13 }} onClick={() => void deleteTrip(trip)}>
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTrips.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
                    Chưa có chuyến xe phù hợp
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
