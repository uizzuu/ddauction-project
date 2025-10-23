import { useState, useEffect } from "react";
import type { User, Product, Report } from "../types/types";
import { API_BASE_URL } from "../services/api";

export default function AdminPage() {
  const [section, setSection] = useState<"user" | "product" | "report" | "stats">("user");
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<{ userCount?: number; productCount?: number; reportCount?: number }>({});

  // 수정용 상태
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ nickName: string; password: string; phone: string }>({
    nickName: "",
    password: "",
    phone: "",
  });

  useEffect(() => {
    if (section === "user") fetchUsers();
    else if (section === "product") fetchProducts();
    else if (section === "report") fetchReports();
    else if (section === "stats") fetchStats();
  }, [section]);

  // --- Fetch Functions ---
  const fetchUsers = async () => {
    const res = await fetch(`${API_BASE_URL}/api/users/admin`);
    const data = await res.json();
    setUsers(data);
  };

  const fetchProducts = async () => {
    const res = await fetch(`${API_BASE_URL}/admin/products`);
    const data = await res.json();
    setProducts(data);
  };

  const fetchReports = async () => {
    const res = await fetch(`${API_BASE_URL}/api/reports/admin`);
    const data = await res.json();
    setReports(data);
  };

  const fetchStats = async () => {
    const res = await fetch(`${API_BASE_URL}/admin/stats`);
    const data = await res.json();
    setStats(data);
  };

  // --- Actions ---
  const handleChangeRole = async (userId: number, newRole: User["role"]) => {
    await fetch(`${API_BASE_URL}/api/users/${userId}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    fetchUsers();
  };

  const handleDeleteProduct = async (productId: number) => {
    await fetch(`${API_BASE_URL}/admin/products/${productId}`, { method: "DELETE" });
    fetchProducts();
  };

  const handleUpdateReportStatus = async (reportId: number, status: boolean) => {
    await fetch(`${API_BASE_URL}/api/reports/${reportId}/status?status=${status}`, { method: "PATCH" });
    fetchReports();
  };

  // --- 회원 수정 ---
  const handleEditClick = (user: User) => {
    setEditingUserId(user.userId);
    setEditForm({
      nickName: user.nickName || "",
      password: "",
      phone: user.phone || "",
    });
  };

  const handleSaveClick = async (userId: number) => {
    await fetch(`${API_BASE_URL}/api/users/${userId}/mypage`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setEditingUserId(null);
    fetchUsers();
  };

  const handleCancelClick = () => {
    setEditingUserId(null);
  };

  return (
    <div className="admin-container">
      {/* 사이드바 */}
      <aside className="admin-sidebar">
        <h2>관리자 페이지</h2>
        <ul>
          <li><button onClick={() => setSection("user")}>회원 관리</button></li>
          <li><button onClick={() => setSection("product")}>상품 관리</button></li>
          <li><button onClick={() => setSection("report")}>신고 관리</button></li>
          <li><button onClick={() => setSection("stats")}>통계</button></li>
        </ul>
      </aside>

      {/* 메인 컨텐츠 */}
      <main className="admin-main">
        {/* 회원 관리 */}
        {section === "user" && (
          <div className="admin-section">
            <h3>회원 관리</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>이름</th>
                  <th>닉네임</th>
                  <th>이메일</th>
                  <th>전화번호</th>
                  <th>가입일</th>
                  <th>최종수정일</th>
                  <th>권한 / 수정</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.userId}>
                    <td>{u.userId}</td>
                    <td>{u.userName}</td>
                    <td>
                      {editingUserId === u.userId ? (
                        <input
                          value={editForm.nickName}
                          onChange={e => setEditForm({ ...editForm, nickName: e.target.value })}
                        />
                      ) : (
                        u.nickName
                      )}
                    </td>
                    <td>{u.email}</td>
                    <td>
                      {editingUserId === u.userId ? (
                        <input
                          value={editForm.phone}
                          onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                        />
                      ) : (
                        u.phone
                      )}
                    </td>
                    <td>{u.createdAt ? new Date(u.createdAt).toLocaleString() : "-"}</td>
                    <td>{u.updatedAt ? new Date(u.updatedAt).toLocaleString() : "-"}</td>
                    <td>
                      {editingUserId === u.userId ? (
                        <>
                          <input
                            type="password"
                            placeholder="새 비밀번호"
                            value={editForm.password}
                            onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                          />
                          <button onClick={() => handleSaveClick(u.userId)}>저장</button>
                          <button onClick={handleCancelClick}>취소</button>
                        </>
                      ) : (
                        <select
                          value={u.role}
                          onChange={e => handleChangeRole(u.userId, e.target.value as User["role"])}
                        >
                          <option value="USER">USER</option>
                          <option value="BANNED">BANNED</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      )}
                      {!editingUserId && <button onClick={() => handleEditClick(u)}>수정</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 상품 관리 */}
        {section === "product" && (
          <div className="admin-section">
            <h3>상품 관리</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>상품명</th>
                  <th>카테고리</th>
                  <th>가격</th>
                  <th>상태</th>
                  <th>삭제</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.productId}>
                    <td>{p.productId}</td>
                    <td>{p.title}</td>
                    <td>{p.categoryName}</td>
                    <td>{p.price ?? "-"}</td>
                    <td>{p.productStatus}</td>
                    <td>
                      <button className="delete-btn" onClick={() => handleDeleteProduct(p.productId)}>삭제</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 신고 관리 */}
        {section === "report" && (
          <div className="admin-section">
            <h3>신고 관리</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>신고자 ID</th>
                  <th>대상 ID</th>
                  <th>사유</th>
                  <th>상태</th>
                  <th>처리</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.reportId}>
                    <td>{r.reportId}</td>
                    <td>{r.reporterId}</td>
                    <td>{r.targetId}</td>
                    <td>{r.reason}</td>
                    <td>{r.status ? "처리 완료" : "보류 중"}</td>
                    <td>
                      <select
                        defaultValue={r.status ? "true" : "false"}
                        onChange={e => handleUpdateReportStatus(r.reportId, e.target.value === "true")}
                      >
                        <option value="false">보류</option>
                        <option value="true">처리 완료</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 통계 */}
        {section === "stats" && (
          <div className="admin-section">
            <h3>통계</h3>
            <p>회원 수: {stats.userCount ?? 0}</p>
            <p>상품 수: {stats.productCount ?? 0}</p>
            <p>신고 수: {stats.reportCount ?? 0}</p>
          </div>
        )}
      </main>
    </div>
  );
}
// 