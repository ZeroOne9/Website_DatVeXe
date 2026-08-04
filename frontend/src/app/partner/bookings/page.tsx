"use client";

import { useEffect, useMemo, useState } from "react";

import { formatMoney } from "@/lib/format";
import { partnerDashboardService } from "@/services/partnerDashboardService";

const bookingStatusLabels: Record<string, string> = {
  pending: "Chờ thanh toán",
  confirmed: "Đã thanh toán",
  cancelled: "Đã hủy",
  expired: "Đã hết hạn",
};

export default function PartnerBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filteredBookings = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return bookings.filter((booking) => {
      const seatCodes = booking.bookingSeats?.map((item: any) => item.seat?.seatCode).join(" ") || "";
      const searchable = `${booking.bookingCode} ${booking.passengerName || ""} ${booking.passengerPhone || ""} ${seatCodes}`.toLowerCase();
      return (!statusFilter || booking.status === statusFilter) && (!normalizedSearch || searchable.includes(normalizedSearch));
    });
  }, [bookings, searchTerm, statusFilter]);

  useEffect(() => {
    partnerDashboardService
      .getBookings()
      .then((response) => setBookings(response.data.bookings))
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Đang tải booking...</div>;

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>Booking của nhà xe</h1>
      <div
        className="card"
        style={{
          padding: 16,
          marginBottom: 16,
          display: "grid",
          gridTemplateColumns: "1fr 220px auto",
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
            placeholder="Mã vé, hành khách, số điện thoại..."
          />
        </label>
        <label>
          <span style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13 }}>Trạng thái</span>
          <select className="input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">Tất cả trạng thái</option>
            <option value="pending">Chờ thanh toán</option>
            <option value="confirmed">Đã thanh toán</option>
            <option value="cancelled">Đã hủy</option>
            <option value="expired">Đã hết hạn</option>
          </select>
        </label>
        <button
          className="button outline"
          type="button"
          onClick={() => {
            setSearchTerm("");
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
              <th>Mã vé</th>
              <th>Hành khách</th>
              <th>Số ghế</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.map((booking) => (
              <tr key={booking.id}>
                <td style={{ fontWeight: 700 }}>{booking.bookingCode}</td>
                <td>
                  <div>{booking.passengerName}</div>
                  <div style={{ color: "var(--muted)", fontSize: 13 }}>{booking.passengerPhone}</div>
                </td>
                <td>{booking.bookingSeats?.map((item: any) => item.seat?.seatCode).join(", ")}</td>
                <td>{formatMoney(booking.totalFareVnd)}</td>
                <td>{bookingStatusLabels[booking.status] || booking.status}</td>
              </tr>
            ))}
            {filteredBookings.length === 0 && (
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
