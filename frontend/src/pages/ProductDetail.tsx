import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Product, Bid, User, Category } from "../types/types";
import { API_BASE_URL } from "../services/api";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [bidValue, setBidValue] = useState("");
  const [remainingTime, setRemainingTime] = useState("");
  const [sellerNickName, setSellerNickName] = useState("로딩중...");
  const [currentHighestBid, setCurrentHighestBid] = useState(0);

  // 찜 관련 state
  const [isBookMarked, setIsBookMarked] = useState(false);
  const [bookmarkCount, setBookmarkCount] = useState(0);

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

  // 상품 정보 가져오기
  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products/${id}`);
        if (!res.ok) throw new Error("상품 정보를 가져올 수 없습니다.");
        const data: Product = await res.json();
        setProduct(data);
        setRemainingTime(calculateRemainingTime(data.auctionEndTime));

        // 찜 수
        const bmCountRes = await fetch(`${API_BASE_URL}/api/bookmarks/count?productId=${id}`);
        if (bmCountRes.ok) {
          const count = await bmCountRes.json();
          setBookmarkCount(count);
        }

        // 판매자 정보
        if (data.sellerId) {
          try {
            const sellerRes = await fetch(`${API_BASE_URL}/api/users/${data.sellerId}`);
            if (sellerRes.ok) {
              const seller: User = await sellerRes.json();
              setSellerNickName(seller.nickName ?? "알 수 없음");
            } else {
              setSellerNickName("알 수 없음");
            }
          } catch {
            setSellerNickName("알 수 없음");
          }
        }

        // 카테고리명
        if (data.categoryId && !data.categoryName) {
          try {
            const categoryRes = await fetch(`${API_BASE_URL}/api/categories/${data.categoryId}`);
            if (categoryRes.ok) {
              const c: Category = await categoryRes.json();
              setProduct((prev) => (prev ? { ...prev, categoryName: c.name } : prev));
            }
          } catch {
            console.warn("카테고리명 불러오기 실패");
          }
        }

        // 최고 입찰가
        const bidRes = await fetch(`${API_BASE_URL}/api/products/${id}/highest-bid`);
        if (bidRes.ok) {
          const highest: number = await bidRes.json();
          setCurrentHighestBid(highest);
        }

        // 현재 사용자가 찜했는지 여부
        const bmRes = await fetch(`${API_BASE_URL}/api/bookmarks/check?productId=${id}`, {
          credentials: "include",
        });
        if (bmRes.ok) {
          const bookmarked: boolean = await bmRes.json();
          setIsBookMarked(bookmarked);
        }
      } catch (err) {
        console.error(err);
        setSellerNickName("알 수 없음");
      }
    };

    fetchProduct();
  }, [id]);

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
      return alert(`입찰가가 현재 최고 입찰가(${currentHighestBid.toLocaleString()}원)보다 높아야 합니다.`);
    }

    const now = new Date();
    const end = new Date(product.auctionEndTime);
    if (now >= end) return alert("이미 경매가 종료된 상품입니다.");

    try {
      const res = await fetch(`${API_BASE_URL}/api/products/${id}/bid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ bidPrice: bidNum }),
      });

      if (res.ok) {
        const newBidServer: { bidderId: number; bidPrice: number } = await res.json();
        const newBid: Bid = {
          bidId: newBidServer.bidderId,
          userId: product.sellerId ?? 0,
          price: newBidServer.bidPrice,
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
        alert("입찰 실패: " + errText);
      }
    } catch (err) {
      console.error(err);
      alert("서버 오류");
    }
  };

  // 찜 토글 처리
  const handleToggleBookmark = async () => {
    if (!product) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookmarks/toggle?productId=${product.productId}`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        const text = await res.text();
        const bookmarked = text === "찜 완료";
        setIsBookMarked(bookmarked);

        // 찜 수 갱신
        const countRes = await fetch(`${API_BASE_URL}/api/bookmarks/count?productId=${product.productId}`);
        if (countRes.ok) {
          const count = await countRes.json();
          setBookmarkCount(count);
        }
      } else {
        alert("찜 기능 실패");
      }
    } catch (err) {
      console.error(err);
      alert("찜 기능 실패");
    }
  };

  // 신고 처리 (세션 기반)
  const handleReport = async () => {
    if (!product) return;

    const reason = prompt("신고 사유를 입력해주세요:");
    if (!reason?.trim()) return alert("신고 사유는 필수입니다.");

    try {
      const res = await fetch(`${API_BASE_URL}/api/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // 세션 쿠키 포함
        body: JSON.stringify({
          targetId: product.sellerId, // 신고 대상은 판매자
          reason: reason.trim(),
        }),
      });

      if (res.ok) {
        alert("신고가 접수되었습니다. 관리자가 확인 후 처리합니다.");
      } else {
        const errText = await res.text();
        alert("신고 실패: " + errText);
      }
    } catch (err) {
      console.error(err);
      alert("신고 처리 중 오류가 발생했습니다.");
    }
  };

  if (!product) return <div style={{ padding: "16px" }}>상품을 찾을 수 없습니다.</div>;

  const graphData = (product.bids ?? []).map((b, i) => ({ name: `${i + 1}`, price: b.price }));
  const auctionStartingPrice = product.startingPrice ?? 0;

  return (
    <div className="container">
      <div className="flex-box">
        {/* 이미지 */}
        <div className="img-box">
          <div>
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div className="no-img-txt">이미지 없음</div>
            )}
          </div>
        </div>
        <div>

        {/* 상세 설명 */}
        <div style={{ flex: 1, minWidth: "300px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{product.title}</h2>

          {/* 찜 + 신고 버튼 */}
          <div style={{ display: "flex", gap: "12px", fontSize: "0.9rem", color: "#555" }}>
            <button
              onClick={handleToggleBookmark}
              style={{
                backgroundColor: isBookMarked ? "#ef4444" : "#fff",
                color: isBookMarked ? "#fff" : "#ef4444",
                border: "1px solid #ef4444",
                borderRadius: "6px",
                padding: "2px 8px",
                cursor: "pointer",
                fontSize: "0.8rem",
              }}
            >
              💖 {bookmarkCount}
            </button>
            <button
              style={{
                backgroundColor: "#ef4444",
                color: "#fff",
                border: "none",
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
            등록시간: {new Date(product.createdAt ?? "").toLocaleString()} <br />
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
            {product.description ?? product.content ?? "상세 설명이 없습니다."}
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
              gap: "8px",
            }}
          >
            <div style={{ marginBottom: "8px" }}>
              {(product.bids ?? []).slice(0, 5).map((b, i) => (
                <p key={b.bidId} style={{ margin: 0 }}>
                  {i + 1}번 입찰가: {b.price.toLocaleString()}원
                </p>
              ))}
              {(!product.bids || product.bids.length === 0) && (
                <p style={{ margin: 0, color: "#888" }}>아직 입찰이 없습니다.</p>
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
      </div>

      {/* 입찰 그래프 */}
      <div style={{ marginTop: "24px" }}>
        <h3 style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "8px" }}>입찰 그래프</h3>
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "12px",
            padding: "12px",
            boxShadow: "0 1px 6px rgba(0,0,0,0.1)",
          }}
        >
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={graphData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="price" stroke="#000" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
