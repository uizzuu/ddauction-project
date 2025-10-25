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
      .catch(() => console.log("게시글 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container">로딩 중...</div>;

  return (
    <div className="container">
      <div className="flex-box between">
        <h2 className="page-title">게시판</h2>

        {user && (
          <button
            onClick={() => navigate("/articles/new")}
            className="article-btn"
          >
            글쓰기
          </button>
        )}
      </div>

      {articles.length === 0 ? (
        <p className="no-content-text">게시글이 없습니다.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #ccc" }}>
              <th style={{ textAlign: "left", padding: "0.5rem", width: "100%" }}>제목</th>
              <th style={{ padding: "0.5rem 2rem", whiteSpace: "noWrap" }}>작성자</th>
              <th style={{ padding: "0.5rem 2rem", whiteSpace: "noWrap" }}>작성일</th>
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
                <td style={{ padding: "0.5rem", width: "100%" }}>{article.title}</td>
                <td style={{ padding: "0.5rem 2rem", whiteSpace: "noWrap" }}>
                  {article.nickName}
                </td>
                <td
                  style={{
                    padding: "0.5rem 2rem",
                    color: "#888", 
                    whiteSpace: "noWrap"
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
