import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

type Props = {
  stats: { userCount?: number; productCount?: number; reportCount?: number };
};

export default function StatsManagement({ stats }: Props) {
  return (
    <div className="admin-section">
      <h3>통계</h3>
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <BarChart
            data={[
              { name: "회원", count: stats.userCount ?? 0 },
              { name: "상품", count: stats.productCount ?? 0 },
              { name: "신고", count: stats.reportCount ?? 0 },
            ]}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}