import type { LocationItem } from "@/services/types";

export function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function getPassengerLocationLabel(location: LocationItem) {
  const normalizedName = normalizeText(location.name);
  const normalizedProvince = normalizeText(location.province);

  if (normalizedName.includes("da lat")) return "Đà Lạt";
  if (normalizedName.includes("nha trang")) return "Nha Trang";
  if (normalizedName.includes("vung tau")) return "Vũng Tàu";
  if (normalizedName.includes("phan thiet")) return "Phan Thiết";
  if (normalizedName.includes("mien dong") || normalizedName.includes("mien tay")) return "TP. Hồ Chí Minh";
  if (normalizedProvince.includes("ha noi")) return "Hà Nội";
  if (normalizedProvince.includes("da nang")) return "Đà Nẵng";
  if (normalizedProvince.includes("hue") || normalizedProvince.includes("thua thien")) return "Huế";
  if (normalizedProvince.includes("can tho")) return "Cần Thơ";

  return location.province;
}
