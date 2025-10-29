import type { Report } from "../../types/types";

type Props = {
  reports: Report[];
  handleUpdateReportStatus: (reportId: number, status: boolean) => void;
};

export default function ReportManagement({ reports, handleUpdateReportStatus }: Props) {
  return (
    <div className="admin-section">
      <h3>신고 관리</h3>
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>신고자 ID</th>
            <th>대상 ID</th>
            <th>사유</th>
            <th>상태</th>
            <th>처리</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <tr key={r.reportId}>
              <td>{r.reportId}</td>
              <td>{r.reporterId}</td>
              <td>{r.targetId}</td>
              <td>{r.reason}</td>
              <td>{r.status ? "처리 완료" : "보류 중"}</td>
              <td>
                <select
                  defaultValue={r.status ? "true" : "false"}
                  onChange={(e) =>
                    handleUpdateReportStatus(r.reportId, e.target.value === "true")
                  }
                >
                  <option value="false">보류</option>
                  <option value="true">처리 완료</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}