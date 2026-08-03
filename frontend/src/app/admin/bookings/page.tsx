"use client";

import { useEffect, useState } from "react";
import { adminService } from "@/services/adminService";
import { formatMoney } from "@/lib/format";
import type { BookingDetail } from "@/services/types";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const loadBookings = async () => {
    try {
      setLoading(true);
      const res = await adminService.getBookings();
      setBookings(res.data.bookings);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Lỗi tải danh sách booking");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleCancel = async (bookingCode: string) => {
    if (!confirm(`Bạn có chắc muốn hủy vé ${bookingCode}?`)) return;
    try {
      setLoading(true);
      await adminService.cancelBooking(bookingCode);
      alert("Hủy vé thành công");
      loadBookings();
    } catch (err: any) {
      alert(err.message || "Lỗi khi hủy vé");
      setLoading(false);
    }
  };

  const filteredBookings = filter === "all" ? bookings : bookings.filter(b => b.status === filter);

  const statusMap: Record<string, { text: string; color: string; bg: string }> = {
    pending: { text: "Chờ TT", color: "#b97700", bg: "#fff3cd" },
    confirmed: { text: "Thành công", color: "#0052cc", bg: "#e8f0fe" },
    cancelled: { text: "Đã hủy", color: "#dc3545", bg: "#f8d7da" },
    expired: { text: "Hết hạn", color: "#dc3545", bg: "#f8d7da" },
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>Quản lý Booking</h1>
        <button className="button" onClick={loadBookings}>Làm mới</button>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <strong style={{ marginRight: 8 }}>Lọc theo:</strong>
          <select 
            className="input" 
            style={{ width: 200, height: 40 }} 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ thanh toán</option>
            <option value="confirmed">Đã thanh toán</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>
      </div>

      <div className="admin-table-container">
        {loading && bookings.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center" }}>Đang tải...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã Đơn</th>
                <th>Khách Hàng</th>
                <th>Chuyến Đi</th>
                <th>Ghế</th>
                <th>Tổng Tiền</th>
                <th>Trạng Thái</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map(b => {
                const route = b.bookingSeats[0]?.trip?.route;
                const status = statusMap[b.status];
                
                return (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 600, color: "var(--primary)" }}>{b.bookingCode}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{b.passengerName}</div>
                      <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>{b.passengerPhone}</div>
                    </td>
                    <td>
                      {route ? (
                        <>
                          <div style={{ fontWeight: 500 }}>{route.departureLocation.name} → {route.destinationLocation.name}</div>
                          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
                            {new Date(b.bookingSeats[0].trip.departureTime).toLocaleString("vi-VN")}
                          </div>
                        </>
                      ) : "---"}
                    </td>
                    <td>{b.bookingSeats.map(s => s.seat.seatCode).join(", ")}</td>
                    <td style={{ fontWeight: 600 }}>{formatMoney(b.totalFareVnd)}</td>
                    <td>
                      <span style={{ 
                        padding: "4px 8px", 
                        borderRadius: 4, 
                        fontSize: 12, 
                        fontWeight: 600,
                        color: status?.color || "#333",
                        background: status?.bg || "#eee"
                      }}>
                        {status?.text || b.status}
                      </span>
                    </td>
                    <td>
                      {(b.status === "pending" || b.status === "confirmed") && (
                        <button 
                          className="button danger" 
                          style={{ height: 28, minHeight: 28, fontSize: 12, padding: "0 8px" }}
                          onClick={() => handleCancel(b.bookingCode)}
                        >
                          Hủy vé
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
                    Không có dữ liệu
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
