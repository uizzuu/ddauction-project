import { useState, useEffect, useRef } from "react";
import DatePickerStyle from "../../components/ui/DatePickerStyle";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Package, Heart, MessageSquare, Settings, ShoppingBag, Gavel, Star, FileText, Search, Check, AlertCircle, ChevronDown, HelpCircle } from "lucide-react";
import { COURIER_OPTIONS, ARTICLE_TYPE_LABELS, IMAGE_TYPE } from "../../common/enums";
import type { User, Product, Report, ProductQna, Inquiry, Review, Bid, ArticleDto, CommentDto } from "../../common/types";
import * as API from "../../common/api";
import { API_BASE_URL } from "../../common/api";
import type { PaymentHistoryResponse } from "../../common/api";
import ProductCard from "../../components/ui/ProductCard";
import BusinessVerify from "../../components/mypage/BusinessVerify";
import ShippingModal from "../../components/ui/ShippingModal";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import ProfileImageUploader from "../../components/mypage/ProfileImageUploader";
import Avatar from "../../components/ui/Avatar";
import CollapsibleSection from "../../components/ui/CollapsibleSection";

type TabId = "selling" | "buying" | "reviews" | "community" | "profile_edit" | "inquiry";

type Props = {
  user: User | null;
  setUser: (user: User | null) => void;
};

// Helper to construct image URL robustly
const getImageUrl = (path: string | null) => {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("blob:")) return path;
  const baseUrl = API_BASE_URL || "";
  // Ensure path starts with / if it doesn't, to avoid concatenation issues
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

