import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, NavLink } from "react-router-dom";
import {
  getArticleById,
  deleteArticle,
  updateArticle,
  getCommentsByArticleId,
  createComment,
  updateComment,
  deleteComment,
} from "../../common/api";
import type {
  ArticleDto,
  User,
  CommentDto,
  CommentForm,
} from "../../common/types";
import { ArticleType } from "../../common/types";
import { formatDateTime } from "../../common/util";

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

  // 게시글 수정 상태
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // 이전글/다음글 State
  const [prevArticle, setPrevArticle] = useState<ArticleDto | null>(null);
  const [nextArticle, setNextArticle] = useState<ArticleDto | null>(null);

  // 페이지네이션
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const COMMENTS_PER_PAGE = 50;

  const commentRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // 게시글 조회
  useEffect(() => {
    if (!id) return;
    const currentId = Number(id);
    getArticleById(currentId)
      .then(setArticle)
      .catch((err) => console.error("게시글 조회 실패:", err));

    // 이전글/다음글 조회 (단순 ID 증감)
    setPrevArticle(null);
    setNextArticle(null);
    if (currentId > 1) {
      getArticleById(currentId - 1).then(setPrevArticle).catch(() => { });
    }
    getArticleById(currentId + 1).then(setNextArticle).catch(() => { });
  }, [id]);

  // 댓글 불러오기 함수 (페이징 적용)
  const loadComments = useCallback(
    async (pageNum: number) => {
      if (!id) return;
      try {
        const allComments = await getCommentsByArticleId(Number(id));
        const start = (pageNum - 1) * COMMENTS_PER_PAGE;
        const pagedComments = allComments.slice(
          start,
          start + COMMENTS_PER_PAGE
        );

        if (pageNum === 1) {
          setComments(pagedComments);
        } else {
          setComments((prev) => [...prev, ...pagedComments]);
        }

        setHasMore(start + COMMENTS_PER_PAGE < allComments.length);
      } catch (err) {
        console.error("댓글 조회 실패:", err);
      }
    },
    [id, setComments, setHasMore]
  );

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
      navigate("/community");
    } catch {
      alert("삭제 실패");
    }
  };

  // 게시글 수정 시작
  const startEditingArticle = () => {
    setEditTitle(article?.title || "");
    setEditContent(article?.content || "");
    setIsEditing(true);
  };

  // 게시글 수정 취소
  const cancelEditingArticle = () => {
    setIsEditing(false);
    setEditTitle("");
    setEditContent("");
  };

  // 게시글 수정 저장
  const saveEditingArticle = async () => {
    if (!id || !user || !article) return;
    if (!editTitle.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }
    if (!editContent.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }

    setIsSaving(true);
    try {
      const articleForm = {
        title: editTitle,
        content: editContent,
        userId: user.userId,
        boardId: article.boardId,
        articleType: article.articleType,
      };
      await updateArticle(Number(id), articleForm);
      // 수정 후 전체 article 데이터를 다시 가져와서 nickName 등 모든 필드 보장
      const refreshedArticle = await getArticleById(Number(id));
      setArticle(refreshedArticle);
      setIsEditing(false);
      alert("수정되었습니다.");
    } catch (error) {
      console.error("Article update error:", error);
      alert("게시글 수정 실패");
    } finally {
      setIsSaving(false);
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
      "#comment-textarea"
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
          className="text-blue-600 cursor-pointer font-medium hover:underline"
        >
          {part}
        </span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  const getArticleTypeBadge = (type: ArticleType) => {
    const badges = {
      [ArticleType.NOTICE]: { label: "공지", bg: "bg-red-100", text: "text-red-600" },
      [ArticleType.FAQ]: { label: "FAQ", bg: "bg-blue-100", text: "text-blue-600" },
      [ArticleType.COMMUNITY]: { label: "자유", bg: "bg-gray-100", text: "text-gray-600" }
    };
    const badge = badges[type] || badges[ArticleType.COMMUNITY];
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-bold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  if (!article) return (
    <div className="max-w-[1280px] mx-auto py-8 flex items-center justify-center">
      <div className="text-gray-500">로딩 중...</div>
    </div>
  );

  return (
    <div className="max-w-[1280px] mx-auto py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate("/community")}
        className="mb-6 flex items-center text-gray-500 hover:text-black transition-colors font-medium"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
          <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
        </svg>
        목록으로 돌아가기
      </button>

      {/* 글 영역 */}
      <div className="bg-white border border-[#ddd] rounded-lg p-6 shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-4">
          {getArticleTypeBadge(article.articleType)}
        </div>

        {/* 제목 */}
        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full text-2xl font-bold text-[#111] mb-4 px-4 py-3 border border-[#ddd] rounded-lg focus:outline-none focus:border-[#111]"
            placeholder="제목을 입력하세요"
          />
        ) : (
          <h1 className="text-2xl font-bold text-[#111] mb-4">{article.title}</h1>
        )}

        <div className="flex justify-between items-center pb-4 mb-6 border-b border-gray-200">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-medium text-[#333]">{article.nickName ?? "알 수 없음"}</span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-500">{formatDateTime(article.createdAt)}</span>
          </div>

          {user?.userId === article.userId && (
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={saveEditingArticle}
                    disabled={isSaving}
                    className="px-4 py-1.5 text-sm bg-[#111] text-white rounded-lg hover:bg-[#333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? "저장 중..." : "저장"}
                  </button>
                  <button
                    onClick={cancelEditingArticle}
                    disabled={isSaving}
                    className="px-4 py-1.5 text-sm border border-[#ddd] rounded-lg text-[#666] hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    취소
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={startEditingArticle}
                    className="px-4 py-1.5 text-sm border border-[#ddd] rounded-lg text-[#666] hover:bg-gray-50 transition-colors"
                  >
                    수정
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-1.5 text-sm border border-red-200 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                  >
                    삭제
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* 내용 */}
        {isEditing ? (
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={15}
            className="w-full px-4 py-3 border border-[#ddd] rounded-lg focus:outline-none focus:border-[#111] text-sm resize-none"
            placeholder="내용을 입력하세요"
          />
        ) : (
          <div
            dangerouslySetInnerHTML={{ __html: article.content }}
            className="prose max-w-none text-[#333] leading-relaxed"
          />
        )}
      </div>

      {/* 댓글 영역 */}
      <div className="bg-white border border-[#ddd] rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#111] mb-4">
          댓글 <span className="text-[#999] font-normal text-base">({comments.length})</span>
        </h2>

        {comments.length === 0 ? (
          <p className="text-gray-400 text-center py-8">댓글이 없습니다.</p>
        ) : (
          <div className="space-y-4 mb-6">
            {comments.map((comment, index) => (
              <div
                key={comment.commentId}
                ref={(el) => {
                  if (comment.commentId != null)
                    commentRefs.current[comment.commentId] = el;
                }}
                className="border-b border-gray-100 pb-4 last:border-0"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReplyClick(index)}
                      className="text-sm font-bold text-[#333] hover:text-blue-600 transition-colors"
                    >
                      #{index + 1} {comment.nickName ?? "알 수 없음"}
                    </button>
                    <span className="text-xs text-gray-400">
                      {formatDateTime(comment.createdAt)}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {editingCommentId === comment.commentId ? (
                      <>
                        <button
                          onClick={saveEditing}
                          className="text-xs px-3 py-1 bg-[#111] text-white rounded hover:bg-[#333] transition-colors"
                        >
                          저장
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="text-xs px-3 py-1 border border-[#ddd] rounded text-[#666] hover:bg-gray-50 transition-colors"
                        >
                          취소
                        </button>
                      </>
                    ) : (
                      user?.userId === comment.userId && (
                        <>
                          <button
                            onClick={() => startEditing(comment)}
                            className="text-xs px-3 py-1 border border-[#ddd] rounded text-[#666] hover:bg-gray-50 transition-colors"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleCommentDelete(comment.commentId!)}
                            className="text-xs px-3 py-1 border border-red-200 rounded text-red-500 hover:bg-red-50 transition-colors"
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
                    className="w-full px-4 py-3 border border-[#ddd] rounded-lg focus:outline-none focus:border-[#111] text-sm resize-none"
                  />
                ) : (
                  <p className="text-sm text-[#333] leading-relaxed whitespace-pre-wrap">
                    {renderCommentContent(comment.content)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {hasMore && (
          <button
            onClick={() => {
              const nextPage = page + 1;
              setPage(nextPage);
              loadComments(nextPage);
            }}
            className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            더보기 +
          </button>
        )}

        {/* 댓글 작성 */}
        {user ? (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <label className="block text-sm font-bold text-[#333] mb-2">
              댓글 작성
            </label>
            <textarea
              id="comment-textarea"
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              rows={4}
              placeholder="댓글을 입력하세요 (예: @1 으로 댓글 번호 언급 가능)"
              className="w-full px-4 py-3 border border-[#ddd] rounded-lg focus:outline-none focus:border-[#111] text-sm resize-none mb-3"
            />
            <div className="flex justify-end">
              <button
                onClick={handleCommentSubmit}
                className="px-6 py-2.5 bg-[#111] text-white rounded-lg font-bold text-sm hover:bg-[#333] transition-colors shadow-sm"
              >
                댓글 등록
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-500 text-sm">
              댓글을 작성하려면 <NavLink to="/login" className="text-blue-600 hover:underline font-medium">로그인</NavLink>하세요.
            </p>
          </div>
        )}
      </div>

      {/* 이전글 / 다음글 네비게이션 */}
      <div className="max-w-[800px] mx-auto mt-10 border-t border-gray-200">
        {prevArticle && (
          <div
            className="flex justify-between items-center py-4 px-2 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => navigate(`/articles/${prevArticle.articleId}`)}
          >
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">이전글</span>
              <span className="text-[#333] font-medium">{prevArticle.title}</span>
            </div>
            <span className="text-xs text-gray-400">{formatDateTime(prevArticle.createdAt)}</span>
          </div>
        )}
        {nextArticle && (
          <div
            className="flex justify-between items-center py-4 px-2 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => navigate(`/articles/${nextArticle.articleId}`)}
          >
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">다음글</span>
              <span className="text-[#333] font-medium">{nextArticle.title}</span>
            </div>
            <span className="text-xs text-gray-400">{formatDateTime(nextArticle.createdAt)}</span>
          </div>
        )}
      </div>

    </div>
  );
}
