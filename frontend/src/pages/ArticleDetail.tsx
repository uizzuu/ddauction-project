import { useEffect, useState } from "react";
import { useParams, useNavigate, NavLink } from "react-router-dom";
import {
  getArticleById,
  deleteArticle,
  getCommentsByArticleId,
  createComment,
  updateComment,
  deleteComment,
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

  // 댓글 수정 관련 상태
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");

  // 게시글 조회
  useEffect(() => {
    if (!id) return;
    getArticleById(Number(id))
      .then(setArticle)
      .catch((err) => console.error("게시글 조회 실패:", err));
  }, [id]);

  // 댓글 목록 조회
  useEffect(() => {
    if (!id) return;
    getCommentsByArticleId(Number(id))
      .then(setComments)
      .catch((err) => console.error("댓글 조회 실패:", err));
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

  // 댓글 수정 시작
  const startEditing = (comment: CommentDto) => {
    setEditingCommentId(comment.commentId!);
    setEditingContent(comment.content);
  };

  // 댓글 수정 취소
  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditingContent("");
  };

  // 댓글 수정 저장
  const saveEditing = async () => {
    if (!editingCommentId) return;

    if (!editingContent.trim()) {
      alert("댓글 내용을 입력해주세요.");
      return;
    }

    const form: CommentForm = {
      content: editingContent,
      userId: user!.userId,
    };

    try {
      await updateComment(editingCommentId, form);
      const updatedComments = await getCommentsByArticleId(Number(id));
      setComments(updatedComments);
      cancelEditing();
    } catch {
      alert("댓글 수정 실패");
    }
  };

  // 댓글 삭제
  const handleCommentDelete = async (commentId: number) => {
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;

    try {
      await deleteComment(commentId);
      setComments(comments.filter((c) => c.commentId !== commentId));
    } catch {
      alert("댓글 삭제 실패");
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
    <div className="container">
      {/* 글 영역 */}
      <div className="flex-column gap-12">
        <h2>{article.title}</h2>
        <div className="flex-column gap-4">
          <p>작성자: {article.nickName}</p>
          <p>{new Date(article.createdAt).toLocaleString()}</p>
        </div>

        <div
          dangerouslySetInnerHTML={{ __html: article.content }}
          className="article-content"
        />

        {/* 게시글 수정/삭제 버튼 */}
        {user?.userId === article.userId && (
          <div className="flex-box gap-4">
            <button
              onClick={() => navigate(`/articles/${article.articleId}/edit`)}
              className="article-btn"
            >
              수정
            </button>
            <button onClick={handleDelete} className="article-btn">
              삭제
            </button>
          </div>
        )}
      </div>

      {/* 댓글 영역 */}
      <div className="flex-column gap-18 review-box border-top">
        <p className="review-title">{comments.length}개의 댓글</p>

        {comments.length === 0 && <p>댓글이 없습니다.</p>}

        <ul className="flex-column gap-18">
          {comments.map((comment) => (
            <li key={comment.commentId} className="flex-column gap-8">
              <div className="flex-box gap-4">
                <strong>{comment.nickName}</strong>
                <span style={{ color: "#888", fontSize: "0.9rem" }}>
                  {new Date(comment.createdAt).toLocaleString()}
                </span>
              </div>

              {editingCommentId === comment.commentId ? (
                <div className="flex-column gap-8">
                  <textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    rows={3}
                    className="article-textarea article-review-li"
                  />
                  <div className="flex-box gap-4">
                    <button onClick={saveEditing} className="article-btn">
                      저장
                    </button>
                    <button onClick={cancelEditing} className="article-btn">
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p>{comment.content}</p>
                  {user?.userId === comment.userId && (
                    <div className="flex-box gap-4">
                      <button
                        onClick={() => startEditing(comment)}
                        className="article-btn"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleCommentDelete(comment.commentId!)}
                        className="article-btn"
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>

        {user ? (
          <div className="flex-column gap-24 border-top">
            <p className="reply-title">댓글쓰기</p>
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              rows={3}
              style={{ width: "100%" }}
              placeholder="댓글을 입력하세요."
              className="article-textarea article-review"
            />
            <div className="btn-wrap">
              <button onClick={handleCommentSubmit} className="article-btn">
                댓글 등록
              </button>
            </div>
          </div>
        ) : (
          <p className="no-content-text">
            댓글을 작성하려면 <NavLink to="/login">로그인</NavLink>하세요.
          </p>
        )}
      </div>
    </div>
  );
}
