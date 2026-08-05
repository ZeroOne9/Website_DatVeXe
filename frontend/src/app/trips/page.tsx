"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { formatMoney } from "@/lib/format";
import { getPassengerLocationLabel, normalizeText } from "@/lib/locations";
import { locationService } from "@/services/locationService";
import { tripService } from "@/services/tripService";
import type { LocationItem, SeatItem, TripSearchItem } from "@/services/types";

type PriceSort = "default" | "asc" | "desc";
type VehicleTypeFilter = "standard" | "sleeper" | "limousine";
type FilterSectionKey = "time" | "company" | "pickup" | "dropoff" | "vehicle" | "price" | "sort";

function parseDateMinutes(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.getHours() * 60 + date.getMinutes();
}

function minutesToTime(minutes: number) {
  if (minutes >= 1440) return "24:00";
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function matchesVehicleType(vehicleType: string, selected: VehicleTypeFilter[]) {
  if (selected.length === 0) return true;
  const normalized = normalizeText(vehicleType);

  return selected.some((type) => {
    if (type === "sleeper") return normalized.includes("giuong") || normalized.includes("sleeper");
    if (type === "limousine") return normalized.includes("limousine");
    return normalized.includes("ghe") || normalized.includes("standard") || normalized.includes("ngoi");
  });
}

function countBy<T>(items: T[], getKey: (item: T) => string) {
  const counts = new Map<string, number>();
  items.forEach((item) => {
    const key = getKey(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function getDemoRating(value: string) {
  const seed = value.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return Math.min(5, 3.8 + (seed % 13) / 10).toFixed(1);
}

function toggleItem(value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) {
  setter((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

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
    setLoading(true);
    tripService
      .getSeats(tripId)
      .then((res) => setSeats(res.data.seats))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [tripId]);

  function handleToggleSeat(seat: SeatItem) {
    if (!seat.isAvailable) return;
    if (selectedSeats.find((item) => item.id === seat.id)) {
      setSelectedSeats((current) => current.filter((item) => item.id !== seat.id));
      return;
    }
    if (selectedSeats.length >= 6) {
      alert("Chỉ được chọn tối đa 6 ghế");
      return;
    }
    setSelectedSeats((current) => [...current, seat]);
  }

  if (loading) return <div className="seat-panel-loading">Đang tải sơ đồ ghế...</div>;
  if (error) return <div className="message error">{error}</div>;

  const floors = Array.from(new Set(seats.map((seat) => seat.floor))).sort((a, b) => a - b);

  return (
    <div className="seat-expand-panel">
      <div className="seat-stepper">
        <div className="step active">
          <span className="step-num">1</span> Chỗ mong muốn
        </div>
        <div className="step">
          <span className="step-num">2</span> Xác nhận
        </div>
        <button className="close-expand" onClick={onClose} title="Đóng">
          ×
        </button>
      </div>

      <div className="seat-picker-body">
        <div className="seat-legend-col">
          <h4>Chú thích</h4>
          <div className="legend-row">
            <div className="legend-icon unavailable" />
            <span>Không bán</span>
          </div>
          <div className="legend-row">
            <div className="legend-icon selected" />
            <span>Đang chọn</span>
          </div>
          <div className="legend-row">
            <div className="legend-icon available" />
            <span>Còn trống</span>
          </div>

          {selectedSeats.length > 0 && (
            <div className="selected-summary">
              <div>Ghế đã chọn:</div>
              <strong className="selected-code">{selectedSeats.map((seat) => seat.seatCode).join(", ")}</strong>
              
            </div>
          )}
        </div>

        <div className="seat-floors-inline">
          {floors.map((floor) => (
            <div key={floor} className="seat-floor-col">
              <h4 className="floor-label">Tầng {floor === 1 ? "dưới" : "trên"}</h4>
              <div className="seat-bus-frame">
                <div className="bus-steering">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4l3 3" />
                  </svg>
                </div>
                <div className="seat-grid-inline">
                  {seats
                    .filter((seat) => seat.floor === floor)
                    .map((seat) => {
                      const isSelected = selectedSeats.some((item) => item.id === seat.id);
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

      <div className="seat-expand-footer">
        <div className="total-display">
          Tổng cộng: <strong>{selectedSeats.length > 0 ? formatMoney(priceVnd * selectedSeats.length) : "0đ"}</strong>
        </div>
        <button
          className="button"
          disabled={selectedSeats.length === 0}
          onClick={() => selectedSeats.length > 0 && onContinue(selectedSeats.map((seat) => seat.id))}
        >
          Tiếp tục
        </button>
      </div>
    </div>
  );
}

function TripCard({
  trip,
  isExpanded,
  onToggle,
  searchParams,
}: {
  trip: TripSearchItem;
  isExpanded: boolean;
  onToggle: () => void;
  searchParams: string;
}) {
  const router = useRouter();

  function handleContinue(seatIds: number[]) {
    const q = new URLSearchParams(searchParams);
    q.set("tripId", String(trip.id));
    q.set("seatIds", seatIds.join(","));
    q.set("tripType", "one_way");
    router.push(`/checkout?${q.toString()}`);
  }

  return (
    <article className={`trip-card-v2 ${isExpanded ? "expanded" : ""}`}>
      <div className="trip-card-top-layout">
        <div className="trip-card-image">
          <div className="image-tag">Xe tốt</div>
          <img src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=400&q=80" alt="Xe khách" />
        </div>

        <div className="trip-card-main-content">
          <div className="trip-card-header">
            <div className="company-info-inline">
              <span className="company-name">{trip.vehicle.busCompany.name}</span>
              <span className="rating-badge">★ {getDemoRating(trip.vehicle.busCompany.name)} ({trip.totalSeatCount})</span>
            </div>
            <div className="price-info">
              <div className="price-display">Từ {formatMoney(trip.priceVnd)}</div>
            </div>
          </div>

          <div className="bus-type-text">{trip.vehicle.vehicleType}</div>

          <div className="trip-card-body-row">
            <div className="trip-info">
              <div className="time-line">
                <div className="time-dot" />
                <div className="time-path" />
                <div className="time-dot end" />
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
                {trip.availableSeatCount > 0 ? `Còn ${trip.availableSeatCount} chỗ trống` : "Hết chỗ"}
              </div>
              <button
                className={isExpanded ? "button outline-primary" : "button"}
                onClick={onToggle}
                disabled={trip.availableSeatCount === 0}
                style={{ marginTop: 12 }}
              >
                {isExpanded ? "Đóng" : "Chọn chuyến"}
              </button>
            </div>
          </div>
        </div>
      </div>

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

function FilterList({
  items,
  selected,
  onToggle,
  showRating,
  showTreeArrow,
}: {
  items: Array<{ label: string; count: number }>;
  selected: string[];
  onToggle: (value: string) => void;
  showRating?: boolean;
  showTreeArrow?: boolean;
}) {
  return (
    <div className="filter-scroll-list">
      {items.map((item) => (
        <label className="filter-check-row" key={item.label}>
          {showTreeArrow && <span className="filter-tree-arrow">›</span>}
          <input type="checkbox" checked={selected.includes(item.label)} onChange={() => onToggle(item.label)} />
          <span className="filter-check-label">
            {item.label} ({item.count})
          </span>
          {showRating && <span className="filter-rating">{getDemoRating(item.label)} ★</span>}
        </label>
      ))}
    </div>
  );
}

function CollapsibleFilterSection({
  title,
  sectionKey,
  openSections,
  onToggle,
  children,
}: {
  title: string;
  sectionKey: FilterSectionKey;
  openSections: FilterSectionKey[];
  onToggle: (section: FilterSectionKey) => void;
  children: React.ReactNode;
}) {
  const isOpen = openSections.includes(sectionKey);

  return (
    <div className="filter-section">
      <button type="button" className="filter-section-toggle" onClick={() => onToggle(sectionKey)}>
        <span>{title}</span>
        <span className={`filter-caret ${isOpen ? "open" : ""}`}>⌄</span>
      </button>
      {isOpen && <div className="filter-section-body">{children}</div>}
    </div>
  );
}

function TripsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const minDate = useMemo(() => today(), []);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [searchDepartureId, setSearchDepartureId] = useState("");
  const [searchDestinationId, setSearchDestinationId] = useState("");
  const [searchDate, setSearchDate] = useState(minDate);
  const [trips, setTrips] = useState<TripSearchItem[]>([]);
  const [message, setMessage] = useState("Đang tải danh sách chuyến...");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [departureFromMinutes, setDepartureFromMinutes] = useState(0);
  const [departureToMinutes, setDepartureToMinutes] = useState(1440);
  const [selectedBusCompanies, setSelectedBusCompanies] = useState<string[]>([]);
  const [selectedPickupPoints, setSelectedPickupPoints] = useState<string[]>([]);
  const [selectedDropoffPoints, setSelectedDropoffPoints] = useState<string[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleTypeFilter[]>([]);
  const [priceFrom, setPriceFrom] = useState(0);
  const [priceTo, setPriceTo] = useState(2000000);
  const [priceSort, setPriceSort] = useState<PriceSort>("default");
  const [companySearch, setCompanySearch] = useState("");
  const [pickupSearch, setPickupSearch] = useState("");
  const [dropoffSearch, setDropoffSearch] = useState("");
  const [openSections, setOpenSections] = useState<FilterSectionKey[]>([]);

  const params = useMemo(
    () => ({
      departureLocationId: searchParams.get("departureLocationId") ?? "",
      destinationLocationId: searchParams.get("destinationLocationId") ?? "",
      departureLocationLabel: searchParams.get("departureLocationLabel") ?? "",
      destinationLocationLabel: searchParams.get("destinationLocationLabel") ?? "",
      date: searchParams.get("date") ?? "",
    }),
    [searchParams],
  );

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
      .then((response) => setLocations(response.data.locations))
      .catch((error: Error) => console.error(error));
  }, []);

  function getSearchLocationLabel(locationId: string) {
    const location = locations.find((item) => String(item.id) === locationId);
    return location ? getPassengerLocationLabel(location) : "";
  }

  useEffect(() => {
    setSearchDepartureId(params.departureLocationId);
    setSearchDestinationId(params.destinationLocationId);
    setSearchDate(params.date || minDate);
  }, [minDate, params]);

  useEffect(() => {
    if (!params.departureLocationId || !params.destinationLocationId) {
      setMessage("Thiếu thông tin tìm kiếm. Vui lòng quay lại trang chủ.");
      setLoading(false);
      return;
    }

    setLoading(true);
    tripService
      .searchTrips(params)
      .then((response) => {
        setTrips(response.data.trips);
        setMessage(response.data.trips.length ? "" : "Chưa có chuyến phù hợp với tuyến đường đã chọn.");
      })
      .catch((error: Error) => setMessage(error.message))
      .finally(() => setLoading(false));
  }, [params]);

  const priceBounds = useMemo(() => {
    const max = trips.length ? Math.max(...trips.map((trip) => trip.priceVnd), 2000000) : 2000000;
    return { min: 0, max };
  }, [trips]);

  const busCompanyOptions = useMemo(() => countBy(trips, (trip) => trip.vehicle.busCompany.name), [trips]);
  const pickupOptions = useMemo(() => countBy(trips, (trip) => trip.route.departureLocation.name), [trips]);
  const dropoffOptions = useMemo(() => countBy(trips, (trip) => trip.route.destinationLocation.name), [trips]);

  const visibleBusCompanyOptions = useMemo(
    () => busCompanyOptions.filter((item) => normalizeText(item.label).includes(normalizeText(companySearch))),
    [busCompanyOptions, companySearch],
  );
  const visiblePickupOptions = useMemo(
    () => pickupOptions.filter((item) => normalizeText(item.label).includes(normalizeText(pickupSearch))),
    [pickupOptions, pickupSearch],
  );
  const visibleDropoffOptions = useMemo(
    () => dropoffOptions.filter((item) => normalizeText(item.label).includes(normalizeText(dropoffSearch))),
    [dropoffOptions, dropoffSearch],
  );

  const filteredTrips = useMemo(() => {
    const result = trips.filter((trip) => {
      const departureMinutes = parseDateMinutes(trip.departureTime);
      const matchesDepartureRange =
        departureMinutes !== null &&
        departureMinutes >= departureFromMinutes &&
        departureMinutes <= departureToMinutes;
      const matchesBusCompany =
        selectedBusCompanies.length === 0 || selectedBusCompanies.includes(trip.vehicle.busCompany.name);
      const matchesPickup =
        selectedPickupPoints.length === 0 || selectedPickupPoints.includes(trip.route.departureLocation.name);
      const matchesDropoff =
        selectedDropoffPoints.length === 0 || selectedDropoffPoints.includes(trip.route.destinationLocation.name);
      const matchesPrice = trip.priceVnd >= priceFrom && trip.priceVnd <= priceTo;

      return (
        matchesDepartureRange &&
        matchesBusCompany &&
        matchesPickup &&
        matchesDropoff &&
        matchesPrice &&
        matchesVehicleType(trip.vehicle.vehicleType, vehicleTypes)
      );
    });

    if (priceSort === "asc") return [...result].sort((a, b) => a.priceVnd - b.priceVnd);
    if (priceSort === "desc") return [...result].sort((a, b) => b.priceVnd - a.priceVnd);
    return result;
  }, [
    departureFromMinutes,
    departureToMinutes,
    priceFrom,
    priceSort,
    priceTo,
    selectedBusCompanies,
    selectedDropoffPoints,
    selectedPickupPoints,
    trips,
    vehicleTypes,
  ]);

  function resetFilters() {
    setDepartureFromMinutes(0);
    setDepartureToMinutes(1440);
    setSelectedBusCompanies([]);
    setSelectedPickupPoints([]);
    setSelectedDropoffPoints([]);
    setVehicleTypes([]);
    setCompanySearch("");
    setPickupSearch("");
    setDropoffSearch("");
    setPriceFrom(priceBounds.min);
    setPriceTo(priceBounds.max);
    setPriceSort("default");
  }

  function updateDepartureFrom(value: number) {
    setDepartureFromMinutes(Math.min(value, departureToMinutes - 30));
  }

  function updateDepartureTo(value: number) {
    setDepartureToMinutes(Math.max(value, departureFromMinutes + 30));
  }

  function updatePriceFrom(value: number) {
    setPriceFrom(Math.min(value, priceTo - 10000));
  }

  function updatePriceTo(value: number) {
    setPriceTo(Math.max(value, priceFrom + 10000));
  }

  function toggleVehicleType(type: VehicleTypeFilter) {
    setVehicleTypes((current) => (current.includes(type) ? current.filter((item) => item !== type) : [...current, type]));
  }

  function toggleFilterSection(section: FilterSectionKey) {
    setOpenSections((current) =>
      current.includes(section) ? current.filter((item) => item !== section) : [...current, section],
    );
  }

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!searchDepartureId || !searchDestinationId || !searchDate) {
      alert("Vui lòng chọn đầy đủ điểm đi, điểm đến và ngày đi.");
      return;
    }

    if (searchDepartureId === searchDestinationId) {
      alert("Điểm đi và điểm đến phải khác nhau.");
      return;
    }

    resetFilters();
    setExpandedId(null);

    const query = new URLSearchParams({
      departureLocationId: searchDepartureId,
      destinationLocationId: searchDestinationId,
    });

    query.set("date", searchDate);

    const departureLocationLabel = getSearchLocationLabel(searchDepartureId);
    const destinationLocationLabel = getSearchLocationLabel(searchDestinationId);

    if (departureLocationLabel) query.set("departureLocationLabel", departureLocationLabel);
    if (destinationLocationLabel) query.set("destinationLocationLabel", destinationLocationLabel);

    router.push(`/trips?${query.toString()}`);
  }

  return (
    <section className="page-shell">
      <div className="search-widget search-widget-inline">
        <div className="search-tabs">
          <div className="search-tab active">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M4 16l2-8h12l2 8M4 16H2M22 16h-2M8 19v2M16 19v2M6 8V6a2 2 0 012-2h8a2 2 0 012 2v2M9 12h6" />
            </svg>
            Xe khách
          </div>
        </div>

        <form className="form-grid trips-search-form" onSubmit={handleSearchSubmit}>
          <div className="field">
            <label htmlFor="trips-departure">Điểm đi</label>
            <div className="field-input-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <select
                id="trips-departure"
                value={searchDepartureId}
                onChange={(event) => setSearchDepartureId(event.target.value)}
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
            <label htmlFor="trips-destination">Điểm đến</label>
            <div className="field-input-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <select
                id="trips-destination"
                value={searchDestinationId}
                onChange={(event) => setSearchDestinationId(event.target.value)}
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
            <label htmlFor="trips-date">Ngày đi</label>
            <div className="field-input-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <input
                id="trips-date"
                min={minDate}
                type="date"
                value={searchDate}
                onChange={(event) => setSearchDate(event.target.value)}
              />
            </div>
          </div>

          <button className="button search-btn" type="submit">
            Tìm chuyến
          </button>
        </form>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, margin: 0 }}>Kết quả tìm kiếm</h1>
          <p style={{ color: "var(--muted)", margin: "6px 0 0" }}>
            {params.date ? `Đang chọn chuyến đi: ${params.date}` : "Đang xem tất cả chuyến của tuyến đường này"}
          </p>
        </div>
      </div>

      <div className="two-column-layout">
        <aside className="filter-sidebar">
          <div className="filter-sidebar-header">
            <strong>Lọc</strong>
            <button type="button" onClick={resetFilters}>
              Xóa lọc
            </button>
          </div>

          <CollapsibleFilterSection title="Giờ đi" sectionKey="time" openSections={openSections} onToggle={toggleFilterSection}>
            <div className="time-range-filter">
              <div className="range-slider">
                <div className="range-track">
                  <div
                    className="range-track-active"
                    style={{
                      left: `${(departureFromMinutes / 1440) * 100}%`,
                      right: `${100 - (departureToMinutes / 1440) * 100}%`,
                    }}
                  />
                </div>
                <input
                  aria-label="Giờ đi từ"
                  type="range"
                  min={0}
                  max={1440}
                  step={30}
                  value={departureFromMinutes}
                  onChange={(event) => updateDepartureFrom(Number(event.target.value))}
                />
                <input
                  aria-label="Giờ đi đến"
                  type="range"
                  min={0}
                  max={1440}
                  step={30}
                  value={departureToMinutes}
                  onChange={(event) => updateDepartureTo(Number(event.target.value))}
                />
              </div>
              <div className="range-time-boxes">
                <div className="range-time-box">
                  <span>Từ</span>
                  <strong>{minutesToTime(departureFromMinutes)}</strong>
                </div>
                <span className="range-time-separator">-</span>
                <div className="range-time-box">
                  <span>Đến</span>
                  <strong>{minutesToTime(departureToMinutes)}</strong>
                </div>
              </div>
            </div>
          </CollapsibleFilterSection>

          <CollapsibleFilterSection title="Nhà xe" sectionKey="company" openSections={openSections} onToggle={toggleFilterSection}>
            <input
              className="filter-search-input"
              value={companySearch}
              onChange={(event) => setCompanySearch(event.target.value)}
              placeholder="Tìm trong danh sách"
            />
            <FilterList
              items={visibleBusCompanyOptions}
              selected={selectedBusCompanies}
              onToggle={(value) => toggleItem(value, setSelectedBusCompanies)}
              showRating
            />
          </CollapsibleFilterSection>

          <CollapsibleFilterSection title="Điểm đón" sectionKey="pickup" openSections={openSections} onToggle={toggleFilterSection}>
            <input
              className="filter-search-input"
              value={pickupSearch}
              onChange={(event) => setPickupSearch(event.target.value)}
              placeholder="Tìm trong danh sách"
            />
            <FilterList
              items={visiblePickupOptions}
              selected={selectedPickupPoints}
              onToggle={(value) => toggleItem(value, setSelectedPickupPoints)}
              showTreeArrow
            />
          </CollapsibleFilterSection>

          <CollapsibleFilterSection title="Điểm trả" sectionKey="dropoff" openSections={openSections} onToggle={toggleFilterSection}>
            <input
              className="filter-search-input"
              value={dropoffSearch}
              onChange={(event) => setDropoffSearch(event.target.value)}
              placeholder="Tìm trong danh sách"
            />
            <FilterList
              items={visibleDropoffOptions}
              selected={selectedDropoffPoints}
              onToggle={(value) => toggleItem(value, setSelectedDropoffPoints)}
              showTreeArrow
            />
          </CollapsibleFilterSection>

          <CollapsibleFilterSection title="Loại xe" sectionKey="vehicle" openSections={openSections} onToggle={toggleFilterSection}>
            <label className="filter-option">
              <input type="checkbox" checked={vehicleTypes.includes("standard")} onChange={() => toggleVehicleType("standard")} /> Ghế ngồi
            </label>
            <label className="filter-option">
              <input type="checkbox" checked={vehicleTypes.includes("sleeper")} onChange={() => toggleVehicleType("sleeper")} /> Giường nằm
            </label>
            <label className="filter-option">
              <input type="checkbox" checked={vehicleTypes.includes("limousine")} onChange={() => toggleVehicleType("limousine")} /> Limousine
            </label>
          </CollapsibleFilterSection>

          <CollapsibleFilterSection title="Giá vé" sectionKey="price" openSections={openSections} onToggle={toggleFilterSection}>
            <div className="range-slider price-range-slider">
              <div className="range-track">
                <div
                  className="range-track-active"
                  style={{
                    left: `${(priceFrom / priceBounds.max) * 100}%`,
                    right: `${100 - (priceTo / priceBounds.max) * 100}%`,
                  }}
                />
              </div>
              <input
                aria-label="Giá vé từ"
                type="range"
                min={priceBounds.min}
                max={priceBounds.max}
                step={10000}
                value={priceFrom}
                onChange={(event) => updatePriceFrom(Number(event.target.value))}
              />
              <input
                aria-label="Giá vé đến"
                type="range"
                min={priceBounds.min}
                max={priceBounds.max}
                step={10000}
                value={priceTo}
                onChange={(event) => updatePriceTo(Number(event.target.value))}
              />
            </div>
            <div className="price-range-labels">
              <span>{formatMoney(priceFrom)}</span>
              <span>{formatMoney(priceTo)}</span>
            </div>
          </CollapsibleFilterSection>

          <CollapsibleFilterSection title="Sắp xếp giá" sectionKey="sort" openSections={openSections} onToggle={toggleFilterSection}>
            <label className="filter-option">
              <input type="radio" name="price" checked={priceSort === "default"} onChange={() => setPriceSort("default")} /> Mặc định
            </label>
            <label className="filter-option">
              <input type="radio" name="price" checked={priceSort === "asc"} onChange={() => setPriceSort("asc")} /> Tăng dần
            </label>
            <label className="filter-option">
              <input type="radio" name="price" checked={priceSort === "desc"} onChange={() => setPriceSort("desc")} /> Giảm dần
            </label>
          </CollapsibleFilterSection>
        </aside>

        <main>
          {message ? <div className={`message ${loading ? "" : "error"}`}>{message}</div> : null}

          {!message && (
            <div style={{ color: "var(--muted)", marginBottom: 12 }}>
              Hiển thị {filteredTrips.length}/{trips.length} chuyến phù hợp
            </div>
          )}

          {!message && filteredTrips.length === 0 ? (
            <div className="message error">Không có chuyến phù hợp với bộ lọc hiện tại.</div>
          ) : null}

          <div className="trip-list">
            {filteredTrips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                isExpanded={expandedId === trip.id}
                onToggle={() => setExpandedId(expandedId === trip.id ? null : trip.id)}
                searchParams={searchParams.toString()}
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
