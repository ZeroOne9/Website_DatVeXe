"use client";

import { useEffect, useState } from "react";

import { formatMoney } from "@/lib/format";
import { partnerDashboardService } from "@/services/partnerDashboardService";

const bookingStatusLabels: Record<string, string> = {
  pending: "Chờ thanh toán",
  confirmed: "Đã thanh toán",
  cancelled: "Đã hủy",
  expired: "Đã hết hạn",
};

export default function PartnerDashboardPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    partnerDashboardService
      .getDashboard()
      .then((response) => setDashboard(response.data))
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Đang tải dashboard...</div>;
  if (!dashboard) return <div className="message error">Không thể tải dashboard nhà xe.</div>;

  const stats = dashboard.stats;

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Dashboard nhà xe</h1>
      <p style={{ color: "var(--muted)", marginBottom: 24 }}>
        {dashboard.busCompany?.name || "Nhà xe đối tác"}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
        <div className="card">
          <div style={{ color: "var(--muted)", marginBottom: 8 }}>Tổng xe</div>
          <strong style={{ fontSize: 28 }}>{stats.vehicles}</strong>
        </div>
        <div className="card">
          <div style={{ color: "var(--muted)", marginBottom: 8 }}>Tổng chuyến</div>
          <strong style={{ fontSize: 28 }}>{stats.trips}</strong>
        </div>
        <div className="card">
          <div style={{ color: "var(--muted)", marginBottom: 8 }}>Tổng booking</div>
          <strong style={{ fontSize: 28 }}>{stats.bookings}</strong>
        </div>
        <div className="card">
          <div style={{ color: "var(--muted)", marginBottom: 8 }}>Doanh thu đã xác nhận</div>
          <strong style={{ fontSize: 24, color: "var(--primary)" }}>{formatMoney(stats.revenue)}</strong>
        </div>
      </div>

      <h2 style={{ marginTop: 32, fontSize: 18 }}>Booking gần đây</h2>
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mã vé</th>
              <th>Hành khách</th>
              <th>Chuyến</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {dashboard.recentBookings.map((booking: any) => {
              const firstSeat = booking.bookingSeats?.[0];
              const trip = firstSeat?.trip;
              return (
                <tr key={booking.id}>
                  <td style={{ fontWeight: 700 }}>{booking.bookingCode}</td>
                  <td>{booking.passengerName}</td>
                  <td>
                    {trip?.route?.departureLocation?.name} - {trip?.route?.destinationLocation?.name}
                  </td>
                  <td>{formatMoney(booking.totalFareVnd)}</td>
                  <td>{bookingStatusLabels[booking.status] || booking.status}</td>
                </tr>
              );
            })}
            {dashboard.recentBookings.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: 32 }}>
                  Chưa có booking nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
