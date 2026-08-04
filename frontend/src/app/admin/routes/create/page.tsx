"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { adminService } from "@/services/adminService";

export default function AdminCreateRoutePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [locations, setLocations] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    departureLocationId: "",
    destinationLocationId: "",
    distanceKm: "",
    estimatedMinutes: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await adminService.getLocations();
        setLocations(res.data.locations || []);
      } catch (err) {
        console.error(err);
        alert("Lỗi khi tải danh sách địa điểm");
      } finally {
        setInitialLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.departureLocationId || !formData.destinationLocationId) {
      alert("Vui lòng chọn Điểm đi và Điểm đến.");
      return;
    }

    if (formData.departureLocationId === formData.destinationLocationId) {
      alert("Điểm đi và Điểm đến phải khác nhau.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        departureLocationId: parseInt(formData.departureLocationId),
        destinationLocationId: parseInt(formData.destinationLocationId),
        distanceKm: formData.distanceKm ? parseFloat(formData.distanceKm) : undefined,
        estimatedMinutes: formData.estimatedMinutes ? parseInt(formData.estimatedMinutes) : undefined,
      };

      await adminService.createRoute(payload);
      alert("Tạo tuyến xe thành công!");
      router.push("/admin/routes");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Lỗi khi tạo tuyến xe");
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div style={{ padding: 40, textAlign: "center" }}>Đang tải danh sách địa điểm...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/admin/routes" className="button outline" style={{ height: 32, padding: "0 12px" }}>
            ← Quay lại
          </Link>
          <h1 style={{ fontSize: 24, margin: 0 }}>Tạo Tuyến Xe Mới</h1>
        </div>
        <Link href="/admin/locations" className="button outline" style={{ height: 32, padding: "0 12px" }}>
          + Thêm địa điểm
        </Link>
      </div>

      {locations.length === 0 && (
        <div className="message" style={{ marginBottom: 20 }}>
          Chưa có địa điểm nào. Hãy thêm địa điểm trước, sau đó quay lại tạo tuyến xe.
        </div>
      )}

      <div className="card" style={{ padding: 32, maxWidth: 600 }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Điểm xuất phát *</label>
            <select
              className="input"
              name="departureLocationId"
              value={formData.departureLocationId}
              onChange={handleChange}
              required
            >
              <option value="">-- Chọn điểm xuất phát --</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.province})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Điểm đến *</label>
            <select
              className="input"
              name="destinationLocationId"
              value={formData.destinationLocationId}
              onChange={handleChange}
              required
            >
              <option value="">-- Chọn điểm đến --</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.province})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Quãng đường (km)</label>
              <input
                type="number"
                className="input"
                name="distanceKm"
                value={formData.distanceKm}
                onChange={handleChange}
                placeholder="VD: 120"
                min="0"
                step="0.1"
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Thời gian dự kiến (phút)</label>
              <input
                type="number"
                className="input"
                name="estimatedMinutes"
                value={formData.estimatedMinutes}
                onChange={handleChange}
                placeholder="VD: 150"
                min="0"
              />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <button type="submit" className="button" disabled={loading || locations.length < 2} style={{ width: "100%" }}>
              {loading ? "Đang xử lý..." : "Lưu tuyến xe"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
