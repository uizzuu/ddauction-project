import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import type { Product, Bid, User, Category, Qna } from "../types/types";
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

        // 최고 입찰가
        try {
          const bidRes = await fetch(
            `${API_BASE_URL}/api/products/${id}/highest-bid`
          );
          if (bidRes.ok) {
            const highest: number = await bidRes.json();
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
        <div style={{ width: "260px", flexShrink: 0 }}>
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
            <div style={{ marginBottom: "8px" }}>
              {(product.bids ?? []).slice(0, 5).map((b, i) => (
                <p key={b.bidId} style={{ margin: 0 }}>
                  {i + 1}번 입찰가: {b.bidPrice.toLocaleString()}원
                </p>
              ))}
              {(!product.bids || product.bids.length === 0) && (
                <p style={{ margin: 0, color: "#888" }}>
                  아직 입찰이 없습니다.
                </p>
              )}
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="number"
                value={bidValue}
                onChange={(e) => setBidValue(e.target.value)}
                placeholder="희망 입찰가"
                style={{
                  flex: 1,
                  padding: "6px 8px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                }}
              />
              <button
                onClick={handleBid}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#ef4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                입찰
              </button>
            </div>
          </div>
        </div>
      </div>

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
