import type { Inquiry } from "../../common/types";

type Props = {
  inquiries: Inquiry[];
  setInquiries: React.Dispatch<React.SetStateAction<Inquiry[]>>;
  handleSaveInquiryAnswer: (inquiryId: number, answer?: string) => void;
};

export default function InquiryManagement({
  inquiries,
  setInquiries,
  handleSaveInquiryAnswer,
}: Props) {
  return (
    <div>
      <h2 className="text-xl font-bold text-[#111] mb-6">1:1 문의 관리</h2>

      {/* Table */}
      <div className="border border-[#eee] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#f9f9f9] border-b-2 border-[#eee]">
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider w-20">ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">제목</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">질문</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">답변</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider w-32">작성일</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#eee]">
            {inquiries.length > 0 ? (
              inquiries.map((inq) => (
                <tr key={inq.inquiryId} className="hover:bg-[#f9f9f9] transition-colors">
                  <td className="px-4 py-3 text-sm text-[#111]">{inq.inquiryId}</td>
                  <td className="px-4 py-3 text-sm text-[#111] font-medium">{inq.title}</td>
                  <td className="px-4 py-3 text-sm text-[#666]">{inq.question}</td>
                  <td className="px-4 py-3 text-sm">
                    {/* Existing Answers */}
                    {inq.answers?.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {inq.answers.map((a) => (
                          <div key={a.inquiryReviewId} className="p-2 bg-[#f9f9f9] rounded border-l-2 border-[#111]">
                            <div className="text-xs font-semibold text-[#111] mb-1">{a.nickName}</div>
                            <div className="text-sm text-[#666]">{a.answer}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* New Answer Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="답변을 입력하세요"
                        value={inq.newAnswer || ""}
                        onChange={(e) => {
                          setInquiries((prev) =>
                            prev.map((i) =>
                              i.inquiryId === inq.inquiryId
                                ? { ...i, newAnswer: e.target.value }
                                : i
                            )
                          );
                        }}
                        className="flex-1 px-3 py-1.5 border border-[#ddd] rounded text-sm bg-white text-[#111] focus:outline-none focus:ring-1 focus:ring-[#111]"
                      />
                      <button
                        onClick={() =>
                          handleSaveInquiryAnswer(inq.inquiryId, inq.newAnswer)
                        }
                        className="px-4 py-1.5 bg-[#111] text-white rounded text-sm font-medium hover:bg-[#333] transition-colors whitespace-nowrap"
                      >
                        답변 등록
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#666]">
                    {new Date(inq.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-[#999]">
                  문의 내역이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
