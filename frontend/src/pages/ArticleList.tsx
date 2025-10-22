import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getArticles } from "../services/api";
import type { ArticleDto, User } from "../types/types";

interface Props {
  user: User | null;
}

export default function ArticleList({ user }: Props) {
  const [articles, setArticles] = useState<ArticleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getArticles()
      .then(setArticles)
      .catch(() => alert("게시글 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>로딩 중...</div>;

  return (
    <div className="container">
      <h2 className="page-title">게시판</h2>

      {user && (
        <button
          onClick={() => navigate("/articles/new")}
          style={{ marginBottom: "1rem" }}
        >
          글쓰기
        </button>
      )}

      {articles.length === 0 ? (
        <p className="no-content-text">게시글이 없습니다.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #ccc" }}>
              <th style={{ textAlign: "left", padding: "0.5rem" }}>제목</th>
              <th style={{ padding: "0.5rem" }}>작성자</th>
              <th style={{ padding: "0.5rem" }}>작성일</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article) => (
              <tr
                key={article.articleId}
                style={{
                  borderBottom: "1px solid #eee",
                  cursor: "pointer",
                }}
                onClick={() => navigate(`/articles/${article.articleId}`)}
              >
                <td style={{ padding: "0.5rem" }}>{article.title}</td>
                <td style={{ padding: "0.5rem", textAlign: "center" }}>
                  {article.nickName}
                </td>
                <td
                  style={{
                    padding: "0.5rem",
                    textAlign: "center",
                    color: "#888",
                  }}
                >
                  {new Date(article.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
