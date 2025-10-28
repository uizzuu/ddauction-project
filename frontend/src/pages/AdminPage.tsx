import { useState, useEffect, useCallback } from "react";
import type {
  User,
  Product,
  Report,
  Category,
  EditProductForm,
  Inquiry
} from "../types/types";
import { PRODUCT_STATUS } from "../types/types";
import { API_BASE_URL } from "../services/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function AdminPage() {
  const [section, setSection] = useState<
    "user" | "product" | "report" | "stats" | "inquiry"
  >("user");
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<{
    userCount?: number;
    productCount?: number;
    reportCount?: number;
  }>({});

  const [categories, setCategories] = useState<Category[]>([]);
  const [filterKeyword, setFilterKeyword] = useState("");
  const [filterCategory, setFilterCategory] = useState<number | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);


  // --- 회원 필터 상태 ---
  const [userFilterField, setUserFilterField] = useState<
    "userName" | "nickName" | "email" | "phone"
  >("userName");
  const [userFilterKeyword, setUserFilterKeyword] = useState("");

  // 상품 수정 상태
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editProductForm, setEditProductForm] = useState<EditProductForm>({
    title: "",
    categoryId: undefined,
    startingPrice: undefined,
    productStatus: PRODUCT_STATUS[0],
  });

  // 회원 수정 상태
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editUserForm, setEditUserForm] = useState<{
    nickName: string;
    password: string;
    phone: string;
  }>({
    nickName: "",
    password: "",
    phone: "",
  });
   // ===================================
  // 통계 데이터 가져오기
  // ===================================
 const fetchStats = useCallback(async () => {
  try {
    const token = localStorage.getItem("token"); // 로그인 후 저장된 토큰
    if (!token) {
      console.error("토큰이 없습니다. 관리자 로그인 필요");
      return;
    }

    const res = await fetch(`${API_BASE_URL}/admin/stats`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // 토큰 포함
      },
    });

    if (!res.ok) {
      console.error("통계 데이터 조회 실패:", res.status);
      return;
    }

    const data = await res.json();
    setStats({
      userCount: data.userCount,
      productCount: data.productCount,
      reportCount: data.reportCount,
    });
  } catch (err) {
    console.error(err);
  }
}, []);


  useEffect(() => {
    if (section === "stats") {
      fetchStats();
    }
  }, [section, fetchStats]);


  const fetchUsers = useCallback(async () => {
    let url = `${API_BASE_URL}/api/users`;

    if (userFilterKeyword) {
      url += "?"; // ? 추가
      if (userFilterField === "userName")
        url += `userName=${encodeURIComponent(userFilterKeyword)}`;
      else if (userFilterField === "nickName")
        url += `nickName=${encodeURIComponent(userFilterKeyword)}`;
      else if (userFilterField === "email")
        url += `email=${encodeURIComponent(userFilterKeyword)}`;
      else if (userFilterField === "phone")
        url += `phone=${encodeURIComponent(userFilterKeyword)}`;
    }

    const token = localStorage.getItem("token");
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    if (!res.ok) {
      console.error("회원 조회 실패:", res.status);
      setUsers([]);
      return;
    }

    const data = await res.json();
    setUsers(data);
  }, [userFilterKeyword, userFilterField]);


  const fetchProducts = useCallback(async () => {
    let url = `${API_BASE_URL}/api/products/search?`;
    if (filterKeyword) url += `keyword=${filterKeyword}&`;
    if (filterCategory) url += `category=${filterCategory}&`;

    const token = localStorage.getItem("token");
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });
    const data = await res.json();
    setProducts(data);
  }, [filterKeyword, filterCategory]);

  const fetchReports = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/reports/admin`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (!res.ok) {
        console.error("신고 조회 실패:", res.status);
        setReports([]);
        return;
      }
      const data = await res.json();
      setReports(data);
    } catch (err) {
      console.error(err);
      setReports([]);
    }
  }, []);

  // const fetchStats = useCallback(async () => {
  //   const res = await fetch(`${API_BASE_URL}/admin/stats`);
  //   const data = await res.json();
  //   setStats(data);
  // }, []);

  const fetchCategories = useCallback(async () => {
    const res = await fetch(`${API_BASE_URL}/api/categories`);
    const data = await res.json();
    setCategories(data);
  }, []);

  useEffect(() => {
    if (section === "user") fetchUsers();
    else if (section === "product") fetchProducts();
    else if (section === "report") fetchReports();
    else if (section === "stats") fetchStats();
    fetchCategories();
  }, [
    section,
    fetchUsers,
    fetchProducts,
    fetchReports,
    fetchStats,
    fetchCategories,
  ]);

  const handleChangeRole = async (userId: number, newRole: User["role"]) => {
    const token = localStorage.getItem("token");
    await fetch(`${API_BASE_URL}/api/users/${userId}/admin`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : ""
      },
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
    try {
      const payload: any = { nickName: editUserForm.nickName, phone: editUserForm.phone };
      if (editUserForm.password) payload.password = editUserForm.password;

      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/users/${userId}/admin`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(payload),
      });


      if (!res.ok) {
        console.error("회원 수정 실패:", res.status);
        alert("회원 수정에 실패했습니다.");
        return;
      }

      setEditingUserId(null);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("회원 수정 중 오류가 발생했습니다.");
    }
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
    try {
      const payload: any = {
        title: editProductForm.title,
        categoryId: editProductForm.categoryId,
        startingPrice: editProductForm.startingPrice,
        productStatus: editProductForm.productStatus,
      };

      const res = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error("상품 수정 실패:", res.status);
        alert("상품 수정에 실패했습니다.");
        return;
      }

      setEditingProductId(null);
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert("상품 수정 중 오류가 발생했습니다.");
    }
  };

  const handleCancelProductClick = () => setEditingProductId(null);

  const handleDeleteProduct = async (productId: number) => {
    await fetch(`${API_BASE_URL}/api/products/${productId}`, {
      method: "DELETE",
    });
    fetchProducts();
  };

  const handleUpdateReportStatus = async (reportId: number, status: boolean) => {
    try {
      const token = localStorage.getItem("token"); // JWT 가져오기
      const res = await fetch(
        `${API_BASE_URL}/api/reports/${reportId}/status?status=${status}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      if (!res.ok) {
        console.error("신고 상태 변경 실패:", res.status);
        return;
      }

      fetchReports(); // 상태 변경 후 화면 갱신
    } catch (err) {
      console.error("신고 상태 변경 중 오류 발생:", err);
    }
  };


  const handleProductStatusChange = (value: string) => {
    if (PRODUCT_STATUS.includes(value as Product["productStatus"])) {
      setEditProductForm({
        ...editProductForm,
        productStatus: value as Product["productStatus"],
      });
    }
  };

  const fetchInquiries = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/inquiry/admin`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!res.ok) {
        console.error("문의 조회 실패:", res.status);
        setInquiries([]);
        return;
      }

      const data: any[] = await res.json();
      console.log("📬 관리자 문의 데이터:", data);

      // Inquiry 타입에 맞춰서 매핑
      const mapped: Inquiry[] = data.map((d, idx) => {
        // content 안에 [답변]:이 있는 경우 분리
        const [questionPart, answerPart] = d.content.split("[답변]:");

        return {
          inquiryId: d.articleId,
          title: d.title,
          question: questionPart.trim(),
          createdAt: d.createdAt,
          answers: answerPart
            ? [
              {
                inquiryReviewId: idx + 1, // 백엔드에서 답변 id가 따로 없으니 임시 번호
                answer: answerPart.trim(),
                nickName: "관리자",
                createdAt: d.updatedAt,
              },
            ]
            : [],
          newAnswer: "",
        };
      });

      setInquiries(mapped);
    } catch (err) {
      console.error("문의 불러오기 실패:", err);
      setInquiries([]);
    }
  };




  const handleSaveInquiryAnswer = async (inquiryId: number, answer?: string) => {
    if (!answer) return alert("답변을 입력해주세요.");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/inquiry/${inquiryId}/answer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ answer }),
      });
      if (!res.ok) throw new Error("답변 저장 실패");

      alert("답변이 등록되었습니다.");
      fetchInquiries(); // 화면 갱신
    } catch (err) {
      console.error(err);
      alert("답변 등록 중 오류가 발생했습니다.");
    }
  };


  return (
    <div className="admin-container">
      <aside className="admin-sidebar">
        <h2>관리자 페이지</h2>
        <ul>
          <li>
            <button onClick={() => setSection("user")}>회원 관리</button>
          </li>
          <li>
            <button onClick={() => setSection("product")}>상품 관리</button>
          </li>
          <li>
            <button onClick={() => setSection("report")}>신고 관리</button>
          </li>
          <li>
            <button onClick={() => setSection("stats")}>통계</button>
          </li>
          <li>
            <button onClick={() => { setSection("inquiry"); fetchInquiries(); }}>
              1:1 문의 관리
            </button>
          </li>

        </ul>
      </aside>

      <main className="admin-main">
        {/* 회원 관리 */}
        {section === "user" && (
          <div className="admin-section">
            <h3>회원 관리</h3>

            {/* --- 회원 필터 UI --- */}
            <div style={{ marginBottom: "1rem" }}>
              <select
                value={userFilterField}
                onChange={(e) =>
                  setUserFilterField(
                    e.target.value as
                    | "userName"
                    | "nickName"
                    | "email"
                    | "phone"
                  )
                }
              >
                <option value="userName">이름</option>
                <option value="nickName">닉네임</option>
                <option value="email">이메일</option>
                <option value="phone">전화번호</option>
              </select>
              <input
                placeholder="검색어 입력"
                value={userFilterKeyword}
                onChange={(e) => setUserFilterKeyword(e.target.value)}
              />
              <button onClick={fetchUsers}>검색</button>
            </div>

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
                  <th>권한</th>
                  <th>수정</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.userId}>
                    <td>{u.userId}</td>
                    <td>{u.userName}</td>
                    <td>
                      {editingUserId === u.userId ? (
                        <input
                          value={editUserForm.nickName}
                          onChange={(e) =>
                            setEditUserForm({ ...editUserForm, nickName: e.target.value })
                          }
                        />
                      ) : (
                        u.nickName
                      )}
                    </td>
                    <td>{u.email}</td>
                    <td>
                      {editingUserId === u.userId ? (
                        <input
                          value={editUserForm.phone}
                          onChange={(e) =>
                            setEditUserForm({ ...editUserForm, phone: e.target.value })
                          }
                        />
                      ) : (
                        u.phone
                      )}
                    </td>
                    <td>{u.createdAt ? new Date(u.createdAt).toLocaleString() : "-"}</td>
                    <td>{u.updatedAt ? new Date(u.updatedAt).toLocaleString() : "-"}</td>

                    {/* 권한 칸 */}
                    <td>
                      <select
                        value={u.role}
                        onChange={(e) =>
                          handleChangeRole(u.userId, e.target.value as User["role"])
                        }
                      >
                        <option value="USER">USER</option>
                        <option value="BANNED">BANNED</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>

                    {/* 수정 칸 */}
                    <td>
                      {editingUserId === u.userId ? (
                        <>
                          <input
                            type="password"
                            placeholder="새 비밀번호"
                            value={editUserForm.password}
                            onChange={(e) =>
                              setEditUserForm({ ...editUserForm, password: e.target.value })
                            }
                          />
                          <button onClick={() => handleSaveUserClick(u.userId)}>저장</button>
                          <button onClick={handleCancelUserClick}>취소</button>
                        </>
                      ) : (
                        <button onClick={() => handleEditUserClick(u)}>수정</button>
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
                onChange={(e) => setFilterKeyword(e.target.value)}
              />
              <select
                value={filterCategory ?? ""}
                onChange={(e) =>
                  setFilterCategory(
                    e.target.value ? Number(e.target.value) : null
                  )
                }
              >
                <option value="">전체 카테고리</option>
                {categories.map((c) => (
                  <option key={c.categoryId} value={c.categoryId}>
                    {c.name}
                  </option>
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
                {products.map((p) => (
                  <tr key={p.productId}>
                    <td>{p.productId}</td>
                    <td>
                      {editingProductId === p.productId ? (
                        <input
                          value={editProductForm.title ?? ""}
                          onChange={(e) =>
                            setEditProductForm({
                              ...editProductForm,
                              title: e.target.value,
                            })
                          }
                        />
                      ) : (
                        p.title
                      )}
                    </td>
                    <td>
                      {editingProductId === p.productId ? (
                        <select
                          value={editProductForm.categoryId ?? ""}
                          onChange={(e) =>
                            setEditProductForm({
                              ...editProductForm,
                              categoryId: Number(e.target.value),
                            })
                          }
                        >
                          {categories.map((c) => (
                            <option key={c.categoryId} value={c.categoryId}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        p.categoryName ??
                        categories.find(
                          (c) => c.categoryId === p.categoryId
                        )?.name ??
                        "-"
                      )}
                    </td>
                    <td>
                      {editingProductId === p.productId ? (
                        <input
                          type="number"
                          value={editProductForm.startingPrice ?? 0}
                          onChange={(e) =>
                            setEditProductForm({
                              ...editProductForm,
                              startingPrice: Number(e.target.value),
                            })
                          }
                        />
                      ) : (
                        p.startingPrice ?? 0
                      )}
                    </td>
                    <td>
                      {editingProductId === p.productId ? (
                        <select
                          value={
                            editProductForm.productStatus ?? PRODUCT_STATUS[0]
                          }
                          onChange={(e) =>
                            handleProductStatusChange(e.target.value)
                          }
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
                          <button
                            onClick={() => handleSaveProductClick(p.productId)}
                          >
                            저장
                          </button>
                          <button onClick={handleCancelProductClick}>
                            취소
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleEditProductClick(p)}>
                            수정
                          </button>
                          <button
                            className="delete-btn"
                            onClick={() => handleDeleteProduct(p.productId)}
                          >
                            삭제
                          </button>
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
                {reports.map((r) => (
                  <tr key={r.reportId}>
                    <td>{r.reportId}</td>
                    <td>{r.reporterId}</td>
                    <td>{r.targetId}</td>
                    <td>{r.reason}</td>
                    <td>{r.status ? "처리 완료" : "보류 중"}</td>
                    <td>
                      <select
                        defaultValue={r.status ? "true" : "false"}
                        onChange={(e) =>
                          handleUpdateReportStatus(
                            r.reportId,
                            e.target.value === "true"
                          )
                        }
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
                <BarChart
                  data={[
                    { name: "회원", count: stats.userCount ?? 0 },
                    { name: "상품", count: stats.productCount ?? 0 },
                    { name: "신고", count: stats.reportCount ?? 0 },
                  ]}
                >
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
        
        {/* 1:1 문의 관리 */}
        {section === "inquiry" && (
          <div className="admin-section">
            <h3>1:1 문의 관리</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>제목</th>
                  <th>질문</th>
                  <th>답변</th>
                  <th>작성일</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.length > 0 ? (
                  inquiries.map((inq) => (
                    <tr key={inq.inquiryId}>
                      <td>{inq.inquiryId}</td>
                      <td>{inq.title}</td>
                      <td>{inq.question}</td>
                      <td>
                        {inq.answers?.length > 0 && inq.answers.map((a) => (
                          <div key={a.inquiryReviewId}>
                            <strong>{a.nickName}</strong>: {a.answer}
                          </div>
                        ))}

                        {/* 관리자가 새 답변 작성 가능 */}
                        <input
                          type="text"
                          placeholder="답변 입력"
                          value={inq.newAnswer}
                          onChange={(e) => {
                            setInquiries(prev =>
                              prev.map(i =>
                                i.inquiryId === inq.inquiryId
                                  ? { ...i, newAnswer: e.target.value }
                                  : i
                              )
                            );
                          }}
                        />
                        <button onClick={() => handleSaveInquiryAnswer(inq.inquiryId, inq.newAnswer)}>
                          답변 등록
                        </button>
                      </td>
                      <td>{new Date(inq.createdAt).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5}>문의 내역이 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

      </main>
    </div>
  );
}





