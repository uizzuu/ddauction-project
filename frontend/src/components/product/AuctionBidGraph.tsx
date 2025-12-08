import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Bid } from "../../common/types";

interface AuctionBidGraphProps {
  bids: Bid[];
}

export const AuctionBidGraph: React.FC<AuctionBidGraphProps> = ({ bids }) => {
  // 데이터 가공: 시간순 정렬 및 포맷
  const data = useMemo(() => {
    if (!bids || bids.length === 0) return [];

    // 시간순 정렬 (오름차순) -> 이미 되어있다고 가정하거나 안전하게 sort
    const sorted = [...bids].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return sorted.map((bid, index) => ({
      index: index + 1,
      price: bid.bidPrice,
      time: new Date(bid.createdAt).toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      fullDate: new Date(bid.createdAt).toLocaleString("ko-KR"),
    }));
  }, [bids]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] bg-gray-50 rounded-xl border border-gray-100 text-gray-400 text-sm">
        아직 입찰 내역이 없습니다.
      </div>
    );
  }

  // Y축 범위 동적 설정
  const minPrice = Math.min(...data.map((d) => d.price));
  const maxPrice = Math.max(...data.map((d) => d.price));
  const padding = (maxPrice - minPrice) * 0.1 || minPrice * 0.1;

  return (
    <div className="w-full h-[250px]">
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis
            dataKey="index"
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(val) => `${val}회`}
          />
          <YAxis
            dataKey="price"
            domain={[minPrice - padding, maxPrice + padding]}
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) =>
              value >= 10000
                ? `${(value / 10000).toLocaleString()}만`
                : value.toLocaleString()
            }
            width={40}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1f2937",
              border: "none",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "12px",
            }}
            itemStyle={{ color: "#fff" }}
            cursor={{ stroke: "#ef4444", strokeWidth: 1, strokeDasharray: "4 4" }}
            formatter={(value: number) => [`${value.toLocaleString()}원`, "입찰가"]}
            labelFormatter={(label, payload) => {
              if (payload && payload.length > 0) {
                return payload[0].payload.fullDate;
              }
              return label;
            }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke="#ef4444"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorPrice)"
            activeDot={{ r: 4, strokeWidth: 0, fill: "#ef4444" }}
            animationDuration={500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
