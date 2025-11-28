import { useState, useRef, useEffect } from "react";
import { queryRAG } from "../../common/api";
import type { ChatMessage, RAGResponse } from "../../common/types";
import { formatDateTime } from "../../common/util";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function RAGChatModal({ isOpen, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 모달이 열릴 때마다 스크롤
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, isOpen]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

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

  if (!isOpen) return null;

  return (
    <>
      {/* 모달 오버레이 */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 999,
        }}
        onClick={onClose}
      />

      {/* 모달 컨테이너 */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "90%",
          maxWidth: "800px",
          height: "85vh",
          maxHeight: "700px",
          backgroundColor: "white",
          borderRadius: "12px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #e9ecef",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#f8f9fa",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: "1.3rem" }}>
              땅땅옥션 문의 챗봇 🤖
            </h2>
            <p
              style={{ margin: "4px 0 0 0", fontSize: "0.9rem", color: "#666" }}
            >
              무엇이든 물어보세요!
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            {chatHistory.length > 0 && (
              <button
                onClick={handleClearHistory}
                style={{
                  padding: "6px 12px",
                  fontSize: "0.9rem",
                  border: "1px solid #dee2e6",
                  borderRadius: "6px",
                  background: "white",
                  cursor: "pointer",
                }}
              >
                초기화
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                padding: "6px 12px",
                fontSize: "1.2rem",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* 채팅 영역 */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {/* 안내 메시지 */}
          {chatHistory.length === 0 && (
            <div
              style={{
                padding: "20px",
                background: "#f8f9fa",
                borderRadius: "8px",
              }}
            >
              <p
                style={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  marginBottom: "12px",
                }}
              >
                💡 사용 안내
              </p>
              <ul style={{ margin: 0, paddingLeft: "20px", lineHeight: "1.8" }}>
                <li>땅땅옥션 이용 방법에 관한 질문을 자유롭게 해보세요.</li>
                <li>예: "경매는 어떻게 진행되나요?"</li>
                <li>예: "중고거래 시 주의사항이 있나요?"</li>
                <li>예: "일반판매와 경매의 차이는 무엇인가요?"</li>
              </ul>
            </div>
          )}

          {/* 채팅 히스토리 */}
          {chatHistory.map((chat) => (
            <div
              key={chat.id}
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {/* 사용자 질문 */}
              <div
                style={{
                  alignSelf: "flex-end",
                  maxWidth: "75%",
                  background: "#007bff",
                  color: "white",
                  padding: "12px 16px",
                  borderRadius: "12px 12px 0 12px",
                }}
              >
                <p style={{ margin: 0, fontWeight: 500 }}>{chat.query}</p>
                <span
                  style={{
                    fontSize: "0.8rem",
                    opacity: 0.8,
                    display: "block",
                    textAlign: "right",
                    marginTop: "6px",
                  }}
                >
                  {formatDateTime(chat.timestamp)}
                </span>
              </div>

              {/* AI 답변 */}
              <div
                style={{
                  alignSelf: "flex-start",
                  maxWidth: "75%",
                  background: "#f1f3f5",
                  padding: "12px 16px",
                  borderRadius: "12px 12px 12px 0",
                }}
              >
                <strong
                  style={{
                    color: "#28a745",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  🤖 AI 답변
                </strong>
                <p
                  style={{
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    lineHeight: "1.6",
                  }}
                >
                  {chat.response.response}
                </p>

                {/* 참고 문서 */}
                {chat.response.sources.length > 0 && (
                  <details style={{ marginTop: "12px" }}>
                    <summary
                      style={{
                        cursor: "pointer",
                        color: "#666",
                        fontSize: "0.9rem",
                      }}
                    >
                      📚 참고 문서 ({chat.response.sources.length}개)
                    </summary>
                    <div
                      style={{
                        marginTop: "10px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      {chat.response.sources.map((doc, index) => (
                        <div
                          key={index}
                          style={{
                            padding: "10px",
                            background: "white",
                            borderRadius: "6px",
                            border: "1px solid #dee2e6",
                            fontSize: "0.85rem",
                          }}
                        >
                          <strong
                            style={{
                              color: "#495057",
                              display: "block",
                              marginBottom: "6px",
                            }}
                          >
                            📄 {doc.filename}
                          </strong>
                          <p
                            style={{
                              margin: 0,
                              color: "#6c757d",
                              lineHeight: "1.5",
                            }}
                          >
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
            <div
              style={{
                alignSelf: "flex-start",
                padding: "12px 16px",
                background: "#f1f3f5",
                borderRadius: "12px",
              }}
            >
              <p style={{ margin: 0, color: "#666" }}>답변 생성 중...</p>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div
              style={{
                padding: "12px",
                background: "#ffe6e6",
                color: "#c92a2a",
                borderRadius: "8px",
                border: "1px solid #ffc9c9",
              }}
            >
              ⚠️ {error}
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* 입력 폼 */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #e9ecef",
            backgroundColor: "#f8f9fa",
          }}
        >
          <form onSubmit={handleSubmit}>
            <div style={{ display: "flex", gap: "8px" }}>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="궁금한 점을 질문해주세요..."
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "12px",
                  border: "1px solid #dee2e6",
                  borderRadius: "8px",
                  resize: "none",
                  fontSize: "0.95rem",
                  minHeight: "60px",
                  fontFamily: "inherit",
                }}
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
                style={{
                  padding: "12px 24px",
                  border: "none",
                  borderRadius: "8px",
                  background: loading || !query.trim() ? "#dee2e6" : "#007bff",
                  color: "white",
                  cursor: loading || !query.trim() ? "not-allowed" : "pointer",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                {loading ? "전송 중..." : "전송 🚀"}
              </button>
            </div>
            <p
              style={{
                margin: "8px 0 0 0",
                fontSize: "0.85rem",
                color: "#868e96",
              }}
            >
              💡 Enter로 전송, Shift+Enter로 줄바꿈
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
