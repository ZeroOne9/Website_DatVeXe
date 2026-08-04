"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { adminService } from "@/services/adminService";

export default function AdminCreateBusCompanyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert("Vui lòng điền tên nhà xe.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
      };

      await adminService.createBusCompany(payload);
      alert("Thêm nhà xe thành công!");
      router.push("/admin/bus-companies");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Lỗi khi thêm nhà xe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/admin/bus-companies" className="button outline" style={{ height: 32, padding: "0 12px" }}>
          ← Quay lại
        </Link>
        <h1 style={{ fontSize: 24, margin: 0 }}>Thêm Nhà Xe Mới</h1>
      </div>

      <div className="card" style={{ padding: 32, maxWidth: 600 }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Tên nhà xe *</label>
            <input
              type="text"
              className="input"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="VD: Nhà xe Phương Trang"
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Số điện thoại</label>
              <input
                type="text"
                className="input"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="VD: 19001234"
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Email</label>
              <input
                type="email"
                className="input"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="VD: hotro@phuongtrang.com"
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Địa chỉ văn phòng</label>
            <input
              type="text"
              className="input"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="VD: 123 Lê Lợi, Q1, TP.HCM"
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <button type="submit" className="button" disabled={loading} style={{ width: "100%" }}>
              {loading ? "Đang xử lý..." : "Lưu nhà xe"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
