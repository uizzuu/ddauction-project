import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { Product, Bid, User, Category, Qna, ProductStatus } from "../types/types";
import { API_BASE_URL } from "../services/api";
import { formatDateTime } from "../utils/util";
import ProductQnA from "../components/ProductQnA";
import ProductBidGraph from "../components/ProductBidGraph";

type Props = {
  user: User | null;
  setUser: (user: User | null) => void;
};

export default function ProductDetail({ user }: Props) {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [bidValue, setBidValue] = useState("");
  const [remainingTime, setRemainingTime] = useState("");
  const [sellerNickName, setSellerNickName] = useState("로딩중...");
  const [currentHighestBid, setCurrentHighestBid] = useState(0);
  const isSeller = user?.userId === product?.sellerId;

  const [editing, setEditing] = useState(false);
  const [productForm, setProductForm] = useState<{
    title: string;
    startingPrice: number;
    content: string;
    categoryId: number | "";
    productStatus: ProductStatus;
    imageUrl: string;          // 추가
    auctionEndTime: string;    // 추가
  }>({
    title: "",
    startingPrice: 0,
    content: "",
    categoryId: "",
    productStatus: "ACTIVE",
    imageUrl: "",              // 초기값
    auctionEndTime: "",        // 초기값
  });

  //카테고리
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/categories`);
        if (res.ok) {
          const data: Category[] = await res.json();
          setCategories(data);
        }
      } catch (err) {
        console.warn("카테고리 조회 실패", err);
      }
    };
    fetchCategories();
  }, []);

  // 찜 관련 state
  const [isBookMarked, setIsBookMarked] = useState(false);
  const [bookmarkCount, setBookmarkCount] = useState(0);

  // QnA 관련 state
  const [qnaList, setQnaList] = useState<Qna[]>([]);

  // 남은 시간 계산
  const calculateRemainingTime = (endTime: string) => {
    const now = new Date();
    const end = new Date(endTime);
    const diffMs = end.getTime() - now.getTime();
    if (diffMs <= 0) return "경매 종료";
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
    const seconds = Math.floor((diffMs / 1000) % 60);
    return `${days}일 ${hours}시간 ${minutes}분 ${seconds}초`;
  };

  // 상품 정보 + 초기 데이터 가져오기
  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products/${id}`);
        if (!res.ok) throw new Error("상품 정보를 가져올 수 없습니다.");
        const data: Product = await res.json();
        setProduct(data);
        setSellerNickName(data.sellerNickName ?? "알 수 없음");
        setRemainingTime(calculateRemainingTime(data.auctionEndTime));

        // 찜 수
        try {
          const bmCountRes = await fetch(
            `${API_BASE_URL}/api/bookmarks/count?productId=${id}`
          );
          if (bmCountRes.ok) {
            const count = await bmCountRes.json();
            setBookmarkCount(count);
          }
        } catch (e) {
          console.warn("찜 수 조회 실패", e);
        }

        // 카테고리명
        if (data.categoryId && !data.categoryName) {
          try {
            const categoryRes = await fetch(
              `${API_BASE_URL}/api/categories/${data.categoryId}`
            );
            if (categoryRes.ok) {
              const c: Category = await categoryRes.json();
              setProduct((prev) =>
                prev ? { ...prev, categoryName: c.name } : prev
              );
            }
          } catch {
            console.warn("카테고리명 불러오기 실패");
          }
        }

        // 모든 입찰 내역 가져오기 추가
        try {
          const bidsRes = await fetch(`${API_BASE_URL}/api/bid/${id}/bids`);
          if (bidsRes.ok) {
            const bids: Bid[] = await bidsRes.json();
            setProduct((prev) => (prev ? { ...prev, bids } : prev));
          }
        } catch {
          console.warn("입찰 내역 불러오기 실패");
        }

        // 최고 입찰가
        try {
          const highestRes = await fetch(
            `${API_BASE_URL}/api/products/${id}/highest-bid`
          );
          if (highestRes.ok) {
            const highest: number = await highestRes.json();
            setCurrentHighestBid(highest);
          }
        } catch {
          console.warn("최고 입찰가 조회 실패");
        }

        // 현재 사용자가 찜했는지 여부 (JWT 기반)
        try {
          const token = user?.token || localStorage.getItem("token");
          const bmRes = await fetch(
            `${API_BASE_URL}/api/bookmarks/check?productId=${id}`,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (bmRes.ok) {
            const bookmarked: boolean = await bmRes.json();
            setIsBookMarked(bookmarked);
          }
        } catch (err) {
          console.warn("찜 여부 조회 실패", err);
        }
      } catch (err) {
        console.error(err);
        setSellerNickName("알 수 없음");
      }
    };

    fetchProduct();
  }, [id, user?.token]);

  // 남은 시간 실시간 업데이트
  useEffect(() => {
    if (!product) return;
    const interval = setInterval(() => {
      setRemainingTime(calculateRemainingTime(product.auctionEndTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [product]);

  // 입찰 처리
  const handleBid = async () => {
    const bidNum = Number(bidValue);
    if (!bidValue || isNaN(bidNum) || bidNum <= 0) {
      return alert("올바른 금액을 입력해주세요 (0보다 큰 숫자)");
    }
    if (!product) return;

    if (bidNum <= currentHighestBid) {
      return alert(
        `입찰가가 현재 최고 입찰가(${currentHighestBid.toLocaleString()}원)보다 높아야 합니다.`
      );
    }

    const now = new Date();
    const end = new Date(product.auctionEndTime);
    if (now >= end) return alert("이미 경매가 종료된 상품입니다.");

    try {
      const token = user?.token || localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/bid/${id}/bid`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          bidPrice: bidNum,
        }),
      });

      if (res.ok) {
        const newBidServer: { bidId: number; bidPrice: number } =
          await res.json();

        const newBid: Bid = {
          bidId: newBidServer.bidId,
          userId: product.sellerId ?? 0,
          bidPrice: newBidServer.bidPrice,
          isWinning: false,
          createdAt: new Date().toISOString(),
        };

        setProduct((prev) =>
          prev ? { ...prev, bids: [...(prev.bids ?? []), newBid] } : prev
        );
        setCurrentHighestBid(newBidServer.bidPrice);
        setBidValue("");
        alert("입찰 성공!");
      } else {
        const errText = await res.text();
        console.log("입찰 실패 : " + errText);
        alert("입찰 실패");
      }
    } catch (err) {
      console.error(err);
      alert("서버 오류");
    }
  };

  // 저장
  const handleSaveProduct = async () => {
    if (!product) return;
    try {
      const token = user?.token || localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/products/${product.productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: productForm.title,
          startingPrice: productForm.startingPrice,
          content: productForm.content,
          categoryId: productForm.categoryId || null, // ""이면 null로
          productStatus: productForm.productStatus,
          imageUrl: productForm.imageUrl,
          auctionEndTime: productForm.auctionEndTime,
        }),
      });
      if (res.ok) {
        const updated: Product = await res.json();
        setProduct(updated);
        setEditing(false);
        alert("상품이 수정되었습니다.");
      } else {
        const msg = await res.text();
        alert("수정 실패: " + msg);
      }
    } catch (err) {
      console.error(err);
      alert("수정 중 오류 발생");
    }
  };




  // 찜 토글
  const handleToggleBookmark = async () => {
    if (!product) return;

    // user가 null이거나 token이 없는 경우, localStorage에서 가져오기
    const token = user?.token || localStorage.getItem("token");
    if (!token) return alert("로그인 후 찜 해주세요.");

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/bookmarks/toggle?productId=${product.productId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const msg = await res.text();
        alert("찜 기능 실패: " + msg);
        return;
      }

      const text = await res.text();
      setIsBookMarked(text === "찜 완료");

      // 찜 수 갱신
      const countRes = await fetch(
        `${API_BASE_URL}/api/bookmarks/count?productId=${product.productId}`
      );
      if (countRes.ok) {
        const count = await countRes.json();
        setBookmarkCount(count);
      }
    } catch (err) {
      console.error(err);
      alert("찜 기능 실패 (네트워크 오류)");
    }
  };

  // 신고
  const handleReport = async () => {
    if (!product) return;

    // 찜하기와 동일하게 token 가져오기
    const token = user?.token || localStorage.getItem("token");
    if (!token) {
      alert("로그인 후 신고할 수 있습니다.");
      return;
    }

    const reason = prompt("신고 사유를 입력해주세요:");
    if (!reason?.trim()) return alert("신고 사유는 필수입니다.");

    try {
      const res = await fetch(`${API_BASE_URL}/api/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetId: product.sellerId,
          reason: reason.trim(),
        }),
      });

      if (res.status === 401) {
        alert("로그인 후 신고할 수 있습니다.");
        return;
      }

      if (res.ok) {
        alert("신고가 접수되었습니다.");
      } else {
        const msg = await res.text();
        alert("신고 실패: " + msg);
      }
    } catch (err) {
      console.error(err);
      alert("신고 처리 중 오류가 발생했습니다.");
    }
  };

  if (!product)
    return <div style={{ padding: "16px" }}>상품을 찾을 수 없습니다.</div>;

  const auctionStartingPrice = product.startingPrice ?? 0;

  return (
    <div className="container">
      <div className="flex-box gap-40">
        {/* 이미지 */}
        <div className="product-image product-detail-image">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.title} />
          ) : (
            <div className="no-image-txt">이미지 없음</div>
          )}
        </div>

        {/* 상세 설명 */}
        <div
          style={{
            flex: 1,
            minWidth: "300px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
            {product.title}
          </h2>

          {/* 찜 + 신고 버튼 */}
          <div
            style={{
              display: "flex",
              gap: "4px",
              fontSize: "0.9rem",
              color: "#555",
            }}
          >
            <button
              onClick={handleToggleBookmark}
              style={{
                backgroundColor: "#fff",
                color: "#aaa",
                border: "1px solid #ddd",
                borderRadius: "6px",
                padding: "2px 8px",
                cursor: "pointer",
                fontSize: "0.8rem",
              }}
            >
              <div className="flex-box gap-4 flex-center">
                <svg
                  width="12"
                  height="11"
                  viewBox="-0.5 -0.5 13 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 11L5.13 10.2087C2.04 7.40926 0 5.55695 0 3.297C0 1.44469 1.452 0 3.3 0C4.344 0 5.346 0.485559 6 1.24687C6.654 0.485559 7.656 0 8.7 0C10.548 0 12 1.44469 12 3.297C12 5.55695 9.96 7.40926 6.87 10.2087L6 11Z"
                    fill={isBookMarked ? "#b17576" : "#fff"}
                    stroke="#b17576"
                  />
                </svg>
                <p>{bookmarkCount}</p>
              </div>
            </button>
            <button
              style={{
                backgroundColor: "#fff",
                color: "#aaa",
                border: "1px solid #ddd",
                borderRadius: "6px",
                padding: "2px 8px",
                cursor: "pointer",
                fontSize: "0.8rem",
              }}
              onClick={handleReport}
            >
              신고
            </button>
          </div>

          <p>판매자: {sellerNickName}</p>
          {isSeller && (
            <button
              style={{
                backgroundColor: "#4caf50",
                color: "#fff",
                border: "none",
                padding: "8px 12px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "0.9rem",
                marginTop: "8px",
              }}
              onClick={() => {
                if (!product) return;
                setProductForm({
                  title: product.title,
                  startingPrice: product.startingPrice ?? 0,
                  content: product.content ?? "",
                  categoryId: product.categoryId,
                  productStatus: product.productStatus,
                  imageUrl: product.imageUrl ?? "",             // 추가
                  auctionEndTime: product.auctionEndTime ?? "", // 추가
                });
                setEditing(true);
              }}
            >
              상품 수정
            </button>
          )}
          <p>카테고리: {product.categoryName ?? "없음"}</p>
          <p style={{ color: "#555", fontSize: "0.9rem" }}>
            등록시간:{" "}
            {product.createdAt
              ? formatDateTime(product.createdAt)
              : "알 수 없음"}{" "}
            <br />
            남은시간: {remainingTime}
          </p>

          <p>경매등록가: {auctionStartingPrice.toLocaleString()}원</p>
          <p>현재 최고 입찰가: {currentHighestBid.toLocaleString()}원</p>

          <div
            style={{
              backgroundColor: "#f9f9f9",
              padding: "8px",
              borderRadius: "8px",
              border: "1px solid #eee",
              whiteSpace: "pre-wrap",
            }}
          >
            {product.content ?? "상세 설명이 없습니다."}
          </div>
        </div>

        {/* 입찰 박스 */}
        <div style={{ width: "260px", flexShrink: 0 }} className="height-450">
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              padding: "12px",
              boxShadow: "0 1px 6px rgba(0,0,0,0.1)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              gap: "8px",
              height: "100%",
            }}
          >
            <div className="mb-20 flex-column gap-8 max-height-350 overflow-y-auto bid-scroll">
              {(product.bids ?? [])
                .sort((a, b) => a.bidId - b.bidId)
                .map((b, i) => (
                  <div key={b.bidId} className="bid-box">
                    <p className="text-16">{i + 1}번 입찰</p>
                    <div className="flex-box gap-4 flex-center-a">
                      <p className="title-20">{b.bidPrice.toLocaleString()}</p>
                      <p className="title-18">원</p>
                    </div>
                  </div>
                ))}
              {(!product.bids || product.bids.length === 0) && (
                <p style={{ margin: 0, color: "#888" }}>
                  아직 입찰이 없습니다.
                </p>
              )}
            </div>

            <div className="max-height-3rem flex-box gap-4">
              <input
                type="text"
                value={Number(bidValue || 0).toLocaleString()}
                onChange={(e) => {
                  const clean = e.target.value.replace(/[^0-9]/g, ""); // 숫자만
                  setBidValue(clean);
                }}
                placeholder="희망 입찰가"
                className="input"
              />
              <div
                className="flex-column search-btn flex-center border-hover-none"
              >
                <button
                  onClick={() =>
                    setBidValue(String(Number(bidValue || 0) + 1000))
                  }
                  className="color-ddd width-fit bg-transparent mb--4 hover"
                >
                  <ChevronUp size={20} />
                </button>
                <button
                  onClick={() =>
                    setBidValue(
                      String(Math.max(Number(bidValue || 0) - 1000, 0))
                    )
                  }
                  className="color-ddd width-fit bg-transparent hover"
                >
                  <ChevronDown size={20} />
                </button>
              </div>
              <button onClick={handleBid} className="search-btn">
                입찰
              </button>
            </div>
          </div>
        </div>
      </div>

      {editing && (
        <div
          style={{
            marginTop: "16px",
            padding: "16px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            backgroundColor: "#fafafa",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            maxWidth: "500px",
          }}
        >
          {/* 상품명 */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={{ marginBottom: "4px", fontWeight: "500" }}>상품명</label>
            <input
              name="title"
              value={productForm.title}
              onChange={(e) =>
                setProductForm({ ...productForm, title: e.target.value })
              }
              placeholder="상품명을 입력하세요"
              style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
            />
          </div>

          {/* 가격 */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={{ marginBottom: "4px", fontWeight: "500" }}>가격</label>
            <input
              name="startingPrice"
              type="number"
              value={productForm.startingPrice}
              onChange={(e) =>
                setProductForm({
                  ...productForm,
                  startingPrice: Number(e.target.value),
                })
              }
              placeholder="숫자만 입력"
              style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
            />
          </div>

          {/* 상세 설명 */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={{ marginBottom: "4px", fontWeight: "500" }}>상세 설명</label>
            <textarea
              name="content"
              value={productForm.content}
              onChange={(e) =>
                setProductForm({ ...productForm, content: e.target.value })
              }
              placeholder="상품 상세 설명을 입력하세요"
              rows={4}
              style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ccc", resize: "vertical" }}
            />
          </div>

          {/* 카테고리 */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={{ marginBottom: "4px", fontWeight: "500" }}>카테고리</label>
            <select
              name="categoryId"
              value={productForm.categoryId}
              onChange={(e) =>
                setProductForm({
                  ...productForm,
                  categoryId: Number(e.target.value),
                })
              }
              style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
            >
              <option value="">카테고리 선택</option>
              {categories.map((c) => (
                <option key={c.categoryId} value={c.categoryId}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* 상품 상태 */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={{ marginBottom: "4px", fontWeight: "500" }}>상태</label>
            <select
              name="productStatus"
              value={productForm.productStatus}
              onChange={(e) =>
                setProductForm({
                  ...productForm,
                  productStatus: e.target.value as ProductStatus,
                })
              }
              style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
            >
              <option value="ACTIVE">판매중</option>
              <option value="SOLD">판매완료</option>
              <option value="CLOSED">종료</option>
            </select>
          </div>

          {/* 버튼 */}
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <button
              onClick={handleSaveProduct}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: "#4caf50",
                color: "#fff",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              저장
            </button>
            <button
              onClick={() => setEditing(false)}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                backgroundColor: "#fff",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              취소
            </button>
          </div>
        </div>
      )}




      {/* 새로운 입찰 그래프 컴포넌트 사용 */}
      <ProductBidGraph bids={product.bids ?? []} />

      <ProductQnA
        user={user}
        product={product}
        productId={product.productId}
        qnaList={qnaList}
        setQnaList={setQnaList}
      />
    </div>
  );
}
