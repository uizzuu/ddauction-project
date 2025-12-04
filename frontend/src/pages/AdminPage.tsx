import { useState, useEffect, useCallback } from "react";
import type { ProductCategoryType } from "../common/enums";
import type {
  User,
  Product,
  Report,
  EditProductForm,
  Inquiry,
} from "../common/types";
import * as API from "../common/api";
import {
  UserManage,
  ProductManage,
  ReportManage,
  AdminDashboard,
  InquiryManagement,
} from "../common/import"

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

  const fetchStats = useCallback(async () => {
    try {
      const data = await API.fetchStatsApi();
      setStats({
        userCount: data.userCount,
        productCount: data.productCount,
        reportCount: data.reportCount,
      });
    } catch (err) {
      console.error("통계 조회 실패:", err);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await API.getUsers(userFilterField, userFilterKeyword);
      setUsers(data);
    } catch (err) {
      console.error("회원 조회 실패:", err);
      setUsers([]);
    }
  }, [userFilterField, userFilterKeyword]);

  const fetchProducts = useCallback(async () => {
    try {
      const data = await API.fetchAdminProducts(filterKeyword, filterCategory);
      setProducts(data);
    } catch (err) {
      console.error("상품 조회 실패:", err);
      setProducts([]);
    }
  }, [filterKeyword, filterCategory]);

  const fetchReports = useCallback(async () => {
    try {
      const data = await API.getReports();
      setReports(data);
    } catch (err) {
      console.error("신고 조회 실패:", err);
      setReports([]);
    }
  }, []);

  const fetchInquiries = useCallback(async () => {
    try {
      const data = await API.getInquiries();
      setInquiries(data);
    } catch (err) {
      console.error("문의 조회 실패:", err);
      setInquiries([]);
    }
  }, []);

  // 회원 관리
  const handleChangeRole = async (userId: number, newRole: User["role"]) => {
    try {
      await API.updateUserRole(userId, newRole);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditUserClick = (user: User) => {
    setEditingUserId(user.userId);
    setEditUserForm({
      nickName: user.nickName,
      password: "",
      phone: user.phone || "",
    });
  };

  const handleSaveUserClick = async (userId: number) => {
    try {
      await API.editUser(userId, editUserForm);
      setEditingUserId(null);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("회원 수정 실패");
    }
  };

  const handleCancelUserClick = () => {
    setEditingUserId(null);
    setEditUserForm({ nickName: "", password: "", phone: "" });
  };

  // 상품 관리
  const handleEditProductClick = (product: Product) => {
    setEditingProductId(product.productId);
    setEditProductForm({
      title: product.title,
      content: product.content || "",
      productCategoryType: product.productCategoryType ?? null,
      startingPrice: product.startingPrice?.toString() || "",
      productStatus: product.productStatus || "ACTIVE",
      productType: product.productType || "AUCTION",
      auctionEndTime: product.auctionEndTime || "",
    });
  };

  const handleSaveProductClick = async (productId: number) => {
    try {
      await API.editProduct(productId, editProductForm);
      setEditingProductId(null);
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert("상품 수정 실패");
    }
  };

  const handleCancelProductClick = () => {
    setEditingProductId(null);
    setEditProductForm({
      title: "",
      content: "",
      productCategoryType: null,
      startingPrice: "",
      productStatus: "ACTIVE",
      productType: "AUCTION",
      auctionEndTime: "",
    });
  };

  const handleDeleteProduct = async (productId: number) => {
    try {
      await API.deleteAdminProduct(productId);
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert("상품 삭제 실패");
    }
  };

  // 신고 관리
  const handleUpdateReportStatus = async (reportId: number, status: boolean) => {
    try {
      await API.updateReportStatus(reportId, status);
      fetchReports();
    } catch (err) {
      console.error(err);
    }
  };

  // 문의 관리
  const handleSaveInquiryAnswer = async (inquiryId: number, answer?: string) => {
    if (!answer) return alert("답변을 입력해주세요.");
    try {
      await API.saveInquiryAnswer(inquiryId, answer);
      alert("답변이 등록되었습니다.");
      fetchInquiries();
    } catch (err) {
      console.error(err);
      alert("답변 등록 실패");
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
            <UserManage
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
            <ProductManage
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
            <ReportManage
              reports={reports}
              handleUpdateReportStatus={handleUpdateReportStatus}
            />
          )}

          {/* 통계 컴포넌트 */}
          {section === "stats" && <AdminDashboard stats={stats} />}

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