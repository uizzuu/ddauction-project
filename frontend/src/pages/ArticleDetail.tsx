import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getArticleById, deleteArticle } from "../services/api"; // API 호출 함수
import type { ArticleDto, User } from "../types/types";

interface Props {
  user: User | null;
}

export default function ArticleDetail({ user }: Props) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState<ArticleDto | null>(null);

  useEffect(() => {
    if (id) {
      getArticleById(Number(id))
        .then(setArticle)
        .catch(() => alert("게시글을 불러오지 못했습니다."));
    }
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      await deleteArticle(Number(id));
      alert("삭제되었습니다.");
      navigate("/board"); // 게시판 목록 경로에 맞게 수정
    } catch (err) {
      alert("삭제 실패");
    }
  };

  if (!article) return <div>로딩 중...</div>;

  return (
    <div className="article-container">
      <h2>{article.title}</h2>
      <p>작성자: {article.nickName}</p>
      <p style={{ color: "#888" }}>
        {new Date(article.createdAt).toLocaleString()}
      </p>
      <div
        style={{ marginTop: "1.5rem" }}
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      {/* 수정/삭제 버튼 - 작성자일 때만 표시 */}
      {user?.userId === article.userId && (
        <div style={{ marginTop: "2rem" }}>
          <button onClick={() => navigate(`/articles/${article.articleId}/edit`)}>
            수정
          </button>
          <button onClick={handleDelete} style={{ marginLeft: "1rem", color: "red" }}>
            삭제
          </button>
        </div>
      )}
    </div>
  );
}
