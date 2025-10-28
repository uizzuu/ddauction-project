import { useEffect, useRef, useState } from "react";
import type { Bid } from "../types/types";

interface UseAuctionProps {
  productId: number;
}

export const useAuction = ({ productId }: UseAuctionProps) => {
  const wsRef = useRef<WebSocket | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [currentHighestBid, setCurrentHighestBid] = useState(0);

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8080/ws/auction?productId=${productId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected:", productId);
    };

    ws.onmessage = (event) => {
      const bidList: Bid[] = JSON.parse(event.data);
      setBids(bidList);

      const highest = bidList.length > 0
        ? Math.max(...bidList.map(b => b.bidPrice))
        : 0;
      setCurrentHighestBid(highest);
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
    };

    return () => {
      ws.close();
    };
  }, [productId]);

  const placeBid = (bidPrice: number) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ bidPrice }));
    }
  };

  return { bids, currentHighestBid, placeBid };
};
