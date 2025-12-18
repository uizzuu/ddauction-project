import { useState, useEffect, useCallback } from "react";
import CheckboxStyle from "../ui/CheckboxStyle";
import type { User, ProductQna, Product } from "../../common/types";
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
import { ROLE } from "../../common/enums";

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
  const [isSecretQuestion, setIsSecretQuestion] = useState(false);
  const [editingQuestionIsSecret, setEditingQuestionIsSecret] = useState(false);

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
        isSecret: isSecretQuestion,
      });
      setNewQuestion({ title: "", content: "" });
      setIsSecretQuestion(false);
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
      await updateQna(qnaId, {
        ...editingQuestion,
        isSecret: editingQuestionIsSecret
      });
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
    setOpenQnaIds((prev) => {
      const isOpen = prev.includes(qnaId);
      if (!isOpen) {
        // 열릴 때 스크롤 이동 (DOM 렌더링 후 실행)
        setTimeout(() => {
          const el = document.getElementById(`qna-${qnaId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
        return [...prev, qnaId];
      } else {
        return prev.filter((id) => id !== qnaId);
      }
    });
  };

  // 답변 권한 확인 함수
  const canAnswer = () => {
    if (!user || !product) return false;
    return user.role === ROLE.ADMIN || user.userId === product.sellerId;
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
    <div className="mt-10">
      <h3 className="text-xl font-bold text-[#111] mb-4">상품 Q&A</h3>
      <div className="bg-white border border-[#ddd] rounded-lg p-6 shadow-sm">
        {/* 질문 작성 */}
        {user && (
          <div className="flex flex-col gap-3 mb-8 pb-8 border-b border-gray-100">
            <h4 className="text-sm font-bold text-[#333]">질문 작성</h4>
            <input
              type="text"
              placeholder="질문 제목"
              value={newQuestion.title}
              onChange={(e) =>
                setNewQuestion({ ...newQuestion, title: e.target.value })
              }
              className="w-full px-4 py-3 border border-[#ddd] rounded-lg focus:outline-none focus:border-[#111] text-sm"
            />
            <textarea
              placeholder="질문 내용"
              value={newQuestion.content}
              onChange={(e) =>
                setNewQuestion({ ...newQuestion, content: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-3 border border-[#ddd] rounded-lg focus:outline-none focus:border-[#111] text-sm resize-none"
            />
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CheckboxStyle
                  checked={isSecretQuestion}
                  onChange={(checked) => setIsSecretQuestion(checked)}
                  label="비밀글"
                />
              </div>
              <button
                onClick={handleCreateQuestion}
                className="px-6 py-2.5 bg-[#111] text-white rounded-lg font-bold text-sm hover:bg-[#333] transition-colors shadow-sm"
              >
                질문 등록
              </button>
            </div>
          </div>
        )}

        {/* 질문 목록 */}
        <div className="flex flex-col gap-2 mt-[10px] mb-[10px]">
          {qnaList.length === 0 ? (
            <p style={{ color: "#888" }}>아직 등록된 질문이 없습니다.</p>
          ) : (
            qnaList.map((q, index) => {
              const isSecret = q.isSecret;
              // 비밀글 조회 권한: 작성자 본인, 판매자, 관리자
              const canViewSecret =
                !isSecret ||
                (user && (user.userId === q.userId || user.userId === product?.sellerId || user.role === 'ADMIN'));

              return (
                <div
                  key={q.productQnaId}
                  id={`qna-${q.productQnaId}`}
                  className="scroll-mt-32 transition-all duration-300"
                >
                  {/* 질문 제목 + 토글 버튼 */}
                  {index !== 0 && <div className="top-line mb-[10px]"></div>}
                  <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-2 w-full cursor-pointer py-2" onClick={() => {
                      if (canViewSecret) {
                        toggleQna(q.productQnaId);
                      } else {
                        alert("비밀글입니다.");
                      }
                    }}>
                      {isSecret && <span className="text-xs text-gray-500 border border-gray-300 rounded px-1.5 py-0.5 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        비밀</span>}
                      <p className={`text-base ${canViewSecret ? 'text-[#333]' : 'text-gray-400'} font-medium`}>
                        {canViewSecret ? q.title : "비밀글입니다."}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (canViewSecret) {
                          toggleQna(q.productQnaId);
                        } else {
                          alert("비밀글입니다.");
                        }
                      }}
                      className="text-gray-400 hover:text-[#111] transition-colors p-2"
                    >
                      <span
                        className={`custom-select-arrow ${openQnaIds.includes(q.productQnaId) ? "open" : ""
                          }`}
                      />
                    </button>
                  </div>

                  {/* 토글 열렸을 때 전체 내용 */}
                  {openQnaIds.includes(q.productQnaId) && canViewSecret && (
                    <div className="flex flex-col gap-1" style={{ marginTop: 8 }}>
                      {/* 질문 수정 모드 */}
                      {editingQuestionId === q.productQnaId ? (
                        <div className="flex flex-col gap-2">
                          <input
                            type="text"
                            value={editingQuestion.title}
                            onChange={(e) =>
                              setEditingQuestion({
                                ...editingQuestion,
                                title: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 border border-[#ddd] rounded-lg focus:outline-none focus:border-[#111] text-sm mb-2"
                          />
                          <textarea
                            value={editingQuestion.content}
                            onChange={(e) =>
                              setEditingQuestion({
                                ...editingQuestion,
                                content: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 border border-[#ddd] rounded-lg focus:outline-none focus:border-[#111] text-sm resize-none"
                          />
                          <div className="mt-2 flex items-center gap-2">
                            <CheckboxStyle
                              checked={editingQuestionIsSecret}
                              onChange={(checked) => setEditingQuestionIsSecret(checked)}
                              label="비밀글"
                            />
                          </div>
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => saveEditingQuestion(q.productQnaId)}
                              className="px-4 py-1.5 text-xs bg-[#111] text-white rounded hover:bg-[#333] transition-colors"
                            >
                              저장
                            </button>
                            <button
                              onClick={() => setEditingQuestionId(null)}
                              className="px-4 py-1.5 text-xs border border-[#ddd] rounded text-[#666] hover:bg-gray-50 transition-colors"
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3 py-4 bg-gray-50 rounded-lg px-4">
                          <div className="flex items-center gap-2 text-sm text-gray-500 border-b border-gray-200 pb-2">
                            <span className="font-bold text-[#333]">
                              {q.userId === product?.sellerId
                                ? "판매자"
                                : (isSecret && !canViewSecret) ? "익명" : (q.nickName || "익명")}
                            </span>
                            <span>|</span>
                            <span>
                              {q.createdAt ? formatDateTime(q.createdAt) : "작성일 없음"}
                            </span>
                          </div>
                          <p className="text-sm text-[#333] leading-relaxed whitespace-pre-wrap">
                            {q.content}
                          </p>

                          {/* 질문 수정/삭제 버튼 */}
                          {user?.userId === q.userId && (
                            <div className="flex gap-2 border-t border-gray-200 pt-3 mt-2">
                              <button
                                onClick={() => {
                                  setEditingQuestionId(q.productQnaId);
                                  setEditingQuestion({
                                    title: q.title,
                                    content: q.content,
                                  });
                                  setEditingQuestionIsSecret(q.isSecret);
                                }}
                                className="text-xs px-3 py-1 border border-[#ddd] rounded text-[#666] hover:bg-gray-50 transition-colors"
                              >
                                수정
                              </button>
                              <button
                                onClick={() => handleQuestionDelete(q.productQnaId)}
                                className="text-xs px-3 py-1 border border-red-200 rounded text-red-500 hover:bg-red-50 transition-colors"
                              >
                                삭제
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 답변 목록 */}
                      {q.answers && q.answers.length > 0 && (
                        <div className="mt-4 pl-4 border-l-2 border-gray-200 space-y-4">
                          {q.answers.map((a) => (
                            <div key={a.qnaReviewId} style={{ marginBottom: 8 }}>
                              {editingAnswerId === a.qnaReviewId ? (
                                <div>
                                  <textarea
                                    value={editingAnswerContent}
                                    onChange={(e) =>
                                      setEditingAnswerContent(e.target.value)
                                    }
                                    className="w-full px-4 py-2 border border-[#ddd] rounded-lg focus:outline-none focus:border-[#111] text-sm resize-none"
                                  />
                                  <div className="flex gap-2 mt-2">
                                    <button
                                      onClick={() =>
                                        saveEditingAnswer(a.qnaReviewId)
                                      }
                                      className="px-3 py-1 text-xs bg-[#111] text-white rounded hover:bg-[#333]"
                                    >
                                      저장
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingAnswerId(null);
                                        setEditingAnswerContent("");
                                      }}
                                      className="px-3 py-1 text-xs border border-[#ddd] rounded text-[#666] hover:bg-gray-50"
                                    >
                                      취소
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  {/* 답변 내용 */}
                                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                                      <span className="font-bold text-[#111]">
                                        {product && a.qnaUserId === product.sellerId
                                          ? "판매자"
                                          : "관리자"}
                                      </span>
                                      <span>|</span>
                                      <span>{a.createdAt ? formatDateTime(a.createdAt) : ""}</span>
                                    </div>
                                    <p className="text-sm text-[#333] leading-relaxed whitespace-pre-wrap">
                                      {a.content}
                                    </p>

                                    {/* 수정/삭제 버튼 */}
                                    {user &&
                                      (user.role === ROLE.ADMIN ||
                                        user.userId === a.qnaUserId) && (
                                        <div className="flex gap-2 mt-3 justify-end">
                                          <button
                                            onClick={() =>
                                              startEditingAnswer(
                                                a.qnaReviewId,
                                                a.content
                                              )
                                            }
                                            className="text-xs text-gray-500 hover:text-[#111] underline"
                                          >
                                            수정
                                          </button>
                                          <button
                                            onClick={() =>
                                              handleAnswerDelete(a.qnaReviewId)
                                            }
                                            className="text-xs text-red-400 hover:text-red-600 underline"
                                          >
                                            삭제
                                          </button>
                                        </div>
                                      )}
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 답변 입력 */}
                      {canAnswer() && (
                        <div
                          className="flex flex-col gap-2"
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
                            rows={3}
                            className="w-full px-4 py-3 border border-[#ddd] rounded-lg focus:outline-none focus:border-[#111] text-sm resize-none"
                          />
                          <div className="flex justify-end mt-2">
                            <button
                              onClick={() => handleAnswerSubmit(q.productQnaId)}
                              className="px-4 py-2 bg-[#111] text-white rounded-lg font-bold text-xs hover:bg-[#333] transition-colors shadow-sm"
                            >
                              답변 등록
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}