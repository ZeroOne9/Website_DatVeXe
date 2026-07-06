"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { formatDateTime, formatMoney } from "@/lib/format";
import { tripService } from "@/services/tripService";
import type { TripSearchItem, SeatItem, TripDetailItem } from "@/services/types";

/* ───── Inline Seat Picker (mở rộng bên trong card) ───── */
function InlineSeatPicker({
  tripId,
  priceVnd,
  onClose,
  onContinue,
}: {
  tripId: number;
  priceVnd: number;
  onClose: () => void;
  onContinue: (seatIds: number[]) => void;
}) {
  const [seats, setSeats] = useState<SeatItem[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<SeatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    tripService
      .getSeats(tripId)
      .then((res) => setSeats(res.data.seats))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [tripId]);

  if (loading) return <div className="seat-panel-loading">Đang tải sơ đồ ghế...</div>;
  if (error) return <div className="message error">{error}</div>;

  const floors = Array.from(new Set(seats.map((s) => s.floor))).sort((a, b) => a - b);
  
  function handleToggleSeat(seat: SeatItem) {
    if (selectedSeats.find(s => s.id === seat.id)) {
      setSelectedSeats(prev => prev.filter(s => s.id !== seat.id));
    } else {
      if (selectedSeats.length >= 6) {
        alert("Chỉ được chọn tối đa 6 ghế");
        return;
      }
      setSelectedSeats(prev => [...prev, seat]);
    }
  }

  return (
    <div className="seat-expand-panel">
      {/* Stepper */}
      <div className="seat-stepper">
        <div className="step active">
          <span className="step-num">1</span> Chỗ mong muốn
        </div>
        <div className="step">
          <span className="step-num">2</span> Điểm đón trả
        </div>
        <button className="close-expand" onClick={onClose} title="Đóng">✕</button>
      </div>

      <div className="seat-picker-body">
        {/* Legend */}
        <div className="seat-legend-col">
          <h4>Chú thích</h4>
          <div className="legend-row">
            <div className="legend-icon unavailable"></div>
            <span>Không bán</span>
          </div>
          <div className="legend-row">
            <div className="legend-icon selected"></div>
            <span>Đang chọn</span>
          </div>
          <div className="legend-row">
            <div className="legend-icon available"></div>
            <span>Còn trống</span>
          </div>

          {selectedSeats.length > 0 && (
            <div className="selected-summary">
              <div>Ghế đã chọn:</div>
              <strong className="selected-code">{selectedSeats.map(s => s.seatCode).join(", ")}</strong>
            </div>
          )}
        </div>

        {/* Seat map */}
        <div className="seat-floors-inline">
          {floors.map((floor) => (
            <div key={floor} className="seat-floor-col">
              <h4 className="floor-label">Tầng {floor === 1 ? "dưới" : "trên"}</h4>
              <div className="seat-bus-frame">
                <div className="bus-steering">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                </div>
                <div className="seat-grid-inline">
                  {seats
                    .filter((s) => s.floor === floor)
                    .map((seat) => {
                      const isSelected = selectedSeats.find(s => s.id === seat.id);
                      let cls = "seat-cell";
                      if (!seat.isAvailable) cls += " sold";
                      else if (isSelected) cls += " picked";

                      return (
                        <button
                          key={seat.id}
                          className={cls}
                          disabled={!seat.isAvailable}
                          onClick={() => handleToggleSeat(seat)}
                          title={seat.seatCode}
                        >
                          {seat.seatCode}
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div className="seat-expand-footer">
        <div className="total-display">
          Tổng cộng: <strong>{selectedSeats.length > 0 ? formatMoney(priceVnd * selectedSeats.length) : "0đ"}</strong>
        </div>
        <button
          className="button"
          disabled={selectedSeats.length === 0}
          onClick={() => selectedSeats.length > 0 && onContinue(selectedSeats.map(s => s.id))}
        >
          Tiếp tục
        </button>
      </div>
    </div>
  );
}

/* ───── Trip Card ───── */
function TripCard({
  trip,
  isExpanded,
  onToggle,
  searchParams,
  isReturnSelection,
}: {
  trip: TripSearchItem;
  isExpanded: boolean;
  onToggle: () => void;
  searchParams: string;
  isReturnSelection: boolean;
}) {
  const router = useRouter();

  function handleContinue(seatIds: number[]) {
    const q = new URLSearchParams(searchParams);

    if (q.get("returnDate") && !isReturnSelection) {
      const nextQuery = new URLSearchParams({
        departureLocationId: q.get("destinationLocationId") ?? "",
        destinationLocationId: q.get("departureLocationId") ?? "",
        date: q.get("returnDate") ?? "",
        returnDate: q.get("returnDate") ?? "",
        selecting: "return",
        outboundTripId: String(trip.id),
        outboundSeatIds: seatIds.join(","),
      });

      router.push(`/trips?${nextQuery.toString()}`);
      return;
    }

    if (isReturnSelection) {
      q.set("returnTripId", String(trip.id));
      q.set("returnSeatIds", seatIds.join(","));
      q.set("tripType", "round_trip");
      router.push(`/checkout?${q.toString()}`);
      return;
    }

    q.set("tripId", String(trip.id));
    q.set("seatIds", seatIds.join(","));
    q.set("tripType", "one_way");
    router.push(`/checkout?${q.toString()}`);
  }

  return (
    <article className={`trip-card-v2 ${isExpanded ? "expanded" : ""}`}>
      <div className="trip-card-top-layout">
        <div className="trip-card-image">
          <div className="image-tag">Xe Xịn</div>
          <img src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=400&q=80" alt="Bus" />
        </div>
        
        <div className="trip-card-main-content">
          <div className="trip-card-header">
            <div className="company-info-inline">
              <span className="company-name">{trip.vehicle.busCompany.name}</span>
              <span className="rating-badge">★ 4.8 (10118)</span>
            </div>
            <div className="price-info">
              <div className="price-display">Từ {formatMoney(trip.priceVnd)}</div>
            </div>
          </div>
          
          <div className="bus-type-text">{trip.vehicle.vehicleType}</div>

          <div className="trip-card-body-row">
            <div className="trip-info">
              <div className="time-line">
                <div className="time-dot"></div>
                <div className="time-path"></div>
                <div className="time-dot end"></div>
              </div>
              <div className="time-details">
                <div className="time-row">
                  <span className="time-text">
                    {new Date(trip.departureTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="location-text">• {trip.route.departureLocation.name}</span>
                </div>
                <div className="duration-text">
                  {trip.route.estimatedMinutes
                    ? `${Math.floor(trip.route.estimatedMinutes / 60)}h${trip.route.estimatedMinutes % 60}m`
                    : ""}
                </div>
                <div className="time-row">
                  <span className="time-text">
                    {trip.arrivalTime
                      ? new Date(trip.arrivalTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
                      : "---"}
                  </span>
                  <span className="location-text">• {trip.route.destinationLocation.name}</span>
                </div>
              </div>
            </div>

            <div className="action-col">
              <div className="seat-status-red">
                {trip.availableSeatCount > 0
                  ? `Chỉ còn ${trip.availableSeatCount} chỗ trống`
                  : "Hết chỗ"}
              </div>
              <button
                className={isExpanded ? "button outline-primary" : "button"}
                onClick={onToggle}
                disabled={trip.availableSeatCount === 0}
                style={{marginTop: 12}}
              >
                {isExpanded ? "Đóng" : "Chọn chuyến"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded seat picker */}
      {isExpanded && (
        <InlineSeatPicker
          tripId={trip.id}
          priceVnd={trip.priceVnd}
          onClose={onToggle}
          onContinue={handleContinue}
        />
      )}
    </article>
  );
}

/* ───── Main Page ───── */
function TripsContent() {
  const searchParams = useSearchParams();
  const [trips, setTrips] = useState<TripSearchItem[]>([]);
  const [message, setMessage] = useState("Đang tải danh sách chuyến...");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const params = useMemo(
    () => ({
      departureLocationId: searchParams.get("departureLocationId") ?? "",
      destinationLocationId: searchParams.get("destinationLocationId") ?? "",
      date: searchParams.get("date") ?? "",
      returnDate: searchParams.get("returnDate") ?? "",
      selecting: searchParams.get("selecting") ?? "outbound",
    }),
    [searchParams]
  );

  const isReturnSelection = params.selecting === "return";

  useEffect(() => {
    if (!params.departureLocationId || !params.destinationLocationId || !params.date) {
      setMessage("Thiếu thông tin tìm kiếm. Vui lòng quay lại trang chủ.");
      setLoading(false);
      return;
    }

    tripService
      .searchTrips(params)
      .then((response) => {
        setTrips(response.data.trips);
        setMessage(response.data.trips.length ? "" : "Chưa có chuyến phù hợp với ngày đã chọn.");
      })
      .catch((error: Error) => setMessage(error.message))
      .finally(() => setLoading(false));
  }, [params]);

  return (
    <section className="page-shell">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, margin: 0 }}>Kết quả tìm kiếm</h1>
          <p style={{ color: "var(--muted)", margin: "6px 0 0" }}>
            {isReturnSelection ? "Đang chọn chuyến về" : "Đang chọn chuyến đi"}: {params.date || "Chưa chọn"}
            {params.returnDate && !isReturnSelection ? ` — Có ngày về: ${params.returnDate}` : ""}
          </p>
        </div>
      </div>

      <div className="two-column-layout">
        {/* Filter Sidebar */}
        <aside className="filter-sidebar">
          <div className="filter-section">
            <div className="filter-title">Giờ đi</div>
            <label className="filter-option"><input type="checkbox" /> Sáng sớm 00:00 - 06:00</label>
            <label className="filter-option"><input type="checkbox" /> Buổi sáng 06:00 - 12:00</label>
            <label className="filter-option"><input type="checkbox" /> Buổi chiều 12:00 - 18:00</label>
            <label className="filter-option"><input type="checkbox" /> Buổi tối 18:00 - 24:00</label>
          </div>
          <div className="filter-section">
            <div className="filter-title">Loại xe</div>
            <label className="filter-option"><input type="checkbox" /> Ghế ngồi</label>
            <label className="filter-option"><input type="checkbox" /> Giường nằm</label>
            <label className="filter-option"><input type="checkbox" /> Limousine</label>
          </div>
          <div className="filter-section">
            <div className="filter-title">Sắp xếp giá</div>
            <label className="filter-option"><input type="radio" name="price" defaultChecked /> Mặc định</label>
            <label className="filter-option"><input type="radio" name="price" /> Tăng dần</label>
            <label className="filter-option"><input type="radio" name="price" /> Giảm dần</label>
          </div>
        </aside>

        {/* Trip list */}
        <main>
          {message ? <div className={`message ${loading ? "" : "error"}`}>{message}</div> : null}

          <div className="trip-list">
            {trips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                isExpanded={expandedId === trip.id}
                onToggle={() => setExpandedId(expandedId === trip.id ? null : trip.id)}
                searchParams={searchParams.toString()}
                isReturnSelection={isReturnSelection}
              />
            ))}
          </div>
        </main>
      </div>
    </section>
  );
}

export default function TripsPage() {
  return (
    <Suspense fallback={<section className="page-shell"><div className="message">Đang tải danh sách chuyến...</div></section>}>
      <TripsContent />
    </Suspense>
  );
}
