import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { User as UserIcon, Package, Heart, MessageSquare, Settings, ShoppingBag, Gavel, Star, FileText } from "lucide-react";
import type { User, Product, Report, ProductQna, Inquiry, Review } from "../../common/types";
import * as API from "../../common/api";
import ProductCard from "../../components/ui/ProductCard";

type TabId = "selling" | "buying" | "community" | "settings";

type Props = {
  user: User | null;
  setUser: (user: User | null) => void;
};

export default function MyPage({ user, setUser }: Props) {
  const navigate = useNavigate();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabId>("selling");
  const tabRefs = useRef<{ [key in TabId]?: HTMLButtonElement }>({});
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  // Data states
  const [sellingProducts, setSellingProducts] = useState<Product[]>([]);
  const [myLikes, setMyLikes] = useState<Product[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [myQnas, setMyQnas] = useState<ProductQna[]>([]);
  const [myInquiries, setMyInquiries] = useState<Inquiry[]>([]);
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    nickName: user?.nickName || "",
    password: "",
    phone: user?.phone || "",
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
      });
    }
  }, [user]);

  // Load stats
  useEffect(() => {
    if (!user) return;

    const loadStats = async () => {
      try {
        const token = localStorage.getItem("token")!;
        const [selling, likes] = await Promise.all([
          API.fetchSellingProducts(user.userId),
          API.fetchMyLikes(token),
        ]);

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
          bidsCount: 0, // TODO: Add bid count API
          rating,
        });
      } catch (err) {
        console.error("Failed to load stats", err);
      }
    };

    loadStats();
  }, [user]);

  // Tab content loader
  const loadTabContent = async (tab: TabId) => {
    if (!user) return;
    setLoading(true);
    const token = localStorage.getItem("token")!;

    try {
      switch (tab) {
        case "selling":
          const selling = await API.fetchSellingProducts(user.userId);
          setSellingProducts(selling);
          const qnas = await API.fetchUserQnas(user.userId);
          setMyQnas(qnas);
          break;
        case "buying":
          const likes = await API.fetchMyLikes(token);
          setMyLikes(likes);
          break;
        case "community":
          const [reviews, inquiries, reportsData] = await Promise.all([
            API.fetchUserReviews(user.userId),
            API.fetchUserInquiries(token),
            API.fetchReports(token),
          ]);
          setMyReviews(reviews);
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
        case "settings":
          // Settings don't need additional data loading
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
      const updatedUser = await API.updateUserProfile(user.userId, profileForm);
      setUser(updatedUser);
      setIsEditingProfile(false);
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

  if (!user) {
    return (
      <div className="container flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  const tabs = [
    { id: "selling" as TabId, label: "판매 관리", icon: Package },
    { id: "buying" as TabId, label: "구매 활동", icon: ShoppingBag },
    { id: "community" as TabId, label: "커뮤니티", icon: MessageSquare },
    { id: "settings" as TabId, label: "설정", icon: Settings },
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-[1280px] mx-auto">
        {/* Profile Summary Card */}
        <div className="py-8 mb-8 border-b border-[#eee]">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-lg bg-[#333] flex items-center justify-center text-white text-3xl font-bold">
              {user.nickName?.charAt(0).toUpperCase() || "U"}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-[#111] mb-1">{user.nickName || user.userName}</h2>
              <p className="text-sm text-[#666]">{user.email}</p>
            </div>

            {/* Edit Button */}
            <button
              onClick={() => {
                setActiveTab("settings");
                setIsEditingProfile(true);
              }}
              className="px-6 py-2.5 bg-[#111] text-white rounded-lg font-medium hover:bg-[#333] transition-colors"
            >
              프로필 수정
            </button>
          </div>

          {/* Stats */}
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

                    <div className="text-center py-12 bg-[#f9f9f9] rounded-lg border border-[#eee]">
                      <ShoppingBag size={40} className="mx-auto text-[#ddd] mb-2" />
                      <p className="text-[#666]">구매 내역이 없습니다.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Community Tab */}
              {activeTab === "community" && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Star size={20} className="text-yellow-600" />
                      리뷰
                    </h3>
                    {myReviews.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">작성한 리뷰가 없습니다.</p>
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

              {/* Settings Tab */}
              {activeTab === "settings" && (
                <div className="space-y-8 max-w-2xl">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <UserIcon size={20} />
                      프로필 정보
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">닉네임</label>
                        <input
                          type="text"
                          value={profileForm.nickName}
                          onChange={(e) => setProfileForm({ ...profileForm, nickName: e.target.value })}
                          disabled={!isEditingProfile}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">전화번호</label>
                        <input
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          disabled={!isEditingProfile}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                        />
                      </div>
                      {isEditingProfile && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            비밀번호 <span className="text-gray-500">(변경 시에만 입력)</span>
                          </label>
                          <input
                            type="password"
                            value={profileForm.password}
                            onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="새 비밀번호"
                          />
                        </div>
                      )}
                      <div className="flex gap-3">
                        {isEditingProfile ? (
                          <>
                            <button
                              onClick={handleUpdateProfile}
                              className="px-6 py-2 bg-[#333] text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                              저장
                            </button>
                            <button
                              onClick={() => {
                                setIsEditingProfile(false);
                                setProfileForm({
                                  nickName: user.nickName || "",
                                  password: "",
                                  phone: user.phone || "",
                                });
                              }}
                              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                            >
                              취소
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setIsEditingProfile(true)}
                            className="px-6 py-2 bg-[#333] text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                          >
                            수정하기
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Settings size={20} />
                      계정 관리
                    </h3>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                      <h4 className="font-medium text-red-900 mb-2">회원 탈퇴</h4>
                      <p className="text-sm text-red-700 mb-4">
                        회원 탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.
                      </p>
                      <button
                        onClick={handleDeleteAccount}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
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
    </div>
  );
}