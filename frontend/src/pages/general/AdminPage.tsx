import { useState, useEffect, useCallback, useRef } from "react";
import type { ProductCategoryType } from "../../common/enums";
import type {
  User,
  Product,
  Report,
  EditProductForm,
  Inquiry,
} from "../../common/types";
import * as API from "../../common/api";
import {
  UserManage,
  ProductManage,
  ReportManage,
  AdminDashboard,
  InquiryManagement,
} from "../../common/import";
import PublicChat from "../../components/chat/PublicChat";
import UserChat from "../../components/chat/UserChat";
import { Users, Package, AlertCircle, BarChart3, MessageSquare, MessagesSquare } from "lucide-react";

type TabId = "user" | "product" | "report" | "stats" | "inquiry" | "publicChat" | "privateChat";


export default function AdminPage({ user }: { user: User }) {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabId>("user");
  const tabRefs = useRef<{ [key in TabId]?: HTMLButtonElement }>({});
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

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

  // Update indicator position when tab changes
  useEffect(() => {
    const currentTab = tabRefs.current[activeTab];
    if (currentTab) {
      setIndicatorStyle({
        left: currentTab.offsetLeft,
        width: currentTab.offsetWidth,
      });
    }
  }, [activeTab]);

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
    if (activeTab === "user") fetchUsers();
    else if (activeTab === "product") fetchProducts();
    else if (activeTab === "report") fetchReports();
    else if (activeTab === "stats") fetchStats();
    else if (activeTab === "inquiry") fetchInquiries();
  }, [
    activeTab,
    fetchUsers,
    fetchProducts,
    fetchReports,
    fetchStats,
    fetchInquiries,
  ]);

  // ===================================
  // 렌더링
  // ===================================

  const tabs = [
    { id: "user" as TabId, label: "회원 관리", icon: Users },
    { id: "product" as TabId, label: "상품 관리", icon: Package },
    { id: "report" as TabId, label: "신고 관리", icon: AlertCircle },
    { id: "stats" as TabId, label: "통계", icon: BarChart3 },
    { id: "inquiry" as TabId, label: "1:1 문의", icon: MessageSquare },
    { id: "publicChat" as TabId, label: "공개 채팅", icon: MessagesSquare },
    { id: "privateChat" as TabId, label: "1:1 채팅", icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-[1280px] mx-auto">
        {/* Header */}
        <div className="py-8">
          <h1 className="text-2xl font-bold text-[#111]">관리자 페이지</h1>
          <p className="text-sm text-[#666] mt-1">시스템 관리 및 모니터링</p>
        </div>

        {/* Tabbed Navigation */}
        <div className="bg-white rounded-t-xl border-b border-[#eee] sticky top-14 z-10 shadow-sm">
          <div className="flex relative">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  ref={(el) => {
                    if (el) tabRefs.current[tab.id] = el;
                  }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors relative flex items-center justify-center gap-2 ${activeTab === tab.id
                    ? "text-[#111]"
                    : "text-[#666] hover:text-[#111]"
                    }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
            {/* Animated underline */}
            <div
              className="absolute bottom-0 h-0.5 bg-[#111] transition-all duration-300 ease-out"
              style={{ left: `${indicatorStyle.left}px`, width: `${indicatorStyle.width}px` }}
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-b-xl py-4 px-1">
          {/* 회원 관리 컴포넌트 */}
          {activeTab === "user" && (
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
          {activeTab === "product" && (
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
          {activeTab === "report" && (
            <ReportManage
              reports={reports}
              handleUpdateReportStatus={handleUpdateReportStatus}
            />
          )}

          {/* 통계 컴포넌트 */}
          {activeTab === "stats" && <AdminDashboard stats={stats} />}

          {/* 1:1 문의 관리 컴포넌트 */}
          {activeTab === "inquiry" && (
            <InquiryManagement
              inquiries={inquiries}
              setInquiries={setInquiries}
              handleSaveInquiryAnswer={handleSaveInquiryAnswer}
            />
          )}

          {/* 공개 채팅 컴포넌트 */}
          {activeTab === "publicChat" && user && <div className="-mt-[20px]"><PublicChat user={user} /></div>}

          {/* 1:1 채팅 컴포넌트 */}
          {activeTab === "privateChat" && user && <div className="-mt-[20px]"><UserChat user={user} /></div>}
        </div>
      </div>
    </div>
  );
}