import { useEffect, useState, useRef, useCallback } from "react";
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
import { formatDateTime } from "../utils/util";

interface Props {
  user: User | null;
}

export default function ArticleDetail({ user }: Props) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [article, setArticle] = useState<ArticleDto | null>(null);
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [commentContent, setCommentContent] = useState("");

  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");

  // 페이지네이션
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const COMMENTS_PER_PAGE = 50;

  const commentRefs = useRef<Record<number, HTMLLIElement | null>>({});

  // 게시글 조회
  useEffect(() => {
    if (!id) return;
    getArticleById(Number(id))
      .then(setArticle)
      .catch((err) => console.error("게시글 조회 실패:", err));
  }, [id]);

  // 댓글 불러오기 함수 (페이징 적용)
  const loadComments =  useCallback(async (pageNum: number) => {
    if (!id) return;
    try {
      const allComments = await getCommentsByArticleId(Number(id));
      const start = (pageNum - 1) * COMMENTS_PER_PAGE;
      const pagedComments = allComments.slice(start, start + COMMENTS_PER_PAGE);
  
      if (pageNum === 1) {
        setComments(pagedComments);
      } else {
        setComments((prev) => [...prev, ...pagedComments]);
      }
  
      setHasMore(start + COMMENTS_PER_PAGE < allComments.length);
    } catch (err) {
      console.error("댓글 조회 실패:", err);
    }
  }, [id, setComments, setHasMore]);

  // 초기 댓글 로드
  useEffect(() => {
    setPage(1);
    loadComments(1);
  }, [id, loadComments]);

  // 댓글 작성
  const handleCommentSubmit = async () => {
    if (!id || !user) return;
    if (!commentContent.trim()) {
      alert("댓글 내용을 입력해주세요.");
      return;
    }

    const form: CommentForm = {
      content: commentContent,
      articleId: Number(id),
      userId: user.userId,
    };

    try {
      await createComment(Number(id), form);
      setCommentContent("");
      setPage(1);
      loadComments(1); // 작성 후 댓글 최신화
    } catch {
      alert("댓글 등록에 실패했습니다.");
    }
  };

  // 댓글 수정
  const startEditing = (comment: CommentDto) => {
    setEditingCommentId(comment.commentId!);
    setEditingContent(comment.content);
  };
  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditingContent("");
  };
  const saveEditing = async () => {
    if (!editingCommentId || !id || !user) return;
    if (!editingContent.trim()) {
      alert("댓글 내용을 입력해주세요.");
      return;
    }

    const form: CommentForm = {
      content: editingContent,
      articleId: Number(id),
      userId: user.userId,
    };

    try {
      await updateComment(editingCommentId, form);
      setEditingCommentId(null);
      setEditingContent("");
      setPage(1);
      loadComments(1); // 수정 후 댓글 최신화
    } catch {
      alert("댓글 수정 실패");
    }
  };

  // 댓글 삭제
  const handleCommentDelete = async (commentId: number) => {
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.commentId !== commentId));
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

  // @번호 클릭 시 해당 댓글로 스크롤
  const handleMentionClick = (mention: string) => {
    const num = Number(mention.replace("@", ""));
    if (isNaN(num) || num < 1 || num > comments.length) return;

    const target = comments[num - 1];
    if (!target || !target.commentId) return;

    const el = commentRefs.current[target.commentId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.remove("highlight-flash");
      void el.offsetWidth;
      el.classList.add("highlight-flash");
    }
  };

  // 댓글 입력창에 @번호 자동 추가
  const handleReplyClick = (index: number) => {
    const mention = `@${index + 1} `;
    setCommentContent((prev) => {
      if (prev.includes(mention)) return prev;
      return prev.trim() ? prev + " " + mention : mention;
    });
    const textarea = document.querySelector<HTMLTextAreaElement>(
      ".article-textarea.article-review"
    );
    textarea?.focus();
  };

  const renderCommentContent = (text: string) => {
    const parts = text.split(/(@\S+)/g);
    return parts.map((part, i) =>
      part.startsWith("@") ? (
        <span
          key={i}
          onClick={() => handleMentionClick(part)}
          style={{ color: "#007bff", cursor: "pointer", fontWeight: 500 }}
        >
          {part}
        </span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  if (!article) return <div>로딩 중...</div>;

  return (
    <div className="container">
      {/* 글 영역 */}
      <div className="flex-column gap-12">
        <h2>{article.title}</h2>
        <div className="flex-box flex-between flex-top-a">
          <div className="flex-box gap-4">
            <strong>{article.nickName ?? "알 수 없음"}</strong>
            <p>{formatDateTime(article.createdAt)}</p>
          </div>
          {user?.userId === article.userId && (
            <div className="flex-box gap-4">
              <button
                onClick={() => navigate(`/articles/${article.articleId}/edit`)}
                className="edit-btn"
              >
                수정
              </button>
              <button onClick={handleDelete} className="edit-btn">
                삭제
              </button>
            </div>
          )}
        </div>

        <div
          dangerouslySetInnerHTML={{ __html: article.content }}
          className="article-content"
        />
      </div>

      {/* 댓글 영역 */}
      <div className="flex-column gap-24 mt-20 top-line">
        <p className="title-24">{comments.length}개의 댓글</p>
        {comments.length === 0 && <p>댓글이 없습니다.</p>}

        <ul className="flex-column gap-16">
          {comments.map((comment, index) => (
            <li
              key={comment.commentId}
              ref={(el) => {
                if (comment.commentId != null)
                  commentRefs.current[comment.commentId] = el;
              }}
              className="flex-column gap-4 comment-item"
            >
              <div className="flex-box flex-between flex-top-a">
                <div className="flex-box gap-4">
                  <strong
                    style={{ cursor: "pointer" }}
                    onClick={() => handleReplyClick(index)}
                  >
                    {index + 1}. {comment.nickName ?? "알 수 없음"}
                  </strong>
                  <span style={{ color: "#888", fontSize: "0.9rem" }}>
                    {formatDateTime(comment.createdAt)}
                  </span>
                </div>

                <div className="flex-box gap-4">
                  {editingCommentId === comment.commentId ? (
                    <>
                      <button onClick={saveEditing} className="edit-btn">
                        저장
                      </button>
                      <button onClick={cancelEditing} className="edit-btn">
                        취소
                      </button>
                    </>
                  ) : (
                    user?.userId === comment.userId && (
                      <>
                        <button
                          onClick={() => startEditing(comment)}
                          className="edit-btn"
                        >
                          수정
                        </button>
                        <button
                          onClick={() =>
                            handleCommentDelete(comment.commentId!)
                          }
                          className="edit-btn"
                        >
                          삭제
                        </button>
                      </>
                    )
                  )}
                </div>
              </div>

              {editingCommentId === comment.commentId ? (
                <textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  rows={3}
                  className="article-textarea article-review-li"
                />
              ) : (
                <p>{renderCommentContent(comment.content)}</p>
              )}
            </li>
          ))}
        </ul>

        {hasMore && (
          <button
            onClick={() => {
              const nextPage = page + 1;
              setPage(nextPage);
              loadComments(nextPage);
            }}
            className="text-16 color-aaa"
          >
            더보기 +
          </button>
        )}

        {user ? (
          <div className="flex-column gap-12 top-line">
            <p className="title-18 mt-10">댓글쓰기</p>
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              rows={3}
              style={{ width: "100%" }}
              placeholder="댓글을 입력하세요. (예: @닉네임 으로 언급)"
              className="article-textarea article-review"
            />
            <div className="width-full flex-column flex-left-a">
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
