import { useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "./api";

export interface RankingItem {
  keyword: string;
  count: number;
}

interface RankingResponse {
  type: string;
  data: RankingItem[];
  timestamp: number;
}

export const RealTimeSearch = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const wsUrl =
      API_BASE_URL.replace("http", "ws").replace("/api", "") +
      "/ws/realtime-search";
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("실시간 검색어 WebSocket 연결됨");
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const response: RankingResponse = JSON.parse(event.data);
      if (response.type === "RANKING") {
        setRankings(response.data);
      }
    };

    ws.onerror = (err) => {
      console.error("실시간 검색어 WebSocket 에러:", err);
    };

    ws.onclose = () => {
      console.log("실시간 검색어 WebSocket 연결 종료");
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  return { rankings, isConnected };
};