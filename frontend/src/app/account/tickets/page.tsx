"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { formatMoney } from "@/lib/format";
import { bookingService } from "@/services/bookingService";
import type { BookingDetail } from "@/services/types";

export default function MyTicketsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [bookings, setBookings] = useState<BookingDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login?redirect=/account/tickets");
      setLoading(false);
      return;
    }

    bookingService.getMyBookings()
      .then(res => setBookings(res.data.bookings))
      .catch(err => setError(err.message || "Lỗi khi tải danh sách vé."))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return <div className="page-shell"><div className="text-center" style={{padding: 40}}>Đang tải danh sách vé...</div></div>;
  }

  const statusMap = {
    pending: { text: "Chờ thanh toán", class: "status warning" },
    confirmed: { text: "Đã thanh toán", class: "status" },
    cancelled: { text: "Đã hủy", class: "status danger" },
    expired: { text: "Hết hạn", class: "status danger" }
  };

  function getEarliestDepartureTime(booking: BookingDetail) {
    const departureTimes = booking.bookingSeats
      .map((bookingSeat) => new Date(bookingSeat.trip.departureTime))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    return departureTimes[0] ?? null;
  }

  function getCancelMessage(booking: BookingDetail) {
    const earliestDepartureTime = getEarliestDepartureTime(booking);

    if (!earliestDepartureTime) {
      return "Không xác định được giờ khởi hành của vé này.";
    }

    if (earliestDepartureTime <= new Date()) {
      return "Xe đã khởi hành, không thể hủy vé.";
    }

    if (booking.status === "pending") {
      return "Vé chưa thanh toán có thể hủy bất cứ lúc nào. Bạn có chắc muốn hủy vé này?";
    }

    const hoursBeforeDeparture = (earliestDepartureTime.getTime() - Date.now()) / (60 * 60 * 1000);

    if (booking.status === "confirmed" && hoursBeforeDeparture < 24) {
      return "Vé đã thanh toán chỉ được hủy trước giờ khởi hành tối thiểu 24 giờ. Vé này không đủ điều kiện hủy.";
    }

    const refundAmount = Math.floor(booking.totalFareVnd * 0.9);
    const feeAmount = booking.totalFareVnd - refundAmount;

    return `Vé đã thanh toán và còn trước giờ khởi hành ít nhất 24 giờ.\n\nHệ thống sẽ mô phỏng hoàn ${formatMoney(refundAmount)} (90% tiền vé), phí hủy ${formatMoney(feeAmount)} (10%).\n\nBạn có chắc muốn hủy vé này?`;
  }

  async function handleCancel(e: React.MouseEvent, booking: BookingDetail) {
    e.preventDefault();
    e.stopPropagation();

    const cancelMessage = getCancelMessage(booking);
    if (cancelMessage.includes("không thể hủy") || cancelMessage.includes("không đủ điều kiện")) {
      alert(cancelMessage);
      return;
    }

    if (!confirm(cancelMessage)) {
      return;
    }
    
    try {
      setLoading(true);
      await bookingService.cancelBooking(booking.bookingCode);
      if (booking.status === "confirmed") {
        alert(`Hủy vé thành công! Đây là thanh toán mô phỏng, hệ thống ghi nhận hoàn 90% tiền vé: ${formatMoney(Math.floor(booking.totalFareVnd * 0.9))}.`);
      } else {
        alert("Hủy vé thành công!");
      }
      const res = await bookingService.getMyBookings();
      setBookings(res.data.bookings);
    } catch (err: any) {
      alert(err.message || "Không thể hủy vé.");
    } finally {
      setLoading(false);
    }
  }

  const filteredBookings = filter === "all" ? bookings : bookings.filter(b => b.status === filter);

  return (
    <div className="page-shell">
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <h1 style={{ fontSize: 24, marginBottom: 24 }}>Vé của tôi</h1>
        
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, overflowX: 'auto', paddingBottom: 8 }}>
          <button 
            className={filter === 'all' ? 'button' : 'button outline'} 
            onClick={() => setFilter('all')}
            style={{ borderRadius: 20, height: 36, fontSize: 14, borderColor: filter !== 'all' ? '#ccc' : undefined, color: filter !== 'all' ? 'var(--text)' : undefined }}
          >
            Tất cả
          </button>
          <button 
            className={filter === 'pending' ? 'button warning' : 'button outline'} 
            onClick={() => setFilter('pending')}
            style={{ borderRadius: 20, height: 36, fontSize: 14, borderColor: filter !== 'pending' ? '#ccc' : undefined, color: filter !== 'pending' ? 'var(--text)' : undefined }}
          >
            Chờ thanh toán
          </button>
          <button 
            className={filter === 'confirmed' ? 'button' : 'button outline'} 
            onClick={() => setFilter('confirmed')}
            style={{ borderRadius: 20, height: 36, fontSize: 14, borderColor: filter !== 'confirmed' ? '#ccc' : undefined, color: filter !== 'confirmed' ? 'var(--text)' : undefined }}
          >
            Đã thanh toán
          </button>
          <button 
            className={filter === 'cancelled' ? 'button danger' : 'button outline'} 
            onClick={() => setFilter('cancelled')}
            style={{ borderRadius: 20, height: 36, fontSize: 14, borderColor: filter !== 'cancelled' ? '#ccc' : undefined, color: filter !== 'cancelled' ? 'var(--text)' : undefined }}
          >
            Đã hủy
          </button>
          <button 
            className={filter === 'expired' ? 'button danger' : 'button outline'} 
            onClick={() => setFilter('expired')}
            style={{ borderRadius: 20, height: 36, fontSize: 14, borderColor: filter !== 'expired' ? '#ccc' : undefined, color: filter !== 'expired' ? 'var(--text)' : undefined }}
          >
            Het han
          </button>
        </div>

        {error && <div className="message error mb-4">{error}</div>}

        {filteredBookings.length === 0 && !error ? (
          <div className="card" style={{ padding: "40px 20px", textAlign: "center" }}>
            <div style={{ color: "var(--muted)", marginBottom: 16 }}>Không có vé nào phù hợp.</div>
            <Link href="/" className="button">Tìm chuyến ngay</Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {filteredBookings.map(booking => {
              const firstSeat = booking.bookingSeats?.[0];
              const route = firstSeat?.trip?.route;
              
              return (
                <Link href={`/tickets/lookup?bookingCode=${booking.bookingCode}`} key={booking.id} style={{ textDecoration: "none" }}>
                  <div className="card trip-card-v2" style={{ marginBottom: 0 }}>
                    <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 600, color: "var(--text)" }}>Mã vé: <span style={{color: "var(--primary)"}}>{booking.bookingCode}</span></span>
                      <span className={statusMap[booking.status]?.class}>{statusMap[booking.status]?.text}</span>
                    </div>
                    <div style={{ padding: "20px" }}>
                      {route && (
                        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: "var(--text)" }}>
                          {route.departureLocation.name} - {route.destinationLocation.name}
                        </div>
                      )}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                        <div style={{ color: "var(--muted)", fontSize: 14 }}>
                          <div style={{ marginBottom: 4 }}>
                            Khởi hành: <strong style={{color: "var(--text)"}}>{firstSeat ? new Date(firstSeat.trip.departureTime).toLocaleString("vi-VN") : "---"}</strong>
                          </div>
                          <div>
                            Ghế ({booking.bookingSeats?.length || 0}): <strong style={{color: "var(--text)"}}>{booking.bookingSeats?.map(s => s.seat.seatCode).join(", ")}</strong>
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--primary)" }}>
                            {formatMoney(booking.totalFareVnd)}
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            {booking.status === "pending" && (
                              <button
                                className="button"
                                style={{ height: 32, fontSize: 13, padding: "0 16px" }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  router.push(`/tickets/lookup?bookingCode=${booking.bookingCode}`);
                                }}
                              >
                                Thanh toán
                              </button>
                            )}
                            {(booking.status === "pending" || booking.status === "confirmed") && (
                              <button
                                className="button outline"
                                style={{ height: 32, fontSize: 13, padding: "0 12px", color: "var(--red)", borderColor: "var(--red)" }}
                                onClick={(e) => handleCancel(e, booking)}
                              >
                                Hủy vé
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
