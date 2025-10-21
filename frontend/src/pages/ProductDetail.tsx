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
  const [sellerNickName, setSellerNickName] = useState("");

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
        if (res.ok) {
          const data: Product = await res.json();
          setProduct(data);
          setRemainingTime(calculateRemainingTime(data.auctionEndTime));

          // 판매자 정보
          if (data.sellerId) {
            fetch(`${API_BASE_URL}/api/users/${data.sellerId}`)
              .then((r) => r.json())
              .then((user: User) => setSellerNickName(user.nickName))
              .catch(() => console.warn("판매자 정보 가져오기 실패"));
          }

          // 카테고리명
          if (data.categoryId && !data.categoryName) {
            fetch(`${API_BASE_URL}/api/categories/${data.categoryId}`)
              .then((r) => r.json())
              .then((c: Category) =>
                setProduct((prev) => (prev ? { ...prev, categoryName: c.name } : prev))
              )
              .catch(() => console.warn("카테고리명 불러오기 실패"));
          }
        }
      } catch (err) {
        console.error(err);
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

  // 🔥 입찰 처리
  const handleBid = async () => {
    const bidNum = Number(bidValue);

    if (!bidValue || isNaN(bidNum) || bidNum <= 0) {
      return alert("올바른 금액을 입력해주세요 (0보다 큰 숫자)");
    }
    if (!product) return;

    // 현재 최고 입찰가보다 낮으면 경고
    const highestBid =
      product.bids && product.bids.length > 0
        ? Math.max(...product.bids.map((b) => b.price))
        : product.startingPrice ?? 0;

    if (bidNum <= highestBid) {
      return alert(`입찰가가 현재 최고 입찰가(${highestBid.toLocaleString()}원)보다 높아야 합니다.`);
    }

    // 경매 종료 체크
    const now = new Date();
    const end = new Date(product.auctionEndTime);
    if (now >= end) {
      return alert("이미 경매가 종료된 상품입니다.");
    }

    if (!id) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/products/${id}/bid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ bidderPrice: bidNum }),
      });

      if (res.ok) {
        const newBidServer: { bidderId: number; bidderPrice: number } = await res.json();
        const newBid: Bid = {
          bidId: newBidServer.bidderId,
          userId: product.sellerId ?? 0,
          price: newBidServer.bidderPrice,
          createdAt: new Date().toISOString(),
        };

        setProduct((prev) =>
          prev ? { ...prev, bids: [...(prev.bids ?? []), newBid] } : prev
        );

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

  if (!product) return <div style={{ padding: "16px" }}>상품을 찾을 수 없습니다.</div>;

  // 그래프 데이터
  const graphData = (product.bids ?? []).map((b, i) => ({ name: `${i + 1}`, price: b.price }));

  // 최고 입찰가
  const highestBid =
    product.bids && product.bids.length > 0
      ? Math.max(...product.bids.map((b) => b.price))
      : product.startingPrice ?? 0;

  return (
    <div style={{ padding: "16px" }}>
      <section style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
        {/* 이미지 */}
        <div style={{ width: "220px", flexShrink: 0 }}>
          <div
            style={{
              width: "100%",
              height: "220px",
              overflow: "hidden",
              borderRadius: "12px",
              backgroundColor: "#f0f0f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div>이미지 없음</div>
            )}
          </div>
        </div>

        {/* 상세 설명 */}
        <div style={{ flex: 1, minWidth: "300px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{product.title}</h2>

          <div style={{ display: "flex", gap: "12px", fontSize: "0.9rem", color: "#555" }}>
            <span>💖 찜 {product.amount ?? 0}</span>
            <span>👀 조회수 {product.bidderId ?? 0}</span>
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
              onClick={() => alert("신고 기능은 아직 미구현")}
            >
              신고
            </button>
          </div>

          <p>판매자: {sellerNickName || "알 수 없음"}</p>
          <p>카테고리: {product.categoryName ?? "없음"}</p>
          <p style={{ color: "#555", fontSize: "0.9rem" }}>
            등록시간: {new Date(product.createdAt ?? "").toLocaleString()} <br />
            남은시간: {remainingTime}
          </p>

          <p>경매등록가: {highestBid.toLocaleString()}원</p>

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
            {/* 입찰 기록: 최대 5건 */}
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
      </section>

      {/* 입찰 그래프 */}
      <section style={{ marginTop: "24px" }}>
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
      </section>
    </div>
  );
}
