import { useEffect, useRef } from "react";

import type { Bid } from "../../common/types";

interface AuctionBiddingProps {
  mergedBids: Bid[];
}

export const AuctionBidding = ({
  mergedBids,
}: AuctionBiddingProps) => {
  /* State managed by parent now */
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new bid
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [mergedBids]);

  return (
    <div className="flex flex-col h-full">
      {/* Bid History List */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-hide mb-4 space-y-2 p-1 min-h-[200px]"
      >
        {mergedBids.length > 0 ? (
          mergedBids.map((b, i) => (
            <div key={b.bidId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
              <span className="text-gray-500 text-sm font-medium">{i + 1}번째 입찰</span>
              <div className="flex items-center gap-1">
                <span className="font-bold text-gray-800 text-base">{b.bidPrice.toLocaleString()}</span>
                <span className="text-sm text-gray-600">원</span>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm py-10">
            <p>아직 입찰 내역이 없습니다.</p>
            <p>첫 번째 입찰자가 되어보세요!</p>
          </div>
        )}
      </div>
    </div>
  );
};
