import { useState, useEffect } from "react";
import { useAuction } from "../hooks/useAuction";
import { ChevronUp, ChevronDown } from "lucide-react";
import { API_BASE_URL } from "../services/api";
import type { Bid } from "../types/types";

interface AuctionBoxProps {
  productId: number;
}

export const AuctionBox = ({ productId }: AuctionBoxProps) => {
  const {
    bids: liveBids,
    currentHighestBid,
    placeBid,
  } = useAuction({ productId });
  const [bidValue, setBidValue] = useState("");
  const [allBids, setAllBids] = useState<Bid[]>([]);

  // 초기 입찰 내역 fetch
  useEffect(() => {
    const fetchAllBids = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/api/bid/${productId}/bids`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const text = await res.text(); // 우선 텍스트로 읽기
        try {
          const data: Bid[] = JSON.parse(text);
          setAllBids(data);
        } catch {
          console.error("입찰 내역 불러오기 실패, 서버 응답:", text);
        }
      } catch (err) {
        console.error("입찰 내역 불러오기 오류:", err);
      }
    };

    fetchAllBids();
  }, [productId]);

  // 초기 fetch + 실시간 입찰 합치기, 중복 제거
  const mergedBids = [...allBids, ...liveBids]
    .reduce<Bid[]>((acc, bid) => {
      if (!acc.find((b) => b.bidId === bid.bidId)) {
        acc.push(bid);
      }
      return acc;
    }, [])
    .sort((a, b) => a.bidId - b.bidId); // bidId 기준 정렬

  // 입찰 처리
  const handleBid = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      return alert("로그인이 필요합니다.");
    }

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
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/bid/${productId}/bid`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ bidPrice: bidNum }),
      });

      if (res.ok) {
        placeBid(bidNum);
        setBidValue("");
        alert("입찰 성공!");
      } else {
        try {
          const data = await res.json();
          if (data.error) {
            alert(data.error); // 서버에서 온 메시지 그대로 alert
          } else {
            alert("입찰 실패");
          }
        } catch {
          alert("입찰 실패");
        }
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
