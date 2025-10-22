import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getArticleById,
  deleteArticle,
  getCommentsByArticleId,
  createComment,
} from "../services/api";
import type { ArticleDto, User, CommentDto, CommentForm } from "../types/types";

interface Props {
  user: User | null;
}

export default function ArticleDetail({ user }: Props) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [article, setArticle] = useState<ArticleDto | null>(null);
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [commentContent, setCommentContent] = useState("");

  // 게시글 조회
  useEffect(() => {
    if (!id) return;
    getArticleById(Number(id))
      .then(setArticle)
      .catch(() => alert("게시글을 불러오지 못했습니다."));
  }, [id]);

  // 댓글 목록 조회
  useEffect(() => {
    if (!id) return;
    getCommentsByArticleId(Number(id))
      .then(setComments)
      .catch(() => alert("댓글을 불러오지 못했습니다."));
  }, [id]);

  // 댓글 작성
  const handleCommentSubmit = async () => {
    if (!id || !user) return;

    if (!commentContent.trim()) {
      alert("댓글 내용을 입력해주세요.");
      return;
    }

    const form: CommentForm = {
      content: commentContent,
      userId: user.userId,
    };

    try {
      await createComment(Number(id), form);
      setCommentContent("");
      const updated = await getCommentsByArticleId(Number(id));
      setComments(updated);
    } catch {
      alert("댓글 등록에 실패했습니다.");
    }
  };

  // 게시글 삭제
  const handleDelete = async () => {
    if (!id) return;
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      await deleteArticle(Number(id));
      alert("삭제되었습니다.");
      navigate("/board");
    } catch {
      alert("삭제 실패");
    }
  };

  if (!article) return <div>로딩 중...</div>;

  return (
    <div style={{ padding: "2rem" }}>
      <h2>{article.title}</h2>
      <p>작성자: {article.nickName}</p>
      <p style={{ color: "#888" }}>{new Date(article.createdAt).toLocaleString()}</p>

      <div
        style={{ marginTop: "1.5rem" }}
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      {/* 수정/삭제 버튼 */}
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

      {/* 댓글 영역 */}
      <div style={{ marginTop: "3rem" }}>
        <h3>댓글</h3>

        {comments.length === 0 && <p>댓글이 없습니다.</p>}

        <ul>
          {comments.map((comment) => (
            <li key={comment.commentId} style={{ marginBottom: "1rem" }}>
              <strong>{comment.nickName}</strong>{" "}
              <span style={{ color: "#888", fontSize: "0.9rem" }}>
                {new Date(comment.createdAt).toLocaleString()}
              </span>
              <p>{comment.content}</p>
            </li>
          ))}
        </ul>

        {user ? (
          <div style={{ marginTop: "1rem" }}>
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              rows={3}
              style={{ width: "100%" }}
              placeholder="댓글을 입력하세요."
            />
            <button onClick={handleCommentSubmit} style={{ marginTop: "0.5rem" }}>
              댓글 등록
            </button>
          </div>
        ) : (
          <p>댓글을 작성하려면 로그인하세요.</p>
        )}
      </div>
    </div>
  );
}
