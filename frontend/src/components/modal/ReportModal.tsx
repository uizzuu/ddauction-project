// src/pages/UserQnaForm.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { submitUserQna } from "../../common/api";

export default function UserQnaForm() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !content.trim()) {
      setError("제목과 내용을 입력하세요.");
      return;
    }

    setLoading(true);
    try {
      await submitUserQna(title, content);
      alert("1:1 문의가 등록되었습니다.");
      navigate("/mypage/qna");
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h1>1:1 문의 작성</h1>
      {error && <p style={{ color: "red", marginBottom: "10px" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "10px" }}>
          <label htmlFor="qna-title">제목:</label>
          <input
            id="qna-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
            required
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label htmlFor="qna-content">내용:</label>
          <textarea
            id="qna-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "등록 중..." : "등록"}
        </button>
      </form>
    </div>
  );
}
