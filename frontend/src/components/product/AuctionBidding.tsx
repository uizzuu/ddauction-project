import { useState, useEffect, useRef } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import * as API from "../../common/api";
import type { Bid } from "../../common/types";

interface AuctionBiddingProps {
  productId: number;
  mergedBids: Bid[];
  currentHighestBid: number;
  placeBid: (bidPrice: number) => void; // WebSocket용, 직접 호출 X
}

export const AuctionBidding = ({
  productId,
  mergedBids,
  currentHighestBid,
}: AuctionBiddingProps) => {
  const [bidValue, setBidValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isBidding, setIsBidding] = useState(false);

  // 새 입찰이 들어올 때마다 스크롤 맨 아래로 이동
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [mergedBids]);

  //  입찰 처리
  const handleBid = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();

    // 중복 클릭 방지
    if (isBidding) return;
    setIsBidding(true);

    const token = localStorage.getItem("token");
    if (!token) {
      alert("로그인이 필요합니다.");
      setIsBidding(false);
      return;
    }

    const bidNum = Number(bidValue);
    if (!bidValue || isNaN(bidNum) || bidNum <= 0) {
      alert("올바른 금액을 입력해주세요 (0보다 큰 숫자)");
      setIsBidding(false);
      return;
    }

    if (bidNum <= currentHighestBid) {
      alert(
        `입찰가가 현재 최고 입찰가(${currentHighestBid.toLocaleString()}원)보다 높아야 합니다.`
      );
      setIsBidding(false);
      return;
    }

    try {
      await API.placeBid(productId, bidNum, token); // productId와 bidNum 전달
      setBidValue("");
      alert("입찰 성공!");
    } catch (err: any) {
      alert(err.message || "서버 오류");
    } finally {
      setIsBidding(false);
    }
  };

  const placeholderText =
    currentHighestBid > 0 ? `${currentHighestBid.toLocaleString()}` : "0";

  return (
    <div style={{ width: "260px", flexShrink: 0 }} className="h-[450px]">
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
        <div
          ref={scrollRef}
          className="mb-5 flex flex-col gap-2 max-h-[350px] overflow-y-auto bid-scroll"
        >
          {mergedBids.length > 0 ? (
            mergedBids.map((b, i) => (
              <div key={b.bidId} className="bid-box">
                <p className="text-16">{i + 1}번 입찰</p>
                <div className="flex gap-1 items-center">
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
        <div className="max-h-[3rem] flex gap-1">
          <input
            type="text"
            value={bidValue ? Number(bidValue).toLocaleString() : ""}
            onChange={(e) => {
              const clean = e.target.value.replace(/[^0-9]/g, "");
              setBidValue(clean);
            }}
            placeholder={placeholderText}
            className="input"
          />

          {/* 금액 조절 버튼 */}
          <div className="flex flex-col search-btn justify-center items-center border-hover-none">
            <button
              type="button"
              onClick={() => setBidValue(String(Number(bidValue || 0) + 1000))}
              className="text-[#ddd] w-fit bg-transparent -mb-1 hover"
            >
              <ChevronUp size={20} />
            </button>
            <button
              type="button"
              onClick={() =>
                setBidValue(String(Math.max(Number(bidValue || 0) - 1000, 0)))
              }
              className="text-[#ddd] w-fit bg-transparent hover"
            >
              <ChevronDown size={20} />
            </button>
          </div>

          {/* 입찰 버튼 */}
          <button
            type="button" // form submit 방지
            onClick={handleBid}
            className="search-btn"
            disabled={isBidding}
          >
            {isBidding ? "입찰 중..." : "입찰"}
          </button>
        </div>
      </div>
    </div>
  );
};