// Social Provider Badges
const ProviderBadge = ({ provider }: { provider: string }) => {
  let color = "bg-gray-100 text-gray-600";
  let label = provider;

  if (provider === "google") {
    color = "bg-white border border-gray-200 text-gray-700";
    label = "Google";
  } else if (provider === "kakao") {
    color = "bg-[#fee500] text-[#3c1e1e]";
    label = "Kakao";
  } else if (provider === "naver") {
    color = "bg-[#03c75a] text-white";
    label = "Naver";
  }

  return (
    <span className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 ${color}`}>
      {/* Simple icon or text */}
      {label} 연동 계정
    </span>
  );
};
const VALID_TABS: TabId[] = ["selling", "buying", "reviews", "community", "profile_edit", "inquiry"];
export default function MyPage({ user, setUser }: Props) {
  const navigate = useNavigate();
  // URL 쿼리 파라미터를 관리합니다.
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get("tab") as TabId | null;
  const initialTab: TabId = (urlTab && VALID_TABS.includes(urlTab))
    ? urlTab
    : "profile_edit";

  const [activeTab, setActiveTab] = useState<TabId>(initialTab); // <-- URL에서 초기값 설정

  // 탭을 변경하고 URL 쿼리 파라미터를 업데이트하는 함수 (핸들러)
  const handleTabChange = (tab: TabId) => {
    // setSearchParams를 호출하여 URL을 변경합니다. (예: /mypage?tab=selling)
    setSearchParams({ tab: tab }, { replace: true });
    // useEffect가 searchParams 변경을 감지하여 activeTab 상태를 동기화합니다.
  };

  // Tab state
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
  const [_myInquiries, setMyInquiries] = useState<Inquiry[]>([]);
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [myArticles, setMyArticles] = useState<ArticleDto[]>([]);
  const [myComments, setMyComments] = useState<CommentDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [shippingModalOpen, setShippingModalOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
  const [modalDefaults, setModalDefaults] = useState({ courier: "CJ", trackingNumber: "" });
  const [expandedReportIds, setExpandedReportIds] = useState<Set<number>>(new Set());

  const toggleReportAnswer = (reportId: number) => {
    setExpandedReportIds((prev) => {
      const next = new Set(prev);
      if (next.has(reportId)) {
        next.delete(reportId);
      } else {
        next.add(reportId);
      }
      return next;
    });
  };

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [myBids, setMyBids] = useState<Bid[]>([]);
  const [confirmTargetId, setConfirmTargetId] = useState<number | null>(null);



  // Profile Edit State
  const [profileForm, setProfileForm] = useState({
    userName: "",
    nickName: "",
    password: "",
    phone: "",
    email: "",
    birthday: "",
  });

  const [addressForm, setAddressForm] = useState({
    address: "",
    detailAddress: "",
    zipCode: "",
  });
  const [nicknameError, setNicknameError] = useState("");

  // Verification States
  const [initialData, setInitialData] = useState({ email: "", phone: "" });
  const [verification, setVerification] = useState({
    isEmailVerified: true,
    isPhoneVerified: true,
    emailCode: "",
    phoneCode: "",
    showEmailInput: false,
    showPhoneInput: false,
    timer: 0,
  });
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [disconnectPassword, setDisconnectPassword] = useState("");

  // Stats
  const [stats, setStats] = useState({
    sellingCount: 0,
    likesCount: 0,
    bidsCount: 0,
    rating: 0,
  });

  // Address Search Handler
  const handleSearchAddress = () => {
    // @ts-ignore
    new window.daum.Postcode({
      oncomplete: function (data: any) {
        let fullAddress = data.address;
        let extraAddress = "";

        if (data.addressType === "R") {
          if (data.bname !== "") extraAddress += data.bname;
          if (data.buildingName !== "") extraAddress += extraAddress !== "" ? `, ${data.buildingName} ` : data.buildingName;
          fullAddress += extraAddress !== "" ? ` (${extraAddress})` : "";
        }

        setAddressForm((prev) => ({
          ...prev,
          address: fullAddress,
          zipCode: data.zonecode,
          detailAddress: "",
        }));
      },
    }).open();
  };

  // Handlers
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));

    if (name === "nickName") {
      const regex = /^[가-힣a-zA-Z0-9]{3,12}$/;
      if (!regex.test(value)) {
        setNicknameError("닉네임은 특수문자 없이 3~12자여야 합니다 (한글, 영문, 숫자).");
      } else {
        setNicknameError("");
      }
    }
  };


  // Verification Logic
  const handleSendEmailCode = async () => {
    try {
      await API.sendVerificationCode(profileForm.email);
      setVerification((prev) => ({ ...prev, showEmailInput: true, timer: 180 }));
      alert("인증 코드가 전송되었습니다.");
    } catch (err: any) {
      alert(err.message || "인증 코드 전송 실패");
    }
  };

  const handleVerifyEmailCode = async () => {
    try {
      await API.checkVerificationCode(profileForm.email, verification.emailCode);
      setVerification((prev) => ({ ...prev, isEmailVerified: true, showEmailInput: false }));
      alert("이메일 인증이 완료되었습니다.");
    } catch (err: any) {
      alert(err.message || "인증 실패");
    }
  };

  const handleSendPhoneCode = async () => {
    try {
      await API.sendPhoneVerificationCode(profileForm.phone);
      setVerification((prev) => ({ ...prev, showPhoneInput: true, timer: 180 }));
      alert("인증 문자가 전송되었습니다.");
    } catch (err: any) {
      alert(err.message || "문자 전송 실패");
    }
  };

  const handleVerifyPhoneCode = async () => {
    try {
      await API.verifyPhoneCode(profileForm.phone, verification.phoneCode);
      setVerification((prev) => ({ ...prev, isPhoneVerified: true, showPhoneInput: false }));
      alert("휴대폰 인증이 완료되었습니다.");
    } catch (err: any) {
      alert(err.message || "인증 실패");
    }
  };


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
        if (err.status === 401) {
          alert("로그인이 만료되었습니다.");
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
        userName: user.userName || "",
        nickName: user.nickName,
        password: "",
        phone: user.phone || "",
        email: user.email || "",
        birthday: user.birthday ? user.birthday.toString() : "",
      });
      if (user.address) {
        setAddressForm({
          address: user.address,
          detailAddress: user.detailAddress || "",
          zipCode: user.zipCode || "",
        });
      }
      setInitialData({
        email: user.email || "",
        phone: user.phone || "",
      });
      setVerification(prev => ({
        ...prev,
        isEmailVerified: true,
        isPhoneVerified: true
      }));
    }
  }, [user]);

  // Watch for changes to require verification
  useEffect(() => {
    if (user) {

      if (profileForm.email !== initialData.email) {
        setVerification(prev => ({ ...prev, isEmailVerified: false }));
      } else {
        setVerification(prev => ({ ...prev, isEmailVerified: true }));
      }

      if (profileForm.phone !== initialData.phone) {
        setVerification(prev => ({ ...prev, isPhoneVerified: false }));
      } else {
        setVerification(prev => ({ ...prev, isPhoneVerified: true }));
      }
    }
  }, [profileForm.email, profileForm.phone, initialData]);


  // Stats Loading (omitted for brevity, same as before)
  useEffect(() => {
    if (!user) return;
    const loadStats = async () => {
      // ... (Keep existing stats logic)
      try {
        const token = localStorage.getItem("token")!;
        const [selling, likes, bids] = await Promise.all([
          API.fetchSellingProducts(user.userId),
          API.fetchMyLikes(token),
          API.fetchMyBids(user.userId),
        ]);
        let rating = 0;
        try {
          const ratingData = await API.fetchAverageRating(user.userId);
          rating = ratingData.averageRating;
        } catch (err) { }
        setStats({ sellingCount: selling.length, likesCount: likes.length, bidsCount: bids.length, rating });
        setSellingProducts(selling);
        setMyBids(bids);
        setMyLikes(likes);
      } catch (err) { }
    };
    loadStats();
  }, [user]);

  // Tab Styling Effect
  useEffect(() => {
    const currentTab = tabRefs.current[activeTab];
    if (currentTab) {
      setIndicatorStyle({
        left: currentTab.offsetLeft,
        width: currentTab.offsetWidth,
      });
    }
  }, [activeTab]);

  // Tab Content Loading (Keep existing logic)
  const loadTabContent = async (tab: TabId) => {
    if (!user) return;
    setLoading(true);
    const token = localStorage.getItem("token")!;
    try {
      switch (tab) {
        case "selling":
          const [sellingResult, sHistoryResult] = await Promise.allSettled([
            API.fetchSellingProducts(user.userId),
            API.fetchSellingHistory()
          ]);
          if (sellingResult.status === "fulfilled") setSellingProducts(sellingResult.value);
          if (sHistoryResult.status === "fulfilled") setSellingHistory(sHistoryResult.value);
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
          setMyReviews(await API.fetchUserReviews(user.userId));
          break;
        case "community":
          const [articles, comments] = await Promise.all([
            API.getArticles({ userId: user.userId }),
            API.fetchUserComments(user.userId),
          ]);
          setMyArticles(articles);
          setMyComments(comments);
          break;
        case "inquiry":
          const [qnasResult, reportsData, inquiries] = await Promise.all([
            API.fetchUserQnas(user.userId),
            API.fetchReports(token),
            API.fetchUserInquiries(token),
          ]);
          setMyQnas(qnasResult);
          setReports(reportsData);
          setMyInquiries(inquiries.map((i: any) => ({
            inquiryId: i.inquiryId, title: i.title, question: i.content, createdAt: i.createdAt,
            answers: (i.answers ?? []).map((a: any) => ({ inquiryReviewId: a.inquiryReviewId, answer: a.answer, nickName: a.nickName ?? "익명", createdAt: a.createdAt ?? new Date().toISOString() }))
          })));
          break;
      }
    } catch (err) {
      console.error("Failed to load tab content:", err);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadTabContent(activeTab); }, [activeTab, user]);

  // 2. URL 파라미터 변경을 감지하고 activeTab을 업데이트합니다. (새로고침 시 탭 유지 핵심)
  useEffect(() => {
    const currentUrlTab = searchParams.get("tab") as TabId | null;
    const newTab: TabId = (currentUrlTab && VALID_TABS.includes(currentUrlTab))
      ? currentUrlTab
      : "profile_edit";

    setActiveTab(newTab); // activeTab 상태를 URL 값으로 업데이트
  }, [searchParams]); // searchParams가 변경될 때마다 실행

  // Tab Styling Effect - 탭 변경 및 레이아웃 로드 시 인디케이터 업데이트
  useEffect(() => {
    // DOM이 완전히 렌더링된 후 인디케이터 위치 계산
    const updateIndicator = () => {
      const currentTab = tabRefs.current[activeTab];
      if (currentTab) {
        setIndicatorStyle({
          left: currentTab.offsetLeft,
          width: currentTab.offsetWidth,
        });
      }
    };

    // requestAnimationFrame을 사용하여 브라우저가 레이아웃을 계산한 후 실행
    const rafId = requestAnimationFrame(() => {
      updateIndicator();
      // 한 번 더 실행하여 확실하게 적용
      requestAnimationFrame(updateIndicator);
    });

    return () => cancelAnimationFrame(rafId);
  }, [activeTab]);

  // Tab Content Loading
  useEffect(() => {
    if (user) {
      loadTabContent(activeTab); // activeTab이 변경될 때마다 데이터 로드
    }
  }, [activeTab, user]);

  // Tab Content Loading
  useEffect(() => {
    if (user) {
      loadTabContent(activeTab); // activeTab이 변경될 때마다 데이터 로드
    }
  }, [activeTab, user]);


  // Handle Update Profile
  const handleUpdateProfile = async () => {
    if (!user) return;

    if (nicknameError) {
      alert("닉네임을 확인해주세요.");
      return;
    }

    if (!verification.isEmailVerified) {
      alert("이메일 인증을 완료해주세요.");
      return;
    }
    if (!verification.isPhoneVerified) {
      alert("휴대폰 인증을 완료해주세요.");
      return;
    }
    if (addressForm.address && !addressForm.detailAddress.trim()) {
      alert("상세 주소를 입력해주세요.");
      return;
    }

    try {
      // ⭐ 모든 정보를 한 번에 보내기
      const updatedUser = await API.updateUserProfile(user.userId, {
        userName: profileForm.userName,
        nickName: profileForm.nickName,
        password: profileForm.password || undefined,
        phone: profileForm.phone,
        email: profileForm.email,
        birthday: profileForm.birthday || undefined,
        address: addressForm.address,
        detailAddress: addressForm.detailAddress,
        zipCode: addressForm.zipCode,
      });

      setUser(updatedUser);
      alert("프로필이 수정되었습니다.");
    } catch (err: any) {
      alert(err.message || "프로필 수정 실패");
    }
  };

  // Handle Disconnect Social
  const handleDisconnectSocial = async () => {
    if (!user) return;
    if (!disconnectPassword) {
      alert("새로운 비밀번호를 입력해주세요.");
      return;
    }
    if (!verification.isEmailVerified || !verification.isPhoneVerified) {
      alert("이메일 및 전화번호 인증이 필요합니다.");
      return;
    }

    // Logic: Update with provider="NONE" and set new password
    try {
      const updatedUser = await API.updateUserProfile(user.userId, {
        nickName: profileForm.nickName,
        password: disconnectPassword, // New password for local login
        phone: profileForm.phone,
        email: profileForm.email,
        birthday: profileForm.birthday || undefined,
        provider: "NONE" // Magic string to clear provider in backend
      });
      setUser(updatedUser);
      setShowDisconnectModal(false);
      alert("계정 연동이 해제되었습니다. 이제 이메일과 비밀번호로 로그인할 수 있습니다.");
    } catch (err: any) {
      alert(err.message || "연동 해제 실패");
    }
  };


  // Other handlers (Delete, Shipping, Confirm, Review) - Keep as is
  const handleDeleteAccount = async () => { /* ... */
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
  const handleShippingSubmit = async (courier: string, trackingNumber: string) => { /* ... */
    if (!selectedPaymentId) return;
    try {
      await API.updateShippingInfo(selectedPaymentId, courier, trackingNumber);
      alert("배송 정보가 등록되었습니다.");
      setShippingModalOpen(false); setSelectedPaymentId(null); loadTabContent("selling");
    } catch (err: any) { alert(err.message || "배송 정보 등록 실패"); }
  };
  const openShippingModal = (id: number, courier = "CJ", trackingNumber = "") => { /* ... */ setSelectedPaymentId(id); setModalDefaults({ courier, trackingNumber }); setShippingModalOpen(true); };
  const handleConfirmPurchase = (id: number) => { /* ... */ setConfirmTargetId(id); setConfirmModalOpen(true); };
  const executeConfirmPurchase = async () => { /* ... */
    if (!confirmTargetId) return;
    await API.confirmPurchase(confirmTargetId);
    setConfirmModalOpen(false);
    await new Promise(r => setTimeout(r, 500));
    await loadTabContent("buying");
  };


  if (!user) return <div className="text-center py-20 text-gray-500">로딩 중...</div>;

  const tabs = [
    { id: "profile_edit" as TabId, label: "회원 정보", icon: Settings },
    { id: "selling" as TabId, label: "판매 관리", icon: Package },
    { id: "buying" as TabId, label: "구매 활동", icon: ShoppingBag },
    { id: "reviews" as TabId, label: "받은 리뷰", icon: Star },
    { id: "community" as TabId, label: "커뮤니티", icon: MessageSquare },
    { id: "inquiry" as TabId, label: "문의", icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen">
      <div className="w-full max-w-[1280px] mx-auto px-4 xl:px-0">
        {/* Profile Summary Card */}
        <div className="py-8 mb-8 border-b border-[#eee]">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="w-32 h-32 rounded-lg bg-[#333] flex items-center justify-center overflow-hidden flex-shrink-0">
              <Avatar src={user.images?.[0]?.imagePath} alt="Profile" className="w-full h-full text-3xl" fallbackText={user.nickName} />
            </div>
            <div className="flex-1 min-w-0 w-full text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3 mb-1 justify-center md:justify-start">
                <h2 className="text-2xl font-bold text-[#111] truncate max-w-full md:max-w-md">{user.nickName || user.userName}</h2>
                {user.provider && <ProviderBadge provider={user.provider} />}
              </div>
              <p className="text-sm text-[#666] truncate">{user.email}</p>
              <div className="flex flex-wrap gap-4 sm:gap-6 md:gap-8 mt-6 pt-6 border-t border-[#eee] justify-center md:justify-start">
                {/* Stats items... added whitespace-nowrap */}
                <div className="flex items-center gap-2 whitespace-nowrap"><Package size={18} className="text-[#666]" /><span className="text-sm text-[#666]">판매중 <span className="font-bold text-[#111]">{stats.sellingCount}</span></span></div>
                <div className="flex items-center gap-2 whitespace-nowrap"><Heart size={18} className="text-[#666]" /><span className="text-sm text-[#666]">찜 <span className="font-bold text-[#111]">{stats.likesCount}</span></span></div>
                <div className="flex items-center gap-2 whitespace-nowrap"><Gavel size={18} className="text-[#666]" /><span className="text-sm text-[#666]">입찰 <span className="font-bold text-[#111]">{stats.bidsCount}</span></span></div>
                <div className="flex items-center gap-2 whitespace-nowrap"><Star size={18} className="text-[#666]" /><span className="text-sm text-[#666]">평점 <span className="font-bold text-[#111]">{stats.rating.toFixed(1)}</span></span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-t-xl border-b border-gray-200 sticky top-14 z-990 shadow-sm">
          <div className="flex relative overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  ref={(el) => { if (el) tabRefs.current[tab.id] = el; }}
                  // ⭐ 수정: setActiveTab 대신 handleTabChange 호출
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex-1 px-4 md:px-6 py-4 text-sm font-medium transition-colors relative flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === tab.id ? "text-[#333]" : "text-gray-600 hover:text-gray-900"}`}
                >
                  <Icon size={18} /> {tab.label}
                </button>
              );
            })}
            <div className="absolute bottom-0 h-0.5 bg-[#333] transition-all duration-300 ease-out" style={{ left: `${indicatorStyle.left}px`, width: `${indicatorStyle.width}px` }} />
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-b-xl py-4 px-1">
          {loading ? <div className="text-center py-10">로딩 중...</div> : (
            <>
              {activeTab === "profile_edit" && (
                <div className="space-y-8 w-full mx-auto">
                  <CollapsibleSection title="프로필 이미지" icon={<Settings size={20} />} className="border-0">
                    <ProfileImageUploader user={user} isEditing={true} onUpload={(url: string) => setUser({ ...user, images: [{ imageId: 0, refId: user.userId, imagePath: url, imageType: IMAGE_TYPE.USER }] })} onDelete={() => setUser({ ...user, images: [] })} />
                  </CollapsibleSection>

                  <CollapsibleSection title="회원 정보 수정" icon={<Settings size={20} />}>
                    <div className="space-y-6 bg-white p-6">
                      {/* Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                        <input type="text" value={profileForm.userName} onChange={(e) => setProfileForm({ ...profileForm, userName: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="이름 입력" />
                      </div>

                      {/* Email Field - Readonly for social users unless disconnected */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">아이디 (이메일)</label>
                        <div className="flex gap-2">
                          <input type="email" value={profileForm.email} readOnly={!!user.provider} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} className={`flex-1 px-4 py-2 border border-gray-300 rounded-lg ${user.provider ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "bg-white"}`} placeholder="이메일 입력" />
                          {!verification.isEmailVerified && (
                            <button onClick={handleSendEmailCode} className="px-3 py-2 bg-black text-white rounded-lg text-sm whitespace-nowrap">인증하기</button>
                          )}
                          {verification.isEmailVerified && (
                            <span className="px-3 py-2 text-green-600 flex items-center"><Check size={18} /></span>
                          )}
                        </div>
                        {user.provider && <p className="text-xs text-gray-500 mt-1">소셜 로그인 계정은 이메일을 변경할 수 없습니다. 변경하려면 연동을 해제하세요.</p>}
                        {verification.showEmailInput && !verification.isEmailVerified && (
                          <div className="mt-2 flex gap-2">
                            <input type="text" value={verification.emailCode} onChange={(e) => setVerification(prev => ({ ...prev, emailCode: e.target.value }))} placeholder="인증코드 입력" className="flex-1 px-4 py-2 border border-gray-300 rounded-lg" />
                            <button onClick={handleVerifyEmailCode} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm">확인</button>
                            <div className="flex items-center text-red-500 text-xs">{verification.timer}초</div>
                          </div>
                        )}
                      </div>

                      {/* Nickname */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">닉네임</label>
                        <input
                          type="text"
                          name="nickName"
                          value={profileForm.nickName}
                          onChange={handleProfileChange}
                          className="w-full px-3 py-2 border rounded-md focus:ring-black focus:border-black"
                        />
                        {nicknameError && <p className="text-red-500 text-xs mt-1">{nicknameError}</p>}
                      </div>

                      {/* Birthday (New) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">생년월일</label>
                        <DatePickerStyle
                          selected={profileForm.birthday ? new Date(profileForm.birthday) : null}
                          onChange={(date) => {
                            if (date) {
                              const year = date.getFullYear();
                              const month = String(date.getMonth() + 1).padStart(2, "0");
                              const day = String(date.getDate()).padStart(2, "0");
                              setProfileForm({ ...profileForm, birthday: `${year} -${month} -${day} ` });
                            }
                          }}
                          placeholder="생년월일 선택"
                        />
                      </div>

                      {/* Phone Field with Verification */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
                        <div className="flex gap-2">
                          <input type="tel" value={profileForm.phone} placeholder="전화번호 입력" onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg" />
                          {!verification.isPhoneVerified && (
                            <button onClick={handleSendPhoneCode} className="px-3 py-2 bg-black text-white rounded-lg text-sm whitespace-nowrap">인증하기</button>
                          )}
                          {verification.isPhoneVerified && (
                            <span className="px-3 py-2 text-green-600 flex items-center"><Check size={18} /></span>
                          )}
                        </div>
                        {verification.showPhoneInput && !verification.isPhoneVerified && (
                          <div className="mt-2 flex gap-2">
                            <input type="text" value={verification.phoneCode} onChange={(e) => setVerification(prev => ({ ...prev, phoneCode: e.target.value }))} placeholder="인증코드 입력" className="flex-1 px-4 py-2 border border-gray-300 rounded-lg" />
                            <button onClick={handleVerifyPhoneCode} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm">확인</button>
                            <div className="flex items-center text-red-500 text-xs">{verification.timer}초</div>
                          </div>
                        )}
                      </div>

                      {/* Password: Hide if social provider exists, but allow "disconnect" */}
                      {!user.provider ? (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 <span className="text-gray-400 text-xs font-normal">(변경 시에만 입력)</span></label>
                          <input type="password" value={profileForm.password} onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="새 비밀번호 입력" />
                        </div>
                      ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-sm text-gray-900">소셜 계정 연동 중</h4>
                            <p className="text-xs text-gray-500">비밀번호 및 이메일 변경 불가</p>
                          </div>
                          <button onClick={() => setShowDisconnectModal(true)} className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-bold rounded shadow-sm hover:bg-gray-100">계정 연동 해제</button>
                        </div>
                      )}

                      {/* Address */}
                      <div className="pt-4 border-t border-gray-100">
                        <div className="flex justify-between items-center mb-3">
                          <label className="block text-sm font-medium text-gray-700">주소 관리</label>
                          <button type="button" onClick={handleSearchAddress} className="px-3 py-1.5 bg-[#333] text-white text-xs rounded-lg hover:bg-black transition-colors flex items-center gap-1"><Search size={12} /> 주소 검색</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="md:col-span-2 flex gap-2">
                            <input type="text" placeholder="우편번호" value={addressForm.zipCode} readOnly className="w-32 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" />
                            <input type="text" placeholder="도로명 주소" value={addressForm.address} readOnly className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" />
                          </div>
                          <input type="text" placeholder="상세 주소" value={addressForm.detailAddress} onChange={(e) => setAddressForm({ ...addressForm, detailAddress: e.target.value })} className="w-full md:col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black" />
                        </div>
                      </div>

                      <div className="flex justify-end pt-4">
                        <button onClick={handleUpdateProfile} className="px-6 py-2.5 bg-[#333] text-white rounded-lg hover:bg-black transition-colors font-medium shadow-sm">회원 정보 수정 저장</button>
                      </div>
                    </div>
                  </CollapsibleSection>
                  {/* Business Verify & Delete Account sections ... keep as is */}
                  <CollapsibleSection title="사업자 인증" icon={<Check size={20} />}>
                    <div className="bg-white p-6">
                      {user.businessNumber ? (
                        <div className="flex items-center justify-between">
                          <div><p className="text-sm text-gray-500 mb-1">사업자 등록번호</p><p className="font-medium text-gray-900">{user.businessNumber}</p></div>
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-bold rounded-full">인증됨</span>
                        </div>
                      ) : (
                        showBusinessVerify ? (<BusinessVerify userId={user.userId} onVerified={(bn) => { setUser({ ...user, businessNumber: bn }); setShowBusinessVerify(false); }} onCancel={() => setShowBusinessVerify(false)} />) : (
                          <button onClick={() => setShowBusinessVerify(true)} className="px-4 py-2 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium transition-colors">사업자 인증하기</button>
                        )
                      )}
                    </div>
                  </CollapsibleSection>
                  <CollapsibleSection title="계정 관리" icon={<AlertCircle size={20} />} className="border-0">
                    <div className="bg-red-50 border border-red-100 rounded-lg p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div><h4 className="font-bold text-red-900 mb-1">회원 탈퇴</h4><p className="text-sm text-red-700">회원 탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.</p></div>
                      <button onClick={handleDeleteAccount} className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium whitespace-nowrap">회원 탈퇴</button>
                    </div>
                  </CollapsibleSection>

                </div>
              )}
              {activeTab === "selling" && (
                <div className="space-y-8">
                  <CollapsibleSection title="판매 완료 및 배송 관리" icon={<ShoppingBag size={20} />}>
                    {sellingHistory.length === 0 ? <div className="text-center py-12 bg-gray-50 rounded-lg"><p className="text-gray-500">판매 내역이 없습니다.</p></div> :
                      <div>{sellingHistory.map((item) => <div key={item.paymentId} className="p-4 border-b border-gray-200 last:border-0 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        <div className="flex-1 min-w-0 flex gap-4 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate(`/products/${item.productId}`)}>
                          <div className="w-20 h-20 bg-[#f8f8f8] rounded-[10px] border border-[#f0f0f0] overflow-hidden flex-shrink-0 relative">
                            {item.productImage ? (
                              <img
                                src={getImageUrl(item.productImage)}
                                alt="product"
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                onError={(e) => {
                                  console.error("Image Load Error:", getImageUrl(item.productImage));
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="flex justify-center items-center w-full h-full text-[#aaa] text-xs"></div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-gray-900 truncate">{item.productTitle}</div>
                            <div className="text-sm text-gray-500">구매자: {item.buyerName}</div>
                            <div className="text-sm text-gray-500">가격: {item.price.toLocaleString()}원</div>
                            <div className="text-xs text-gray-400">{new Date(item.paidAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 min-w-[200px] w-full md:w-auto">
                          <div className="text-sm font-bold text-blue-600">{item.status}</div>
                          {item.courier && item.trackingNumber ? (
                            <div className="text-sm text-gray-600 text-right">
                              <div>{COURIER_OPTIONS.find(c => c.value === item.courier)?.label || item.courier}</div>
                              <div className="text-xs mb-1">{item.trackingNumber}</div>
                              <button onClick={() => openShippingModal(item.paymentId, item.courier!, item.trackingNumber!)} className="text-xs text-gray-400 underline hover:text-gray-600">수정</button>
                            </div>
                          ) : (
                            <button onClick={() => openShippingModal(item.paymentId)} className="px-3 py-1 bg-black text-white text-xs rounded hover:bg-gray-800">배송 정보 입력</button>
                          )}
                        </div>
                      </div>)}</div>}
                  </CollapsibleSection>
                  <CollapsibleSection title="판매 중인 상품" icon={<Package size={20} />}>
                    {sellingProducts.length === 0 ? <div className="text-center py-12 bg-gray-50 rounded-lg"><Package size={48} className="mx-auto text-gray-300 mb-3" /><p className="text-gray-500 mb-4">판매 중인 상품이 없습니다.</p><button onClick={() => navigate("/register")} className="px-6 py-2 bg-[#333] text-white rounded-lg hover:bg-blue-700 transition-colors">상품 등록하기</button></div> : <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-4 p-3">{sellingProducts.map((p) => <ProductCard key={p.productId} product={p} />)}</div>}
                  </CollapsibleSection>

                </div>
              )}
              {activeTab === "buying" && (
                <div className="space-y-8 px-1">
                  <CollapsibleSection title="구매 내역" icon={<ShoppingBag size={20} />}>
                    {buyingHistory.length === 0 ? <div className="text-center py-12 bg-[#f9f9f9] rounded-lg border border-[#eee]"><ShoppingBag size={40} className="mx-auto text-[#ddd] mb-2" /><p className="text-[#666]">구매 내역이 없습니다.</p></div> :
                      <div>{buyingHistory.map((item) => <div key={item.paymentId} className="p-4 border-b border-gray-200 last:border-0 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        <div className="flex-1 min-w-0 flex gap-4 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate(`/products/${item.productId}`)}>
                          <div className="w-20 h-20 bg-[#f8f8f8] rounded-[10px] border border-[#f0f0f0] overflow-hidden flex-shrink-0 relative">
                            {item.productImage ? (
                              <img
                                src={getImageUrl(item.productImage)}
                                alt="product"
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                onError={(e) => {
                                  console.error("Image Load Error:", getImageUrl(item.productImage));
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="flex justify-center items-center w-full h-full text-[#aaa] text-xs"></div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-gray-900 truncate">{item.productTitle}</div>
                            <div className="text-sm text-gray-500">판매자: {item.sellerNickName}</div>
                            <div className="text-sm text-gray-500">가격: {item.price.toLocaleString()}원</div>
                            <div className="text-xs text-gray-400">{new Date(item.paidAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 text-right w-full md:w-auto">
                          <div className="text-sm font-bold text-blue-600">{item.status}</div>
                          <div className="flex gap-2 justify-end">
                            {item.status === "PAID" && (
                              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleConfirmPurchase(item.paymentId); }} className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 font-medium whitespace-nowrap">구매 확정</button>
                            )}
                            {item.status === "CONFIRMED" && (
                              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/reviews/write/${item.productId}`); }} className="px-3 py-1 bg-black text-white text-xs rounded hover:bg-gray-800 font-medium whitespace-nowrap">리뷰 작성</button>
                            )}
                          </div>
                          {item.courier && item.trackingNumber && (
                            <div className="text-sm text-gray-600">
                              <div>{COURIER_OPTIONS.find(c => c.value === item.courier)?.label || item.courier}</div>
                              <div className="text-xs">{item.trackingNumber}</div>
                            </div>
                          )}
                        </div>
                      </div>)}</div>}
                  </CollapsibleSection>
                  <CollapsibleSection title="입찰 내역" icon={<Gavel size={20} />}>
                    {myBids.length === 0 ? <div className="text-center py-12 bg-[#f9f9f9] rounded-lg border border-[#eee]"><Gavel size={40} className="mx-auto text-[#ddd] mb-2" /><p className="text-[#666]">입찰 내역이 없습니다.</p></div> : <div>{myBids.map(bid => <div key={bid.bidId} className="p-4 border-b"><div
                      className="font-bold hover:underline cursor-pointer"
                      onClick={() => navigate(`/products/${bid.productId}`)}
                    >{bid.productName || "상품명 없음"}</div><div>{(bid.bidAmount || bid.bidPrice).toLocaleString()}원</div><div className="text-xs text-gray-500">{new Date(bid.bidTime || bid.createdAt).toLocaleString()}</div></div>)}</div>}
                  </CollapsibleSection>
                  <CollapsibleSection title="찜한 상품" icon={<Heart size={20} />}>
                    {myLikes.length === 0 ? <div className="text-center py-16 bg-[#f9f9f9] rounded-lg border border-[#eee]"><Heart size={48} className="mx-auto text-[#ddd] mb-3" /><p className="text-[#666] mb-4">찜한 상품이 없습니다.</p><button onClick={() => navigate("/products")} className="px-6 py-2.5 bg-[#111] text-white rounded-lg hover:bg-[#333] transition-colors font-medium">상품 둘러보기</button></div> : <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-4 p-3">{myLikes.map((p) => <ProductCard key={p.productId} product={p} />)}</div>}
                  </CollapsibleSection>
                </div>
              )}
              {activeTab === "reviews" && (
                <div className="space-y-8">
                  <CollapsibleSection title="받은 리뷰" icon={<Star size={20} className="text-yellow-600" />}>
                    {myReviews.length === 0 ? <div className="text-center py-12 bg-gray-50 rounded-lg"><p className="text-gray-500">받은 리뷰가 없습니다.</p></div> : <div>{myReviews.map((review, idx) => <div key={review.reviewId} className={`p-4 ${idx !== 0 ? "border-t border-gray-200" : ""}`}><div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><div className="flex items-center">{[...Array(5)].map((_, i) => <Star key={i} size={16} className={i < review.rating ? "text-yellow-500" : "text-gray-300"} fill={i < review.rating ? "currentColor" : "none"} />)}</div><span className="text-sm font-bold text-gray-900">{review.nickName}</span></div><span className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span></div><p className="text-sm text-gray-700">{review.content}</p></div>)}</div>}
                  </CollapsibleSection>
                </div>
              )}
              {activeTab === "community" && (
                <div className="space-y-8">
                  {/* 작성한 글 */}
                  <CollapsibleSection title="작성한 글" icon={<FileText size={20} />}>
                    {myArticles.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">작성한 글이 없습니다.</p>
                      </div>
                    ) : (
                      <div>
                        {myArticles.map((article, idx) => (
                          <div
                            key={article.articleId}
                            className={`p-4 ${idx !== 0 ? "border-t border-gray-200" : ""} hover:bg-gray-50 cursor-pointer`}
                            onClick={() => navigate(`/articles/${article.articleId}`)}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <div>
                                <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded mr-2 align-middle">
                                  {ARTICLE_TYPE_LABELS[article.articleType]}
                                </span>
                                <span className="font-medium text-gray-900 align-middle">
                                  {article.title}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                {new Date(article.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-1">{article.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CollapsibleSection>

                  {/* 작성한 댓글 */}
                  <CollapsibleSection title="작성한 댓글" icon={<MessageSquare size={20} />}>
                    {myComments.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">작성한 댓글이 없습니다.</p>
                      </div>
                    ) : (
                      <div>
                        {myComments.map((comment, idx) => (
                          <div
                            key={comment.commentId}
                            className={`p-4 ${idx !== 0 ? "border-t border-gray-200" : ""} hover:bg-gray-50 cursor-pointer`}
                            onClick={() => navigate(`/articles/${comment.articleId}`)}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">
                                  {comment.articleTitle}
                                </p>
                                <p className="text-sm font-medium text-gray-900 line-clamp-2">
                                  {comment.content}
                                </p>
                              </div>
                              <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                {new Date(comment.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CollapsibleSection>

                </div>
              )}
              {activeTab === "inquiry" && (
                <div className="space-y-8">
                  <CollapsibleSection title="상품 Q&A" icon={<MessageSquare size={20} />}>
                    {myQnas.length === 0 ? <div className="text-center py-12 bg-gray-50 rounded-lg"><p className="text-gray-500">문의 내역이 없습니다.</p></div> : <div>{myQnas.map((qna, idx) => <div key={qna.productQnaId} className={`p-4 ${idx !== 0 ? "border-t border-gray-200" : ""} hover:bg-gray-50`}><div className="flex justify-between items-start mb-2"><p className="font-medium text-gray-900 mb-1">{qna.title}</p><span className="text-xs text-gray-500">{new Date(qna.createdAt).toLocaleDateString()}</span></div><p className="text-sm text-gray-600 mb-2">{qna.content}</p>{qna.answers?.map(a => <div key={a.qnaReviewId} className="mt-2 pl-4 border-l-2 border-blue-500 bg-blue-50 p-3 rounded-r"><p className="text-sm text-gray-700">{a.content}</p></div>)}</div>)}</div>}
                  </CollapsibleSection>

                  <CollapsibleSection title="신고 내역" icon={<AlertCircle size={20} />}>
                    {reports.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">신고 내역이 없습니다.</p>
                      </div>
                    ) : (
                      <div>
                        {reports.map((report, idx) => (
                          <div
                            key={report.reportId}
                            className={`p-4 ${idx !== 0 ? "border-t border-gray-200" : ""}`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm font-medium text-gray-900 mb-1">
                                  신고 사유: {report.reason}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(report.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <span
                                className={`px-2 py-1 rounded text-xs font-bold ${report.status
                                  ? "bg-green-100 text-green-700"
                                  : "bg-yellow-100 text-yellow-700"
                                  }`}
                              >
                                {report.status ? "처리 완료" : "처리 중"}
                              </span>
                            </div>
                            {report.answer && (
                              <div className="mt-2">
                                <button
                                  onClick={() => toggleReportAnswer(report.reportId)}
                                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                                >
                                  {expandedReportIds.has(report.reportId) ? "답변 접기" : "답변 보기"}
                                  <ChevronDown
                                    size={16}
                                    className={`transition-transform duration-200 ${expandedReportIds.has(report.reportId) ? "rotate-180" : ""
                                      }`}
                                  />
                                </button>
                                {expandedReportIds.has(report.reportId) && (
                                  <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-700 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <span className="font-bold text-black block mb-1">답변:</span>
                                    {report.answer}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CollapsibleSection>
                </div>
              )}



              <ShippingModal isOpen={shippingModalOpen} onClose={() => setShippingModalOpen(false)} onSubmit={handleShippingSubmit} defaultCourier={modalDefaults.courier} defaultTrackingNumber={modalDefaults.trackingNumber} />

              <ConfirmModal isOpen={confirmModalOpen} onClose={() => setConfirmModalOpen(false)} onConfirm={executeConfirmPurchase} title="구매 확정" message="구매를 확정하시겠습니까?" confirmText="확인" cancelText="취소" />

              {/* Disconnect Social Modal */}
              {
                showDisconnectModal && (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 relative">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">계정 연동 해제</h3>
                      <p className="text-sm text-gray-500 mb-6">
                        소셜 계정 연동을 해제하려면 새로운 비밀번호를 설정해야 합니다.<br />
                        연동 해제 후에는 <strong>{profileForm.email}</strong> 이메일과 설정한 비밀번호로 로그인할 수 있습니다.
                        <br /><span className="text-red-500 text-xs">* 이메일/전화번호 인증이 완료되어야 합니다.</span>
                      </p>

                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호 설정</label>
                        <input type="password" value={disconnectPassword} onChange={(e) => setDisconnectPassword(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="8자 이상, 숫자/특수문자 포함" />
                      </div>

                      <div className="flex justify-end gap-3">
                        <button onClick={() => setShowDisconnectModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">취소</button>
                        <button onClick={handleDisconnectSocial} disabled={!verification.isEmailVerified || !verification.isPhoneVerified} className="px-4 py-2 bg-[#333] text-white rounded-lg hover:bg-black transition-colors font-medium disabled:bg-gray-300">
                          연동 해제 및 전환
                        </button>
                      </div>
                      <button onClick={() => setShowDisconnectModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><AlertCircle className="rotate-45" size={20} /></button>
                    </div>
                  </div>
                )
              }
            </>
          )
          }
        </div>
      </div>
    </div>
  );
}