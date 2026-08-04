"use client";

import { useEffect, useMemo, useState } from "react";

import { partnerDashboardService } from "@/services/partnerDashboardService";

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

const statusOptions = [
  { value: "active", label: "Đang hoạt động" },
  { value: "maintenance", label: "Đang bảo trì" },
  { value: "inactive", label: "Ngừng hoạt động" },
];

const vehicleStatusLabels = Object.fromEntries(statusOptions.map((option) => [option.value, option.label]));

type VehicleForm = {
  licensePlate: string;
  name: string;
  vehicleType: string;
  capacity: string;
  status: string;
};

const emptyVehicleForm: VehicleForm = {
  licensePlate: "",
  name: "",
  vehicleType: "",
  capacity: "",
  status: "active",
};

function isSleeperVehicle(vehicleType?: string) {
  const normalized = (vehicleType || "").toLowerCase();
  return normalized.includes("giường") || normalized.includes("giuong") || normalized.includes("sleeper");
}

function getAutoSeatType(vehicle: any) {
  return isSleeperVehicle(vehicle?.vehicleType) ? "sleeper" : "standard";
}

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

export default function PartnerVehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [savingSeat, setSavingSeat] = useState(false);
  const [savingQuickSeats, setSavingQuickSeats] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [vehicleForm, setVehicleForm] = useState<VehicleForm>(emptyVehicleForm);
  const [quickSeatForm, setQuickSeatForm] = useState({
    vehicleId: "",
    prefix: "A",
    startNumber: "1",
    quantity: "",
    seatsPerRow: "2",
    floorMode: "auto",
  });
  const [seatForm, setSeatForm] = useState({
    vehicleId: "",
    seatCode: "",
    seatType: "standard",
    floor: "1",
    rowNumber: "",
    colNumber: "",
  });

  const editingSeatCount = useMemo(
    () => editingVehicle?._count?.seats ?? 0,
    [editingVehicle],
  );

  const selectedQuickVehicle = useMemo(
    () => vehicles.find((vehicle) => String(vehicle.id) === quickSeatForm.vehicleId),
    [vehicles, quickSeatForm.vehicleId],
  );

  const quickSeatType = getAutoSeatType(selectedQuickVehicle);
  const quickVehicleSeatCount = selectedQuickVehicle?._count?.seats ?? 0;
  const quickVehicleCapacity = selectedQuickVehicle?.capacity ?? 0;
  const quickVehicleRemainingSeats = Math.max(quickVehicleCapacity - quickVehicleSeatCount, 0);

  const vehicleTypeOptions = useMemo(
    () => Array.from(new Set(vehicles.map((vehicle) => vehicle.vehicleType).filter(Boolean))).sort(),
    [vehicles],
  );

  const filteredVehicles = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return vehicles.filter((vehicle) => {
      const searchable = `${vehicle.id} ${vehicle.name || ""} ${vehicle.licensePlate || ""} ${vehicle.vehicleType || ""}`.toLowerCase();
      return (
        (!vehicleTypeFilter || vehicle.vehicleType === vehicleTypeFilter) &&
        (!statusFilter || vehicle.status === statusFilter) &&
        (!normalizedSearch || searchable.includes(normalizedSearch))
      );
    });
  }, [searchTerm, statusFilter, vehicleTypeFilter, vehicles]);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const response = await partnerDashboardService.getVehicles();
      setVehicles(response.data.vehicles);
    } catch (error) {
      console.error(error);
      alert("Không thể tải danh sách xe.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const updateVehicleForm = (field: keyof VehicleForm, value: string) => {
    setVehicleForm((current) => ({ ...current, [field]: value }));
  };

  const updateSeatForm = (field: keyof typeof seatForm, value: string) => {
    setSeatForm((current) => ({ ...current, [field]: value }));
  };

  const updateQuickSeatForm = (field: keyof typeof quickSeatForm, value: string) => {
    setQuickSeatForm((current) => ({ ...current, [field]: value }));
  };

  const openEditForm = (vehicle: any) => {
    setEditingVehicle(vehicle);
    setVehicleForm({
      licensePlate: vehicle.licensePlate || "",
      name: vehicle.name || "",
      vehicleType: vehicle.vehicleType || "",
      capacity: String(vehicle.capacity || ""),
      status: vehicle.status || "active",
    });
  };

  const closeEditForm = () => {
    setEditingVehicle(null);
    setVehicleForm(emptyVehicleForm);
  };

  const handleCreateVehicle = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingVehicle(true);
    try {
      await partnerDashboardService.createVehicle({
        licensePlate: vehicleForm.licensePlate.trim(),
        name: vehicleForm.name.trim(),
        vehicleType: vehicleForm.vehicleType.trim(),
        capacity: Number(vehicleForm.capacity),
      });
      setVehicleForm(emptyVehicleForm);
      await loadVehicles();
      alert("Tạo xe thành công.");
    } catch (error: any) {
      alert(error.message || "Không thể tạo xe.");
    } finally {
      setSavingVehicle(false);
    }
  };

  const handleUpdateVehicle = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingVehicle) return;

    const capacity = Number(vehicleForm.capacity);
    if (!vehicleForm.licensePlate || !vehicleForm.name || !vehicleForm.vehicleType || !capacity) {
      alert("Vui lòng nhập đầy đủ thông tin xe.");
      return;
    }

    if (capacity < editingSeatCount) {
      alert(`Sức chứa không được nhỏ hơn số ghế đã tạo (${editingSeatCount}).`);
      return;
    }

    setSavingVehicle(true);
    try {
      await partnerDashboardService.updateVehicle(editingVehicle.id, {
        licensePlate: vehicleForm.licensePlate.trim(),
        name: vehicleForm.name.trim(),
        vehicleType: vehicleForm.vehicleType.trim(),
        capacity,
        status: vehicleForm.status,
      });
      closeEditForm();
      await loadVehicles();
      alert("Cập nhật xe thành công.");
    } catch (error: any) {
      alert(error.message || "Không thể cập nhật xe.");
    } finally {
      setSavingVehicle(false);
    }
  };

  const handleQuickCreateSeats = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedQuickVehicle) {
      alert("Vui lòng chọn xe cần tạo ghế.");
      return;
    }

    const quantity = Number(quickSeatForm.quantity);
    const startNumber = Number(quickSeatForm.startNumber);
    const seatsPerRow = Number(quickSeatForm.seatsPerRow);
    const prefix = quickSeatForm.prefix.trim().toUpperCase();

    if (!prefix || !quantity || !startNumber || !seatsPerRow) {
      alert("Vui lòng nhập đầy đủ thông tin tạo ghế nhanh.");
      return;
    }

    if (quantity > quickVehicleRemainingSeats) {
      alert(`Xe chỉ còn trống ${quickVehicleRemainingSeats} vị trí so với sức chứa.`);
      return;
    }

    const splitAt = Math.ceil(quantity / 2);

    try {
      setSavingQuickSeats(true);
      for (let index = 0; index < quantity; index += 1) {
        const seatNumber = startNumber + index;
        const seatCode = `${prefix}${String(seatNumber).padStart(2, "0")}`;
        const floor = quickSeatForm.floorMode === "two_floors" && index >= splitAt ? 2 : 1;
        const rowIndex = quickSeatForm.floorMode === "two_floors" && index >= splitAt ? index - splitAt : index;

        await partnerDashboardService.createVehicleSeat(selectedQuickVehicle.id, {
          seatCode,
          seatType: quickSeatType,
          floor,
          rowNumber: Math.floor(rowIndex / seatsPerRow) + 1,
          colNumber: (rowIndex % seatsPerRow) + 1,
        });
      }

      setQuickSeatForm((current) => ({ ...current, quantity: "" }));
      await loadVehicles();
      alert(`Đã tạo nhanh ${quantity} ghế cho xe ${selectedQuickVehicle.name}.`);
    } catch (error: any) {
      alert(error.message || "Không thể tạo ghế nhanh. Kiểm tra mã ghế có bị trùng không.");
    } finally {
      setSavingQuickSeats(false);
    }
  };

  const handleCreateSeat = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const selectedVehicle = vehicles.find((vehicle) => String(vehicle.id) === seatForm.vehicleId);

    setSavingSeat(true);
    try {
      await partnerDashboardService.createVehicleSeat(Number(seatForm.vehicleId), {
        seatCode: seatForm.seatCode.trim(),
        seatType: isSleeperVehicle(selectedVehicle?.vehicleType) ? "sleeper" : seatForm.seatType,
        floor: Number(seatForm.floor),
        rowNumber: seatForm.rowNumber ? Number(seatForm.rowNumber) : undefined,
        colNumber: seatForm.colNumber ? Number(seatForm.colNumber) : undefined,
      });
      setSeatForm((current) => ({ ...current, seatCode: "", rowNumber: "", colNumber: "" }));
      await loadVehicles();
      alert("Tạo ghế thành công.");
    } catch (error: any) {
      alert(error.message || "Không thể tạo ghế.");
    } finally {
      setSavingSeat(false);
    }
  };

  const handleStatusChange = async (vehicle: any, status: string) => {
    if (vehicle.status === status) return;
    if (!confirm(`Đổi trạng thái xe "${vehicle.name}" thành "${vehicleStatusLabels[status] || status}"?`)) return;

    try {
      await partnerDashboardService.updateVehicle(vehicle.id, { status });
      await loadVehicles();
    } catch (error: any) {
      alert(error.message || "Không thể cập nhật trạng thái xe.");
    }
  };

  const handleDeleteVehicle = async (vehicle: any) => {
    if (
      !confirm(
        `Xóa xe "${vehicle.name}"?\n\nChỉ xóa được xe chưa có chuyến xe. Nếu xe đã có chuyến, hãy chuyển sang Ngừng hoạt động.`,
      )
    ) {
      return;
    }

    try {
      await partnerDashboardService.deleteVehicle(vehicle.id);
      await loadVehicles();
      alert("Xóa xe thành công.");
    } catch (error: any) {
      alert(error.message || "Không thể xóa xe.");
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Đang tải danh sách xe...</div>;

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>Xe của nhà xe</h1>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.2fr)", gap: 20 }}>
        <section className="card">
          <h2 style={{ fontSize: 18, marginTop: 0 }}>Thêm xe mới</h2>
          <form onSubmit={handleCreateVehicle} style={{ display: "grid", gap: 14 }}>
            <FieldLabel label="Tên xe *" help="Tên nội bộ để nhận diện xe, ví dụ: Limousine 01.">
              <input
                required
                style={inputStyle}
                value={vehicleForm.name}
                onChange={(event) => updateVehicleForm("name", event.target.value)}
                placeholder="VD: Limousine 01"
              />
            </FieldLabel>

            <FieldLabel label="Biển số xe *" help="Nhập biển số thật của xe, tối thiểu 5 ký tự.">
              <input
                required
                minLength={5}
                maxLength={20}
                style={inputStyle}
                value={vehicleForm.licensePlate}
                onChange={(event) => updateVehicleForm("licensePlate", event.target.value)}
                placeholder="VD: 51B-12345"
              />
            </FieldLabel>

            <FieldLabel label="Loại xe *" help='Nếu nhập "Giường nằm 34", hệ thống sẽ tự tạo tất cả ghế nhanh là giường nằm.'>
              <input
                required
                style={inputStyle}
                value={vehicleForm.vehicleType}
                onChange={(event) => updateVehicleForm("vehicleType", event.target.value)}
                placeholder="VD: Giường nằm 34"
              />
            </FieldLabel>

            <FieldLabel label="Sức chứa *" help="Tổng số ghế tối đa của xe. Số ghế tạo ra không được vượt quá số này.">
              <input
                required
                min={1}
                type="number"
                style={inputStyle}
                value={vehicleForm.capacity}
                onChange={(event) => updateVehicleForm("capacity", event.target.value)}
                placeholder="VD: 34"
              />
            </FieldLabel>

            <button className="button primary" type="submit" disabled={savingVehicle}>
              {savingVehicle ? "Đang lưu..." : "Tạo xe"}
            </button>
          </form>
        </section>

        <section className="card">
          <h2 style={{ fontSize: 18, marginTop: 0 }}>Tạo ghế nhanh</h2>
          <form onSubmit={handleQuickCreateSeats} style={{ display: "grid", gap: 14 }}>
            <FieldLabel label="Xe cần tạo ghế *" help="Chọn xe đã tạo ở danh sách. Mỗi xe chỉ được tạo tối đa bằng sức chứa.">
              <select
                required
                style={inputStyle}
                value={quickSeatForm.vehicleId}
                onChange={(event) => updateQuickSeatForm("vehicleId", event.target.value)}
              >
                <option value="">Chọn xe cần tạo ghế</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.name} - {vehicle.licensePlate} ({vehicle._count?.seats ?? 0}/{vehicle.capacity} ghế)
                  </option>
                ))}
              </select>
            </FieldLabel>

            {selectedQuickVehicle && (
              <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
                Còn có thể tạo: <strong>{quickVehicleRemainingSeats}</strong> ghế. Loại ghế tự động:{" "}
                <strong>{quickSeatType === "sleeper" ? "Giường nằm" : "Ghế thường"}</strong>.
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <FieldLabel label="Tiền tố mã ghế *" help="Chữ đứng trước số ghế. Ví dụ nhập A sẽ tạo A01, A02...">
                <input
                  required
                  style={inputStyle}
                  value={quickSeatForm.prefix}
                  onChange={(event) => updateQuickSeatForm("prefix", event.target.value)}
                  placeholder="VD: A"
                />
              </FieldLabel>

              <FieldLabel label="Số bắt đầu *" help="Số đầu tiên trong dãy ghế. Thường nhập 1.">
                <input
                  required
                  min={1}
                  type="number"
                  style={inputStyle}
                  value={quickSeatForm.startNumber}
                  onChange={(event) => updateQuickSeatForm("startNumber", event.target.value)}
                  placeholder="VD: 1"
                />
              </FieldLabel>

              <FieldLabel label="Số lượng ghế *" help="Số ghế muốn tạo thêm, không vượt quá phần còn trống của xe.">
                <input
                  required
                  min={1}
                  max={quickVehicleRemainingSeats || undefined}
                  type="number"
                  style={inputStyle}
                  value={quickSeatForm.quantity}
                  onChange={(event) => updateQuickSeatForm("quantity", event.target.value)}
                  placeholder="VD: 34"
                />
              </FieldLabel>
            </div>

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
                />
              </FieldLabel>

              <FieldLabel label="Kiểu tầng" help="Xe 1 tầng chọn Một tầng. Xe giường nằm 2 tầng chọn Chia đều 2 tầng.">
                <select
                  style={inputStyle}
                  value={quickSeatForm.floorMode}
                  onChange={(event) => updateQuickSeatForm("floorMode", event.target.value)}
                >
                  <option value="auto">Một tầng</option>
                  <option value="two_floors">Chia đều 2 tầng</option>
                </select>
              </FieldLabel>
            </div>

            <div style={{ padding: 12, borderRadius: 8, background: "var(--primary-light)", color: "var(--primary-dark)", fontSize: 13 }}>
              Ví dụ: tiền tố <strong>A</strong>, số bắt đầu <strong>1</strong>, số lượng <strong>34</strong> sẽ tạo mã ghế từ{" "}
              <strong>A01</strong> đến <strong>A34</strong>.
            </div>

            <button
              className="button primary"
              type="submit"
              disabled={savingQuickSeats || !selectedQuickVehicle || quickVehicleRemainingSeats === 0}
            >
              {savingQuickSeats ? "Đang tạo ghế..." : "Tạo ghế nhanh"}
            </button>
          </form>
        </section>
      </div>

      <section className="card" style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 18, marginTop: 0 }}>Thêm 1 ghế thủ công</h2>
        <form onSubmit={handleCreateSeat} style={{ display: "grid", gridTemplateColumns: "1.2fr repeat(5, 1fr) auto", gap: 12, alignItems: "start" }}>
          <FieldLabel label="Xe *">
            <select
              required
              style={inputStyle}
              value={seatForm.vehicleId}
              onChange={(event) => updateSeatForm("vehicleId", event.target.value)}
            >
              <option value="">Chọn xe</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.name} - {vehicle.licensePlate}
                </option>
              ))}
            </select>
          </FieldLabel>

          <FieldLabel label="Mã ghế *" help="VD: A01">
            <input
              required
              style={inputStyle}
              value={seatForm.seatCode}
              onChange={(event) => updateSeatForm("seatCode", event.target.value)}
              placeholder="A01"
            />
          </FieldLabel>

          <FieldLabel label="Loại ghế">
            <select
              style={inputStyle}
              value={seatForm.seatType}
              onChange={(event) => updateSeatForm("seatType", event.target.value)}
            >
              <option value="standard">Ghế thường</option>
              <option value="sleeper">Giường nằm</option>
              <option value="vip">Ghế VIP</option>
            </select>
          </FieldLabel>

          <FieldLabel label="Tầng *">
            <input
              required
              min={1}
              type="number"
              style={inputStyle}
              value={seatForm.floor}
              onChange={(event) => updateSeatForm("floor", event.target.value)}
              placeholder="1"
            />
          </FieldLabel>

          <FieldLabel label="Hàng">
            <input
              min={1}
              type="number"
              style={inputStyle}
              value={seatForm.rowNumber}
              onChange={(event) => updateSeatForm("rowNumber", event.target.value)}
              placeholder="1"
            />
          </FieldLabel>

          <FieldLabel label="Cột">
            <input
              min={1}
              type="number"
              style={inputStyle}
              value={seatForm.colNumber}
              onChange={(event) => updateSeatForm("colNumber", event.target.value)}
              placeholder="1"
            />
          </FieldLabel>

          <button className="button primary" type="submit" disabled={savingSeat || vehicles.length === 0} style={{ marginTop: 26 }}>
            {savingSeat ? "Đang lưu..." : "Tạo ghế"}
          </button>
        </form>
      </section>

      {editingVehicle && (
        <section className="card" style={{ marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 18, margin: 0 }}>Sửa thông tin xe</h2>
              <div style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>
                Đã tạo {editingSeatCount}/{editingVehicle.capacity} ghế
              </div>
            </div>
            <button className="button outline" type="button" onClick={closeEditForm}>
              Hủy
            </button>
          </div>

          <form
            onSubmit={handleUpdateVehicle}
            style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }}
          >
            <input
              required
              style={inputStyle}
              value={vehicleForm.name}
              onChange={(event) => updateVehicleForm("name", event.target.value)}
              placeholder="Tên xe"
            />
            <input
              required
              minLength={5}
              maxLength={20}
              style={inputStyle}
              value={vehicleForm.licensePlate}
              onChange={(event) => updateVehicleForm("licensePlate", event.target.value)}
              placeholder="Biển số xe"
            />
            <input
              required
              style={inputStyle}
              value={vehicleForm.vehicleType}
              onChange={(event) => updateVehicleForm("vehicleType", event.target.value)}
              placeholder="Loại xe"
            />
            <input
              required
              min={editingSeatCount || 1}
              type="number"
              style={inputStyle}
              value={vehicleForm.capacity}
              onChange={(event) => updateVehicleForm("capacity", event.target.value)}
              placeholder="Sức chứa"
            />
            <select
              style={inputStyle}
              value={vehicleForm.status}
              onChange={(event) => updateVehicleForm("status", event.target.value)}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button className="button primary" type="submit" disabled={savingVehicle}>
              {savingVehicle ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </form>
        </section>
      )}

      <h2 style={{ fontSize: 18, marginTop: 32 }}>Danh sách xe</h2>
      <div
        className="card"
        style={{
          padding: 16,
          marginBottom: 16,
          display: "grid",
          gridTemplateColumns: "1.4fr minmax(160px, 1fr) minmax(160px, 1fr) auto",
          gap: 12,
          alignItems: "end",
        }}
      >
        <label>
          <span style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13 }}>Tìm kiếm</span>
          <input
            className="input"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tên xe, biển số..."
          />
        </label>
        <label>
          <span style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13 }}>Loại xe</span>
          <select className="input" value={vehicleTypeFilter} onChange={(event) => setVehicleTypeFilter(event.target.value)}>
            <option value="">Tất cả</option>
            {vehicleTypeOptions.map((vehicleType) => (
              <option key={vehicleType} value={vehicleType}>
                {vehicleType}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13 }}>Trạng thái</span>
          <select className="input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">Tất cả</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button
          className="button outline"
          type="button"
          onClick={() => {
            setSearchTerm("");
            setVehicleTypeFilter("");
            setStatusFilter("");
          }}
        >
          Xóa lọc
        </button>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Biển số</th>
              <th>Tên xe</th>
              <th>Loại xe</th>
              <th>Ghế</th>
              <th>Chuyến</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredVehicles.map((vehicle) => {
              const hasTrips = (vehicle._count?.trips ?? 0) > 0;

              return (
                <tr key={vehicle.id}>
                  <td style={{ fontWeight: 700 }}>{vehicle.licensePlate}</td>
                  <td>{vehicle.name}</td>
                  <td>{vehicle.vehicleType}</td>
                  <td>{vehicle._count?.seats ?? 0}/{vehicle.capacity}</td>
                  <td>{vehicle._count?.trips ?? 0}</td>
                  <td>
                    <select
                      style={{ ...inputStyle, width: 150, minHeight: 32, fontSize: 13 }}
                      value={vehicle.status}
                      onChange={(event) => handleStatusChange(vehicle, event.target.value)}
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        className="button outline"
                        type="button"
                        style={{ height: 28, fontSize: 12, padding: "0 12px" }}
                        onClick={() => openEditForm(vehicle)}
                      >
                        Sửa
                      </button>
                      <button
                        className="button"
                        type="button"
                        disabled={hasTrips}
                        title={hasTrips ? "Xe đã có chuyến, chỉ có thể ngừng hoạt động." : "Xóa xe"}
                        onClick={() => handleDeleteVehicle(vehicle)}
                        style={{
                          height: 28,
                          fontSize: 12,
                          padding: "0 12px",
                          background: hasTrips ? "#cbd5e1" : "#dc2626",
                          color: "white",
                        }}
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredVehicles.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 32 }}>
                  Chưa có xe nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
