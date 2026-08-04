"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { locationService } from "@/services/locationService";
import type { LocationItem } from "@/services/types";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getPassengerLocationLabel(location: LocationItem) {
  const normalizedName = normalizeText(location.name);
  const normalizedProvince = normalizeText(location.province);

  if (normalizedName.includes("da lat")) return "Đà Lạt";
  if (normalizedName.includes("nha trang")) return "Nha Trang";
  if (normalizedName.includes("vung tau")) return "Vũng Tàu";
  if (normalizedName.includes("phan thiet")) return "Phan Thiết";
  if (normalizedName.includes("mien dong")) return "TP. Hồ Chí Minh";
  if (normalizedName.includes("mien tay")) return "TP. Hồ Chí Minh";
  if (normalizedProvince.includes("ha noi")) return "Hà Nội";
  if (normalizedProvince.includes("da nang")) return "Đà Nẵng";
  if (normalizedProvince.includes("hue") || normalizedProvince.includes("thua thien")) return "Huế";
  if (normalizedProvince.includes("can tho")) return "Cần Thơ";

  return location.province;
}

const popularRoutes = [
  {
    from: "TP. Hồ Chí Minh",
    to: "Đà Lạt",
    price: "320.000đ",
    departureLabel: "TP. Hồ Chí Minh",
    destinationLabel: "Đà Lạt",
    img: "https://images.unsplash.com/photo-1518002054494-3a6f94352e9d?auto=format&fit=crop&w=600&q=80",
  },
  {
    from: "TP. Hồ Chí Minh",
    to: "Nha Trang",
    price: "400.000đ",
    departureLabel: "TP. Hồ Chí Minh",
    destinationLabel: "Nha Trang",
    img: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=600&q=80",
  },
  {
    from: "TP. Hồ Chí Minh",
    to: "Vũng Tàu",
    price: "120.000đ",
    departureLabel: "TP. Hồ Chí Minh",
    destinationLabel: "Vũng Tàu",
    img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
  },
  {
    from: "TP. Hồ Chí Minh",
    to: "Phan Thiết",
    price: "220.000đ",
    departureLabel: "TP. Hồ Chí Minh",
    destinationLabel: "Phan Thiết",
    img: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80",
  },
  {
    from: "TP. Hồ Chí Minh",
    to: "Cần Thơ",
    price: "180.000đ",
    departureLabel: "TP. Hồ Chí Minh",
    destinationLabel: "Cần Thơ",
    img: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=600&q=80",
  },
  {
    from: "Đà Nẵng",
    to: "Huế",
    price: "150.000đ",
    departureLabel: "Đà Nẵng",
    destinationLabel: "Huế",
    img: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=600&q=80",
  },
  {
    from: "Hà Nội",
    to: "Đà Nẵng",
    price: "620.000đ",
    departureLabel: "Hà Nội",
    destinationLabel: "Đà Nẵng",
    img: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=600&q=80",
  },
  {
    from: "Đà Nẵng",
    to: "Hà Nội",
    price: "620.000đ",
    departureLabel: "Đà Nẵng",
    destinationLabel: "Hà Nội",
    img: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80",
  },
];

