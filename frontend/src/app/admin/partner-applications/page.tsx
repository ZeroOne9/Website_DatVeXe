"use client";

import { useCallback, useEffect, useState } from "react";
import { adminService } from "@/services/adminService";

export default function AdminPartnerApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const loadApplications = useCallback(async () => {
    try {
      setLoading(true);
      const queryStatus = statusFilter === "all" ? undefined : statusFilter;
      const res = await adminService.getPartnerApplications(queryStatus);
      setApplications(res.data.applications || []);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Lỗi tải danh sách hồ sơ");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleApprove = async (id: number, name: string) => {
    if (!confirm(`Bạn có chắc muốn DUYỆT hồ sơ của nhà xe "${name}" không? Hệ thống sẽ tự động tạo một Nhà Xe mới.`)) return;
    try {
      await adminService.approvePartnerApplication(id);
      alert("Đã duyệt hồ sơ và tạo nhà xe thành công!");
      loadApplications();
    } catch (err: any) {
      alert(err.message || "Lỗi khi duyệt hồ sơ");
    }
  };

  const handleReject = async (id: number, name: string) => {
    if (!confirm(`Bạn có chắc muốn TỪ CHỐI hồ sơ của nhà xe "${name}"?`)) return;
    try {
      await adminService.rejectPartnerApplication(id);
      alert("Đã từ chối hồ sơ.");
      loadApplications();
    } catch (err: any) {
      alert(err.message || "Lỗi khi từ chối hồ sơ");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>Duyệt Hồ Sơ Nhà Xe</h1>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <select 
            className="input" 
            style={{ height: 36, padding: "0 12px" }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ duyệt (Pending)</option>
            <option value="approved">Đã duyệt (Approved)</option>
            <option value="rejected">Từ chối (Rejected)</option>
          </select>
          <button className="button outline" onClick={loadApplications}>Làm mới</button>
        </div>
      </div>

      <div className="admin-table-container">
        {loading ? (
          <div style={{ padding: 40, textAlign: "center" }}>Đang tải...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên Đăng Ký</th>
                <th>Người Liên Hệ</th>
                <th>Liên Lạc</th>
                <th>Thời Gian Nộp</th>
                <th>Trạng Thái</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {applications.map(app => (
                <tr key={app.id}>
                  <td>{app.id}</td>
                  <td style={{ fontWeight: 600 }}>{app.companyName}</td>
                  <td>{app.contactName}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{app.phone}</div>
                    <div style={{ fontSize: 13, color: "var(--muted)" }}>{app.email || "---"}</div>
                    <div style={{ fontSize: 13, color: "var(--primary)", marginTop: 4 }}>
                      TK: {app.accountEmail || "Chua co"}
                    </div>
                  </td>
                  <td>{new Date(app.createdAt).toLocaleDateString("vi-VN")}</td>
                  <td>
                    <span style={{ 
                      padding: "4px 8px", 
                      borderRadius: 4, 
                      fontSize: 12, 
                      fontWeight: 500,
                      background: app.status === "approved" ? "#d4edda" : app.status === "pending" ? "#fff3cd" : "#f8d7da",
                      color: app.status === "approved" ? "#155724" : app.status === "pending" ? "#856404" : "#721c24"
                    }}>
                      {app.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    {app.status === "pending" ? (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button 
                          className="button" 
                          style={{ height: 28, fontSize: 12, padding: "0 12px", background: "var(--green)" }}
                          onClick={() => handleApprove(app.id, app.companyName)}
                        >
                          Duyệt
                        </button>
                        <button 
                          className="button outline" 
                          style={{ height: 28, fontSize: 12, padding: "0 12px", color: "var(--red)", borderColor: "var(--red)" }}
                          onClick={() => handleReject(app.id, app.companyName)}
                        >
                          Từ chối
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: 13, color: "var(--muted)" }}>Đã xử lý</span>
                    )}
                  </td>
                </tr>
              ))}
              {applications.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
                    Không có hồ sơ nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
