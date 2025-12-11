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
    let wsUrl = "";
    
    // API_BASE_URL이 존재하면 변환, 없으면 현재 호스트 기준 (Production 등)
    if (API_BASE_URL) {
       // http -> ws, https -> wss
       wsUrl = API_BASE_URL.replace(/^http/, "ws") + "/ws/realtime-search";
    } else {
       const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
       const host = window.location.host;
       wsUrl = `${protocol}//${host}/ws/realtime-search`;
    }

    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;
    } catch (error) {
      console.error("WebSocket create failed:", error);
      return;
    }

    if (!ws) return;

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