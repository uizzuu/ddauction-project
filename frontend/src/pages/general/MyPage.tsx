import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Heart, MessageSquare, Settings, ShoppingBag, Gavel, Star, FileText } from "lucide-react";
import { COURIER_OPTIONS } from "../../common/enums";
import type { User, Product, Report, ProductQna, Inquiry, Review, Bid } from "../../common/types";
import * as API from "../../common/api";
import { API_BASE_URL } from "../../common/api";
import type { PaymentHistoryResponse } from "../../common/api";
import ProductCard from "../../components/ui/ProductCard";
import BusinessVerify from "../../components/mypage/BusinessVerify";
import ShippingModal from "../../components/ui/ShippingModal";
import ReviewModal from "../../components/ui/ReviewModal";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import ProfileImageUploader from "../../components/mypage/ProfileImageUploader";
import Avatar from "../../components/ui/Avatar";

type TabId = "selling" | "buying" | "reviews" | "community" | "profile_edit";

type Props = {
  user: User | null;
  setUser: (user: User | null) => void;
};

export default function MyPage({ user, setUser }: Props) {
  const navigate = useNavigate();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabId>("profile_edit");
  const tabRefs = useRef<{ [key in TabId]?: HTMLButtonElement }>({});
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [showBusinessVerify, setShowBusinessVerify] = useState(false);

  // Data states
  const [sellingProducts, setSellingProducts] = useState<Product[]>([]);
  const [sellingHistory, setSellingHistory] = useState<PaymentHistoryResponse[]>([]);
  const [buyingHistory, setBuyingHistory] = useState<PaymentHistoryResponse[]>([]);
  const [myLikes, setMyLikes] = useState<Product[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [myQnas, setMyQnas] = useState<ProductQna[]>([]);
  const [myInquiries, setMyInquiries] = useState<Inquiry[]>([]);
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [shippingModalOpen, setShippingModalOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
  const [modalDefaults, setModalDefaults] = useState({ courier: "CJ", trackingNumber: "" });
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{ sellerId: number; refId: number; productType?: string } | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [myBids, setMyBids] = useState<Bid[]>([]);
  const [confirmTargetId, setConfirmTargetId] = useState<number | null>(null);

  // Profile edit state
  const [profileForm, setProfileForm] = useState({
    nickName: user?.nickName || "",
    password: "",
    phone: user?.phone || "",
    address: user?.address || "", // Add address
    detailAddress: "", // Note: User type might not have detailAddress explicitly mapped in frontend type yet? Check User type.
    zipCode: "",
  });

  const [addressForm, setAddressForm] = useState({
    address: "",
    detailAddress: "",
    zipCode: "",
  });

  // Stats
  const [stats, setStats] = useState({
    sellingCount: 0,
    likesCount: 0,
    bidsCount: 0,
    rating: 0,
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

  // Load user data on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    API.fetchCurrentUser(token)
      .then((data) => setUser(data))
      .catch((err: any) => {
        console.error(err);
        if (err.status === 401) {
          alert("로그인이 만료되었습니다. 다시 로그인해주세요.");
          localStorage.removeItem("token");
          setUser(null);
          navigate("/login");
        } else {
          navigate("/");
        }
      });
  }, [navigate, setUser]);

  // Update profile form when user changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        nickName: user.nickName || "",
        password: "",
        phone: user.phone || "",
        address: user.address || "",
        detailAddress: "",
        zipCode: "",
      });
    }
  }, [user]);

  // Load stats
  useEffect(() => {
    if (!user) return;

    const loadStats = async () => {
      try {
        const token = localStorage.getItem("token")!;
        const [selling, likes, bids] = await Promise.all([
          API.fetchSellingProducts(user.userId),
          API.fetchMyLikes(token),
          API.fetchMyBids(user.userId),
        ]);

        console.log("💡 fetchMyBids result:", bids);
        console.log("💡 bids.length:", (bids as any).length);

        let rating = 0;
        try {
          const ratingData = await API.fetchAverageRating(user.userId);
          rating = ratingData.averageRating;
        } catch (err) {
          // Rating might not exist
        }

        setStats({
          sellingCount: selling.length,
          likesCount: likes.length,
          bidsCount: bids.length,  // TODO: Add bid count API
          rating,
        });
        setSellingProducts(selling);
        setMyBids(bids);
        setMyLikes(likes);
      } catch (err) {
        console.error("Failed to load stats", err);
      }
    };

    loadStats();
  }, [user]);
  // 좋아요 카운팅
  useEffect(() => {
    setStats(prev => ({
      ...prev,
      likesCount: myLikes.length,
    }));
  }, [myLikes.length]);

  // 판매중 카운팅
  useEffect(() => {
    setStats(prev => ({
      ...prev,
      sellingCount: sellingProducts.length,
    }));
  }, [sellingProducts.length]);

  // 입찰 카운팅
  useEffect(() => {
    setStats(prev => ({
      ...prev,
      bidsCount: myBids.length,
    }));
  }, [myBids.length]);

  // Tab content loader
  const loadTabContent = async (tab: TabId) => {
    if (!user) return;
    setLoading(true);
    const token = localStorage.getItem("token")!;

    try {
      switch (tab) {
        case "selling":
          const [sellingResult, qnasResult, sHistoryResult] = await Promise.allSettled([
            API.fetchSellingProducts(user.userId),
            API.fetchUserQnas(user.userId),
            API.fetchSellingHistory()
          ]);

          if (sellingResult.status === "fulfilled") setSellingProducts(sellingResult.value);
          else console.error("Failed to load selling products", sellingResult.reason);

          if (qnasResult.status === "fulfilled") setMyQnas(qnasResult.value);

          if (sHistoryResult.status === "fulfilled") setSellingHistory(sHistoryResult.value);
          else console.error("Failed to load selling history", sHistoryResult.reason);
          break;
        case "buying":
          const [likes, bHistory] = await Promise.all([
            API.fetchMyLikes(token),
            API.fetchBuyingHistory()
          ]);
          setMyLikes(likes);
          setBuyingHistory(bHistory);
          break;
        case "reviews":
          const reviews = await API.fetchUserReviews(user.userId);
          setMyReviews(reviews);
          break;
        case "community":
          // Removed reviews from here. Keep inquiries.
          const [inquiries, reportsData] = await Promise.all([
            API.fetchUserInquiries(token),
            API.fetchReports(token),
          ]);

          setMyInquiries(inquiries.map((i: any) => ({
            inquiryId: i.inquiryId,
            title: i.title,
            question: i.content,
            createdAt: i.createdAt,
            answers: (i.answers ?? []).map((a: any) => ({
              inquiryReviewId: a.inquiryReviewId,
              answer: a.answer,
              nickName: a.nickName ?? "익명",
              createdAt: a.createdAt ?? new Date().toISOString(),
            })),
          })));
          setReports(reportsData);
          break;
        case "profile_edit":
          // No data load needed
          break;
      }
    } catch (err) {
      console.error("Failed to load tab content", err);
    } finally {
      setLoading(false);
    }
  };

  // Load content when tab changes
  useEffect(() => {
    loadTabContent(activeTab);
  }, [activeTab, user]);

  // Handle profile update
  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      // 1. Update basic info
      const updatedUser = await API.updateUserProfile(user.userId, {
        nickName: profileForm.nickName,
        password: profileForm.password,
        phone: profileForm.phone
      });

      // 2. Update address if provided (Need separate API or use updatedUser?)
      // If user inputs address, we call updateAddress API
      if (addressForm.address) {
        await API.updateUserAddress(user.userId, { ...addressForm, phone: profileForm.phone });
      }

      setUser(updatedUser);
      alert("프로필이 수정되었습니다.");
    } catch (err: any) {
      alert(err.message || "프로필 수정 실패");
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!user) return;
    if (!confirm("정말 회원 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;

    try {
      const token = localStorage.getItem("token")!;
      await API.withdrawUser(user.userId, token);
      setUser(null);
      localStorage.removeItem("token");
      navigate("/");
      alert("회원탈퇴가 완료되었습니다.");
    } catch (err: any) {
      alert(err.message || "회원 탈퇴 실패");
    }
  };

  const handleShippingSubmit = async (courier: string, trackingNumber: string) => {
    if (!selectedPaymentId) return;

    try {
      await API.updateShippingInfo(selectedPaymentId, courier, trackingNumber);
      alert("배송 정보가 등록되었습니다.");
      setShippingModalOpen(false);
      setSelectedPaymentId(null);
      loadTabContent("selling");
    } catch (err: any) {
      alert(err.message || "배송 정보 등록 실패");
    }
  };

  const openShippingModal = (paymentId: number, courier = "CJ", trackingNumber = "") => {
    setSelectedPaymentId(paymentId);
    setModalDefaults({ courier, trackingNumber });
    setShippingModalOpen(true);
  };

  const handleConfirmPurchase = (paymentId: number) => {
    setConfirmTargetId(paymentId);
    setConfirmModalOpen(true);
  };

  const executeConfirmPurchase = async () => {
    if (!confirmTargetId) throw new Error("결제 ID가 없습니다.");

    // API call will throw if it fails (e.g., 401)
    await API.confirmPurchase(confirmTargetId);

    // If successful:
    // 1. Close modal
    setConfirmModalOpen(false);

    // 2. Refresh data
    await new Promise(resolve => setTimeout(resolve, 500));
    await loadTabContent("buying");
  };

  const openReviewModal = (sellerId: number, refId: number, productType?: string) => {
    setReviewTarget({ sellerId, refId, productType });
    setReviewModalOpen(true);
  };

  const handleReviewSubmit = async (rating: number, comments: string) => {
    if (!reviewTarget) return;
    try {
      await API.submitReview(
        reviewTarget.sellerId,
        {
          rating,
          comments,
          refId: reviewTarget.refId,
          productType: reviewTarget.productType ?? "AUCTION" // Fallback or strict?
        },
        localStorage.getItem("token") || ""
      );
      alert("리뷰가 등록되었습니다.");
      setReviewModalOpen(false);
      setReviewTarget(null);
    } catch (err: any) {
      alert(err.message || "리뷰 등록 실패");
    }
  };

  if (!user) {
    return (
      <div className="container flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  const tabs = [
    { id: "profile_edit" as TabId, label: "회원 정보", icon: Settings },
    { id: "selling" as TabId, label: "판매 관리", icon: Package },
    { id: "buying" as TabId, label: "구매 활동", icon: ShoppingBag },
    { id: "reviews" as TabId, label: "받은 리뷰", icon: Star },
    { id: "community" as TabId, label: "커뮤니티", icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-[1280px] mx-auto">
        {/* Profile Summary Card */}
        <div className="py-8 mb-8 border-b border-[#eee]">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-lg bg-[#333] flex items-center justify-center overflow-hidden">
              <Avatar
                src={user.images && user.images.length > 0 ? user.images[0].imagePath : null}
                alt="Profile"
                className="w-full h-full text-3xl"
                fallbackText={user.nickName || user.userName}
              />
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-[#111] mb-1">{user.nickName || user.userName}</h2>
              <p className="text-sm text-[#666]">{user.email}</p>

              {/* Stats - moved below user info as requested */}
              <div className="flex gap-8 mt-6 pt-6 border-t border-[#eee]">
                <div className="flex items-center gap-2">
                  <Package size={18} className="text-[#666]" />
                  <span className="text-sm text-[#666]">
                    판매중 <span className="font-bold text-[#111]">{stats.sellingCount}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart size={18} className="text-[#666]" />
                  <span className="text-sm text-[#666]">
                    찜 <span className="font-bold text-[#111]">{stats.likesCount}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Gavel size={18} className="text-[#666]" />
                  <span className="text-sm text-[#666]">
                    입찰 <span className="font-bold text-[#111]">{stats.bidsCount}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Star size={18} className="text-[#666]" />
                  <span className="text-sm text-[#666]">
                    평점 <span className="font-bold text-[#111]">{stats.rating.toFixed(1)}</span>
                  </span>
                </div>
              </div>
            </div>


          </div>
        </div>

        {/* Tabbed Navigation */}
        <div className="bg-white rounded-t-xl border-b border-gray-200 sticky top-14 z-10 shadow-sm">
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
                    ? "text-[#333]"
                    : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
            {/* Animated underline */}
            <div
              className="absolute bottom-0 h-0.5 bg-[#333] transition-all duration-300 ease-out"
              style={{ left: `${indicatorStyle.left}px`, width: `${indicatorStyle.width}px` }}
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-b-xl py-4 px-1">
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="text-gray-500">로딩 중...</div>
            </div>
          ) : (
            <>


              {/* Selling Tab */}
              {activeTab === "selling" && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Package size={20} />
                      판매 중인 상품
                    </h3>
                    {sellingProducts.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <Package size={48} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 mb-4">판매 중인 상품이 없습니다.</p>
                        <button
                          onClick={() => navigate("/register")}
                          className="px-6 py-2 bg-[#333] text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          상품 등록하기
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        {sellingProducts.map((product) => (
                          <ProductCard key={product.productId} product={product} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sold History & Shipping */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <ShoppingBag size={20} />
                      판매 완료 및 배송 관리
                    </h3>
                    {sellingHistory.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">판매 내역이 없습니다.</p>
                      </div>
                    ) : (
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        {sellingHistory.map((item) => (
                          <div key={item.paymentId} className="p-4 border-b border-gray-200 last:border-0 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                            <div className="flex gap-4">
                              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                {item.productImage && <img src={item.productImage} alt="product" className="w-full h-full object-cover" />}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{item.productTitle}</div>
                                <div className="text-sm text-gray-500">구매자: {item.buyerName}</div>
                                <div className="text-sm text-gray-500">가격: {item.price.toLocaleString()}원</div>
                                <div className="text-xs text-gray-400">{new Date(item.paidAt).toLocaleDateString()}</div>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2 min-w-[200px]">
                              <div className="text-sm font-bold text-blue-600">{item.status}</div>
                              {item.courier && item.trackingNumber ? (
                                <div className="text-sm text-gray-600 text-right">
                                  <div>{COURIER_OPTIONS.find(c => c.value === item.courier)?.label || item.courier}</div>
                                  <div className="text-xs mb-1">{item.trackingNumber}</div>
                                  <button
                                    onClick={() => openShippingModal(item.paymentId, item.courier!, item.trackingNumber!)}
                                    className="text-xs text-gray-400 underline hover:text-gray-600"
                                  >
                                    수정
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => openShippingModal(item.paymentId)}
                                  className="px-3 py-1 bg-black text-white text-xs rounded hover:bg-gray-800"
                                >
                                  배송 정보 입력
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <MessageSquare size={20} />
                      상품 Q&A
                    </h3>
                    {myQnas.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">문의 내역이 없습니다.</p>
                      </div>
                    ) : (
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        {myQnas.map((qna, idx) => (
                          <div
                            key={qna.productQnaId}
                            className={`p-4 ${idx !== 0 ? "border-t border-gray-200" : ""} hover:bg-gray-50`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <p className="font-medium text-gray-900 mb-1">{qna.title}</p>
                              <span className="text-xs text-gray-500">{new Date(qna.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{qna.content}</p>
                            {qna.answers && qna.answers.length > 0 && (
                              <div className="space-y-2">
                                {qna.answers.map((answer) => (
                                  <div key={answer.qnaReviewId} className="mt-2 pl-4 border-l-2 border-blue-500 bg-blue-50 p-3 rounded-r">
                                    <p className="text-sm text-gray-700">{answer.content}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Buying Tab */}
              {activeTab === "buying" && (
                <div className="space-y-8 px-1">
                  {/* 찜한 상품 섹션 */}
                  <div>
                    <h3 className="text-lg font-bold text-[#111] mb-4 flex items-center gap-2">
                      <Heart size={20} className="text-[#666]" />
                      찜한 상품
                    </h3>

                    {myLikes.length === 0 ? (
                      <div className="text-center py-16 bg-[#f9f9f9] rounded-lg border border-[#eee]">
                        <Heart size={48} className="mx-auto text-[#ddd] mb-3" />
                        <p className="text-[#666] mb-4">찜한 상품이 없습니다.</p>
                        <button
                          onClick={() => navigate("/products")}
                          className="px-6 py-2.5 bg-[#111] text-white rounded-lg hover:bg-[#333] transition-colors font-medium"
                        >
                          상품 둘러보기
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        {myLikes.map((product) => (
                          <ProductCard key={product.productId} product={product} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 입찰 내역 섹션 */}
                  <div>
                    <h3 className="text-lg font-bold text-[#111] mb-4 flex items-center gap-2">
                      <Gavel size={20} className="text-[#666]" />
                      입찰 내역
                    </h3>

                    <div className="text-center py-12 bg-[#f9f9f9] rounded-lg border border-[#eee]">
                      <Gavel size={40} className="mx-auto text-[#ddd] mb-2" />
                      <p className="text-[#666]">입찰 내역이 없습니다.</p>
                    </div>
                  </div>

                  {/* 구매 내역 섹션 */}
                  <div>
                    <h3 className="text-lg font-bold text-[#111] mb-4 flex items-center gap-2">
                      <ShoppingBag size={20} className="text-[#666]" />
                      구매 내역
                    </h3>

                    {buyingHistory.length === 0 ? (
                      <div className="text-center py-12 bg-[#f9f9f9] rounded-lg border border-[#eee]">
                        <ShoppingBag size={40} className="mx-auto text-[#ddd] mb-2" />
                        <p className="text-[#666]">구매 내역이 없습니다.</p>
                      </div>
                    ) : (
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        {buyingHistory.map((item) => (
                          <div key={item.paymentId} className="p-4 border-b border-gray-200 last:border-0 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                            <div className="flex gap-4">
                              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                {item.productImage && <img src={item.productImage} alt="product" className="w-full h-full object-cover" />}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{item.productTitle}</div>
                                <div className="text-sm text-gray-500">판매자: {item.sellerNickName}</div>
                                <div className="text-sm text-gray-500">가격: {item.price.toLocaleString()}원</div>
                                <div className="text-xs text-gray-400">{new Date(item.paidAt).toLocaleDateString()}</div>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2 text-right">
                              <div className="text-sm font-bold text-blue-600">{item.status}</div>

                              {/* Buyer Action Buttons */}
                              {item.status === "PAID" && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleConfirmPurchase(item.paymentId);
                                  }}
                                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 font-medium"
                                >
                                  구매 확정
                                </button>
                              )}
                              {item.status === "CONFIRMED" && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    openReviewModal(item.sellerId, item.productId, item.productType);
                                  }}
                                  className="px-3 py-1 bg-black text-white text-xs rounded hover:bg-gray-800 font-medium"
                                >
                                  리뷰 작성
                                </button>
                              )}

                              {item.courier && item.trackingNumber && (
                                <div className="text-sm text-gray-600">
                                  <div>{COURIER_OPTIONS.find(c => c.value === item.courier)?.label || item.courier}</div>
                                  <div className="text-xs">{item.trackingNumber}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}



              {/* Reviews Tab */}
              {activeTab === "reviews" && (
                <div className="space-y-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Star size={20} className="text-yellow-600" />
                    받은 리뷰
                  </h3>
                  {myReviews.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">받은 리뷰가 없습니다.</p>
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      {myReviews.map((review, idx) => (
                        <div
                          key={review.reviewId}
                          className={`p-4 ${idx !== 0 ? "border-t border-gray-200" : ""}`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={16}
                                  className={i < review.rating ? "text-yellow-500" : "text-gray-300"}
                                  fill={i < review.rating ? "currentColor" : "none"}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-gray-700">{review.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Community Tab */}
              {activeTab === "community" && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <FileText size={20} />
                      1:1 문의
                    </h3>
                    {myInquiries.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">문의 내역이 없습니다.</p>
                      </div>
                    ) : (
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        {myInquiries.map((inquiry, idx) => (
                          <div
                            key={inquiry.inquiryId}
                            className={`p-4 ${idx !== 0 ? "border-t border-gray-200" : ""}`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <p className="font-medium text-gray-900">{inquiry.title}</p>
                              <span className="text-xs text-gray-500">{new Date(inquiry.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{inquiry.question}</p>
                            {inquiry.answers.map((answer) => (
                              <div key={answer.inquiryReviewId} className="mt-2 pl-4 border-l-2 border-green-500 bg-green-50 p-3 rounded-r">
                                <p className="text-sm font-medium text-gray-900 mb-1">{answer.nickName}</p>
                                <p className="text-sm text-gray-700">{answer.answer}</p>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <FileText size={20} />
                      신고 내역
                    </h3>
                    {reports.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">신고 내역이 없습니다.</p>
                      </div>
                    ) : (
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        {reports.map((report, idx) => (
                          <div
                            key={report.reportId}
                            className={`p-4 ${idx !== 0 ? "border-t border-gray-200" : ""}`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm font-medium text-gray-900 mb-1">신고 사유: {report.reason}</p>
                                <p className="text-xs text-gray-500">{new Date(report.createdAt).toLocaleDateString()}</p>
                              </div>
                              <span
                                className={`px-2 py-1 rounded text-xs font-bold ${report.status ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                                  }`}
                              >
                                {report.status ? "처리 완료" : "처리 중"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Profile Edit Tab */}
              {activeTab === "profile_edit" && (
                <div className="space-y-8 max-w-2xl mx-auto">
                  {/* Profile Image */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">프로필 이미지</h3>
                    <ProfileImageUploader
                      user={user}
                      isEditing={true}
                      onUpload={(url: string) => setUser({
                        ...user,
                        images: [{ imageId: 0, refId: user.userId, imagePath: url, imageType: "USER" }]
                      })}
                      onDelete={() => setUser({ ...user, images: [] })}
                    />
                  </div>

                  {/* Account Info Form */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">회원 정보 수정</h3>
                    <div className="space-y-6 bg-white p-6 rounded-lg border border-gray-200">

                      {/* Read-Only Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">아이디 (이메일)</label>
                          <div className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
                            {user.email}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">이름</label>
                          <div className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
                            {user.userName}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">생년월일</label>
                          <div className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
                            {user.birthday ? new Date(user.birthday).toLocaleDateString() : '-'}
                          </div>
                        </div>
                      </div>

                      <div className="h-px bg-gray-100 my-4"></div>

                      {/* Editable Fields */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">닉네임</label>
                            <input
                              type="text"
                              value={profileForm.nickName}
                              onChange={(e) => setProfileForm({ ...profileForm, nickName: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
                            <input
                              type="tel"
                              value={profileForm.phone}
                              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            비밀번호 <span className="text-gray-400 text-xs font-normal">(변경 시에만 입력)</span>
                          </label>
                          <input
                            type="password"
                            value={profileForm.password}
                            onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                            placeholder="새 비밀번호 입력"
                          />
                        </div>
                      </div>

                      {/* Address Section */}
                      <div className="pt-4 border-t border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 mb-3">주소 관리</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="md:col-span-2">
                            <input
                              type="text"
                              placeholder="우편번호"
                              value={addressForm.zipCode}
                              onChange={(e) => setAddressForm({ ...addressForm, zipCode: e.target.value })}
                              className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black mb-2"
                            />
                          </div>
                          <input
                            type="text"
                            placeholder="도로명 주소"
                            value={addressForm.address}
                            onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                          />
                          <input
                            type="text"
                            placeholder="상세 주소"
                            value={addressForm.detailAddress}
                            onChange={(e) => setAddressForm({ ...addressForm, detailAddress: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-4">
                        <button
                          onClick={handleUpdateProfile}
                          className="px-6 py-2.5 bg-[#333] text-white rounded-lg hover:bg-black transition-colors font-medium shadow-sm"
                        >
                          회원 정보 수정 저장
                        </button>
                      </div>
                    </div>
                  </div>



                  {/* Business Verification */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">사업자 인증</h3>
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      {user.businessNumber ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500 mb-1">사업자 등록번호</p>
                            <p className="font-medium text-gray-900">{user.businessNumber}</p>
                          </div>
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-bold rounded-full">인증됨</span>
                        </div>
                      ) : (
                        showBusinessVerify ? (
                          <BusinessVerify
                            userId={user.userId}
                            onVerified={(bn) => {
                              setUser({ ...user, businessNumber: bn });
                              setShowBusinessVerify(false);
                            }}
                            onCancel={() => setShowBusinessVerify(false)}
                          />
                        ) : (
                          <button
                            onClick={() => setShowBusinessVerify(true)}
                            className="px-4 py-2 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium transition-colors"
                          >
                            사업자 인증하기
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Account Management */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">계정 관리</h3>
                    <div className="bg-red-50 border border-red-100 rounded-lg p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-red-900 mb-1">회원 탈퇴</h4>
                        <p className="text-sm text-red-700">
                          회원 탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.
                        </p>
                      </div>
                      <button
                        onClick={handleDeleteAccount}
                        className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium whitespace-nowrap"
                      >
                        회원 탈퇴
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <ShippingModal
        isOpen={shippingModalOpen}
        onClose={() => setShippingModalOpen(false)}
        onSubmit={handleShippingSubmit}
        defaultCourier={modalDefaults.courier}
        defaultTrackingNumber={modalDefaults.trackingNumber}
      />
      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        onSubmit={handleReviewSubmit}
      />
      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={executeConfirmPurchase}
        title="구매 확정"
        message="구매를 확정하시겠습니까? 구매 확정 후에는 취소가 불가능합니다."
        confirmText="확인"
        cancelText="취소"
      />
    </div>
  );
}