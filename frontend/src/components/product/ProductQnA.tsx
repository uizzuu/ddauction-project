import { useState, useEffect, useCallback } from "react";
import type { User, ProductQna, Product } from "../../common/types";
import { ROLE } from "../../common/enums";
import {
  getQnaList,
  createQna,
  updateQna,
  deleteQna,
  createQnaAnswer,
  updateQnaAnswer,
  deleteQnaAnswer,
} from "../../common/api";
import { formatDateTime } from "../../common/util";

type Props = {
  user: User | null;
  product: Product | null;
  productId: number;
  qnaList: ProductQna[];
  setQnaList: (list: ProductQna[]) => void;
};

export default function ProductQnA({
  user,
  product,
  productId,
  qnaList,
  setQnaList,
}: Props) {
  const [newQuestion, setNewQuestion] = useState({ title: "", content: "" });
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<{
    title: string;
    content: string;
  }>({ title: "", content: "" });
  const [editingAnswerId, setEditingAnswerId] = useState<number | null>(null);
  const [editingAnswerContent, setEditingAnswerContent] = useState("");
  const [openQnaIds, setOpenQnaIds] = useState<number[]>([]);

  const fetchQnaList = useCallback(async () => {
    try {
      const data = await getQnaList(productId);
      setQnaList(data);
    } catch (error) {
      console.error("QnA 목록 조회 실패:", error);
      setQnaList([]);
    }
  }, [productId, setQnaList]);

  useEffect(() => {
    if (productId) fetchQnaList();
  }, [productId, fetchQnaList]);

  // 질문 등록
  const handleCreateQuestion = async () => {
    if (!user) return alert("로그인 후 질문을 등록할 수 있습니다.");

    if (product && user.userId === product.sellerId) {
      return alert("본인 상품에는 질문을 작성할 수 없습니다.");
    }

    if (!newQuestion.title.trim()) return alert("질문 제목을 입력해주세요.");
    if (!newQuestion.content.trim()) return alert("질문 내용을 입력해주세요.");

    try {
      await createQna({
        refId: productId,
        productType: product?.productType || "AUCTION",
        title: newQuestion.title,
        content: newQuestion.content,
      });
      setNewQuestion({ title: "", content: "" });
      fetchQnaList();
      alert("질문이 등록되었습니다.");
    } catch (error) {
      console.error("질문 등록 오류:", error);
      alert(error instanceof Error ? error.message : "질문 등록 중 오류 발생");
    }
  };

  // 질문 삭제
  const handleQuestionDelete = async (qnaId: number) => {
    if (!window.confirm("질문을 삭제하시겠습니까?")) return;
    try {
      await deleteQna(qnaId);
      fetchQnaList();
      alert("질문이 삭제되었습니다.");
    } catch (error) {
      console.error("질문 삭제 오류:", error);
      alert(error instanceof Error ? error.message : "질문 삭제 실패");
    }
  };

  // 질문 수정 저장
  const saveEditingQuestion = async (qnaId: number) => {
    if (!editingQuestion.title.trim() || !editingQuestion.content.trim())
      return alert("제목과 내용을 모두 입력해주세요.");
    try {
      await updateQna(qnaId, editingQuestion);
      setEditingQuestionId(null);
      setEditingQuestion({ title: "", content: "" });
      fetchQnaList();
      alert("질문이 수정되었습니다.");
    } catch (error) {
      console.error("질문 수정 오류:", error);
      alert(error instanceof Error ? error.message : "질문 수정 실패");
    }
  };

  // 토글 버튼
  const toggleQna = (qnaId: number) => {
    setOpenQnaIds((prev) =>
      prev.includes(qnaId) ? prev.filter((id) => id !== qnaId) : [...prev, qnaId]
    );
  };

  // 답변 권한 확인 함수
  const canAnswer = () => {
    if (!user || !product) return false;
    return user.role === ROLE[0] || user.userId === product.sellerId;
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
      await updateQnaAnswer(answerId, editingAnswerContent);
      setEditingAnswerId(null);
      setEditingAnswerContent("");
      fetchQnaList();
      alert("답변이 수정되었습니다.");
    } catch (error) {
      console.error("답변 수정 오류:", error);
      alert(error instanceof Error ? error.message : "답변 수정 실패");
    }
  };

  // 답변 삭제
  const handleAnswerDelete = async (answerId: number) => {
    if (!window.confirm("답변을 삭제하시겠습니까?")) return;
    try {
      await deleteQnaAnswer(answerId);
      fetchQnaList();
      alert("답변이 삭제되었습니다.");
    } catch (error) {
      console.error("답변 삭제 오류:", error);
      alert(error instanceof Error ? error.message : "답변 삭제 실패");
    }
  };

  // 답변 등록
  const handleAnswerSubmit = async (qnaId: number) => {
    const answer = answers[qnaId];
    if (!answer?.trim()) return alert("답변 내용을 입력해주세요.");
    try {
      await createQnaAnswer(qnaId, answer);
      setAnswers((prev) => ({ ...prev, [qnaId]: "" }));
      fetchQnaList();
      alert("답변이 등록되었습니다.");
    } catch (error) {
      console.error("답변 등록 오류:", error);
      alert(error instanceof Error ? error.message : "답변 등록 중 오류 발생");
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
              value={newQuestion.content}
              onChange={(e) =>
                setNewQuestion({ ...newQuestion, content: e.target.value })
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
              <div key={q.productQnaId}>
                {/* 질문 제목 + 토글 버튼 */}
                {index !== 0 && <div className="top-line mb-10"></div>}
                <div className="flex-box flex-center flex-between width-full">
                  <p className="title-16 color-333 text-nowrap width-full">
                    {q.title}
                  </p>
                  <button
                    onClick={() => toggleQna(q.productQnaId)}
                    className="top-16 right-8 trans"
                  >
                    <span
                      className={`custom-select-arrow ${
                        openQnaIds.includes(q.productQnaId) ? "open" : ""
                      }`}
                    />
                  </button>
                </div>

                {/* 토글 열렸을 때 전체 내용 */}
                {openQnaIds.includes(q.productQnaId) && (
                  <div className="flex-column gap-4" style={{ marginTop: 8 }}>
                    {/* 질문 수정 모드 */}
                    {editingQuestionId === q.productQnaId ? (
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
                          value={editingQuestion.content}
                          onChange={(e) =>
                            setEditingQuestion({
                              ...editingQuestion,
                              content: e.target.value,
                            })
                          }
                          className="article-textarea article-review"
                        />
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => saveEditingQuestion(q.productQnaId)}
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
                        <p className="text-16 color-333 mb-1rem" style={{ whiteSpace: "pre-wrap" }}>
                          {q.content}
                        </p>

                        {/* 질문 수정/삭제 버튼 */}
                        {user?.userId === q.userId && (
                          <div
                            style={{ display: "flex", gap: 8, marginBottom: 6 }}
                          >
                            <button
                              onClick={() => {
                                setEditingQuestionId(q.productQnaId);
                                setEditingQuestion({
                                  title: q.title,
                                  content: q.content,
                                });
                              }}
                              className="article-btn"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleQuestionDelete(q.productQnaId)}
                              className="article-btn"
                            >
                              삭제
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 답변 목록 */}
                    {q.answers && q.answers.length > 0 && (
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
                                  {a.content}
                                </p>

                                {/* 작성자 / 날짜 */}
                                <p
                                  style={{
                                    fontSize: "0.8rem",
                                    color: "#777",
                                    margin: 0,
                                  }}
                                >
                                  {product && a.qnaUserId === product.sellerId
                                    ? "판매자"
                                    : "관리자"}{" "}
                                  |{" "}
                                  {a.createdAt ? formatDateTime(a.createdAt) : ""}
                                </p>

                                {/* 수정/삭제 버튼 */}
                                {user &&
                                  (user.role === "ADMIN" ||
                                    user.userId === a.qnaUserId) && (
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
                                            a.content
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
                          value={answers[q.productQnaId] || ""}
                          onChange={(e) =>
                            setAnswers({
                              ...answers,
                              [q.productQnaId]: e.target.value,
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
                            onClick={() => handleAnswerSubmit(q.productQnaId)}
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