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
} from "../types/types";
import { PRODUCT_STATUS, PAYMENT_STATUS } from "../types/types";
import { API_BASE_URL } from "../services/api";

type Props = {
  user: User | null;
  setUser: (user: User | null) => void;
};

export default function MyPage({ user, setUser }: Props) {
  const [editing, setEditing] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [showSelling, setShowSelling] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [showQnas, setShowQnas] = useState(false);


  const [showReviews, setShowReviews] = useState(false);
  const [myReviews, setMyReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [targetUserId, setTargetUserId] = useState<number>(0);
  const [rating, setRating] = useState<number>(5);
  const [comments, setComments] = useState<string>("");


  const [form, setForm] = useState({
    nickName: user?.nickName || "",
    password: "",
    phone: user?.phone || "",
  });

  const [productForm, setProductForm] = useState<
    ProductForm & { productStatus: string }
  >({
    title: "",
    content: "",
    startingPrice: "",
    imageUrl: "",
    oneMinuteAuction: false,
    auctionEndTime: "",
    categoryId: null,
    productStatus: PRODUCT_STATUS[0],
  });

  const [sellingProducts, setSellingProducts] = useState<Product[]>([]);
  const [bookmarkedProducts, setBookmarkedProducts] = useState<Product[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [myQnas, setMyQnas] = useState<Qna[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const navigate = useNavigate();


  // ❗ 여기 기존 useEffect 위쪽 또는 바로 아래에 넣기
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
      .then(res => {
        if (!res.ok) throw new Error("유저 정보 불러오기 실패");
        return res.json();
      })
      .then(data => setUser(data))
      .catch(err => {
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




  const buttonStyle = {
    padding: "12px 24px",
    background: "#000",
    color: "white",
    border: "1px solid #fff",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
    width: "220px",
    marginBottom: "10px",
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    if (!user) return alert("로그인이 필요합니다.");

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${user.userId}/mypage`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
        setEditing(false);
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


  // ★ 이미지 URL 절대 경로 처리
  const normalizeProduct = (p: Partial<Product>): Product => ({
    productId: p.productId ?? 0,
    title: p.title ?? "제목 없음",
    content: p.content ?? "",
    startingPrice: p.startingPrice ?? 0,
    imageUrl: p.imageUrl
      ? p.imageUrl.startsWith("http")
        ? p.imageUrl
        : `${API_BASE_URL}/${p.imageUrl}`
      : "",
    oneMinuteAuction: p.oneMinuteAuction ?? false,
    auctionEndTime: p.auctionEndTime ?? new Date().toISOString(),
    productStatus: p.productStatus ?? PRODUCT_STATUS[0],
    paymentStatus: p.paymentStatus ?? PAYMENT_STATUS[0],
    categoryId: p.categoryId ?? 0,
    categoryName: p.categoryName ?? "없음",
    sellerId: p.sellerId ?? 0,
    sellerNickName: p.sellerNickName ?? "익명",
    bidId: p.bidId,
    bidPrice: p.bidPrice,
    bids: (p.bids ?? []).map(b => ({
      bidId: b.bidId ?? 0,
      bidPrice: b.bidPrice ?? 0,
      userId: b.userId ?? 0,
      isWinning: b.isWinning ?? false,
      createdAt: b.createdAt ?? new Date().toISOString(),
    })),
    bid: p.bid
      ? {
        bidId: p.bid.bidId ?? 0,
        bidPrice: p.bid.bidPrice ?? 0,
        userId: p.bid.userId ?? p.sellerId ?? 0,
        isWinning: p.bid.isWinning ?? false,
        createdAt: p.bid.createdAt ?? new Date().toISOString(),
      }
      : null,
  });

  const fetchSellingProducts = async () => {
    if (!user) return; // null 체크
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/seller/${user.userId}`);
      if (res.ok) {
        const data: Partial<Product>[] = await res.json();
        setSellingProducts(data.map(normalizeProduct));
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
          "Authorization": `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data: Partial<Product>[] = await res.json();
        setBookmarkedProducts(data.map(normalizeProduct));
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
          "Authorization": `Bearer ${token}`,
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
    if (!user) return; // null 체크
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

  const toggleSection = (
    section: "editing" | "selling" | "bookmarks" | "reports" | "qnas" | "inquiries" | "reviews"
  ) => {
    const isCurrentlyOpen =
      (section === "editing" && editing) ||
      (section === "selling" && showSelling) ||
      (section === "bookmarks" && showBookmarks) ||
      (section === "reports" && showReports) ||
      (section === "qnas" && showQnas) ||
      (section === "inquiries" && showInquiries) ||
      (section === "reviews" && showReviews);

    setEditing(false);
    setShowSelling(false);
    setShowBookmarks(false);
    setShowReports(false);
    setShowQnas(false);
    setEditingProductId(null);
    setShowReviews(false);

    if (isCurrentlyOpen) return;

    switch (section) {
      case "editing":
        setEditing(true);
        break;
      case "selling":
        setShowSelling(true);
        fetchSellingProducts();
        break;
      case "bookmarks":
        setShowBookmarks(true);
        handleFetchBookmarkedProducts();
        break;
      case "reports":
        setShowReports(true);
        handleFetchReports();
        break;
      case "qnas":
        setShowQnas(true);
        handleFetchMyQnas();
        break;
      case "inquiries":
        setShowInquiries(true);
        handleFetchMyInquiries();
        break;
      case "reviews":
        if (!user) return alert("로그인이 필요합니다.");
        setShowReviews(true);
        fetchMyReviews();
        break;
    }
  };

  const getCategoryName = (categoryId?: number) =>
    categories.find((c) => c.categoryId === categoryId)?.name || "없음";

  const goToProductDetail = (productId: number) =>
    navigate(`/products/${productId}`);

  const handleEditProduct = (product: Product) => {
    setEditingProductId(product.productId);
    setProductForm({
      title: product.title,
      content: product.content ?? "",
      startingPrice: String(product.startingPrice ?? 0),
      imageUrl: product.imageUrl ?? "",
      oneMinuteAuction: product.oneMinuteAuction ?? false,
      auctionEndTime: product.auctionEndTime,
      categoryId: product.categoryId ?? null,
      productStatus: product.productStatus ?? PRODUCT_STATUS[0],
    });
  };

  const handleChangeProductForm = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
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
      const res = await fetch(
        `${API_BASE_URL}/api/products/${editingProductId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: productForm.title,
            startingPrice: productForm.startingPrice,
            content: productForm.content,
            categoryId: productForm.categoryId,
            productStatus: productForm.productStatus,
            imageUrl: productForm.imageUrl, // ★ 기존 이미지 URL 포함
            auctionEndTime: productForm.auctionEndTime, // ★ 기존 마감 시간 포함
            oneMinuteAuction: productForm.oneMinuteAuction, // ★ 1분 경매 여부 포함
          }),
        }
      );

      if (res.ok) {
        const updatedProduct = normalizeProduct(await res.json());
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

  const [showInquiries, setShowInquiries] = useState(false);
  const [myInquiries, setMyInquiries] = useState<Inquiry[]>([]);

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
          "Authorization": `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const dataFromServer: any[] = await res.json();
        const mappedData: Inquiry[] = dataFromServer.map((i) => ({
          inquiryId: i.inquiryId,
          title: i.title,
          question: i.content,
          createdAt: i.createdAt,
          answers: i.answers ?? [],  // 여기서 서버 답변이 안 들어올 경우 빈 배열
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
    if (!user) return; // user 없으면 fetch 중단
    try {
      const res = await fetch(`${API_BASE_URL}/reviews/user/${user.userId}`);
      if (res.ok) {
        const data = await res.json();
        setMyReviews(data);
      }
      const avgRes = await fetch(`${API_BASE_URL}/reviews/user/${user.userId}/average`);
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
    if (!targetUserId || !rating) return alert("리뷰 대상과 평점을 입력해주세요.");
    try {
      const res = await fetch(`${API_BASE_URL}/reviews/${targetUserId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comments }),
      });
      if (res.ok) {
        alert("리뷰가 등록되었습니다.");
        fetchMyReviews();
        setTargetUserId(0);
        setComments("");
        setRating(5);
      } else {
        alert("리뷰 등록 실패");
      }
    } catch (err) {
      console.error(err);
      alert("서버 오류");
    }
  };




  return (
    <div className="container">
      <button onClick={() => navigate("/")} style={buttonStyle}>
        메인으로
      </button>

      <h2>마이페이지</h2>

      <div style={{ marginBottom: "20px" }}>
        <button style={buttonStyle} onClick={() => toggleSection("editing")}>
          내 정보 수정
        </button>
        <button style={buttonStyle} onClick={() => toggleSection("selling")}>
          판매 상품
        </button>
        <button style={buttonStyle} onClick={() => toggleSection("bookmarks")}>
          찜 목록
        </button>
        <button style={buttonStyle} onClick={() => toggleSection("reports")}>
          신고 내역
        </button>
        <button style={buttonStyle} onClick={() => toggleSection("qnas")}>
          내 Q&A
        </button>
        <button style={buttonStyle} onClick={() => toggleSection("inquiries")}>
          1:1 문의 내역
        </button>
        <button style={buttonStyle} onClick={() => toggleSection("reviews")}>
          리뷰 관리
        </button>
      </div>

      {/* 내 정보 수정 */}
      {editing && (
        <div style={{ marginBottom: "20px" }}>
          <input
            name="nickName"
            placeholder="닉네임"
            value={form.nickName}
            onChange={handleChange}
          />
          <input
            name="password"
            placeholder="비밀번호"
            type="password"
            value={form.password}
            onChange={handleChange}
          />
          <input
            name="phone"
            placeholder="전화번호"
            value={form.phone}
            onChange={handleChange}
          />
          <div>
            <button style={buttonStyle} onClick={handleUpdate}>
              저장
            </button>
            <button style={buttonStyle} onClick={() => setEditing(false)}>
              취소
            </button>
          </div>
        </div>
      )}

      {/* 판매 상품 */}
      {showSelling && (
        <div style={{ marginBottom: "20px" }}>
          <h3>판매 중인 상품</h3>
          {sellingProducts.length === 0 ? (
            <p>판매 중인 상품이 없습니다.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {sellingProducts.map((product) => (
                <li
                  key={product.productId}
                  style={{
                    marginBottom: "30px",
                    border: "1px solid #ddd",
                    padding: "15px",
                    borderRadius: "8px",
                  }}
                >
                  <div style={{ display: "flex", gap: "15px" }}>
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        style={{
                          width: "150px",
                          cursor: "pointer",
                          borderRadius: "6px",
                          flexShrink: 0,
                        }}
                        onClick={() => goToProductDetail(product.productId)}
                      />
                    ) : (
                      <div className="no-image-txt">이미지 없음</div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "bold", fontSize: "18px" }}>
                        {product.title}
                      </div>
                      <div>설명: {product.content}</div>
                      <div>
                        가격: {product.startingPrice?.toLocaleString()}원
                      </div>
                      <div>
                        카테고리: {getCategoryName(product.categoryId)}
                      </div>
                      <div>상품 상태: {product.productStatus}</div>
                      <div>결제 상태: {product.paymentStatus}</div>
                      <div>
                        경매 종료:{" "}
                        {new Date(product.auctionEndTime).toLocaleString()}
                      </div>
                      <div>
                        1분 경매: {product.oneMinuteAuction ? "예" : "아니오"}
                      </div>
                      <div>
                        판매자: {product.sellerId} (ID: {product.sellerId}
                        )
                      </div>
                    </div>
                  </div>

                  <button
                    style={{
                      ...buttonStyle,
                      width: "140px",
                      marginTop: "10px",
                    }}
                    onClick={() => handleEditProduct(product)}
                  >
                    상품 수정
                  </button>

                  {editingProductId === product.productId && (
                    <div
                      style={{
                        marginTop: "15px",
                        padding: "10px",
                        border: "1px solid #ccc",
                        borderRadius: "8px",
                        background: "#f9f9f9",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                        }}
                      >
                        <input
                          name="title"
                          value={productForm.title}
                          onChange={handleChangeProductForm}
                          placeholder="상품명"
                        />
                        <input
                          name="startingPrice"
                          type="number"
                          value={productForm.startingPrice}
                          onChange={handleChangeProductForm}
                          placeholder="가격"
                        />
                        <textarea
                          name="content"
                          value={productForm.content}
                          onChange={handleChangeProductForm}
                          placeholder="설명"
                          rows={3}
                        />
                        <select
                          name="categoryId"
                          value={productForm.categoryId ?? ""}
                          onChange={handleChangeProductForm}
                        >
                          <option value="">카테고리 선택</option>
                          {categories.map((c) => (
                            <option key={c.categoryId} value={c.categoryId}>
                              {c.name}
                            </option>
                          ))}
                        </select>

                        <select
                          name="productStatus"
                          value={productForm.productStatus}
                          onChange={handleChangeProductForm}
                        >
                          <option value="ACTIVE">판매중</option>
                          <option value="SOLD">판매완료</option>
                          <option value="PAUSED">일시중지</option>
                        </select>

                        <div
                          style={{
                            display: "flex",
                            gap: "10px",
                            marginTop: "10px",
                          }}
                        >
                          <button
                            style={buttonStyle}
                            onClick={handleSaveProduct}
                          >
                            저장
                          </button>
                          <button
                            style={buttonStyle}
                            onClick={handleCancelProductEdit}
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* 찜 목록 */}
      {showBookmarks && (
        <div style={{ marginBottom: "20px" }}>
          <h3>찜한 상품</h3>
          {bookmarkedProducts.length === 0 ? (
            <p>찜한 상품이 없습니다.</p>
          ) : (
            <ul>
              {bookmarkedProducts.map((product) => (
                <li key={product.productId} style={{ marginBottom: "20px" }}>
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      style={{
                        width: "150px",
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                      onClick={() => goToProductDetail(product.productId)}
                    />
                  ) : (
                    <div
                      style={{
                        width: "150px",
                        height: "150px",
                        background: "#eee",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#888",
                        borderRadius: "6px",
                        flexShrink: 0,
                      }}
                    >
                      이미지 없음
                    </div>
                  )}
                  <div style={{ fontWeight: "bold", fontSize: "18px" }}>
                    {product.title} -{" "}
                    {product.startingPrice?.toLocaleString() ||
                      product.startingPrice?.toLocaleString()}
                    원
                  </div>
                  <div>{product.content}</div>
                  <div>
                    카테고리: {getCategoryName(product.categoryId)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* 신고 내역 */}
      {showReports && (
        <div style={{ marginBottom: "20px" }}>
          <h3>신고 내역</h3>
          {reports.length === 0 ? (
            <p>신고한 내역이 없습니다.</p>
          ) : (
            <ul>
              {reports.map((report) => (
                <li key={report.reportId} style={{ marginBottom: "10px" }}>
                  <div>신고 대상 ID: {report.targetId}</div>
                  <div>신고 사유: {report.reason}</div>
                  <div>처리 상태: {report.status ? "완료" : "대기"}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* 내 Q&A */}
      {showQnas && (
        <div style={{ marginBottom: "20px" }}>
          <h3>내 Q&A</h3>
          {myQnas.length === 0 ? (
            <p>작성한 질문이 없습니다.</p>
          ) : (
            <ul>
              {myQnas.map((qna) => (
                <li key={qna.qnaId} style={{ marginBottom: "15px" }}>
                  <div style={{ fontWeight: "bold" }}>{qna.title}</div>
                  <div>질문: {qna.question}</div>
                  <div>작성일: {new Date(qna.createdAt).toLocaleString()}</div>

                  {/* 답변 상태 */}
                  {qna.answers && qna.answers.length > 0 && (
                    <div>
                      <strong>답변 완료</strong>
                      <ul>
                        {qna.answers.map((a) => (
                          <li key={a.qnaReviewId}>
                            {a.nickName ?? "익명"}: {a.answer} (
                            {new Date(a.createdAt).toLocaleString()})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 실제 답변 내용 */}
                  {(qna.answers ?? []).map((a) => (
                    <div key={a.qnaReviewId} style={{ marginLeft: "10px" }}>
                      {a.nickName ?? "익명"}: {a.answer} (
                      {new Date(a.createdAt).toLocaleString()})
                    </div>
                  ))}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}


      {/* 기타 기능 버튼 */}
      <div style={{ marginTop: "20px" }}>
        <button style={buttonStyle} onClick={() => alert("결제 수단 관리")}>
          결제 수단 관리
        </button>
        <button style={buttonStyle} onClick={() => alert("구매 상품 목록")}>
          구매 상품
        </button>
        <button style={buttonStyle} onClick={() => alert("입찰 목록")}>
          입찰 목록
        </button>
        <button style={buttonStyle} onClick={() => alert("리뷰 목록")}>
          리뷰 목록
        </button>
        <button style={buttonStyle} onClick={handleDelete}>
          회원탈퇴
        </button>
      </div>

      {/* 1:1 문의 내역 */}
      {showInquiries && (
        <div style={{ marginBottom: "20px" }}>
          <h3>1:1 문의 내역</h3>
          {myInquiries.length === 0 ? (
            <p>문의 내역이 없습니다.</p>
          ) : (
            <ul>
              {myInquiries.map((i) => {
                const answers = i.answers ?? []; // null 방지
                return (
                  <li key={i.inquiryId} style={{ marginBottom: "15px" }}>
                    <div><strong>제목:</strong> {i.title}</div>
                    <div><strong>내용:</strong> {i.question}</div>
                    <div>
                      <strong>작성일:</strong>{" "}
                      {i.createdAt ? new Date(i.createdAt).toLocaleString() : "작성일 없음"}
                    </div>

                    {/* 답변 내용 */}
                    {answers.length > 0 && (
                      <div style={{ marginLeft: "10px", marginTop: "5px" }}>
                        {answers.map((a) => (
                          <div key={a.inquiryReviewId}>
                            {a.nickName ?? "익명"}: {a.answer} (
                            {a.createdAt
                              ? new Date(a.createdAt).toLocaleString()
                              : "작성일 없음"}
                            )
                          </div>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
      {showInquiries && (
        <div> ... 문의 내역 ... </div>
      )}

      {showReviews && (
        <div style={{ marginBottom: "20px" }}>
          <h3>리뷰 관리</h3>

          <h4>⭐ 내 평균 평점: {averageRating.toFixed(1)}점</h4>

          <div style={{ marginBottom: "20px" }}>
            <h4>📋 내가 받은 리뷰</h4>
            {myReviews.length === 0 ? (
              <p>받은 리뷰가 없습니다.</p>
            ) : (
              <ul>
                {myReviews.map((r, idx) => (
                  <li key={idx} style={{ marginBottom: "10px" }}>
                    <strong>평점:</strong> {r.rating}점 <br />
                    <strong>내용:</strong> {r.comments} <br />
                    <small>
                      작성일:{" "}
                      {r.createdAt
                        ? new Date(r.createdAt).toLocaleString()
                        : "날짜 없음"}
                    </small>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <hr />

          <div style={{ marginTop: "20px" }}>
            <h4>✏️ 리뷰 작성</h4>
            <input
              type="number"
              min="1"
              max="5"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              style={{ marginRight: "10px" }}
            />
            <input
              type="number"
              placeholder="대상 유저 ID"
              value={targetUserId || ""}
              onChange={(e) => setTargetUserId(Number(e.target.value))}
              style={{ marginRight: "10px" }}
            />
            <input
              type="text"
              placeholder="리뷰 내용 입력"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              style={{ width: "300px", marginRight: "10px" }}
            />
            <button style={buttonStyle} onClick={handleSubmitReview}>
              리뷰 등록
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
      