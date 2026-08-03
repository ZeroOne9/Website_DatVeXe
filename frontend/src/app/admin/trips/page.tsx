"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { adminService } from "@/services/adminService";
import { formatMoney } from "@/lib/format";

const statusOptions = [
  { value: "scheduled", label: "Chua khoi hanh" },
  { value: "departed", label: "Da khoi hanh" },
  { value: "completed", label: "Hoan thanh" },
  { value: "cancelled", label: "Da huy" },
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
    if (!statusFilter) return trips;
    return trips.filter((trip) => trip.status === statusFilter);
  }, [trips, statusFilter]);

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
      alert(err.message || "Khong the tai du lieu chuyen xe.");
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
      alert("Vui long nhap du route, xe, gio khoi hanh va gia ve.");
      return;
    }

    try {
      await adminService.updateTrip(editingId, buildTripPayload(form));
      alert("Cap nhat chuyen xe thanh cong.");
      cancelEdit();
      await loadData();
    } catch (err: any) {
      alert(err.message || "Khong the cap nhat chuyen xe.");
    }
  };

  const deleteTrip = async (trip: any) => {
    if (!confirm(`Xoa chuyen #${trip.id}? Chi xoa duoc chuyen chua co ve dat.`)) return;

    try {
      await adminService.deleteTrip(trip.id);
      alert("Xoa chuyen xe thanh cong.");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Khong the xoa chuyen xe.");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, margin: 0 }}>Quan ly Chuyen xe</h1>
          <p style={{ color: "var(--muted)", marginTop: 6 }}>
            Tao, cap nhat, huy hoac xoa chuyen xe chua phat sinh ve.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="button outline" onClick={() => void loadData()}>
            Lam moi
          </button>
          <Link href="/admin/trips/create" className="button">
            + Tao chuyen moi
          </Link>
        </div>
      </div>

      <div style={{ marginBottom: 16, maxWidth: 240 }}>
        <select className="input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">Tat ca trang thai</option>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {editingId && (
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, marginTop: 0 }}>Sua chuyen #{editingId}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 }}>
            <select className="input" value={form.routeId} onChange={(e) => setForm({ ...form, routeId: e.target.value })}>
              <option value="">Chon tuyen xe</option>
              {routes.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.departureLocation?.name} - {route.destinationLocation?.name}
                </option>
              ))}
            </select>
            <select className="input" value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
              <option value="">Chon xe</option>
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
              placeholder="Gia ve"
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
              Luu thay doi
            </button>
            <button className="button outline" onClick={cancelEdit}>
              Huy
            </button>
          </div>
        </div>
      )}

      <div className="admin-table-container">
        {loading && trips.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center" }}>Dang tai...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tuyen</th>
                <th>Xe & Nha xe</th>
                <th>Khoi hanh</th>
                <th>Gia ve</th>
                <th>Ve da dat</th>
                <th>Trang thai</th>
                <th>Thao tac</th>
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
                        Sua
                      </button>
                      <button className="button danger" style={{ height: 32, fontSize: 13 }} onClick={() => void deleteTrip(trip)}>
                        Xoa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTrips.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
                    Chua co chuyen xe phu hop
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
