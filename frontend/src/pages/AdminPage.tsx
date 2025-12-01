import { useState, useEffect, useCallback } from "react";
import type {
  User,
  Product,
  Report,
  EditProductForm,
  Inquiry,
} from "../common/types";
import { API_BASE_URL } from "../common/api";
import type { ProductCategoryType } from "../common/enums";

// 분리된 컴포넌트 임포트
import UserManagement from "../components/admin/UserManagement";
import ProductManagement from "../components/admin/ProductManagement";
import ReportManagement from "../components/admin/ReportManagement";
import StatsManagement from "../components/admin/StatsManagement";
import InquiryManagement from "../components/admin/InquiryManagement";

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

  const [inquiries, setInquiries] = useState<Inquiry[]>([]);

  // --- 상품 필터 상태 (ProductManagement로 props 전달) ---
  const [filterKeyword, setFilterKeyword] = useState("");
  const [filterCategory, setFilterCategory] = useState<ProductCategoryType | null>(null);

  // --- 회원 필터 상태 (UserManagement로 props 전달) ---
  const [userFilterField, setUserFilterField] = useState<
    "userName" | "nickName" | "email" | "phone"
  >("userName");
  const [userFilterKeyword, setUserFilterKeyword] = useState("");

  // 상품 수정 상태
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editProductForm, setEditProductForm] = useState<EditProductForm>({
    title: "",
    content: "",
    productCategoryType: null,
    startingPrice: "",
    productStatus: "ACTIVE",
    productType: "AUCTION",
    auctionEndTime: "",
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
                  inquiryReviewId: idx + 1,
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
      content: product.content ?? "",
      productCategoryType: product.productCategoryType ?? null,
      startingPrice: product.startingPrice?.toString(),
      productStatus: product.productStatus,
      auctionEndTime: product.auctionEndTime,
      productType : "AUCTION",
    });
  };

  const handleSaveProductClick = async (productId: number) => {
    try {
      const payload: {
        title: string;
        productCategoryType?: ProductCategoryType | null;
        startingPrice?: string;
        productStatus: Product["productStatus"];
      } = {
        title: editProductForm.title,
        productCategoryType: editProductForm.productCategoryType,
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
              editingProductId={editingProductId}
              editProductForm={editProductForm}
              setEditProductForm={setEditProductForm}
              handleEditProductClick={handleEditProductClick}
              handleSaveProductClick={handleSaveProductClick}
              handleCancelProductClick={handleCancelProductClick}
              handleDeleteProduct={handleDeleteProduct}
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