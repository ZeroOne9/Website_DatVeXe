"use client";

import { useEffect, useMemo, useState } from "react";

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

const helpTextStyle: React.CSSProperties = {
  marginTop: 6,
  color: "var(--muted)",
  fontSize: 12,
  lineHeight: 1.5,
};

const tripStatusLabels: Record<string, string> = {
  scheduled: "Chưa khởi hành",
  departed: "Đã khởi hành",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
};

function FieldLabel({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <label>
      <span style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14 }}>{label}</span>
      {children}
      {help && <div style={helpTextStyle}>{help}</div>}
    </label>
  );
}

export default function PartnerTripsPage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [routeFilter, setRouteFilter] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState({
    routeId: "",
    vehicleId: "",
    departureTime: "",
    arrivalTime: "",
    priceVnd: "",
  });

  const filteredTrips = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return trips.filter((trip) => {
      const routeTitle = `${trip.route?.departureLocation?.name || ""} ${trip.route?.destinationLocation?.name || ""}`;
      const searchable = `${trip.id} ${routeTitle} ${trip.vehicle?.name || ""} ${trip.vehicle?.licensePlate || ""}`.toLowerCase();

      return (
        (!routeFilter || String(trip.routeId ?? trip.route?.id) === routeFilter) &&
        (!vehicleFilter || String(trip.vehicleId ?? trip.vehicle?.id) === vehicleFilter) &&
        (!statusFilter || trip.status === statusFilter) &&
        (!normalizedSearch || searchable.includes(normalizedSearch))
      );
    });
  }, [routeFilter, searchTerm, statusFilter, trips, vehicleFilter]);

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
      alert("Không thể tải dữ liệu tạo chuyến.");
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
      alert("Tạo chuyến thành công.");
    } catch (error: any) {
      alert(error.message || "Không thể tạo chuyến.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Đang tải danh sách chuyến...</div>;

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>Chuyến xe của nhà xe</h1>

      <section className="card">
        <h2 style={{ fontSize: 18, marginTop: 0 }}>Tạo chuyến xe mới</h2>
        <p style={{ color: "var(--muted)", marginTop: -6, marginBottom: 18, lineHeight: 1.6 }}>
          Chuyến xe là một lượt chạy cụ thể của nhà xe theo tuyến, xe, thời gian khởi hành và giá vé.
        </p>

        <form onSubmit={handleCreateTrip} style={{ display: "grid", gap: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <FieldLabel
              label="Tuyến xe *"
              help="Chọn tuyến đã được admin khai báo, ví dụ: Bến xe Miền Đông - Bến xe Đà Lạt."
            >
              <select
                required
                style={inputStyle}
                value={form.routeId}
                onChange={(event) => updateForm("routeId", event.target.value)}
              >
                <option value="">Chọn tuyến đang hoạt động</option>
                {routes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.departureLocation?.name} - {route.destinationLocation?.name}
                  </option>
                ))}
              </select>
            </FieldLabel>

            <FieldLabel
              label="Xe chạy chuyến *"
              help="Chọn xe thuộc nhà xe của bạn. Xe nên được tạo ghế trước khi mở bán."
            >
              <select
                required
                style={inputStyle}
                value={form.vehicleId}
                onChange={(event) => updateForm("vehicleId", event.target.value)}
              >
                <option value="">Chọn xe của nhà xe</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.name} - {vehicle.licensePlate} ({vehicle._count?.seats ?? 0}/{vehicle.capacity} ghế)
                  </option>
                ))}
              </select>
            </FieldLabel>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <FieldLabel
              label="Thời gian khởi hành *"
              help="Ngày và giờ xe bắt đầu chạy. Ví dụ: 28/07/2026 lúc 08:00."
            >
              <input
                required
                type="datetime-local"
                style={inputStyle}
                value={form.departureTime}
                onChange={(event) => updateForm("departureTime", event.target.value)}
              />
            </FieldLabel>

            <FieldLabel
              label="Thời gian đến dự kiến"
              help="Có thể bỏ trống nếu chưa xác định. Nếu nhập thì phải sau giờ khởi hành."
            >
              <input
                type="datetime-local"
                style={inputStyle}
                value={form.arrivalTime}
                onChange={(event) => updateForm("arrivalTime", event.target.value)}
              />
            </FieldLabel>

            <FieldLabel
              label="Giá vé *"
              help="Nhập giá cho 1 ghế, đơn vị VNĐ. Ví dụ: 250000."
            >
              <input
                required
                min={1000}
                step={1000}
                type="number"
                style={inputStyle}
                value={form.priceVnd}
                onChange={(event) => updateForm("priceVnd", event.target.value)}
                placeholder="VD: 250000"
              />
            </FieldLabel>
          </div>

          {(routes.length === 0 || vehicles.length === 0) && (
            <div className="message" style={{ margin: 0 }}>
              Cần có ít nhất một tuyến đang hoạt động và một xe của nhà xe trước khi tạo chuyến.
            </div>
          )}

          <button className="button primary" type="submit" disabled={saving || vehicles.length === 0 || routes.length === 0}>
            {saving ? "Đang lưu..." : "Tạo chuyến"}
          </button>
        </form>
      </section>

      <h2 style={{ fontSize: 18, marginTop: 32 }}>Danh sách chuyến xe</h2>
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
            placeholder="Mã chuyến, tuyến, xe..."
          />
        </label>
        <label>
          <span style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13 }}>Tuyến xe</span>
          <select className="input" value={routeFilter} onChange={(event) => setRouteFilter(event.target.value)}>
            <option value="">Tất cả</option>
            {routes.map((route) => (
              <option key={route.id} value={route.id}>
                {route.departureLocation?.name} - {route.destinationLocation?.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13 }}>Xe</span>
          <select className="input" value={vehicleFilter} onChange={(event) => setVehicleFilter(event.target.value)}>
            <option value="">Tất cả</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.name} - {vehicle.licensePlate}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13 }}>Trạng thái</span>
          <select className="input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">Tất cả</option>
            {Object.entries(tripStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button
          className="button outline"
          type="button"
          onClick={() => {
            setSearchTerm("");
            setRouteFilter("");
            setVehicleFilter("");
            setStatusFilter("");
          }}
        >
          Xóa lọc
        </button>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Tuyến</th>
              <th>Xe</th>
              <th>Khởi hành</th>
              <th>Giá vé</th>
              <th>Ghế đã đặt</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrips.map((trip) => (
              <tr key={trip.id}>
                <td>
                  {trip.route?.departureLocation?.name} - {trip.route?.destinationLocation?.name}
                </td>
                <td>{trip.vehicle?.name}</td>
                <td>{formatDateTime(trip.departureTime)}</td>
                <td>{formatMoney(trip.priceVnd)}</td>
                <td>{trip._count?.bookingSeats ?? 0}</td>
                <td>{tripStatusLabels[trip.status] || trip.status}</td>
              </tr>
            ))}
            {filteredTrips.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 32 }}>
                  Chưa có chuyến xe nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
