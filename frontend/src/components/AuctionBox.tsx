import { useState, useEffect, useRef } from "react";
// import { useAuction } from "../hooks/useAuction";
import { ChevronUp, ChevronDown } from "lucide-react";
import { API_BASE_URL } from "../services/api";
import type { Bid } from "../types/types";

interface AuctionBoxProps {
  productId: number;
  mergedBids: Bid[];
  currentHighestBid: number;
  placeBid: (bidPrice: number) => void;
}

export const AuctionBox = ({
  productId,
  mergedBids,
  currentHighestBid,
  placeBid,
}: AuctionBoxProps) => {
  const [bidValue, setBidValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // 새 입찰이 들어올 때마다 스크롤 아래로
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [mergedBids]);

  // 입찰 처리
  const handleBid = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("로그인이 필요합니다.");

    const bidNum = Number(bidValue);
    if (!bidValue || isNaN(bidNum) || bidNum <= 0) {
      return alert("올바른 금액을 입력해주세요 (0보다 큰 숫자)");
    }
    if (bidNum <= currentHighestBid) {
      return alert(
        `입찰가가 현재 최고 입찰가(${currentHighestBid.toLocaleString()}원)보다 높아야 합니다.`
      );
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/bid/${productId}/bid`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bidPrice: bidNum }),
      });

      if (res.ok) {
        placeBid(bidNum); // 함수 호출
        setBidValue("");
        alert("입찰 성공!");
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "입찰 실패");
      }
    } catch (err) {
      console.error("입찰 중 오류:", err);
      alert("서버 오류");
    }
  };

  return (
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
        {/* 입찰 리스트 */}
        <div className="mb-20 flex-column gap-8 max-height-350 overflow-y-auto bid-scroll">
          {mergedBids.length > 0 ? (
            mergedBids.map((b, i) => (
              <div key={b.bidId} className="bid-box">
                <p className="text-16">{i + 1}번 입찰</p>
                <div className="flex-box gap-4 flex-center-a">
                  <p className="title-20">{b.bidPrice.toLocaleString()}</p>
                  <p className="title-18">원</p>
                </div>
              </div>
            ))
          ) : (
            <p style={{ margin: 0, color: "#888" }}>아직 입찰이 없습니다.</p>
          )}
        </div>

        {/* 입찰 입력 */}
        <div className="max-height-3rem flex-box gap-4">
          <input
            type="text"
            value={Number(bidValue || 0).toLocaleString()}
            onChange={(e) => {
              const clean = e.target.value.replace(/[^0-9]/g, "");
              setBidValue(clean);
            }}
            placeholder="희망 입찰가"
            className="input"
          />

          <div className="flex-column search-btn flex-center border-hover-none">
            <button
              onClick={() => setBidValue(String(Number(bidValue || 0) + 1000))}
              className="color-ddd width-fit bg-transparent mb--4 hover"
            >
              <ChevronUp size={20} />
            </button>
            <button
              onClick={() =>
                setBidValue(String(Math.max(Number(bidValue || 0) - 1000, 0)))
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
  );
};
