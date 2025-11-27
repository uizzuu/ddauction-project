import { useState, useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { queryRAG } from "../services/api";
import type { User, ChatMessage, RAGResponse } from "../types/types";
import { formatDateTime } from "../utils/util";

interface Props {
  user: User | null;
}

export default function RAGChat({ user }: Props) {
  const [query, setQuery] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ✅ user 사용 1: 로그인 필수
  if (!user) {
    return (
      <div className="container">
        <div className="flex-column gap-24">
          <h2>출결 규정 문의 챗봇 🤖</h2>
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              background: "#f8f9fa",
              borderRadius: "8px",
            }}
          >
            <p style={{ fontSize: "1.1rem", marginBottom: "16px" }}>
              로그인이 필요한 서비스입니다
            </p>
            <NavLink to="/login" className="article-btn">
              로그인하기
            </NavLink>
          </div>
        </div>
      </div>
    );
  }

  // 채팅 히스토리가 업데이트되면 스크롤
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

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

  return (
    <div className="container">
      <div className="flex-column gap-24">
        {/* ✅ user 사용 2: 헤더에 환영 메시지 */}
        <div className="flex-box flex-between">
          <div className="flex-column gap-4">
            <h2>출결 규정 문의 챗봇 🤖</h2>
            <p style={{ fontSize: "0.9rem", color: "#666" }}>
              {user.nickName}님, 환영합니다!
            </p>
          </div>
          {chatHistory.length > 0 && (
            <button onClick={handleClearHistory} className="edit-btn">
              대화 초기화
            </button>
          )}
        </div>

        {/* 안내 메시지 */}
        {chatHistory.length === 0 && (
          <div
            style={{
              padding: "20px",
              background: "#f8f9fa",
              borderRadius: "8px",
            }}
          >
            <p className="title-18">💡 사용 안내</p>
            <ul style={{ marginTop: "12px", paddingLeft: "20px" }}>
              <li>출결 규정에 관한 질문을 자유롭게 해보세요.</li>
              <li>예: "지각은 몇 분까지 인정되나요?"</li>
              <li>예: "결석 사유는 어떻게 제출하나요?"</li>
            </ul>
          </div>
        )}

        {/* 채팅 히스토리 */}
        <div className="flex-column gap-20">
          {chatHistory.map((chat) => (
            <div key={chat.id} className="flex-column gap-16">
              {/* 사용자 질문 */}
              <div
                className="flex-column gap-8"
                style={{
                  alignSelf: "flex-end",
                  maxWidth: "80%",
                  background: "#007bff",
                  color: "white",
                  padding: "12px 16px",
                  borderRadius: "12px 12px 0 12px",
                }}
              >
                <p style={{ fontWeight: 500 }}>{chat.query}</p>
                <span
                  style={{
                    fontSize: "0.85rem",
                    opacity: 0.8,
                    textAlign: "right",
                  }}
                >
                  {formatDateTime(chat.timestamp)}
                </span>
              </div>

              {/* AI 답변 */}
              <div
                className="flex-column gap-12"
                style={{
                  alignSelf: "flex-start",
                  maxWidth: "80%",
                  background: "#f1f3f5",
                  padding: "12px 16px",
                  borderRadius: "12px 12px 12px 0",
                }}
              >
                <div className="flex-box gap-8">
                  <strong style={{ color: "#28a745" }}>🤖 AI 답변</strong>
                </div>
                <p style={{ whiteSpace: "pre-wrap", lineHeight: "1.6" }}>
                  {chat.response.response}
                </p>

                {/* 참고 문서 */}
                {chat.response.documents.length > 0 && (
                  <details style={{ marginTop: "8px" }}>
                    <summary
                      style={{
                        cursor: "pointer",
                        color: "#666",
                        fontSize: "0.9rem",
                      }}
                    >
                      📚 참고 문서 ({chat.response.documents.length}개)
                    </summary>
                    <div className="flex-column gap-8 mt-10">
                      {chat.response.documents.map((doc, index) => (
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
                          <div style={{ marginBottom: "6px" }}>
                            <strong style={{ color: "#495057" }}>
                              📄 {doc.source}
                            </strong>
                          </div>
                          <p style={{ color: "#6c757d", lineHeight: "1.5" }}>
                            {doc.content.length > 200
                              ? `${doc.content.substring(0, 200)}...`
                              : doc.content}
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
              <p style={{ color: "#666" }}>답변 생성 중...</p>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

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

        {/* 질문 입력 폼 */}
        <div className="flex-column gap-12 top-line">
          <form onSubmit={handleSubmit} className="flex-column gap-12">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={3}
              placeholder="궁금한 점을 질문해주세요... (예: 지각 기준은 무엇인가요?)"
              className="article-textarea article-review"
              disabled={loading}
              style={{
                resize: "vertical",
                minHeight: "80px",
              }}
            />
            <div className="width-full flex-box flex-between">
              <p style={{ fontSize: "0.9rem", color: "#666" }}>
                💡 Tip: 구체적으로 질문할수록 정확한 답변을 받을 수 있습니다
              </p>
              <button
                type="submit"
                className="article-btn"
                disabled={loading || !query.trim()}
                style={{
                  minWidth: "120px",
                  opacity: loading || !query.trim() ? 0.6 : 1,
                }}
              >
                {loading ? "생성 중..." : "질문하기 🚀"}
              </button>
            </div>
          </form>
        </div>

        {/* 안내 문구 */}
        {chatHistory.length > 0 && (
          <p
            style={{
              fontSize: "0.85rem",
              color: "#868e96",
              textAlign: "center",
              marginTop: "20px",
            }}
          >
            ⓘ AI가 생성한 답변이므로 정확하지 않을 수 있습니다. 중요한 사항은
            공식 문서를 확인해주세요.
          </p>
        )}
      </div>
    </div>
  );
}