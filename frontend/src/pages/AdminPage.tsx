import { useState, useEffect } from "react";
import type { User, Product, Report, Category } from "../types/types";
import { API_BASE_URL } from "../services/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function AdminPage() {
  const [section, setSection] = useState<"user" | "product" | "report" | "stats">("user");
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<{ userCount?: number; productCount?: number; reportCount?: number }>({});

  const [categories, setCategories] = useState<Category[]>([]);
  const [filterKeyword, setFilterKeyword] = useState("");
  const [filterCategory, setFilterCategory] = useState<number | null>(null);

  // 상품 수정 상태
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editProductForm, setEditProductForm] = useState<Partial<Product>>({
    title: "",
    categoryId: undefined,
    startingPrice: undefined,
    productStatus: "ACTIVE",
  });

  // 회원 수정 상태
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editUserForm, setEditUserForm] = useState<{ nickName: string; password: string; phone: string }>({
    nickName: "",
    password: "",
    phone: "",
  });

  useEffect(() => {
    if (section === "user") fetchUsers();
    else if (section === "product") fetchProducts();
    else if (section === "report") fetchReports();
    else if (section === "stats") fetchStats();
    fetchCategories();
  }, [section]);

  // --- Fetch Functions ---
  const fetchUsers = async () => {
    const res = await fetch(`${API_BASE_URL}/api/users/admin`);
    const data = await res.json();
    setUsers(data);
  };

  const fetchProducts = async () => {
    let url = `${API_BASE_URL}/api/products/search?`;
    if (filterKeyword) url += `keyword=${filterKeyword}&`;
    if (filterCategory) url += `category=${filterCategory}&`;
    const res = await fetch(url);
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

  const fetchCategories = async () => {
    const res = await fetch(`${API_BASE_URL}/api/categories`);
    const data = await res.json();
    setCategories(data);
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

  const handleEditUserClick = (user: User) => {
    setEditingUserId(user.userId);
    setEditUserForm({
      nickName: user.nickName || "",
      password: "",
      phone: user.phone || "",
    });
  };

  const handleSaveUserClick = async (userId: number) => {
    await fetch(`${API_BASE_URL}/api/users/${userId}/mypage`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editUserForm),
    });
    setEditingUserId(null);
    fetchUsers();
  };

  const handleCancelUserClick = () => setEditingUserId(null);

  const handleEditProductClick = (product: Product) => {
    setEditingProductId(product.productId);
    setEditProductForm({
      title: product.title,
      categoryId: product.categoryId,
      startingPrice: product.startingPrice,
      productStatus: product.productStatus,
    });
  };

  const handleSaveProductClick = async (productId: number) => {
    await fetch(`${API_BASE_URL}/api/products/${productId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editProductForm),
    });
    setEditingProductId(null);
    fetchProducts();
  };

  const handleCancelProductClick = () => setEditingProductId(null);

  const handleDeleteProduct = async (productId: number) => {
    await fetch(`${API_BASE_URL}/api/products/${productId}`, { method: "DELETE" });
    fetchProducts();
  };

  const handleUpdateReportStatus = async (reportId: number, status: boolean) => {
    await fetch(`${API_BASE_URL}/api/reports/${reportId}/status?status=${status}`, { method: "PATCH" });
    fetchReports();
  };

  // --- Render ---
  return (
    <div className="admin-container">
      <aside className="admin-sidebar">
        <h2>관리자 페이지</h2>
        <ul>
          <li><button onClick={() => setSection("user")}>회원 관리</button></li>
          <li><button onClick={() => setSection("product")}>상품 관리</button></li>
          <li><button onClick={() => setSection("report")}>신고 관리</button></li>
          <li><button onClick={() => setSection("stats")}>통계</button></li>
        </ul>
      </aside>

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
                          value={editUserForm.nickName}
                          onChange={e => setEditUserForm({ ...editUserForm, nickName: e.target.value })}
                        />
                      ) : u.nickName}
                    </td>
                    <td>{u.email}</td>
                    <td>
                      {editingUserId === u.userId ? (
                        <input
                          value={editUserForm.phone}
                          onChange={e => setEditUserForm({ ...editUserForm, phone: e.target.value })}
                        />
                      ) : u.phone}
                    </td>
                    <td>{u.createdAt ? new Date(u.createdAt).toLocaleString() : "-"}</td>
                    <td>{u.updatedAt ? new Date(u.updatedAt).toLocaleString() : "-"}</td>
                    <td>
                      {editingUserId === u.userId ? (
                        <>
                          <input
                            type="password"
                            placeholder="새 비밀번호"
                            value={editUserForm.password}
                            onChange={e => setEditUserForm({ ...editUserForm, password: e.target.value })}
                          />
                          <button onClick={() => handleSaveUserClick(u.userId)}>저장</button>
                          <button onClick={handleCancelUserClick}>취소</button>
                        </>
                      ) : (
                        <>
                          <select
                            value={u.role}
                            onChange={e => handleChangeRole(u.userId, e.target.value as User["role"])}
                          >
                            <option value="USER">USER</option>
                            <option value="BANNED">BANNED</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                          <button onClick={() => handleEditUserClick(u)}>수정</button>
                        </>
                      )}
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
            <div style={{ marginBottom: "1rem" }}>
              <input
                placeholder="상품명 검색"
                value={filterKeyword}
                onChange={e => setFilterKeyword(e.target.value)}
              />
              <select
                value={filterCategory ?? ""}
                onChange={e => setFilterCategory(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">전체 카테고리</option>
                {categories.map(c => (
                  <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
                ))}
              </select>
              <button onClick={fetchProducts}>검색</button>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>상품명</th>
                  <th>카테고리</th>
                  <th>가격</th>
                  <th>상태</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.productId}>
                    <td>{p.productId}</td>
                    <td>
                      {editingProductId === p.productId ? (
                        <input
                          value={editProductForm.title ?? ""}
                          onChange={e => setEditProductForm({ ...editProductForm, title: e.target.value })}
                        />
                      ) : p.title}
                    </td>
                    <td>
                      {editingProductId === p.productId ? (
                        <select
                          value={editProductForm.categoryId ?? ""}
                          onChange={e => setEditProductForm({ ...editProductForm, categoryId: Number(e.target.value) })}
                        >
                          {categories.map(c => (
                            <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
                          ))}
                        </select>
                      ) : (
                        p.categoryName ?? categories.find(c => c.categoryId === p.categoryId)?.name ?? "-"
                      )}
                    </td>
                    <td>
                      {editingProductId === p.productId ? (
                        <input
                          type="number"
                          value={editProductForm.startingPrice ?? 0}
                          onChange={e => setEditProductForm({ ...editProductForm, startingPrice: Number(e.target.value) })}
                        />
                      ) : (
                        p.price ?? p.startingPrice ?? 0
                      )}
                    </td>
                    <td>
                      {editingProductId === p.productId ? (
                        <select
                          value={editProductForm.productStatus ?? "ACTIVE"}
                          onChange={e => setEditProductForm({ ...editProductForm, productStatus: e.target.value })}
                        >
                          <option value="ACTIVE">판매중</option>
                          <option value="SOLD">판매완료</option>
                          <option value="CLOSED">비활성</option>
                        </select>
                      ) : (
                        p.productStatus ?? "-"
                      )}
                    </td>
                    <td>
                      {editingProductId === p.productId ? (
                        <>
                          <button onClick={() => handleSaveProductClick(p.productId)}>저장</button>
                          <button onClick={handleCancelProductClick}>취소</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleEditProductClick(p)}>수정</button>
                          <button className="delete-btn" onClick={() => handleDeleteProduct(p.productId)}>삭제</button>
                        </>
                      )}
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
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={[
                  { name: "회원", count: stats.userCount ?? 0 },
                  { name: "상품", count: stats.productCount ?? 0 },
                  { name: "신고", count: stats.reportCount ?? 0 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
