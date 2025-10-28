import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { Bid } from "../types/types";

type Props = {
  bids: Bid[];
};

export default function ProductBidGraph({ bids }: Props) {
  const graphData = bids.map((b, i) => ({
    name: `${i + 1}`,
    bidPrice: b.bidPrice,
  }));

  return (
    <div style={{ marginTop: "24px" }}>
      <h3 style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "8px" }}>
        입찰 그래프
      </h3>
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
            <Line type="monotone" dataKey="bidPrice" stroke="#000" strokeWidth={2} />  
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}