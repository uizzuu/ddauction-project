import type { Report } from "../../common/types";
import CustomSelect from "../ui/CustomSelect";
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import * as API from "../../common/api";

type Props = {
  reports: Report[];
  handleUpdateReportStatus: (reportId: number, status: boolean) => void;
};

type TargetInfo = {
  title: string;
  type: string;
  link: string;
};

export default function ReportManage({
  reports,
  handleUpdateReportStatus,
}: Props) {
  const navigate = useNavigate();
  const [targetInfo, setTargetInfo] = useState<Record<number, TargetInfo>>({});
  const [loading, setLoading] = useState(true);

  // 답변 관련 상태
  const [answeringReportId, setAnsweringReportId] = useState<number | null>(null);
  const [answerText, setAnswerText] = useState("");

  const handleOpenAnswer = (report: Report) => {
    setAnsweringReportId(report.reportId);
    setAnswerText(report.answer || "");
  };

  const handleSaveAnswer = async () => {
    if (!answeringReportId) return;
    if (!answerText.trim()) {
      alert("답변 내용을 입력해주세요.");
      return;
    }

    try {
      await API.saveReportAnswer(answeringReportId, answerText);
      alert("답변이 등록되었습니다.");
      handleUpdateReportStatus(answeringReportId, true); // 처리 완료로 변경
      setAnsweringReportId(null);
      setAnswerText("");
    } catch (error) {
      console.error("답변 등록 실패:", error);
      alert("답변 등록에 실패했습니다.");
    }
  };

  useEffect(() => {
    const fetchTargetInfo = async () => {
      setLoading(true);
      const info: Record<number, TargetInfo> = {};

      for (const report of reports) {
        try {
          switch (report.reportType) {
            case 'PRODUCT':
              try {
                const res = await axios.get(`/api/products/${report.refId}`);
                info[report.reportId] = {
                  title: res.data.title,
                  type: '상품',
                  link: `/products/${report.refId}`
                };
              } catch (error) {
                info[report.reportId] = {
                  title: `상품 #${report.refId} (삭제됨)`,
                  type: '상품',
                  link: ''
                };
              }
              break;

            case 'ARTICLE':
              try {
                const res = await axios.get(`/api/articles/${report.refId}`);
                info[report.reportId] = {
                  title: res.data.title,
                  type: '게시글',
                  link: `/articles/${report.refId}`
                };
              } catch (error) {
                info[report.reportId] = {
                  title: `게시글 #${report.refId} (삭제됨)`,
                  type: '게시글',
                  link: ''
                };
              }
              break;

            case 'PUBLIC_CHAT':
              // 공개채팅은 특정 메시지 ID로 이동하기 어려우므로 채팅방으로 이동
              info[report.reportId] = {
                title: `공개채팅 메시지 #${report.refId}`,
                type: '공개채팅',
                link: `/chat/public`
              };
              break;

            case 'COMMENT':
              try {
                // 댓글 정보 조회 (댓글 API가 있다면)
                const res = await axios.get(`/api/comments/${report.refId}`);
                const preview = res.data.content.length > 30
                  ? res.data.content.substring(0, 30) + '...'
                  : res.data.content;
                info[report.reportId] = {
                  title: preview,
                  type: '댓글',
                  link: `/articles/${res.data.articleId}` // 댓글이 달린 게시글로 이동
                };
              } catch (error) {
                info[report.reportId] = {
                  title: `댓글 #${report.refId} (삭제됨)`,
                  type: '댓글',
                  link: ''
                };
              }
              break;

            default:
              info[report.reportId] = {
                title: '알 수 없는 항목',
                type: report.reportType || '알 수 없음',
                link: ''
              };
          }
        } catch (error) {
          console.error(`Failed to fetch target info for report ${report.reportId}:`, error);
          info[report.reportId] = {
            title: '정보 없음',
            type: report.reportType || '알 수 없음',
            link: ''
          };
        }
      }

      setTargetInfo(info);
      setLoading(false);
    };

    if (reports.length > 0) {
      fetchTargetInfo();
    } else {
      setLoading(false);
    }
  }, [reports]);

  const handleTargetClick = (link: string) => {
    if (link) {
      navigate(link);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-[#111] mb-6">신고 관리</h2>

      {/* Table */}
      <div className="border border-[#eee] rounded-lg">
        <table className="w-full table-fixed">
          <thead>
            <tr className="bg-[#f9f9f9] border-b-2 border-[#eee]">
              <th className="w-[5%] px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider text-nowrap">ID</th>
              <th className="w-[10%] px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider text-nowrap">신고자</th>
              <th className="w-[8%] px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider text-nowrap">대상 타입</th>
              <th className="w-[15%] px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider text-nowrap">대상 정보</th>
              <th className="w-[20%] px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider text-nowrap">신고 사유</th>
              <th className="w-[10%] px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider text-nowrap">신고일</th>
              <th className="w-[8%] px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider text-nowrap">상태</th>
              <th className="w-[12%] px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider text-nowrap">처리</th>
              <th className="w-[12%] px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider text-nowrap">답변</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#eee]">
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-[#666]">
                  로딩 중...
                </td>
              </tr>
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-[#666]">
                  신고 내역이 없습니다.
                </td>
              </tr>
            ) : (
              reports.map((r) => (
                <tr key={r.reportId} className="hover:bg-[#f9f9f9] transition-colors">
                  <td className="px-4 py-3 text-sm text-[#111]">{r.reportId}</td>
                  <td className="px-4 py-3 text-sm text-[#666]">
                    <div>
                      <div className="font-medium">{r.userName || '알 수 없음'}</div>
                      <div className="text-xs text-[#999]">ID: {r.userId}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium text-nowrap">
                      {targetInfo[r.reportId]?.type || r.reportType || "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#111]">
                    {targetInfo[r.reportId]?.link ? (
                      <button
                        onClick={() => handleTargetClick(targetInfo[r.reportId].link)}
                        className="text-blue-600 hover:text-blue-800 hover:underline text-left"
                      >
                        {targetInfo[r.reportId]?.title || "로딩 중..."}
                      </button>
                    ) : (
                      <span className="text-[#999]">
                        {targetInfo[r.reportId]?.title || "로딩 중..."}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#111]">
                    <div className="max-w-xs truncate" title={r.reason}>
                      {r.reason}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#666] whitespace-nowrap">
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString('ko-KR') : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${r.status
                      ? "bg-green-50 text-green-700"
                      : "bg-yellow-50 text-yellow-700"
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
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => handleOpenAnswer(r)}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs transition-colors whitespace-nowrap"
                    >
                      {r.answer ? "답변 수정" : "답변 하기"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 답변 모달 */}
      {answeringReportId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold mb-4">신고 답변 작성</h3>
            <textarea
              className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
              placeholder="답변 내용을 입력하세요..."
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setAnsweringReportId(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
              >
                취소
              </button>
              <button
                onClick={handleSaveAnswer}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                등록
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}