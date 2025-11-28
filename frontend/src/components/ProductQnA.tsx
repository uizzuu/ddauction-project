import { useState, useEffect, useCallback } from "react";
import type { User, Qna, Product } from "../common/types";
import { ROLE } from "../common/enums";
import { API_BASE_URL } from "../common/api";
import { formatDateTime } from "../common/util";

type Props = {
  user: User | null;
  product: Product | null;
  productId: number;
  qnaList: Qna[];
  setQnaList: (list: Qna[]) => void;
};

export default function ProductQnA({
  user,
  product,
  productId,
  qnaList,
  setQnaList,
}: Props) {
  const [newQuestion, setNewQuestion] = useState({ title: "", question: "" });
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(
    null
  );
  const [editingQuestion, setEditingQuestion] = useState<{
    title: string;
    question: string;
  }>({ title: "", question: "" });
  const [editingAnswerId, setEditingAnswerId] = useState<number | null>(null);
  const [editingAnswerContent, setEditingAnswerContent] = useState("");

  const [openQnaIds, setOpenQnaIds] = useState<number[]>([]);

  const fetchQnaList = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/qna/product/${productId}`);
      if (res.ok) {
        const data = await res.json();
        setQnaList(data);
      } else {
        setQnaList([]);
      }
    } catch {
      setQnaList([]);
    }
  }, [productId, setQnaList]);

  useEffect(() => {
    if (productId) fetchQnaList();
  }, [productId, fetchQnaList]);

  // 질문 등록
  const handleCreateQuestion = async () => {
    if (
      qnaList.some(
        (q) => q.userId === user?.userId && q.productId === productId
      )
    ) {
      return alert("본인 글에는 질문을 작성할 수 없습니다.");
    }

    if (!newQuestion.question.trim()) return alert("질문 내용을 입력해주세요.");

    const token = localStorage.getItem("token");
    if (!token) return alert("로그인 후 질문을 등록할 수 있습니다.");

    try {
      const res = await fetch(`${API_BASE_URL}/api/qna`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, ...newQuestion, boardName: "qna" }),
      });
      if (res.ok) {
        setNewQuestion({ title: "", question: "" });
        fetchQnaList();
      } else {
        const msg = await res.text();
        console.log("질문 등록 실패 : " + msg);
        alert("질문 등록 실패");
      }
    } catch {
      alert("질문 등록 중 오류 발생");
    }
  };

  // 질문 삭제
  const handleQuestionDelete = async (qnaId: number) => {
    if (!window.confirm("질문을 삭제하시겠습니까?")) return;
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_BASE_URL}/api/qna/${qnaId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      fetchQnaList();
    } catch {
      alert("질문 삭제 실패");
    }
  };

  // 질문 수정 저장
  const saveEditingQuestion = async (qnaId: number) => {
    if (!editingQuestion.title.trim() || !editingQuestion.question.trim())
      return alert("내용을 입력해주세요.");
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_BASE_URL}/api/qna/${qnaId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingQuestion),
      });
      setEditingQuestionId(null);
      setEditingQuestion({ title: "", question: "" });
      fetchQnaList();
    } catch {
      alert("질문 수정 실패");
    }
  };

  // 토글 버튼
  const toggleQna = (qnaId: number) => {
    setOpenQnaIds((prev) =>
      prev.includes(qnaId)
        ? prev.filter((id) => id !== qnaId)
        : [...prev, qnaId]
    );
  };

  // 답변 권한 확인 함수
  const canAnswer = () => {
    if (!user || !product) return false;
    return user?.role === ROLE[0] || user?.userId === product.sellerId;
  };

  // 답변 수정 시작
  const startEditingAnswer = (answerId: number, content: string) => {
    setEditingAnswerId(answerId);
    setEditingAnswerContent(content);
  };

  // 답변 수정 저장
  const saveEditingAnswer = async (answerId: number) => {
    if (!editingAnswerContent.trim()) return alert("내용을 입력해주세요.");
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_BASE_URL}/api/qna/${answerId}/review`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answer: editingAnswerContent }),
      });
      setEditingAnswerId(null);
      setEditingAnswerContent("");
      fetchQnaList();
    } catch {
      alert("답변 수정 실패");
    }
  };

  // 답변 삭제
  const handleAnswerDelete = async (answerId: number) => {
    if (!window.confirm("답변을 삭제하시겠습니까?")) return;
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_BASE_URL}/api/qna/${answerId}/review`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      fetchQnaList();
    } catch {
      alert("답변 삭제 실패");
    }
  };

  // 답변 등록
  const handleAnswerSubmit = async (qnaId: number) => {
    const answer = answers[qnaId];
    if (!answer?.trim()) return alert("답변 내용을 입력해주세요.");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/qna/${qnaId}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answer }),
      });
      if (res.ok) {
        setAnswers((prev) => ({ ...prev, [qnaId]: "" }));
        fetchQnaList();
      } else {
        const msg = await res.text();
        alert("답변 등록 실패: " + msg);
      }
    } catch {
      alert("답변 등록 중 오류 발생");
    }
  };

  return (
    <div style={{ marginTop: 40 }}>
      <h3 className="title-20 mb-10">상품 Q&A</h3>
      <div
        style={{
          backgroundColor: "#fff",
          padding: 16,
          borderRadius: 12,
          boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
        }}
      >
        {/* 질문 작성 */}
        {user && (
          <div className="flex-column gap-8">
            <input
              type="text"
              placeholder="질문 제목"
              value={newQuestion.title}
              onChange={(e) =>
                setNewQuestion({ ...newQuestion, title: e.target.value })
              }
              className="article-input article-review"
            />
            <textarea
              placeholder="질문 내용"
              value={newQuestion.question}
              onChange={(e) =>
                setNewQuestion({ ...newQuestion, question: e.target.value })
              }
              className="article-textarea article-review"
            />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={handleCreateQuestion} className="article-btn">
                질문 등록
              </button>
            </div>
          </div>
        )}

        {/* 질문 목록 */}
        <div className="flex-column gap-8 mt-10 mb-10">
          {qnaList.length === 0 ? (
            <p style={{ color: "#888" }}>아직 등록된 질문이 없습니다.</p>
          ) : (
            qnaList.map((q, index) => (
              <div key={q.qnaId}>
                {/* 질문 제목 + 토글 버튼 */}
                {index !== 0 && <div className="top-line mb-10"></div>}
                <div className="flex-box flex-center flex-between width-full">
                  <p className="title-16 color-333 text-nowrap width-full">
                    {q.title}
                  </p>
                  <button
                    onClick={() => toggleQna(q.qnaId)}
                    className="top-16 right-8 trans"
                  >
                    <span
                      className={`custom-select-arrow ${
                        openQnaIds.includes(q.qnaId) ? "open" : ""
                      }`}
                    />
                  </button>
                </div>

                {/* 토글 열렸을 때 전체 내용 */}
                {openQnaIds.includes(q.qnaId) && (
                  <div className="flex-column gap-4" style={{ marginTop: 8 }}>
                    {/* 질문 수정 모드 */}
                    {editingQuestionId === q.qnaId ? (
                      <div className="flex-column gap-8">
                        <input
                          type="text"
                          value={editingQuestion.title}
                          onChange={(e) =>
                            setEditingQuestion({
                              ...editingQuestion,
                              title: e.target.value,
                            })
                          }
                          className="article-input article-review"
                        />
                        <textarea
                          value={editingQuestion.question}
                          onChange={(e) =>
                            setEditingQuestion({
                              ...editingQuestion,
                              question: e.target.value,
                            })
                          }
                          className="article-textarea article-review"
                        />
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => saveEditingQuestion(q.qnaId)}
                            className="article-btn"
                          >
                            저장
                          </button>
                          <button
                            onClick={() => setEditingQuestionId(null)}
                            className="article-btn"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-column gap-4">
                        <p className="text-16 color-777 text-nowrap after-wrap">
                          <span className="after">
                            {q.userId === product?.sellerId
                              ? "판매자"
                              : q.nickName || "알 수 없음"}
                          </span>
                          <span className="after">
                            {q.createdAt
                              ? formatDateTime(q.createdAt)
                              : "작성일 없음"}
                          </span>
                        </p>
                        <p className="text-16 color-333 text-nowrap mb-1rem">
                          {q.question}
                        </p>

                        {/* 질문 수정/삭제 버튼 */}
                        {user?.userId === q.userId && (
                          <div
                            style={{ display: "flex", gap: 8, marginBottom: 6 }}
                          >
                            <button
                              onClick={() => {
                                setEditingQuestionId(q.qnaId);
                                setEditingQuestion({
                                  title: q.title,
                                  question: q.question,
                                });
                              }}
                              className="article-btn"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleQuestionDelete(q.qnaId)}
                              className="article-btn"
                            >
                              삭제
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 답변 목록 */}
                    {q.answers && q.answers?.length > 0 && (
                      <div
                        style={{
                          marginTop: 8,
                          paddingLeft: 12,
                          borderLeft: "3px solid #b17576",
                        }}
                      >
                        {q.answers.map((a) => (
                          <div key={a.qnaReviewId} style={{ marginBottom: 8 }}>
                            {editingAnswerId === a.qnaReviewId ? (
                              <div>
                                <textarea
                                  value={editingAnswerContent}
                                  onChange={(e) =>
                                    setEditingAnswerContent(e.target.value)
                                  }
                                  className="article-textarea article-review"
                                />
                                <div
                                  style={{
                                    display: "flex",
                                    gap: 8,
                                    marginTop: 4,
                                  }}
                                >
                                  <button
                                    onClick={() =>
                                      saveEditingAnswer(a.qnaReviewId)
                                    }
                                    className="article-btn"
                                  >
                                    저장
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingAnswerId(null);
                                      setEditingAnswerContent("");
                                    }}
                                    className="article-btn"
                                  >
                                    취소
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                {/* 답변 내용 */}
                                <p
                                  className="text-16 color-333 mb-1rem"
                                  style={{ whiteSpace: "pre-wrap" }}
                                >
                                  {a.answer}
                                </p>

                                {/* 작성자 / 날짜 */}
                                <p
                                  style={{
                                    fontSize: "0.8rem",
                                    color: "#777",
                                    margin: 0,
                                  }}
                                >
                                  {a.role === "ADMIN" ? "관리자" : "판매자"} |{" "}
                                  {a.createdAt
                                    ? formatDateTime(a.createdAt)
                                    : ""}
                                </p>

                                {/* 수정/삭제 버튼 */}
                                {user &&
                                  (user.role === "ADMIN" ||
                                    user.userId === a.userId) && (
                                    <div
                                      style={{
                                        display: "flex",
                                        gap: 6,
                                        marginTop: 4,
                                      }}
                                    >
                                      <button
                                        onClick={() =>
                                          startEditingAnswer(
                                            a.qnaReviewId,
                                            a.answer
                                          )
                                        }
                                        className="article-btn"
                                      >
                                        수정
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleAnswerDelete(a.qnaReviewId)
                                        }
                                        className="article-btn"
                                      >
                                        삭제
                                      </button>
                                    </div>
                                  )}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 답변 입력 */}
                    {canAnswer() && (
                      <div
                        className="flex-column gap-8"
                        style={{ marginTop: 8 }}
                      >
                        <textarea
                          placeholder="답변 입력"
                          value={answers[q.qnaId] || ""}
                          onChange={(e) =>
                            setAnswers({
                              ...answers,
                              [q.qnaId]: e.target.value,
                            })
                          }
                          className="article-textarea article-review"
                        />
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                          }}
                        >
                          <button
                            onClick={() => handleAnswerSubmit(q.qnaId)}
                            className="article-btn"
                          >
                            답변 등록
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
