"use client";

import { useEffect, useState } from "react";

import { partnerDashboardService } from "@/services/partnerDashboardService";

const inputStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 40,
  border: "1px solid var(--line)",
  borderRadius: "var(--radius)",
  padding: "0 12px",
  background: "white",
};

export default function PartnerVehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [savingSeat, setSavingSeat] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({
    licensePlate: "",
    name: "",
    vehicleType: "",
    capacity: "",
  });
  const [seatForm, setSeatForm] = useState({
    vehicleId: "",
    seatCode: "",
    seatType: "standard",
    floor: "1",
    rowNumber: "",
    colNumber: "",
  });

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const response = await partnerDashboardService.getVehicles();
      setVehicles(response.data.vehicles);
    } catch (error) {
      console.error(error);
      alert("Khong the tai danh sach xe.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const updateVehicleForm = (field: keyof typeof vehicleForm, value: string) => {
    setVehicleForm((current) => ({ ...current, [field]: value }));
  };

  const updateSeatForm = (field: keyof typeof seatForm, value: string) => {
    setSeatForm((current) => ({ ...current, [field]: value }));
  };

  const handleCreateVehicle = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingVehicle(true);
    try {
      await partnerDashboardService.createVehicle({
        licensePlate: vehicleForm.licensePlate,
        name: vehicleForm.name,
        vehicleType: vehicleForm.vehicleType,
        capacity: Number(vehicleForm.capacity),
      });
      setVehicleForm({ licensePlate: "", name: "", vehicleType: "", capacity: "" });
      await loadVehicles();
      alert("Tao xe thanh cong.");
    } catch (error: any) {
      alert(error.message || "Khong the tao xe.");
    } finally {
      setSavingVehicle(false);
    }
  };

  const handleCreateSeat = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingSeat(true);
    try {
      await partnerDashboardService.createVehicleSeat(Number(seatForm.vehicleId), {
        seatCode: seatForm.seatCode,
        seatType: seatForm.seatType,
        floor: Number(seatForm.floor),
        rowNumber: seatForm.rowNumber ? Number(seatForm.rowNumber) : undefined,
        colNumber: seatForm.colNumber ? Number(seatForm.colNumber) : undefined,
      });
      setSeatForm((current) => ({ ...current, seatCode: "", rowNumber: "", colNumber: "" }));
      await loadVehicles();
      alert("Tao ghe thanh cong.");
    } catch (error: any) {
      alert(error.message || "Khong the tao ghe.");
    } finally {
      setSavingSeat(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Dang tai danh sach xe...</div>;

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>Xe cua nha xe</h1>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 20 }}>
        <section className="card">
          <h2 style={{ fontSize: 18, marginTop: 0 }}>Them xe moi</h2>
          <form onSubmit={handleCreateVehicle} style={{ display: "grid", gap: 14 }}>
            <input
              required
              style={inputStyle}
              value={vehicleForm.name}
              onChange={(event) => updateVehicleForm("name", event.target.value)}
              placeholder="Ten xe"
            />
            <input
              required
              minLength={5}
              maxLength={20}
              style={inputStyle}
              value={vehicleForm.licensePlate}
              onChange={(event) => updateVehicleForm("licensePlate", event.target.value)}
              placeholder="Bien so xe"
            />
            <input
              required
              style={inputStyle}
              value={vehicleForm.vehicleType}
              onChange={(event) => updateVehicleForm("vehicleType", event.target.value)}
              placeholder="Loai xe"
            />
            <input
              required
              min={1}
              type="number"
              style={inputStyle}
              value={vehicleForm.capacity}
              onChange={(event) => updateVehicleForm("capacity", event.target.value)}
              placeholder="Suc chua"
            />
            <button className="button primary" type="submit" disabled={savingVehicle}>
              {savingVehicle ? "Dang luu..." : "Tao xe"}
            </button>
          </form>
        </section>

        <section className="card">
          <h2 style={{ fontSize: 18, marginTop: 0 }}>Them ghe cho xe</h2>
          <form onSubmit={handleCreateSeat} style={{ display: "grid", gap: 14 }}>
            <select
              required
              style={inputStyle}
              value={seatForm.vehicleId}
              onChange={(event) => updateSeatForm("vehicleId", event.target.value)}
            >
              <option value="">Chon xe</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.name} - {vehicle.licensePlate}
                </option>
              ))}
            </select>
            <input
              required
              style={inputStyle}
              value={seatForm.seatCode}
              onChange={(event) => updateSeatForm("seatCode", event.target.value)}
              placeholder="Ma ghe, vi du A01"
            />
            <select
              style={inputStyle}
              value={seatForm.seatType}
              onChange={(event) => updateSeatForm("seatType", event.target.value)}
            >
              <option value="standard">standard</option>
              <option value="sleeper">sleeper</option>
              <option value="vip">vip</option>
            </select>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              <input
                required
                min={1}
                type="number"
                style={inputStyle}
                value={seatForm.floor}
                onChange={(event) => updateSeatForm("floor", event.target.value)}
                placeholder="Tang"
              />
              <input
                min={1}
                type="number"
                style={inputStyle}
                value={seatForm.rowNumber}
                onChange={(event) => updateSeatForm("rowNumber", event.target.value)}
                placeholder="Hang"
              />
              <input
                min={1}
                type="number"
                style={inputStyle}
                value={seatForm.colNumber}
                onChange={(event) => updateSeatForm("colNumber", event.target.value)}
                placeholder="Cot"
              />
            </div>
            <button className="button primary" type="submit" disabled={savingSeat || vehicles.length === 0}>
              {savingSeat ? "Dang luu..." : "Tao ghe"}
            </button>
          </form>
        </section>
      </div>

      <h2 style={{ fontSize: 18, marginTop: 32 }}>Danh sach xe</h2>
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Bien so</th>
              <th>Ten xe</th>
              <th>Loai xe</th>
              <th>Ghe</th>
              <th>Chuyen</th>
              <th>Trang thai</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((vehicle) => (
              <tr key={vehicle.id}>
                <td style={{ fontWeight: 700 }}>{vehicle.licensePlate}</td>
                <td>{vehicle.name}</td>
                <td>{vehicle.vehicleType}</td>
                <td>{vehicle._count?.seats ?? 0}/{vehicle.capacity}</td>
                <td>{vehicle._count?.trips ?? 0}</td>
                <td>{vehicle.status}</td>
              </tr>
            ))}
            {vehicles.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 32 }}>
                  Chua co xe nao
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
