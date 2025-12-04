import type { Qna } from "../../common/types";

type Props = {
  MyProductQna: Qna[];
};

export default function MyProductQna({ MyProductQna }: Props) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <h3>내 Q&A</h3>
      {MyProductQna.length === 0 ? (
        <p>작성한 질문이 없습니다.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {MyProductQna.map((qna) => {
            const answers = qna.answers ?? [];
            return (
              <li
                key={qna.qnaId}
                style={{
                  marginBottom: "15px",
                  border: "1px solid #eee",
                  padding: "10px",
                  borderRadius: "6px",
                }}
              >
                <div style={{ fontWeight: "bold" }}>제목: {qna.title}</div>
                <div>질문: {qna.question}</div>
                <div>작성일: {new Date(qna.createdAt).toLocaleString()}</div>

                {answers.length > 0 && (
                  <div
                    style={{
                      marginTop: "10px",
                      paddingLeft: "10px",
                      borderLeft: "3px solid #000",
                    }}
                  >
                    <strong>답변 완료</strong>
                    <ul
                      style={{
                        listStyle: "none",
                        padding: 0,
                        marginTop: "5px",
                      }}
                    >
                      {answers.map((a) => (
                        <li key={a.qnaReviewId} style={{ marginTop: "5px" }}>
                          {a.nickName ?? "익명"}: {a.answer} (
                          {new Date(a.createdAt).toLocaleString()})
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
