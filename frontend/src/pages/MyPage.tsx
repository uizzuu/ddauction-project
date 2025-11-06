import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type {
  User,
  Product,
  Report,
  Qna,
  ProductForm,
  Category,
  Inquiry,
  Review,
} from "../types/types";
import { PRODUCT_STATUS, PAYMENT_STATUS } from "../types/types";
import { API_BASE_URL } from "../services/api";

// Components Import
import UserInfoEdit from "../components/mypage/UserInfoEdit";
import SellingProducts from "../components/mypage/SellingProducts";
import BookmarkedProducts from "../components/mypage/BookmarkedProducts";
import MyReports from "../components/mypage/MyReports";
import MyQnas from "../components/mypage/MyQnas";
import MyInquiries from "../components/mypage/MyInquiries";
import ReviewManagement from "../components/mypage/ReviewManagement";
import PaymentProducts from "../components/mypage/PaymentProducts";

// ★ 이미지 URL 절대 경로 처리 (Helper Function)
const normalizeProduct = (
  p: Partial<Product>,
  API_BASE_URL: string
): Product & { imageUrl: string } =>
({
  productId: p.productId ?? 0,
  title: p.title ?? "제목 없음",
  content: p.content ?? "",
  startingPrice: p.startingPrice ?? 0,
  imageUrl: p.images?.[0]?.imagePath
    ? `${API_BASE_URL.replace(/\/$/, "")}${p.images[0].imagePath}`
    : "",
  oneMinuteAuction: p.oneMinuteAuction ?? false,
  auctionEndTime: p.auctionEndTime ?? (() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  })(),
  productStatus: p.productStatus ?? PRODUCT_STATUS[0],
  paymentStatus: p.paymentStatus ?? PAYMENT_STATUS[0],
  categoryId: p.categoryId ?? 0,
  categoryName: p.categoryName ?? "없음",
  sellerId: p.sellerId ?? 0,
  sellerNickName: p.sellerNickName ?? "익명",
  bidId: p.bidId,
  bidPrice: p.bidPrice,
  bids: (p.bids ?? []).map((b) => ({
    bidId: b.bidId ?? 0,
    bidPrice: b.bidPrice ?? 0,
    userId: b.userId ?? 0,
    isWinning: b.isWinning ?? false,
    createdAt: b.createdAt ?? (() => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    })(),
  })),
  bid: p.bid
    ? {
      bidId: p.bid.bidId ?? 0,
      bidPrice: p.bid.bidPrice ?? 0,
      userId: p.bid.userId ?? p.sellerId ?? 0,
      isWinning: p.bid.isWinning ?? false,
      createdAt: p.bid.createdAt ?? (() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      })(),
    }
    : null,
} as Product & { imageUrl: string });

type MypageSection =
  | "info"
  | "selling"
  | "bookmarks"
  | "reports"
  | "qnas"
  | "inquiries"
  | "reviews"
  | "payments"
  | "purchases"
  | "bids"
  | "withdrawal";

type Props = {
  user: User | null;
  setUser: (user: User | null) => void;
};

