import type { Inquiry } from "../../types/types";

type Props = {
  inquiries: Inquiry[];
  setInquiries: React.Dispatch<React.SetStateAction<Inquiry[]>>;
  handleSaveInquiryAnswer: (inquiryId: number, answer?: string) => void;
};

export default function InquiryManagement({ inquiries, setInquiries, handleSaveInquiryAnswer }: Props) {
  return (
    <div className="admin-section">
      <h3>1:1 문의 관리</h3>
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>제목</th>
            <th>질문</th>
            <th>답변</th>
            <th>작성일</th>
          </tr>
        </thead>
        <tbody>
          {inquiries.length > 0 ? (
            inquiries.map((inq) => (
              <tr key={inq.inquiryId}>
                <td>{inq.inquiryId}</td>
                <td>{inq.title}</td>
                <td>{inq.question}</td>
                <td>
                  {inq.answers?.length > 0 &&
                    inq.answers.map((a) => (
                      <div key={a.inquiryReviewId}>
                        <strong>{a.nickName}</strong>: {a.answer}
                      </div>
                    ))}

                  <input
                    type="text"
                    placeholder="답변 입력"
                    value={inq.newAnswer}
                    onChange={(e) => {
                      setInquiries((prev) =>
                        prev.map((i) =>
                          i.inquiryId === inq.inquiryId
                            ? { ...i, newAnswer: e.target.value }
                            : i
                        )
                      );
                    }}
                  />
                  <button onClick={() => handleSaveInquiryAnswer(inq.inquiryId, inq.newAnswer)}>답변 등록</button>
                </td>
                <td>{new Date(inq.createdAt).toLocaleString()}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5}>문의 내역이 없습니다.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}