"use client";

import { useEffect, useState } from "react";

import { formatMoney } from "@/lib/format";
import { partnerDashboardService } from "@/services/partnerDashboardService";

export default function PartnerBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    partnerDashboardService
      .getBookings()
      .then((response) => setBookings(response.data.bookings))
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Dang tai booking...</div>;

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>Booking cua nha xe</h1>
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Ma ve</th>
              <th>Hanh khach</th>
              <th>So ghe</th>
              <th>Tong tien</th>
              <th>Trang thai</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td style={{ fontWeight: 700 }}>{booking.bookingCode}</td>
                <td>
                  <div>{booking.passengerName}</div>
                  <div style={{ color: "var(--muted)", fontSize: 13 }}>{booking.passengerPhone}</div>
                </td>
                <td>{booking.bookingSeats?.map((item: any) => item.seat?.seatCode).join(", ")}</td>
                <td>{formatMoney(booking.totalFareVnd)}</td>
                <td>{booking.status}</td>
              </tr>
            ))}
            {bookings.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: 32 }}>
                  Chua co booking nao
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
