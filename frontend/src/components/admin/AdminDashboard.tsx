import { Users, Package, AlertCircle, TrendingUp, ShoppingCart, Clock } from "lucide-react";

type Props = {
  stats: { userCount?: number; productCount?: number; reportCount?: number };
};

export default function AdminDashboard({ stats }: Props) {
  // Calculate some derived stats
  const totalUsers = stats.userCount ?? 0;
  const totalProducts = stats.productCount ?? 0;
  const totalReports = stats.reportCount ?? 0;

  // Simulated data - in real app, fetch from API
  const activeProducts = Math.floor(totalProducts * 0.7);
  const soldProducts = Math.floor(totalProducts * 0.25);
  const estimatedRevenue = totalProducts * 15000; // 평균 상품가 * 개수

  const statCards = [
    {
      title: "전체 회원",
      value: totalUsers.toLocaleString(),
      subtext: "active users",
      icon: Users,
      color: "bg-blue-50 text-[#333]",
      borderColor: "border-blue-100",
    },
    {
      title: "전체 상품",
      value: totalProducts.toLocaleString(),
      subtext: `${activeProducts} 판매중`,
      icon: Package,
      color: "bg-green-50 text-green-600",
      borderColor: "border-green-100",
    },
    {
      title: "총 신고",
      value: totalReports.toLocaleString(),
      subtext: "pending reports",
      icon: AlertCircle,
      color: "bg-red-50 text-red-600",
      borderColor: "border-red-100",
    },
    {
      title: "예상 거래액",
      value: `₩${(estimatedRevenue / 10000).toFixed(0)}만`,
      subtext: "estimated value",
      icon: TrendingUp,
      color: "bg-purple-50 text-purple-600",
      borderColor: "border-purple-100",
    },
  ];

  // Activity data
  const recentActivities = [
    { type: "user", action: "새 회원 가입", time: "5분 전" },
    { type: "product", action: "상품 등록", time: "12분 전" },
    { type: "order", action: "거래 완료", time: "23분 전" },
    { type: "report", action: "신고 접수", time: "45분 전" },
    { type: "user", action: "회원 탈퇴", time: "1시간 전" },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold text-[#111] mb-6">대시보드</h2>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className={`border ${card.borderColor} rounded-lg p-5 hover:shadow-sm transition-shadow`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${card.color}`}>
                  <Icon size={20} />
                </div>
              </div>
              <div>
                <p className="text-sm text-[#666] mb-1">{card.title}</p>
                <p className="text-2xl font-bold text-[#111] mb-1">{card.value}</p>
                <p className="text-xs text-[#999]">{card.subtext}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Product Status Distribution */}
        <div className="border border-[#eee] rounded-lg p-6">
          <h3 className="text-base font-bold text-[#111] mb-4">상품 현황</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-[#666]">판매중</span>
                <span className="text-sm font-semibold text-[#111]">{activeProducts}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${(activeProducts / totalProducts) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-[#666]">판매완료</span>
                <span className="text-sm font-semibold text-[#111]">{soldProducts}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-gray-400 h-2 rounded-full transition-all"
                  style={{ width: `${(soldProducts / totalProducts) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-[#666]">비활성</span>
                <span className="text-sm font-semibold text-[#111]">
                  {totalProducts - activeProducts - soldProducts}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-red-400 h-2 rounded-full transition-all"
                  style={{
                    width: `${((totalProducts - activeProducts - soldProducts) / totalProducts) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* User Growth */}
        <div className="border border-[#eee] rounded-lg p-6">
          <h3 className="text-base font-bold text-[#111] mb-4">회원 구성</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-[#f9f9f9] rounded">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-[#666]" />
                <span className="text-sm text-[#666]">일반 회원</span>
              </div>
              <span className="text-base font-bold text-[#111]">{Math.floor(totalUsers * 0.95)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#f9f9f9] rounded">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-[#666]" />
                <span className="text-sm text-[#666]">정지 회원</span>
              </div>
              <span className="text-base font-bold text-[#111]">{Math.floor(totalUsers * 0.03)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#f9f9f9] rounded">
              <div className="flex items-center gap-2">
                <ShoppingCart size={16} className="text-[#666]" />
                <span className="text-sm text-[#666]">관리자</span>
              </div>
              <span className="text-base font-bold text-[#111]">{Math.floor(totalUsers * 0.02)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="border border-[#eee] rounded-lg p-6">
        <h3 className="text-base font-bold text-[#111] mb-4">최근 활동</h3>
        <div className="space-y-3">
          {recentActivities.map((activity, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 hover:bg-[#f9f9f9] rounded transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#f1f1f1] flex items-center justify-center">
                  {activity.type === "user" && <Users size={14} className="text-[#666]" />}
                  {activity.type === "product" && <Package size={14} className="text-[#666]" />}
                  {activity.type === "order" && <ShoppingCart size={14} className="text-[#666]" />}
                  {activity.type === "report" && <AlertCircle size={14} className="text-[#666]" />}
                </div>
                <span className="text-sm text-[#666]">{activity.action}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#999]">
                <Clock size={12} />
                {activity.time}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}