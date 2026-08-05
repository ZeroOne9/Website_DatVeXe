import { normalizeText } from "@/lib/locations";

type VehicleLike = {
  vehicleType?: string | null;
};

export function isSleeperVehicle(vehicleType?: string | null) {
  const normalized = normalizeText(vehicleType ?? "");
  return normalized.includes("giuong") || normalized.includes("sleeper");
}

export function getAutoSeatType(vehicle?: VehicleLike | null) {
  return isSleeperVehicle(vehicle?.vehicleType) ? "sleeper" : "standard";
}

export function getSeatTypeLabel(seatType: string) {
  if (seatType === "sleeper") return "Giường nằm";
  if (seatType === "vip") return "Ghế VIP";
  return "Ghế thường";
}
