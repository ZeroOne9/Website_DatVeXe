"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { formatMoney } from "@/lib/format";
import { tripService } from "@/services/tripService";
import { bookingService } from "@/services/bookingService";
import type { TripDetailItem, SeatItem } from "@/services/types";

type CheckoutLeg = {
  legType: "outbound" | "return";
  tripId: number;
  seatIds: number[];
};

type LegDetail = CheckoutLeg & {
  trip: TripDetailItem;
  seats: SeatItem[];
};

function parseSeatIds(value: string | null) {
  return value
    ? value
        .split(",")
        .map(Number)
        .filter((id) => Number.isInteger(id) && id > 0)
    : [];
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const legs = useMemo<CheckoutLeg[]>(() => {
    const legacyTripId = Number(searchParams.get("tripId"));
    const outboundTripId = Number(searchParams.get("outboundTripId") ?? legacyTripId);
    const returnTripId = Number(searchParams.get("returnTripId"));
    const outboundSeatIds = parseSeatIds(searchParams.get("outboundSeatIds") ?? searchParams.get("seatIds"));
    const returnSeatIds = parseSeatIds(searchParams.get("returnSeatIds"));
    const nextLegs: CheckoutLeg[] = [];

    if (outboundTripId && outboundSeatIds.length) {
      nextLegs.push({ legType: "outbound", tripId: outboundTripId, seatIds: outboundSeatIds });
    }

    if (returnTripId && returnSeatIds.length) {
      nextLegs.push({ legType: "return", tripId: returnTripId, seatIds: returnSeatIds });
    }

    return nextLegs;
  }, [searchParams]);

  const tripType: "one_way" | "round_trip" = legs.some((leg) => leg.legType === "return")
    ? "round_trip"
    : "one_way";

  const [legDetails, setLegDetails] = useState<LegDetail[]>([]);
  const [name, setName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (legs.length === 0) {
      setError("Thông tin đặt vé không hợp lệ.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    Promise.all(
      legs.map(async (leg) => {
        const res = await tripService.getSeats(leg.tripId);
        const selectedSeats = res.data.seats.filter((seat) => leg.seatIds.includes(seat.id));

        if (selectedSeats.length !== leg.seatIds.length) {
          throw new Error("Không tìm thấy đầy đủ ghế đã chọn.");
        }

        return {
          ...leg,
          trip: res.data.trip,
          seats: selectedSeats,
        };
      }),
    )
      .then(setLegDetails)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [legs]);

  useEffect(() => {
    if (user) {
      if (!name) setName(user.fullName);
      if (!phone && user.phone) setPhone(user.phone);
      if (!email) setEmail(user.email);
    }
  }, [email, name, phone, user]);

  async function handleSubmit(e?: React.FormEvent | React.MouseEvent) {
    e?.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await bookingService.createBooking({
        tripType,
        legs: legs.map((leg) => ({
          legType: leg.legType,
          tripId: leg.tripId,
          seatIds: leg.seatIds,
        })),
        passengerName: name,
        passengerPhone: phone,
        passengerEmail: email || undefined,
      });
      router.push(`/tickets/lookup?bookingCode=${res.data.booking.bookingCode}`);
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi tạo đơn hàng.");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="page-shell">
        <div className="message">Đang tải thông tin đơn hàng...</div>
      </div>
    );
  }

  if (error || legDetails.length === 0) {
    return (
      <div className="page-shell">
        <div className="message error">{error}</div>
      </div>
    );
  }

  const totalSeats = legDetails.reduce((sum, leg) => sum + leg.seats.length, 0);
  const totalPrice = legDetails.reduce((sum, leg) => sum + leg.trip.priceVnd * leg.seats.length, 0);

  return (
    <div className="page-shell">
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>Xác nhận thông tin đặt vé</h1>

      <div className="checkout-layout">
        <form onSubmit={handleSubmit}>
          <div className="card">
            <h2 className="card-title">Thông tin hành khách</h2>

            {error && <div className="message error mb-4">{error}</div>}

            <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className="field">
                <label>Họ và tên *</label>
                <div className="field-input-wrapper">
                  <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên người đi" />
                </div>
              </div>
              <div className="field">
                <label>Số điện thoại *</label>
                <div className="field-input-wrapper">
                  <input
                    required
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Số điện thoại liên hệ"
                  />
                </div>
              </div>
              <div className="field" style={{ gridColumn: "1 / span 2" }}>
                <label>Email nhận vé</label>
                <div className="field-input-wrapper">
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
                </div>
              </div>
            </div>

            <div className="message mt-4">
              <strong>Lưu ý:</strong> Vui lòng kiểm tra thông tin hành khách, chuyến xe và ghế trước khi thanh toán.
            </div>
          </div>
        </form>

        <aside>
          <div className="card" style={{ position: "sticky", top: 90 }}>
            <h2 className="card-title">Tóm tắt đơn hàng</h2>
            <div className="message" style={{ marginBottom: 16 }}>
              {tripType === "round_trip" ? "Vé khứ hồi" : "Vé một chiều"}
            </div>

            {legDetails.map((leg) => (
              <div key={leg.legType} style={{ borderBottom: "1px solid var(--border)", marginBottom: 16, paddingBottom: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>
                  {leg.legType === "outbound" ? "Chiều đi" : "Chiều về"}: {leg.trip.route.departureLocation.name} -{" "}
                  {leg.trip.route.destinationLocation.name}
                </div>
                <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 10 }}>
                  {leg.trip.vehicle.busCompany.name} - {leg.trip.vehicle.vehicleType}
                </div>
                <div className="summary-row">
                  <span>Ngày đi</span>
                  <strong>{new Date(leg.trip.departureTime).toLocaleDateString("vi-VN")}</strong>
                </div>
                <div className="summary-row">
                  <span>Giờ đi</span>
                  <strong>{new Date(leg.trip.departureTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</strong>
                </div>
                <div className="summary-row">
                  <span>Ghe</span>
                  <strong style={{ color: "var(--primary)" }}>{leg.seats.map((seat) => seat.seatCode).join(", ")}</strong>
                </div>
              </div>
            ))}

            <div className="summary-row">
              <span>Tổng số ghế</span>
              <strong>{totalSeats} ghế</strong>
            </div>
            <div className="summary-row total">
              <span>Tổng tiền</span>
              <strong style={{ fontSize: 22, color: "var(--primary)" }}>{formatMoney(totalPrice)}</strong>
            </div>

            <button className="button" style={{ width: "100%", marginTop: 24, height: 48 }} onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Đang xử lý..." : "Thanh toán"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="page-shell"><div className="message">Đang tải...</div></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
