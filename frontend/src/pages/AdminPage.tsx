import { useState, useEffect, useCallback } from "react";
import type {
  User,
  Product,
  Report,
  Category,
  EditProductForm,
  Inquiry,
} from "../types/types";
import { PRODUCT_STATUS } from "../types/types";
import { API_BASE_URL } from "../services/api";

// 분리된 컴포넌트 임포트
import UserManagement from "../components/admin/UserManagement";
import ProductManagement from "../components/admin/ProductManagement";
import ReportManagement from "../components/admin/ReportManagement";
import StatsManagement from "../components/admin/StatsManagement";
import InquiryManagement from "../components/admin/InquiryManagement";

// Recharts 관련 import 제거됨

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
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);

  // --- 상품 필터 상태 (ProductManagement로 props 전달) ---
  const [filterKeyword, setFilterKeyword] = useState("");
  const [filterCategory, setFilterCategory] = useState<number | null>(null);

  // --- 회원 필터 상태 (UserManagement로 props 전달) ---
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
  // 데이터 Fetch 함수
  // ===================================

  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("토큰이 없습니다. 관리자 로그인 필요");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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

  const fetchUsers = useCallback(async () => {
    let url = `${API_BASE_URL}/api/users`;

    if (userFilterKeyword) {
      url += "?";
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
  }, [userFilterKeyword, userFilterField]); // 의존성 유지

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
  }, [filterKeyword, filterCategory]); // 의존성 유지

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

  const fetchCategories = useCallback(async () => {
    const res = await fetch(`${API_BASE_URL}/api/categories`);
    const data = await res.json();
    setCategories(data);
  }, []);

  const fetchInquiries = useCallback(async () => {
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

      const data: {
        articleId: number;
        title: string;
        content: string;
        createdAt: string;
        updatedAt: string;
      }[] = await res.json();

      // Inquiry 타입에 맞춰서 매핑 및 답변 분리 로직 유지
      const mapped: Inquiry[] = data.map((d, idx) => {
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
          newAnswer: "", // 답변 상태를 로컬에서 관리하기 위해 추가
        };
      });

      setInquiries(mapped);
    } catch (err) {
      console.error("문의 불러오기 실패:", err);
      setInquiries([]);
    }
  }, []);

  // ===================================
  // CRUD/Action Handler 함수
  // ===================================

  // 회원 관리 핸들러
  const handleChangeRole = async (userId: number, newRole: User["role"]) => {
    const token = localStorage.getItem("token");
    await fetch(`${API_BASE_URL}/api/users/${userId}/admin`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
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
      const payload: {
        nickName: string;
        password?: string;
        phone: string;
      } = {
        nickName: editUserForm.nickName,
        phone: editUserForm.phone,
      };
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

  // 상품 관리 핸들러
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
      const payload: {
        title: string;
        categoryId?: number;
        startingPrice?: number;
        productStatus: Product["productStatus"];
      } = {
        title: editProductForm.title,
        categoryId: editProductForm.categoryId,
        startingPrice: editProductForm.startingPrice,
        productStatus: editProductForm.productStatus,
      };

      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
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
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
      method: "DELETE",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    if (!res.ok) {
      alert("상품 삭제에 실패했습니다.");
      console.error("상품 삭제 실패:", res.status);
      return;
    }
    fetchProducts();
  };

  // 신고 관리 핸들러
  const handleUpdateReportStatus = async (
    reportId: number,
    status: boolean
  ) => {
    try {
      const token = localStorage.getItem("token");
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

      fetchReports();
    } catch (err) {
      console.error("신고 상태 변경 중 오류 발생:", err);
    }
  };

  // 문의 관리 핸들러
  const handleSaveInquiryAnswer = async (
    inquiryId: number,
    answer?: string
  ) => {
    if (!answer) return alert("답변을 입력해주세요.");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE_URL}/api/inquiry/${inquiryId}/answer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({ answer }),
        }
      );
      if (!res.ok) throw new Error("답변 저장 실패");

      alert("답변이 등록되었습니다.");
      fetchInquiries();
    } catch (err) {
      console.error(err);
      alert("답변 등록 중 오류가 발생했습니다.");
    }
  };

  // ===================================
  // useEffect - 데이터 로딩
  // ===================================

  useEffect(() => {
    fetchCategories(); // 카테고리는 모든 섹션에서 필요할 수 있으므로 항상 로드
  }, [fetchCategories]);

  useEffect(() => {
    if (section === "user") fetchUsers();
    else if (section === "product") fetchProducts();
    else if (section === "report") fetchReports();
    else if (section === "stats") fetchStats();
    else if (section === "inquiry") fetchInquiries();
  }, [
    section,
    fetchUsers,
    fetchProducts,
    fetchReports,
    fetchStats,
    fetchInquiries,
  ]);

  // ===================================
  // 렌더링
  // ===================================

  return (
    <div className="container p-0">
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
              <button
                onClick={() => {
                  setSection("inquiry");
                }}
              >
                1:1 문의 관리
              </button>
            </li>
          </ul>
        </aside>

        <main className="admin-main">
          {/* 회원 관리 컴포넌트 */}
          {section === "user" && (
            <UserManagement
              users={users}
              editingUserId={editingUserId}
              editUserForm={editUserForm}
              setEditUserForm={setEditUserForm}
              handleEditUserClick={handleEditUserClick}
              handleSaveUserClick={handleSaveUserClick}
              handleCancelUserClick={handleCancelUserClick}
              handleChangeRole={handleChangeRole}
              // 필터링 관련 props
              userFilterField={userFilterField}
              setUserFilterField={setUserFilterField}
              userFilterKeyword={userFilterKeyword}
              setUserFilterKeyword={setUserFilterKeyword}
              fetchUsers={fetchUsers}
            />
          )}

          {/* 상품 관리 컴포넌트 */}
          {section === "product" && (
            <ProductManagement
              products={products}
              categories={categories}
              editingProductId={editingProductId}
              editProductForm={editProductForm}
              setEditProductForm={setEditProductForm}
              handleEditProductClick={handleEditProductClick}
              handleSaveProductClick={handleSaveProductClick}
              handleCancelProductClick={handleCancelProductClick}
              handleDeleteProduct={handleDeleteProduct}
              // 필터링 관련 props
              filterKeyword={filterKeyword}
              setFilterKeyword={setFilterKeyword}
              filterCategory={filterCategory}
              setFilterCategory={setFilterCategory}
              fetchProducts={fetchProducts}
            />
          )}

          {/* 신고 관리 컴포넌트 */}
          {section === "report" && (
            <ReportManagement
              reports={reports}
              handleUpdateReportStatus={handleUpdateReportStatus}
            />
          )}

          {/* 통계 컴포넌트 */}
          {section === "stats" && <StatsManagement stats={stats} />}

          {/* 1:1 문의 관리 컴포넌트 */}
          {section === "inquiry" && (
            <InquiryManagement
              inquiries={inquiries}
              setInquiries={setInquiries}
              handleSaveInquiryAnswer={handleSaveInquiryAnswer}
            />
          )}
        </main>
      </div>
    </div>
  );
}
