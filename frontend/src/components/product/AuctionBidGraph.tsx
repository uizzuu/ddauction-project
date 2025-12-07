import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Bid } from "../../common/types";

type Props = {
  bids: Bid[];
  startingPrice: number;
};

export default function AuctionBidGraph({ bids, startingPrice }: Props) {
  const graphData = bids.map((b, i) => ({
    name: `${i + 1}`,
    bidPrice: b.bidPrice,
  }));

  return (
    <div>
      <div>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={graphData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[startingPrice, "auto"]} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="bidPrice"
              stroke="#000"
              strokeWidth={2}
              name="입찰가"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
