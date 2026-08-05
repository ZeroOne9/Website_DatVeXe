"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { formatMoney } from "@/lib/format";
import { tripService } from "@/services/tripService";
import type { SeatItem, TripDetailItem } from "@/services/types";

export default function SeatSelectionPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [trip, setTrip] = useState<TripDetailItem | null>(null);
  const [seats, setSeats] = useState<SeatItem[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<SeatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    tripService
      .getSeats(Number(id))
      .then((response) => {
        setTrip(response.data.trip);
        setSeats(response.data.seats);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page-shell"><div className="message">Đang tải sơ đồ ghế...</div></div>;
  if (error || !trip) return <div className="page-shell"><div className="message error">{error || "Không tìm thấy chuyến."}</div></div>;

  // Group seats by floor
  const floors = Array.from(new Set(seats.map(s => s.floor))).sort((a, b) => a - b);
  const totalPrice = trip.priceVnd * selectedSeats.length;

  function toggleSeat(seat: SeatItem) {
    setSelectedSeats((current) => {
      if (current.some((item) => item.id === seat.id)) {
        return current.filter((item) => item.id !== seat.id);
      }

      if (current.length >= 6) {
        alert("Chỉ được chọn tối đa 6 ghế");
        return current;
      }

      return [...current, seat];
    });
  }

  function handleContinue() {
    if (selectedSeats.length === 0) return;
    const q = new URLSearchParams(searchParams.toString());
    q.set("tripId", String(trip!.id));
    q.set("seatIds", selectedSeats.map((seat) => seat.id).join(","));
    router.push(`/checkout?${q.toString()}`);
  }

  return (
    <div style={{minHeight: '100vh', display: 'flex', flexDirection: 'column'}}>
      <section className="page-shell" style={{flexGrow: 1}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24}}>
          <div>
            <h1 style={{fontSize: 24, margin: 0}}>Chọn ghế chuyến xe</h1>
            <p style={{color: 'var(--muted)', margin: '8px 0 0'}}>{trip.route.departureLocation.name} đi {trip.route.destinationLocation.name} • {trip.vehicle.busCompany.name}</p>
          </div>
          <Link className="button secondary" href={`/trips?${searchParams.toString()}`}>
            Đổi chuyến khác
          </Link>
        </div>

        <div className="card">
          <div className="card-title">Sơ đồ ghế</div>

          <div className="seat-legend">
            <div className="legend-item"><div className="legend-box available"></div> Trống</div>
            <div className="legend-item"><div className="legend-box selected"></div> Đang chọn</div>
            <div className="legend-item"><div className="legend-box unavailable"></div> Đã bán</div>
          </div>

          <div className="seat-floors-container">
            {floors.map(floor => (
              <div key={floor} className="seat-floor">
                <div className="floor-title">Tầng {floor}</div>
                <div className="seat-grid">
                  {seats.filter(s => s.floor === floor).map(seat => {
                    const isSelected = selectedSeats.some((item) => item.id === seat.id);
                    const cssClass = !seat.isAvailable ? "seat-btn unavailable" : isSelected ? "seat-btn selected" : "seat-btn";
                    return (
                      <button
                        key={seat.id}
                        className={cssClass}
                        disabled={!seat.isAvailable}
                        onClick={() => toggleSeat(seat)}
                        title={seat.seatCode}
                      >
                        {seat.seatCode}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sticky Bottom Bar */}
      <div className="bottom-bar">
        <div className="bottom-bar-content">
          <div className="selected-seats-info">
            {selectedSeats.length > 0 ? (
              <>
                <div style={{fontSize: 14, color: 'var(--muted)'}}>Ghế đã chọn: <strong style={{color: 'var(--primary)', fontSize: 16}}>{selectedSeats.map((seat) => seat.seatCode).join(", ")}</strong></div>
                <div style={{fontSize: 20, fontWeight: 700}}>Tổng cộng: {formatMoney(totalPrice)}</div>
              </>
            ) : (
              <div style={{fontSize: 16, color: 'var(--muted)'}}>Vui lòng chọn ghế để tiếp tục</div>
            )}
          </div>
          <button 
            className="button" 
            style={{height: 48, minWidth: 160}} 
            disabled={selectedSeats.length === 0} 
            onClick={handleContinue}
          >
            Tiếp tục
          </button>
        </div>
      </div>
    </div>
  );
}
