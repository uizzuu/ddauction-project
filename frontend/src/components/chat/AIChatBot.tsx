import { useState, useRef, useEffect } from "react";
import { queryRAG } from "../../common/api";
import type { ChatMessage, RAGResponse } from "../../common/types";
import { formatDateTime } from "../../common/util";


interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIChatBot({ isOpen, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false); // Added state
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    if (chatHistory.length > 0 || query.trim().length > 0) {
      setShowCloseConfirm(true); // Open custom modal
    } else {
      triggerCloseAnimation();
    }
  };

  const triggerCloseAnimation = () => {
    setIsClosing(true);
  };

  // 애니메이션 종료 후 실제 onClose 호출
  useEffect(() => {
    if (isClosing) {
      const timer = setTimeout(() => {
        setIsClosing(false);
        onClose();
      }, 380); // 애니메이션 시간(0.4s)보다 약간 짧게 잡아 깜빡임 방지
      return () => clearTimeout(timer);
    }
  }, [isClosing, onClose]);

  // 모달이 열릴 때마다 스크롤
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, isOpen]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !showCloseConfirm) { // Prevent close if confirm is open
        handleClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, chatHistory, showCloseConfirm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      alert("질문을 입력해주세요.");
      return;
    }

    setLoading(true);
    setError(null);

    const userQuery = query;
    setQuery("");

    try {
      const response: RAGResponse = await queryRAG(userQuery);

      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        query: userQuery,
        response,
        timestamp: new Date().toISOString(),
      };

      setChatHistory((prev) => [...prev, newMessage]);
    } catch (err) {
      console.error("RAG 질의 에러:", err);
      setError(
        err instanceof Error ? err.message : "답변 생성 중 오류가 발생했습니다."
      );
      setQuery(userQuery);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("채팅 기록을 모두 삭제하시겠습니까?")) {
      setChatHistory([]);
    }
  };

  const [isAlertClosing, setIsAlertClosing] = useState(false); // Alert closing state

  const handleAlertCancel = () => {
    setIsAlertClosing(true);
    setTimeout(() => {
      setIsAlertClosing(false);
      setShowCloseConfirm(false);
    }, 300); // Match animation duration
  };

  if (!isOpen && !isClosing) return null;

  return (
    <>
      <div
        className="fixed bottom-6 right-6 z-[1000] w-[400px] h-[650px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden origin-bottom-right"
        style={{
          animation: isClosing
            ? 'collapseChatPanel 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
            : 'expandChatPanel 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        }}
      >
        {/* 헤더 */}
        <div className="px-6 py-5 border-b border-[#e9ecef] flex justify-between items-center bg-[#f8f9fa]">
          <div>
            <h2 className="m-0 text-[1.3rem] font-semibold">
              땅땅옥션 문의 챗봇 🤖
            </h2>
            <p className="mt-1 text-[0.9rem] text-[#666]">
              무엇이든 물어보세요!
            </p>
          </div>
          <div className="flex gap-2 items-center">
            {chatHistory.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="px-3 py-1.5 text-sm border border-[#dee2e6] rounded-md bg-white hover:bg-gray-50 transition-colors"
              >
                초기화
              </button>
            )}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-[#888] hover:text-[#333] hover:shadow-xl hover:scale-110 transition-all duration-300"
              aria-label="챗봇 닫기"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* 채팅 영역 */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {/* 안내 메시지 */}
          {chatHistory.length === 0 && (
            <div className="p-5 bg-[#f8f9fa] rounded-[12px]">
              <p className="text-base font-semibold mb-3">
                사용 안내
              </p>
              <ul className="m-0 leading-[1.8]">
                <li>땅땅옥션 이용 방법에 관한 질문을 자유롭게 해보세요.</li>
                <li>(ex) 경매는 어떻게 진행되나요?</li>
                <li>(ex) 중고거래 시 주의사항이 있나요?</li>
                <li>(ex) 일반판매와 경매의 차이는 무엇인가요?</li>
              </ul>
            </div>
          )}

          {/* 채팅 히스토리 */}
          {chatHistory.map((chat) => (
            <div
              key={chat.id}
              className="flex flex-col gap-3"
            >
              {/* 사용자 질문 */}
              <div className="self-end max-w-[75%] bg-[#007bff] text-white px-4 py-3 rounded-[12px_12px_0_12px]">
                <p className="m-0 font-medium">{chat.query}</p>
                <span className="text-[0.8rem] opacity-80 block text-right mt-1.5">
                  {formatDateTime(chat.timestamp)}
                </span>
              </div>

              {/* AI 답변 */}
              <div className="self-start max-w-[75%] bg-[#f1f3f5] px-4 py-3 rounded-[12px_12px_12px_0]">
                <strong className="text-[#28a745] block mb-2">
                  🤖 AI 답변
                </strong>
                <p className="m-0 whitespace-pre-wrap leading-relaxed">
                  {chat.response.response}
                </p>

                {/* 참고 문서 */}
                {chat.response.sources.length > 0 && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-[#666] text-[0.9rem]">
                      📚 참고 문서 ({chat.response.sources.length}개)
                    </summary>
                    <div className="mt-2.5 flex flex-col gap-2">
                      {chat.response.sources.map((doc, index) => (
                        <div
                          key={index}
                          className="p-2.5 bg-white rounded-md border border-[#dee2e6] text-[0.85rem]"
                        >
                          <strong className="text-[#495057] block mb-1.5">
                            📄 {doc.filename}
                          </strong>
                          <p className="m-0 text-[#6c757d] leading-normal">
                            {doc.content_snippet.length > 200
                              ? `${doc.content_snippet.substring(0, 200)}...`
                              : doc.content_snippet}
                          </p>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </div>
          ))}

          {/* 로딩 인디케이터 */}
          {loading && (
            <div className="self-start px-4 py-3 bg-[#f1f3f5] rounded-xl">
              <p className="m-0 text-[#666]">답변 생성 중...</p>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="p-3 bg-[#ffe6e6] text-[#c92a2a] rounded-lg border border-[#ffc9c9]">
              ⚠️ {error}
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* 입력 폼 */}
        <div className="px-6 py-4 border-t border-[#e9ecef] relative">
          <form onSubmit={handleSubmit}>
            <div className="flex gap-2">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="궁금한 점을 질문해주세요..."
                disabled={loading}
                className="flex-1 p-3 border border-[#dee2e6] rounded-lg resize-none text-[0.95rem] min-h-[60px] font-[inherit]"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className={`px-6 py-3 border-none rounded-lg text-white text-[0.95rem] font-semibold whitespace-nowrap cursor-pointer transition-colors ${loading || !query.trim() ? "bg-[#aaa] cursor-not-allowed" : "bg-[#666]"
                  }`}
              >
                {loading ? "전송 중..." : "전송"}
              </button>
            </div>
            <p className="mt-2 text-[0.85rem] text-[#aaa]">
              💡 Enter로 전송, Shift+Enter로 줄바꿈
            </p>
          </form>
        </div>

        {/* Custom Internal Alert Modal */}
        {(showCloseConfirm || isAlertClosing) && (
          <div className={`absolute inset-0 z-[2000] flex items-center justify-center bg-black/40 backdrop-blur-none rounded-2xl ${isAlertClosing ? "animate-fade-out-down" : "animate-fade-in-up"}`}>
            <div className="bg-white w-[270px] rounded-[14px] overflow-hidden shadow-2xl text-center">
              {/* Title & Message */}
              <div className="pt-5 pb-4 px-4">
                <h3 className="text-[17px] font-semibold text-black mb-1">대화 종료</h3>
                <p className="text-[13px] text-gray-800 leading-tight">
                  창을 닫으면 대화 내용이<br />저장되지 않습니다.<br />정말 닫으시겠습니까?
                </p>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-300 flex">
                {/* Cancel Button */}
                <button
                  onClick={handleAlertCancel}
                  className="flex-1 py-3 text-[17px] text-[#007aff] font-normal hover:bg-gray-50 active:bg-gray-100 transition-colors border-r border-gray-300"
                >
                  취소
                </button>

                {/* Confirm Button */}
                <button
                  onClick={triggerCloseAnimation}
                  className="flex-1 py-3 text-[17px] text-[#ff3b30] font-semibold hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  종료
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