export default function MyPage({ user, setUser }: Props) {
  // 섹션 상태는 하나로 통합 (editing, showSelling 등을 대체)
  const [section, setSection] = useState<MypageSection>("info");

  // 나머지 상태는 유지
  const [editingProductId, setEditingProductId] = useState<number | null>(null);

  // Review states
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [targetUserId, setTargetUserId] = useState<number>(0);
  const [rating, setRating] = useState<number>(5);
  const [comments, setComments] = useState<string>("");

  // User form state
  const [form, setForm] = useState({
    nickName: user?.nickName || "",
    password: "",
    phone: user?.phone || "",
  });

  // Product form state
  const [productForm, setProductForm] = useState<
    ProductForm & { productStatus: string }
  >({
    title: "",
    content: "",
    startingPrice: "",
    oneMinuteAuction: false,
    auctionEndTime: "",
    categoryId: null,
    productStatus: PRODUCT_STATUS[0],
    images: [],
  });

  // Data states
  const [sellingProducts, setSellingProducts] = useState<Product[]>([]);
  const [bookmarkedProducts, setBookmarkedProducts] = useState<Product[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [myQnas, setMyQnas] = useState<Qna[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [myInquiries, setMyInquiries] = useState<Inquiry[]>([]);

  const navigate = useNavigate();

  // ----------------------------------------------------
  // Effects & Initial Load
  // ----------------------------------------------------

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    fetch(`${API_BASE_URL}/api/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("유저 정보 불러오기 실패");
        return res.json();
      })
      .then((data) => setUser(data))
      .catch((err) => {
        console.error(err);
        navigate("/");
      });
  }, [navigate, setUser]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/categories`)
      .then((res) => res.json())
      .then(setCategories)
      .catch((err) => console.error("카테고리 불러오기 실패", err));
  }, []);

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        nickName: user.nickName || "",
        phone: user.phone || "",
      }));
    }
  }, [user]);

  // ----------------------------------------------------
  // User Actions
  // ----------------------------------------------------

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    if (!user) return alert("로그인이 필요합니다.");

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/users/${user.userId}/mypage`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
        alert("정보가 수정되었습니다.");
      } else {
        const errorText = await res.text();
        alert("정보 수정 실패: " + errorText);
      }
    } catch (err) {
      console.error(err);
      alert("서버 오류");
    }
  };

  const handleDelete = async () => {
    if (!user) return alert("로그인이 필요합니다.");
    if (!confirm("정말 회원 탈퇴하시겠습니까?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${user.userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setUser(null);
        navigate("/");
        alert("회원탈퇴 완료");
      } else {
        const errorText = await res.text();
        alert("회원 탈퇴 실패: " + errorText);
      }
    } catch (err) {
      console.error(err);
      alert("서버 오류");
    }
  };

  // ----------------------------------------------------
  // Data Fetching & Helpers
  // ----------------------------------------------------

  const getCategoryName = (categoryId?: number) =>
    categories.find((c) => c.categoryId === categoryId)?.name || "없음";

  const goToProductDetail = (productId: number) =>
    navigate(`/products/${productId}`);

  const fetchSellingProducts = async () => {
    if (!user) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/products/seller/${user.userId}`
      );
      if (res.ok) {
        const data: Partial<Product>[] = await res.json();
        setSellingProducts(data.map((p) => normalizeProduct(p, API_BASE_URL)));
      } else {
        alert("판매 상품 조회 실패");
      }
    } catch (err) {
      console.error(err);
      alert("서버 오류");
    }
  };

  const handleFetchBookmarkedProducts = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/bookmarks/mypage`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data: Partial<Product>[] = await res.json();
        setBookmarkedProducts(
          data.map((p) => normalizeProduct(p, API_BASE_URL))
        );
      } else {
        alert("찜 상품 조회 실패");
      }
    } catch (err) {
      console.error(err);
      alert("서버 오류");
    }
  };

  const handleFetchReports = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/reports/mypage`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data: Report[] = await res.json();
        setReports(data);
      } else {
        alert("신고 내역 조회 실패");
      }
    } catch (err) {
      console.error(err);
      alert("서버 오류");
    }
  };

  const handleFetchMyQnas = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/qna/user/${user.userId}`);
      if (res.ok) {
        const data: Qna[] = await res.json();
        setMyQnas(data);
      } else {
        alert("Q&A 조회 실패");
      }
    } catch (err) {
      console.error(err);
      alert("서버 오류");
    }
  };

  const handleFetchMyInquiries = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/inquiry/user`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const dataFromServer: {
          inquiryId: number;
          title: string;
          content: string;
          createdAt: string;
          answers?: {
            inquiryReviewId: number;
            answer: string;
            nickName?: string;
            createdAt?: string;
          }[];
        }[] = await res.json();
        const mappedData: Inquiry[] = dataFromServer.map((i) => ({
          inquiryId: i.inquiryId,
          title: i.title,
          question: i.content,
          createdAt: i.createdAt,
          answers: (i.answers ?? []).map((a) => ({
            inquiryReviewId: a.inquiryReviewId,
            answer: a.answer,
            nickName: a.nickName ?? "익명",
            createdAt: a.createdAt ?? (() => {
              const now = new Date();
              const year = now.getFullYear();
              const month = String(now.getMonth() + 1).padStart(2, "0");
              const day = String(now.getDate()).padStart(2, "0");
              const hours = String(now.getHours()).padStart(2, "0");
              const minutes = String(now.getMinutes()).padStart(2, "0");
              const seconds = String(now.getSeconds()).padStart(2, "0");
              return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
            })(),
          })),
        }));
        setMyInquiries(mappedData);
      } else {
        alert("문의 내역 조회 실패");
      }
    } catch (err) {
      console.error(err);
      alert("서버 오류");
    }
  };

  const fetchMyReviews = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE_URL}/reviews/user/${user.userId}`);
      if (res.ok) {
        const data = await res.json();
        setMyReviews(data);
      }
      const avgRes = await fetch(
        `${API_BASE_URL}/reviews/user/${user.userId}/average`
      );
      if (avgRes.ok) {
        const data = await avgRes.json();
        setAverageRating(data.averageRating);
      }
    } catch (err) {
      console.error(err);
      alert("리뷰 불러오기 실패");
    }
  };

  const handleSubmitReview = async () => {
    if (!targetUserId || !rating)
      return alert("리뷰 대상과 평점을 입력해주세요.");

    const token = localStorage.getItem("token");
    if (!token) return alert("로그인이 필요합니다.");

    try {
      const res = await fetch(`${API_BASE_URL}/reviews/${targetUserId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating, comments }),
      });

      if (res.ok) {
        alert("리뷰가 등록되었습니다.");
        fetchMyReviews();
        setTargetUserId(0);
        setComments("");
        setRating(5);
      } else {
        const errorText = await res.text();
        alert("리뷰 등록 실패: " + errorText);
      }
    } catch (err) {
      console.error(err);
      alert("서버 오류");
    }
  };

  // ----------------------------------------------------
  // Product Edit Actions
  // ----------------------------------------------------

  const handleEditProduct = (product: Product) => {
    setEditingProductId(product.productId);
    setProductForm({
      title: product.title,
      content: product.content ?? "",
      startingPrice: String(product.startingPrice ?? 0),
      oneMinuteAuction: product.oneMinuteAuction ?? false,
      auctionEndTime: product.auctionEndTime,
      categoryId: product.categoryId ?? null,
      productStatus: product.productStatus ?? PRODUCT_STATUS[0],
      images: [],
    });
  };

  const handleChangeProductForm = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    if (e.target.type === "file") {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        setProductForm({ ...productForm, images: Array.from(files) });
      }
      return;
    }
    const value =
      e.target instanceof HTMLSelectElement && e.target.name !== "productStatus"
        ? Number(e.target.value)
        : e.target.value;
    setProductForm({ ...productForm, [e.target.name]: value });
  };

  const handleSaveProduct = async () => {
    if (!editingProductId) return;
    if (!productForm.categoryId) {
      alert("카테고리를 선택해주세요.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", productForm.title);
      formData.append("content", productForm.content);
      formData.append("startingPrice", productForm.startingPrice);
      formData.append("categoryId", String(productForm.categoryId));
      formData.append("auctionEndTime", productForm.auctionEndTime);
      formData.append("oneMinuteAuction", String(productForm.oneMinuteAuction));

      // 이미지 파일 추가
      productForm.images?.forEach((file) => formData.append("images", file));

      const res = await fetch(`${API_BASE_URL}/api/products/${editingProductId}`, {
        method: "PUT",
        body: formData,
      });

      if (res.ok) {
        const updatedProduct = normalizeProduct(await res.json(), API_BASE_URL);
        setSellingProducts((prev) =>
          prev.map((p) =>
            p.productId === editingProductId ? updatedProduct : p
          )
        );
        setEditingProductId(null);
        alert("상품이 수정되었습니다.");
      } else {
        const errorText = await res.text();
        alert("상품 수정 실패: " + errorText);
      }
    } catch (err) {
      console.error(err);
      alert("서버 오류");
    }
  };

  const handleCancelProductEdit = () => setEditingProductId(null);

  // ----------------------------------------------------
  // Section Change Logic (with Data Fetching)
  // ----------------------------------------------------

  const handleSectionChange = (newSection: MypageSection) => {
    setSection(newSection);
    setEditingProductId(null); // 상품 수정 모드 해제

    switch (newSection) {
      case "selling":
        fetchSellingProducts();
        break;
      case "bookmarks":
        handleFetchBookmarkedProducts();
        break;
      case "reports":
        handleFetchReports();
        break;
      case "qnas":
        handleFetchMyQnas();
        break;
      case "inquiries":
        handleFetchMyInquiries();
        break;
      case "reviews":
        if (!user) return alert("로그인이 필요합니다.");
        fetchMyReviews();
        break;
      default:
        // 'info', 'payments', 'purchases', 'bids', 'withdrawal' 등은 별도 로직 없음
        break;
    }
  };

  // ----------------------------------------------------
  // Render
  // ----------------------------------------------------
  return (
    <div className="container p-0">
      <div
        className="admin-page"
        style={{
          display: "flex",
          minHeight: "100vh",
          backgroundColor: "#f4f4f4",
        }}
      >
        {/* 1. 사이드바 (AdminPage.tsx와 동일한 스타일) */}
        <nav
          className="sidebar"
          style={{
            width: "250px",
            backgroundColor: "#333",
            color: "white",
            padding: "20px",
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              color: "#fff",
              marginBottom: "20px",
            }}
          >
            마이페이지
          </h2>

          <div
            style={{ marginTop: "20px" }}
            className="flex-column gap-8 flex-left-a"
          >
            <h4 style={{ color: "#ddd", marginBottom: "10px" }}>메인 메뉴</h4>
            {[
              { key: "info", name: "내 정보 수정" },
              { key: "selling", name: "판매 상품 관리" },
              { key: "bookmarks", name: "찜 목록" },
              { key: "reports", name: "신고 내역" },
              { key: "qnas", name: "내 Q&A" },
              { key: "inquiries", name: "1:1 문의 내역" },
              { key: "reviews", name: "리뷰 관리" },
            ].map((item) => (
              <button
                key={item.key}
                style={{
                  color: section === item.key ? "#b17576" : "#ddd",
                  border: "none",
                }}
                className="text-16"
                onClick={() => handleSectionChange(item.key as MypageSection)}
              >
                {item.name}
              </button>
            ))}
          </div>

          <div
            style={{
              marginTop: "30px",
              borderTop: "1px solid #555",
              paddingTop: "15px",
            }}
          >
            <h4 style={{ color: "#ddd", marginBottom: "10px" }}>기타 메뉴</h4>
            <div className="flex-column gap-8 flex-left-a">
              <div className="flex-column gap-8 flex-left-a">
                <button
                  className="text-16 color-ddd"
                  onClick={() => handleSectionChange("payments")}
                >
                  결제 수단 관리
                </button>
                <button
                  className="text-16 color-ddd"
                  onClick={() => handleSectionChange("purchases")}
                >
                  결제 완료 상품
                </button>
                <button
                  className="text-16 color-ddd"
                  onClick={() => handleSectionChange("bids")}
                >
                  입찰 목록
                </button>
                <button className="text-16 color-ddd" onClick={handleDelete}>
                  회원탈퇴
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* 2. 메인 컨텐츠 영역 (AdminPage.tsx와 동일한 스타일) */}
        <main className="width-full p-20-30">
          <h1
            style={{
              marginBottom: "20px",
            }}
          >
            {
              {
                info: "내 정보 수정",
                selling: "판매 상품 관리",
                bookmarks: "찜 목록",
                reports: "신고 내역",
                qnas: "내 Q&A",
                inquiries: "1:1 문의 내역",
                reviews: "리뷰 관리",
                payments: "결제 수단 관리",
                purchases: "구매 상품",
                bids: "입찰 목록",
                withdrawal: "회원탈퇴",
              }[section]
            }
          </h1>

          {/* 섹션별 컴포넌트 렌더링 */}
          {section === "info" && (
            <UserInfoEdit
              form={form}
              handleChange={handleChange}
              handleUpdate={handleUpdate}
              setEditing={() => {
                /* 이 레이아웃에서는 setEditing(false) 대신 섹션 전환을 사용하거나 내부 상태로 관리 */
              }}
            />
          )}

          {section === "selling" && (
            <SellingProducts
              sellingProducts={sellingProducts}
              editingProductId={editingProductId}
              productForm={productForm}
              categories={categories}
              getCategoryName={getCategoryName}
              goToProductDetail={goToProductDetail}
              handleEditProduct={handleEditProduct}
              handleChangeProductForm={handleChangeProductForm}
              handleSaveProduct={handleSaveProduct}
              handleCancelProductEdit={handleCancelProductEdit}
            />
          )}

          {section === "bookmarks" && (
            <BookmarkedProducts
              bookmarkedProducts={bookmarkedProducts}
              getCategoryName={getCategoryName}
              goToProductDetail={goToProductDetail}
            />
          )}

          {section === "reports" && <MyReports reports={reports} />}

          {section === "qnas" && <MyQnas myQnas={myQnas} />}

          {section === "inquiries" && <MyInquiries myInquiries={myInquiries} />}

          {section === "reviews" && (
            <ReviewManagement
              averageRating={averageRating}
              myReviews={myReviews}
              rating={rating}
              setRating={setRating}
              targetUserId={targetUserId}
              setTargetUserId={setTargetUserId}
              comments={comments}
              setComments={setComments}
              handleSubmitReview={handleSubmitReview}
            />
          )}

          {/* 기타 메뉴에 대한 간단한 Placeholder */}
          {section === "payments" && <div>결제 수단 관리 페이지입니다.</div>}
          {section === "purchases" && user && (
            <PaymentProducts token={localStorage.getItem("token") || ""} />
          )}

          {section === "bids" && <div>입찰 목록 페이지입니다.</div>}
          {section === "withdrawal" && (
            <button
              style={{ width: "200px", backgroundColor: "red" }}
              onClick={handleDelete}
            >
              회원탈퇴 진행
            </button>
          )}
        </main>
      </div>
    </div>
  );
}
