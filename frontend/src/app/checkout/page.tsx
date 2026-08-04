"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useAuth } from "@/lib/auth-context";
import { formatMoney } from "@/lib/format";
import { bookingService } from "@/services/bookingService";
import { tripService } from "@/services/tripService";
import type { SeatItem, TripDetailItem } from "@/services/types";

type CheckoutLeg = {
  legType: "outbound" | "return";
  tripId: number;
  seatIds: number[];
};

type LegDetail = CheckoutLeg & {
  trip: TripDetailItem;
  seats: SeatItem[];
};

const paymentMethods = [
  {
    value: "cash",
    label: "Thanh toán tại quầy",
    description: "Giữ vé tạm thời, hành khách thanh toán khi đến bến hoặc lên xe.",
  },
  {
    value: "bank_transfer",
    label: "Chuyển khoản ngân hàng",
    description: "Mô phỏng chuyển khoản. Hệ thống sẽ xác nhận thanh toán ảo ngay sau khi đặt.",
  },
  {
    value: "e_wallet",
    label: "Ví điện tử",
    description: "Mô phỏng thanh toán qua ví điện tử như Momo/ZaloPay.",
  },
];

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
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0].value);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
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

    if (!paymentMethod) {
      setError("Vui lòng chọn phương thức thanh toán.");
      return;
    }

    if (!acceptedTerms) {
      setError("Vui lòng xác nhận đã đọc quy định và điều khoản trước khi thanh toán.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const selectedPayment = paymentMethods.find((method) => method.value === paymentMethod);
      alert(`Thanh toán ảo bằng phương thức: ${selectedPayment?.label ?? "Đã chọn"}.\nHệ thống sẽ tạo mã đặt vé demo.`);

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

  if (error && legDetails.length === 0) {
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
        <div>
          <form onSubmit={handleSubmit}>
            <div className="card">
              <h2 className="card-title">Thông tin khách hàng</h2>

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
            </div>

            <div className="card">
              <h2 className="card-title">Phương thức thanh toán</h2>
              <div style={{ display: "grid", gap: 12 }}>
                {paymentMethods.map((method) => (
                  <label
                    key={method.value}
                    style={{
                      display: "flex",
                      gap: 12,
                      padding: 14,
                      border: paymentMethod === method.value ? "1px solid var(--primary)" : "1px solid var(--line)",
                      borderRadius: 8,
                      background: paymentMethod === method.value ? "var(--primary-light)" : "white",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.value}
                      checked={paymentMethod === method.value}
                      onChange={(event) => setPaymentMethod(event.target.value)}
                      style={{ marginTop: 4 }}
                    />
                    <span>
                      <strong style={{ display: "block", marginBottom: 4 }}>{method.label}</strong>
                      <span style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.5 }}>{method.description}</span>
                    </span>
                  </label>
                ))}
              </div>
              <div className="message mt-4">
                Đây là thanh toán mô phỏng phục vụ demo luận văn. Hệ thống chưa kết nối cổng thanh toán thật.
              </div>
            </div>

            <div className="card">
              <h2 className="card-title">Thông tin khách hàng sẽ dùng trên vé</h2>
              <div className="summary-row">
                <span>Họ tên</span>
                <strong>{name || "---"}</strong>
              </div>
              <div className="summary-row">
                <span>Số điện thoại</span>
                <strong>{phone || "---"}</strong>
              </div>
              <div className="summary-row">
                <span>Email</span>
                <strong>{email || "---"}</strong>
              </div>
              <div className="summary-row">
                <span>Thanh toán</span>
                <strong>{paymentMethods.find((method) => method.value === paymentMethod)?.label || "---"}</strong>
              </div>
              <div className="message mt-4">
                Vui lòng kiểm tra đúng số điện thoại và email để nhận mã vé, thông tin thanh toán và hỗ trợ khi cần.
              </div>
            </div>
          </form>
        </div>

        <aside>
          <div className="card" style={{ position: "sticky", top: 90 }}>
            <h2 className="card-title">Thông tin vé</h2>
            <div className="message" style={{ marginBottom: 16 }}>
              {tripType === "round_trip" ? "Vé khứ hồi" : "Vé một chiều"}
            </div>

            {legDetails.map((leg) => (
              <div key={leg.legType} style={{ borderBottom: "1px solid var(--line)", marginBottom: 16, paddingBottom: 16 }}>
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
                  <span>Ghế</span>
                  <strong style={{ color: "var(--primary)" }}>{leg.seats.map((seat) => seat.seatCode).join(", ")}</strong>
                </div>
              </div>
            ))}

            <div className="summary-row">
              <span>Tổng số ghế</span>
              <strong>{totalSeats} ghế</strong>
            </div>
            <div className="summary-row">
              <span>Phương thức</span>
              <strong>{paymentMethods.find((method) => method.value === paymentMethod)?.label}</strong>
            </div>
            <div className="summary-row total">
              <span>Tổng tiền</span>
              <strong style={{ fontSize: 22, color: "var(--primary)" }}>{formatMoney(totalPrice)}</strong>
            </div>

            <div className="checkout-terms">
              <h3>Quy định và điều khoản</h3>
              <ul>
                <li>Hành khách cần có mặt trước giờ khởi hành tối thiểu 30 phút.</li>
                <li>Thông tin khách hàng và số điện thoại phải chính xác để nhận thông báo vé.</li>
                <li>Vé chưa thanh toán có thể hủy bất cứ lúc nào nếu xe chưa khởi hành.</li>
                <li>Vé đã thanh toán hủy trước giờ khởi hành từ 24 giờ trở lên được mô phỏng hoàn 90% tiền vé.</li>
                <li>Vé đã thanh toán hủy trước giờ khởi hành dưới 24 giờ hoặc xe đã khởi hành sẽ không được hủy.</li>
                <li>Ghế đã chọn sẽ được giữ sau khi đặt vé thành công và hoàn tất thanh toán.</li>
              </ul>
              <label className="terms-checkbox">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) => setAcceptedTerms(event.target.checked)}
                />
                <span>Tôi đã đọc và đồng ý với quy định, điều khoản đặt vé.</span>
              </label>
            </div>

            <button
              className="button"
              style={{ width: "100%", marginTop: 20, height: 48 }}
              onClick={handleSubmit}
              disabled={submitting || !acceptedTerms || !paymentMethod}
            >
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
