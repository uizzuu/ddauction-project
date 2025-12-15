import type { Report } from "../../common/types";

type Props = {
  reports: Report[];
};

export default function MyReports({ reports }: Props) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <h3>신고 내역</h3>
      {reports.length === 0 ? (
        <p>신고한 내역이 없습니다.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #000" }}>
              <th style={{ padding: "10px", textAlign: "left" }}>ID</th>
              <th style={{ padding: "10px", textAlign: "left" }}>
                신고 대상 ID
              </th>
              <th style={{ padding: "10px", textAlign: "left" }}>사유</th>
              <th style={{ padding: "10px", textAlign: "left" }}>처리 상태</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr
                key={report.reportId}
                style={{ borderBottom: "1px solid #eee" }}
              >
                <td style={{ padding: "10px" }}>{report.reportId}</td>
                <td style={{ padding: "10px" }}>{report.refId}</td>
                <td style={{ padding: "10px" }}>{report.reason}</td>
                <td style={{ padding: "10px" }}>
                  {report.status ? "처리 완료" : "대기"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
