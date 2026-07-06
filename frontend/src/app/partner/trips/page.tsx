"use client";

import { useEffect, useState } from "react";

import { formatDateTime, formatMoney } from "@/lib/format";
import { partnerDashboardService } from "@/services/partnerDashboardService";

const inputStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 40,
  border: "1px solid var(--line)",
  borderRadius: "var(--radius)",
  padding: "0 12px",
  background: "white",
};

export default function PartnerTripsPage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    routeId: "",
    vehicleId: "",
    departureTime: "",
    arrivalTime: "",
    priceVnd: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [tripsResponse, vehiclesResponse, routesResponse] = await Promise.all([
        partnerDashboardService.getTrips(),
        partnerDashboardService.getVehicles(),
        partnerDashboardService.getRoutes(),
      ]);
      setTrips(tripsResponse.data.trips);
      setVehicles(vehiclesResponse.data.vehicles);
      setRoutes(routesResponse.data.routes);
    } catch (error) {
      console.error(error);
      alert("Khong the tai du lieu tao chuyen.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateForm = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleCreateTrip = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await partnerDashboardService.createTrip({
        routeId: Number(form.routeId),
        vehicleId: Number(form.vehicleId),
        departureTime: new Date(form.departureTime).toISOString(),
        arrivalTime: form.arrivalTime ? new Date(form.arrivalTime).toISOString() : undefined,
        priceVnd: Number(form.priceVnd),
      });
      setForm({ routeId: "", vehicleId: "", departureTime: "", arrivalTime: "", priceVnd: "" });
      await loadData();
      alert("Tao chuyen thanh cong.");
    } catch (error: any) {
      alert(error.message || "Khong the tao chuyen.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Dang tai danh sach chuyen...</div>;

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>Chuyen xe cua nha xe</h1>

      <section className="card">
        <h2 style={{ fontSize: 18, marginTop: 0 }}>Tao chuyen xe moi</h2>
        <form onSubmit={handleCreateTrip} style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <select
              required
              style={inputStyle}
              value={form.routeId}
              onChange={(event) => updateForm("routeId", event.target.value)}
            >
              <option value="">Chon tuyen active</option>
              {routes.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.departureLocation?.name} - {route.destinationLocation?.name}
                </option>
              ))}
            </select>
            <select
              required
              style={inputStyle}
              value={form.vehicleId}
              onChange={(event) => updateForm("vehicleId", event.target.value)}
            >
              <option value="">Chon xe cua nha xe</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.name} - {vehicle.licensePlate}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <input
              required
              type="datetime-local"
              style={inputStyle}
              value={form.departureTime}
              onChange={(event) => updateForm("departureTime", event.target.value)}
            />
            <input
              type="datetime-local"
              style={inputStyle}
              value={form.arrivalTime}
              onChange={(event) => updateForm("arrivalTime", event.target.value)}
            />
            <input
              required
              min={1000}
              step={1000}
              type="number"
              style={inputStyle}
              value={form.priceVnd}
              onChange={(event) => updateForm("priceVnd", event.target.value)}
              placeholder="Gia ve"
            />
          </div>

          <button className="button primary" type="submit" disabled={saving || vehicles.length === 0 || routes.length === 0}>
            {saving ? "Dang luu..." : "Tao chuyen"}
          </button>
        </form>
      </section>

      <h2 style={{ fontSize: 18, marginTop: 32 }}>Danh sach chuyen xe</h2>
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Tuyen</th>
              <th>Xe</th>
              <th>Khoi hanh</th>
              <th>Gia ve</th>
              <th>Ghe da dat</th>
              <th>Trang thai</th>
            </tr>
          </thead>
          <tbody>
            {trips.map((trip) => (
              <tr key={trip.id}>
                <td>
                  {trip.route?.departureLocation?.name} - {trip.route?.destinationLocation?.name}
                </td>
                <td>{trip.vehicle?.name}</td>
                <td>{formatDateTime(trip.departureTime)}</td>
                <td>{formatMoney(trip.priceVnd)}</td>
                <td>{trip._count?.bookingSeats ?? 0}</td>
                <td>{trip.status}</td>
              </tr>
            ))}
            {trips.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 32 }}>
                  Chua co chuyen xe nao
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
