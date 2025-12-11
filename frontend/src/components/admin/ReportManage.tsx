import type { Report } from "../../common/types";
import CustomSelect from "../ui/CustomSelect";

type Props = {
  reports: Report[];
  handleUpdateReportStatus: (reportId: number, status: boolean) => void;
};

export default function ReportManage({
  reports,
  handleUpdateReportStatus,
}: Props) {
  return (
    <div>
      <h2 className="text-xl font-bold text-[#111] mb-6">신고 관리</h2>

      {/* Table */}
      <div className="border border-[#eee] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#f9f9f9] border-b-2 border-[#eee]">
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">신고자 ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">대상 ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">사유</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">신고일</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">상태</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">처리</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#eee]">
            {reports.map((r) => (
              <tr key={r.reportId} className="hover:bg-[#f9f9f9] transition-colors">
                <td className="px-4 py-3 text-sm text-[#111]">{r.reportId}</td>
                <td className="px-4 py-3 text-sm text-[#666]">{r.reporterId}</td>
                <td className="px-4 py-3 text-sm text-[#666]">{r.targetId}</td>
                <td className="px-4 py-3 text-sm text-[#111]">{r.reason}</td>
                <td className="px-4 py-3 text-sm text-[#666]">
                  {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "-"}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.status ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
                    }`}>
                    {r.status ? "처리 완료" : "보류 중"}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <CustomSelect
                    value={r.status ? "true" : "false"}
                    onChange={(value) =>
                      handleUpdateReportStatus(
                        r.reportId,
                        value === "true"
                      )
                    }
                    options={[
                      { value: "false", label: "보류" },
                      { value: "true", label: "처리 완료" },
                    ]}
                    className="w-32"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
