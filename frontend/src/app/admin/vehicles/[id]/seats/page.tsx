"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { getAutoSeatType, getSeatTypeLabel } from "@/lib/vehicleSeats";
import { adminService } from "@/services/adminService";

const inputStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 40,
  border: "1px solid var(--line)",
  borderRadius: "var(--radius)",
  padding: "0 12px",
  background: "white",
};

const helpTextStyle: React.CSSProperties = {
  marginTop: 6,
  color: "var(--muted)",
  fontSize: 12,
  lineHeight: 1.5,
};

function FieldLabel({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <label>
      <span style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14 }}>{label}</span>
      {children}
      {help && <div style={helpTextStyle}>{help}</div>}
    </label>
  );
}

export default function AdminVehicleSeatsPage({ params }: { params: { id: string } }) {
  const vehicleId = Number(params.id);

  const [vehicleInfo, setVehicleInfo] = useState<any>(null);
  const [seats, setSeats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingSeat, setCreatingSeat] = useState(false);
  const [creatingQuickSeats, setCreatingQuickSeats] = useState(false);

  const [quickSeatForm, setQuickSeatForm] = useState({
    prefix: "A",
    startNumber: "1",
    quantity: "",
    seatsPerRow: "2",
    floorMode: "auto",
  });

  const [seatForm, setSeatForm] = useState({
    seatCode: "",
    seatType: "standard",
    floor: "1",
    rowNumber: "",
    colNumber: "",
  });

  const loadSeats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.getVehicleSeats(vehicleId);
      setVehicleInfo(res.data.vehicle);
      setSeats(res.data.vehicle.seats || []);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Lỗi tải thông tin ghế.");
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    if (vehicleId) loadSeats();
  }, [loadSeats, vehicleId]);

  const capacity = vehicleInfo?.capacity || 0;
  const remainingSeats = Math.max(capacity - seats.length, 0);
  const autoSeatType = getAutoSeatType(vehicleInfo);
  const isSleeper = autoSeatType === "sleeper";

  const existingSeatCodes = useMemo(
    () => new Set(seats.map((seat) => String(seat.seatCode).toUpperCase())),
    [seats],
  );

  const updateSeatForm = (field: keyof typeof seatForm, value: string) => {
    setSeatForm((current) => ({ ...current, [field]: value }));
  };

  const updateQuickSeatForm = (field: keyof typeof quickSeatForm, value: string) => {
    setQuickSeatForm((current) => ({ ...current, [field]: value }));
  };

  const handleQuickCreateSeats = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const prefix = quickSeatForm.prefix.trim().toUpperCase();
    const startNumber = Number(quickSeatForm.startNumber);
    const quantity = Number(quickSeatForm.quantity);
    const seatsPerRow = Number(quickSeatForm.seatsPerRow);

    if (!prefix || !startNumber || !quantity || !seatsPerRow) {
      alert("Vui lòng nhập đầy đủ thông tin tạo ghế nhanh.");
      return;
    }

    if (quantity > remainingSeats) {
      alert(`Xe chỉ còn trống ${remainingSeats} vị trí so với sức chứa.`);
      return;
    }

    const newSeatCodes = Array.from({ length: quantity }, (_, index) => {
      const seatNumber = startNumber + index;
      return `${prefix}${String(seatNumber).padStart(2, "0")}`;
    });

    const duplicatedSeatCode = newSeatCodes.find((seatCode) => existingSeatCodes.has(seatCode));
    if (duplicatedSeatCode) {
      alert(`Mã ghế ${duplicatedSeatCode} đã tồn tại. Vui lòng đổi tiền tố hoặc số bắt đầu.`);
      return;
    }

    try {
      setCreatingQuickSeats(true);
      const splitAt = Math.ceil(quantity / 2);

      for (let index = 0; index < quantity; index += 1) {
        const floor = quickSeatForm.floorMode === "two_floors" && index >= splitAt ? 2 : 1;
        const rowIndex = quickSeatForm.floorMode === "two_floors" && index >= splitAt ? index - splitAt : index;

        await adminService.createVehicleSeat(vehicleId, {
          seatCode: newSeatCodes[index],
          seatType: autoSeatType,
          floor,
          rowNumber: Math.floor(rowIndex / seatsPerRow) + 1,
          colNumber: (rowIndex % seatsPerRow) + 1,
        });
      }

      setQuickSeatForm((current) => ({ ...current, quantity: "" }));
      await loadSeats();
      alert("Tạo ghế nhanh thành công.");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Không thể tạo ghế nhanh.");
    } finally {
      setCreatingQuickSeats(false);
    }
  };

  const handleCreateSeat = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const seatCode = seatForm.seatCode.trim().toUpperCase();
    if (!seatCode) return;

    if (remainingSeats <= 0) {
      alert(`Xe đã đạt sức chứa tối đa (${capacity} ghế). Không thể thêm nữa.`);
      return;
    }

    if (existingSeatCodes.has(seatCode)) {
      alert(`Mã ghế ${seatCode} đã tồn tại.`);
      return;
    }

    try {
      setCreatingSeat(true);
      await adminService.createVehicleSeat(vehicleId, {
        seatCode,
        seatType: isSleeper ? "sleeper" : seatForm.seatType,
        floor: Number(seatForm.floor),
        rowNumber: seatForm.rowNumber ? Number(seatForm.rowNumber) : undefined,
        colNumber: seatForm.colNumber ? Number(seatForm.colNumber) : undefined,
      });

      setSeatForm((current) => ({ ...current, seatCode: "", rowNumber: "", colNumber: "" }));
      await loadSeats();
      alert("Tạo ghế thành công.");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Lỗi khi tạo ghế.");
    } finally {
      setCreatingSeat(false);
    }
  };

  if (loading && !vehicleInfo) {
    return <div style={{ padding: 40, textAlign: "center" }}>Đang tải...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/admin/vehicles" className="button outline" style={{ height: 32, padding: "0 12px" }}>
          ← Quay lại
        </Link>
        <div>
          <h1 style={{ fontSize: 24, margin: 0 }}>Sơ đồ / Quản lý ghế</h1>
          {vehicleInfo && (
            <div style={{ fontSize: 14, color: "var(--muted)", marginTop: 4 }}>
              Xe: {vehicleInfo.name} ({vehicleInfo.licensePlate}) - {vehicleInfo.busCompany?.name}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 0.85fr) minmax(0, 1.5fr)", gap: 24, alignItems: "start" }}>
        <div style={{ display: "grid", gap: 20 }}>
          <section className="card" style={{ padding: 24 }}>
            <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 18 }}>Tạo ghế nhanh</h2>

            <div style={{ padding: 12, background: "#f8f9fa", borderRadius: 8, marginBottom: 16, fontSize: 13, lineHeight: 1.6 }}>
              Sức chứa: <strong>{capacity} ghế</strong>
              <br />
              Đã tạo:{" "}
              <strong style={{ color: remainingSeats === 0 ? "var(--red)" : "var(--primary)" }}>
                {seats.length} ghế
              </strong>
              <br />
              Còn có thể tạo: <strong>{remainingSeats} ghế</strong>
              <br />
              Loại ghế tự động: <strong>{autoSeatType === "sleeper" ? "Giường nằm" : "Ghế thường"}</strong>
            </div>

            <form onSubmit={handleQuickCreateSeats} style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FieldLabel label="Tiền tố mã ghế *" help="Chữ đứng trước số ghế. Ví dụ nhập A sẽ tạo A01, A02...">
                  <input
                    required
                    style={inputStyle}
                    value={quickSeatForm.prefix}
                    onChange={(event) => updateQuickSeatForm("prefix", event.target.value)}
                    placeholder="VD: A"
                    disabled={remainingSeats === 0}
                  />
                </FieldLabel>

                <FieldLabel label="Số bắt đầu *" help="Số đầu tiên trong dãy ghế, thường nhập 1.">
                  <input
                    required
                    min={1}
                    type="number"
                    style={inputStyle}
                    value={quickSeatForm.startNumber}
                    onChange={(event) => updateQuickSeatForm("startNumber", event.target.value)}
                    placeholder="VD: 1"
                    disabled={remainingSeats === 0}
                  />
                </FieldLabel>
              </div>

              <FieldLabel label="Số lượng ghế *" help="Số ghế muốn tạo thêm, không được vượt quá phần còn trống của xe.">
                <input
                  required
                  min={1}
                  max={remainingSeats || undefined}
                  type="number"
                  style={inputStyle}
                  value={quickSeatForm.quantity}
                  onChange={(event) => updateQuickSeatForm("quantity", event.target.value)}
                  placeholder="VD: 34"
                  disabled={remainingSeats === 0}
                />
              </FieldLabel>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FieldLabel label="Số ghế mỗi hàng *" help="Dùng để tự gán hàng/cột. Ví dụ 2 nghĩa là mỗi hàng có 2 ghế.">
                  <input
                    required
                    min={1}
                    type="number"
                    style={inputStyle}
                    value={quickSeatForm.seatsPerRow}
                    onChange={(event) => updateQuickSeatForm("seatsPerRow", event.target.value)}
                    placeholder="VD: 2"
                    disabled={remainingSeats === 0}
                  />
                </FieldLabel>

                <FieldLabel label="Kiểu tầng" help="Xe 1 tầng chọn Một tầng. Xe giường nằm 2 tầng chọn Chia đều 2 tầng.">
                  <select
                    style={inputStyle}
                    value={quickSeatForm.floorMode}
                    onChange={(event) => updateQuickSeatForm("floorMode", event.target.value)}
                    disabled={remainingSeats === 0}
                  >
                    <option value="auto">Một tầng</option>
                    <option value="two_floors">Chia đều 2 tầng</option>
                  </select>
                </FieldLabel>
              </div>

              <div style={{ padding: 12, borderRadius: 8, background: "var(--primary-light)", color: "var(--primary-dark)", fontSize: 13, lineHeight: 1.6 }}>
                Ví dụ: tiền tố <strong>A</strong>, số bắt đầu <strong>1</strong>, số lượng <strong>34</strong> sẽ tạo mã ghế từ{" "}
                <strong>A01</strong> đến <strong>A34</strong>.
              </div>

              <button
                type="submit"
                className="button"
                disabled={creatingQuickSeats || remainingSeats === 0}
                style={{ marginTop: 4 }}
              >
                {creatingQuickSeats ? "Đang tạo ghế..." : "Tạo ghế nhanh"}
              </button>
            </form>
          </section>

          <section className="card" style={{ padding: 24 }}>
            <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 18 }}>Thêm 1 ghế thủ công</h2>

            <form onSubmit={handleCreateSeat} style={{ display: "grid", gap: 14 }}>
              <FieldLabel label="Mã ghế *" help="Mã ghế phải duy nhất trong xe. Ví dụ: A01, B12.">
                <input
                  required
                  style={inputStyle}
                  value={seatForm.seatCode}
                  onChange={(event) => updateSeatForm("seatCode", event.target.value)}
                  placeholder="VD: A01"
                  autoFocus
                  disabled={remainingSeats === 0}
                />
              </FieldLabel>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FieldLabel label="Tầng *" help="Nhập 1 cho tầng dưới, 2 cho tầng trên.">
                  <input
                    required
                    min={1}
                    type="number"
                    style={inputStyle}
                    value={seatForm.floor}
                    onChange={(event) => updateSeatForm("floor", event.target.value)}
                    placeholder="1"
                    disabled={remainingSeats === 0}
                  />
                </FieldLabel>

                <FieldLabel label="Loại ghế *" help={isSleeper ? "Xe giường nằm sẽ tự tạo tất cả ghế là giường nằm." : "Chọn loại ghế phù hợp với xe."}>
                  <select
                    style={inputStyle}
                    value={isSleeper ? "sleeper" : seatForm.seatType}
                    onChange={(event) => updateSeatForm("seatType", event.target.value)}
                    disabled={remainingSeats === 0 || isSleeper}
                  >
                    <option value="standard">Ghế thường</option>
                    <option value="sleeper">Giường nằm</option>
                    <option value="vip">Ghế VIP</option>
                  </select>
                </FieldLabel>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FieldLabel label="Hàng" help="Không bắt buộc. Dùng để sắp xếp sơ đồ ghế.">
                  <input
                    min={1}
                    type="number"
                    style={inputStyle}
                    value={seatForm.rowNumber}
                    onChange={(event) => updateSeatForm("rowNumber", event.target.value)}
                    placeholder="VD: 1"
                    disabled={remainingSeats === 0}
                  />
                </FieldLabel>

                <FieldLabel label="Cột" help="Không bắt buộc. Dùng để sắp xếp sơ đồ ghế.">
                  <input
                    min={1}
                    type="number"
                    style={inputStyle}
                    value={seatForm.colNumber}
                    onChange={(event) => updateSeatForm("colNumber", event.target.value)}
                    placeholder="VD: 2"
                    disabled={remainingSeats === 0}
                  />
                </FieldLabel>
              </div>

              <button
                type="submit"
                className="button"
                disabled={creatingSeat || remainingSeats === 0}
                style={{ marginTop: 4 }}
              >
                {creatingSeat ? "Đang thêm..." : "+ Thêm ghế này"}
              </button>
            </form>
          </section>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã ghế</th>
                <th>Tầng</th>
                <th>Hàng</th>
                <th>Cột</th>
                <th>Loại ghế</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {seats.map((seat) => (
                <tr key={seat.id}>
                  <td style={{ fontWeight: 700, color: "var(--primary)", fontSize: 16 }}>{seat.seatCode}</td>
                  <td>Tầng {seat.floor}</td>
                  <td>{seat.rowNumber || "-"}</td>
                  <td>{seat.colNumber || "-"}</td>
                  <td>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: 4,
                        fontSize: 12,
                        background: seat.seatType === "vip" ? "#fff3cd" : seat.seatType === "sleeper" ? "#d1ecf1" : "#e2e3e5",
                        color: seat.seatType === "vip" ? "#856404" : seat.seatType === "sleeper" ? "#0c5460" : "#383d41",
                      }}
                    >
                      {getSeatTypeLabel(seat.seatType)}
                    </span>
                  </td>
                  <td>
                    {seat.isActive ? (
                      <span style={{ color: "var(--green)" }}>Đang dùng</span>
                    ) : (
                      <span style={{ color: "var(--red)" }}>Đã khóa</span>
                    )}
                  </td>
                </tr>
              ))}
              {seats.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
                    Xe này chưa cấu hình ghế nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
