import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type {
  User,
  Product,
  Report,
  Qna,
  ProductForm,
  Inquiry,
  Review,
} from "../common/types";
import {
  PRODUCT_STATUS,
} from "../common/enums";
import type { ProductType } from "../common/enums";
import * as API from "../common/api";
import { getCategoryName } from "../common/util";
import {
  UserInfoEdit,
  SellingProducts,
  BookmarkedProducts,
  MyReports,
  MyQnas,
  MyInquiries,
  ReviewManagement,
  PaymentProducts,
} from "../common/import";

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

type EditProductState = ProductForm & {
  productStatus: string;
};

export default function MyPage({ user, setUser }: Props) {
  const [section, setSection] = useState<MypageSection>("info");
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
  const [productForm, setProductForm] = useState<EditProductState>({
    title: "",
    content: "",
    startingPrice: "",
    auctionEndTime: "",
    productStatus: PRODUCT_STATUS[0],
    productType: "AUCTION" as ProductType,
    images: [],
    productCategoryType: null,
  });

  // Data states
  const [sellingProducts, setSellingProducts] = useState<Product[]>([]);
  const [bookmarkedProducts, setBookmarkedProducts] = useState<Product[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [myQnas, setMyQnas] = useState<Qna[]>([]);
  const [myInquiries, setMyInquiries] = useState<Inquiry[]>([]);

  const navigate = useNavigate();

  // ----------------------------------------------------
  // Effects
  // ----------------------------------------------------
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    API.fetchMe(token)
      .then((data) => setUser(data))
      .catch((err) => {
        console.error(err);
        navigate("/");
      });
  }, [navigate, setUser]);

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
      const updatedUser = await API.updateMyInfo(user.userId, form);
      setUser(updatedUser);
      alert("정보가 수정되었습니다.");
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "서버 오류");
    }
  };

  const handleDelete = async () => {
    if (!user) return alert("로그인이 필요합니다.");
    if (!confirm("정말 회원탈퇴하시겠습니까?")) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      await API.withdrawUser(user.userId, token);
      setUser(null);
      navigate("/");
      alert("회원탈퇴 완료");
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "서버 오류");
    }
  };

  // ----------------------------------------------------
  // Data Fetching
  // ----------------------------------------------------
  const goToProductDetail = (productId: number) =>
    navigate(`/products/${productId}`);

  const fetchSellingProductsData = async () => {
    if (!user) return;
    try {
      const data = await API.fetchSellingProducts(user.userId);
      setSellingProducts(data);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "서버 오류");
    }
  };

  const handleFetchBookmarkedProducts = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      const data = await API.fetchBookmarkedProducts(token);
      setBookmarkedProducts(data);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "서버 오류");
    }
  };

  const handleFetchReports = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      const data = await API.fetchMyReports(token);
      setReports(data);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "서버 오류");
    }
  };

  const handleFetchMyQnas = async () => {
    if (!user) return;
    try {
      const data = await API.fetchMyQnas(user.userId);
      setMyQnas(data);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "서버 오류");
    }
  };

  const handleFetchMyInquiries = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      const data = await API.fetchMyInquiries(token);
      setMyInquiries(data);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "서버 오류");
    }
  };

  const fetchReviewsData = async () => {
    if (!user) return;
    try {
      const { reviews, averageRating: avg } = await API.fetchMyReviews(user.userId);
      setMyReviews(reviews);
      setAverageRating(avg);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "서버 오류");
    }
  };

  const handleSubmitReview = async () => {
    if (!targetUserId || !rating)
      return alert("리뷰 대상과 평점을 입력해주세요.");

    const token = localStorage.getItem("token");
    if (!token) return alert("로그인이 필요합니다.");

    try {
      await API.submitReview(targetUserId, rating, comments, token);
      alert("리뷰가 등록되었습니다.");
      fetchReviewsData();
      setTargetUserId(0);
      setComments("");
      setRating(5);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "서버 오류");
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
      auctionEndTime: product.auctionEndTime,
      productCategoryType: product.productCategoryType ?? null,
      productStatus: product.productStatus ?? PRODUCT_STATUS[0],
      productType: product.productType ?? ("AUCTION" as ProductType),
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

    const value = e.target.value;
    setProductForm({ ...productForm, [e.target.name]: value });
  };

  const handleSaveProduct = async () => {
    if (!editingProductId) return;

    if (!productForm.productCategoryType) {
      alert("카테고리를 선택해주세요.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", productForm.title);
      formData.append("content", productForm.content);
      formData.append("startingPrice", productForm.startingPrice);
      formData.append("productCategoryType", productForm.productCategoryType);
      formData.append("auctionEndTime", productForm.auctionEndTime);
      formData.append("productStatus", productForm.productStatus);
      formData.append("productType", productForm.productType);

      productForm.images?.forEach((file) => formData.append("images", file));

      const updatedProduct = await API.updateProductWithImages(editingProductId, formData);
      
      setSellingProducts((prev) =>
        prev.map((p) =>
          p.productId === editingProductId ? updatedProduct : p
        )
      );
      setEditingProductId(null);
      alert("상품이 수정되었습니다.");
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "서버 오류");
    }
  };

  const handleCancelProductEdit = () => setEditingProductId(null);

  // ----------------------------------------------------
  // Section Change Logic
  // ----------------------------------------------------
  const handleSectionChange = (newSection: MypageSection) => {
    setSection(newSection);
    setEditingProductId(null);

    const sectionFetchers: Record<string, () => void> = {
      selling: fetchSellingProductsData,
      bookmarks: handleFetchBookmarkedProducts,
      reports: handleFetchReports,
      qnas: handleFetchMyQnas,
      inquiries: handleFetchMyInquiries,
      reviews: fetchReviewsData,
    };

    sectionFetchers[newSection]?.();
  };

  // ----------------------------------------------------
  // Menu Configuration
  // ----------------------------------------------------
  const mainMenuItems = [
    { key: "info", name: "내 정보 수정" },
    { key: "selling", name: "판매 상품 관리" },
    { key: "bookmarks", name: "찜 목록" },
    { key: "reports", name: "신고 내역" },
    { key: "qnas", name: "내 Q&A" },
    { key: "inquiries", name: "1:1 문의 내역" },
    { key: "reviews", name: "리뷰 관리" },
  ];

  const otherMenuItems = [
    { key: "payments", name: "결제 수단 관리" },
    { key: "purchases", name: "결제 완료 상품" },
    { key: "bids", name: "입찰 목록" },
  ];

  const sectionTitles: Record<MypageSection, string> = {
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
        {/* Sidebar */}
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
          <h2 style={{ color: "#fff", marginBottom: "20px" }}>마이페이지</h2>

          <div style={{ marginTop: "20px" }} className="flex-column gap-8 flex-left-a">
            <h4 style={{ color: "#ddd", marginBottom: "10px" }}>메인 메뉴</h4>
            {mainMenuItems.map((item) => (
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
              {otherMenuItems.map((item) => (
                <button
                  key={item.key}
                  className="text-16 color-ddd"
                  onClick={() => handleSectionChange(item.key as MypageSection)}
                >
                  {item.name}
                </button>
              ))}
              <button className="text-16 color-ddd" onClick={handleDelete}>
                회원탈퇴
              </button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="width-full p-20-30">
          <h1 style={{ marginBottom: "20px" }}>{sectionTitles[section]}</h1>

          {section === "info" && (
            <UserInfoEdit
              form={form}
              handleChange={handleChange}
              handleUpdate={handleUpdate}
              setEditing={() => {}}
            />
          )}

          {section === "selling" && (
            <SellingProducts
              sellingProducts={sellingProducts}
              editingProductId={editingProductId}
              productForm={productForm}
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