export default function HomePage() {
  const router = useRouter();
  const minDate = useMemo(() => today(), []);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [departureLocationId, setDepartureLocationId] = useState("");
  const [destinationLocationId, setDestinationLocationId] = useState("");
  const [date, setDate] = useState(minDate);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const passengerLocations = useMemo(() => {
    const seenLabels = new Set<string>();

    return locations.filter((location) => {
      const label = getPassengerLocationLabel(location);
      if (seenLabels.has(label)) return false;
      seenLabels.add(label);
      return true;
    });
  }, [locations]);

  useEffect(() => {
    locationService
      .getLocations()
      .then((response) => {
        const nextLocations = response.data.locations;
        const defaultDeparture =
          nextLocations.find((location) => normalizeText(location.name).includes("mien dong")) ?? nextLocations[0];
        const defaultDestination =
          nextLocations.find((location) => normalizeText(location.name).includes("da lat")) ??
          nextLocations.find((location) => location.id !== defaultDeparture?.id) ??
          nextLocations[1];

        setLocations(nextLocations);
        setDepartureLocationId(String(defaultDeparture?.id ?? ""));
        setDestinationLocationId(String(defaultDestination?.id ?? ""));
      })
      .catch((error: Error) => setMessage(error.message))
      .finally(() => setLoading(false));
  }, []);

  function getLocationLabelById(locationId: string) {
    const location = locations.find((item) => String(item.id) === locationId);
    return location ? getPassengerLocationLabel(location) : "";
  }

  function goToTrips(nextDepartureLocationId: string, nextDestinationLocationId: string, nextDate?: string) {
    const departureLocationLabel = getLocationLabelById(nextDepartureLocationId);
    const destinationLocationLabel = getLocationLabelById(nextDestinationLocationId);
    const query = new URLSearchParams({
      departureLocationId: nextDepartureLocationId,
      destinationLocationId: nextDestinationLocationId,
    });

    if (nextDate) query.set("date", nextDate);
    if (departureLocationLabel) query.set("departureLocationLabel", departureLocationLabel);
    if (destinationLocationLabel) query.set("destinationLocationLabel", destinationLocationLabel);

    router.push(`/trips?${query.toString()}`);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!departureLocationId || !destinationLocationId || !date) {
      setMessage("Vui lòng chọn đầy đủ điểm đi, điểm đến và ngày đi.");
      return;
    }

    if (departureLocationId === destinationLocationId) {
      setMessage("Điểm đi và điểm đến phải khác nhau.");
      return;
    }

    goToTrips(departureLocationId, destinationLocationId, date);
  }

  function handlePopularRouteClick(route: (typeof popularRoutes)[number]) {
    const departure = passengerLocations.find(
      (location) => normalizeText(getPassengerLocationLabel(location)) === normalizeText(route.departureLabel),
    );
    const destination = passengerLocations.find(
      (location) => normalizeText(getPassengerLocationLabel(location)) === normalizeText(route.destinationLabel),
    );

    if (!departure || !destination) {
      setMessage("Không tìm thấy địa điểm tương ứng với tuyến đường này.");
      return;
    }

    goToTrips(String(departure.id), String(destination.id));
  }

  return (
    <>
      <div className="hero-banner">
        <div className="hero-content">
          <h1>Đặt Vé Xe - Hỗ trợ đặt vé xe khách trực tuyến</h1>
          <p>Tìm chuyến, chọn ghế, đặt vé xe khách dễ dàng.</p>
        </div>
      </div>

      <div className="search-widget">
        <div className="search-tabs">
          <div className="search-tab active">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M4 16l2-8h12l2 8M4 16H2M22 16h-2M8 19v2M16 19v2M6 8V6a2 2 0 012-2h8a2 2 0 012 2v2M9 12h6" />
            </svg>
            Xe khách
          </div>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="departure">Điểm đi</label>
            <div className="field-input-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <select
                id="departure"
                value={departureLocationId}
                onChange={(event) => setDepartureLocationId(event.target.value)}
                disabled={loading}
              >
                {passengerLocations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {getPassengerLocationLabel(location)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="destination">Điểm đến</label>
            <div className="field-input-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <select
                id="destination"
                value={destinationLocationId}
                onChange={(event) => setDestinationLocationId(event.target.value)}
                disabled={loading}
              >
                {passengerLocations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {getPassengerLocationLabel(location)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="date">Ngày đi</label>
            <div className="field-input-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <input id="date" min={minDate} type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </div>
          </div>

          <button className="button search-btn" type="submit" disabled={loading}>
            Tìm chuyến
          </button>
        </form>

        {message ? <div className="message error mt-4">{message}</div> : null}
      </div>

      <div className="page-shell">
        <h2 style={{ marginTop: "40px", marginBottom: "20px" }}>Tuyến đường phổ biến</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "20px" }}>
          {popularRoutes.map((route, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handlePopularRouteClick(route)}
              disabled={loading}
              style={{
                border: 0,
                padding: 0,
                textAlign: "left",
                cursor: loading ? "not-allowed" : "pointer",
                borderRadius: "8px",
                overflow: "hidden",
                boxShadow: "var(--shadow)",
                background: "white",
              }}
            >
              <img
                src={route.img}
                alt={route.to}
                style={{ width: "100%", height: "160px", objectFit: "cover", background: "linear-gradient(135deg, #e8f1fd, #cfe2ff)" }}
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
              <div style={{ padding: "16px" }}>
                <div style={{ fontWeight: 700, marginBottom: "8px" }}>
                  {route.from} - {route.to}
                </div>
                <div style={{ color: "var(--muted)", fontSize: "14px" }}>Từ {route.price}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
