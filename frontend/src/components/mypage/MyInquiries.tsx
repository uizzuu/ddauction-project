import type { Inquiry } from "../../types/types";

type Props = {
  myInquiries: Inquiry[];
};

export default function MyInquiries({ myInquiries }: Props) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <h3>1:1 문의 내역</h3>
      {myInquiries.length === 0 ? (
        <p>문의 내역이 없습니다.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {myInquiries.map((i) => {
            const answers = i.answers ?? [];
            return (
              <li
                key={i.inquiryId}
                style={{
                  marginBottom: "15px",
                  border: "1px solid #eee",
                  padding: "10px",
                  borderRadius: "6px",
                }}
              >
                <div>
                  <strong>제목:</strong> {i.title}
                </div>
                <div>
                  <strong>내용:</strong> {i.question}
                </div>
                <div>
                  <strong>작성일:</strong>{" "}
                  {i.createdAt
                    ? new Date(i.createdAt).toLocaleString()
                    : "작성일 없음"}
                </div>

                {/* 답변 내용 */}
                {answers.length > 0 && (
                  <div style={{ marginTop: "10px", paddingLeft: "10px", borderLeft: "3px solid #000" }}>
                    <strong>답변 완료</strong>
                    <ul style={{ listStyle: "none", padding: 0, marginTop: "5px" }}>
                        {answers.map((a) => (
                          <li key={a.inquiryReviewId}>
                            {a.nickName ?? "익명"}: {a.answer} (
                            {a.createdAt
                              ? new Date(a.createdAt).toLocaleString()
                              : "작성일 없음"}
                            )
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}