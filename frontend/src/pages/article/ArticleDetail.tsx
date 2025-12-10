import { useState, useEffect } from "react";
import CheckboxStyle from "../../components/ui/CheckboxStyle";
import { useRef, useCallback } from "react";
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
  const [isSecret, setIsSecret] = useState(false);
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
    setIsSecret(article?.isSecret || false);
    setIsEditing(true);
  };

  // 게시글 수정 취소
  const cancelEditingArticle = () => {
    setIsEditing(false);
    setEditTitle("");
    setEditContent("");
    setIsSecret(false);
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
        articleType: article.articleType,
        isSecret: isSecret,
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

  // 작성자 최초 등장 Map 계산 (렌더링 시 사용)
  const getUserFirstAppearanceMap = () => {
    const map = new Map<number, { index: number; commentId: number }>();
    if (!article || article.articleType !== ArticleType.COMMUNITY) return map;

    comments.forEach((c, i) => {
      if (!map.has(c.userId)) {
        map.set(c.userId, { index: i + 1, commentId: c.commentId! });
      }
    });
    return map;
  };

  const firstAppearanceMap = getUserFirstAppearanceMap();

  // 닉네임 표시 로직 (Community 전용 포맷 적용)
  const getDisplayNickNameObj = (comment: CommentDto, index: number) => {
    if (!article) return { label: "", originalCommentId: null };

    // Community: 익명 처리 (Sequence Based)
    if (article.articleType === ArticleType.COMMUNITY) {
      // 1. 관리자 체크 (여기서는 별도 role 필드가 commentDto에 없으므로 nickName이나 userId 등으로 판단해야 할 수도 있으나, 보통 Role을 가져와야 함. 
      //    User 정보를 join해서 가져오지 않는 이상 nickName이 "관리자"인지 확인하거나, 로직상 admin 여부를 알 수 있어야 함. 
      //    현재 CommentDto에는 role 필드가 없으므로, 우선 '글쓴이' 요구사항을 확실히 반영.
      //    (Tip: 관리자 계정은 보통 nickName이 관리자일 수 있음)

      // 글쓴이 우선
      if (comment.userId === article.userId) {
        return { label: "글쓴이", originalCommentId: null };
      }

      // 관리자 - 닉네임이 '관리자' 이거나 특정 플래그가 있다면... 
      // 일단 사용자가 "관리자 계정은 관리자로 나오게" 라고 했으므로, 닉네임 자체가 관리자인 경우나 
      // 특정 userId(예: 1)가 관리자인지 확인해야 함. 
      // 여기서는 User 객체 접근이 어려우므로, nickName이 '관리자'인 경우 '관리자'로 표시하도록 방어 코드 작성.
      if (comment.nickName === "관리자") {
        return { label: "관리자", originalCommentId: null };
      }

      const currentSeq = index + 1;
      let label = `${currentSeq}. 익명${currentSeq}`;

      // 이전 등장이 있는지 확인
      const first = firstAppearanceMap.get(comment.userId);
      let originalCommentId: number | null = null;

      if (first && first.index !== currentSeq) {
        label += `(=익명${first.index})`;
        originalCommentId = first.commentId;
      }

      return { label, originalCommentId };
    }

    // FAQ, Others: 닉네임 그대로 표시 (비밀글인 경우 제외)
    // 여기도 관리자면 '관리자'로 나오는 게 좋음
    if (comment.nickName === "관리자") return { label: "관리자", originalCommentId: null };

    return {
      label: article.isSecret ? "익명" : (comment.nickName ?? "알 수 없음"),
      originalCommentId: null
    };
  };

  // @숫자 or @닉네임 클릭 핸들러
  const handleMentionClick = (mention: string) => {
    if (!article) return;
    const cleanMention = mention.replace("@", "");

    let target: CommentDto | undefined;

    // COMMUNITY: @숫자 형식 지원
    if (article.articleType === ArticleType.COMMUNITY) {
      // @123 형태인지 확인
      const num = Number(cleanMention);
      if (!isNaN(num) && num > 0 && num <= comments.length) {
        // 숫자는 1-based index이므로 배열은 num-1
        target = comments[num - 1];
      } else if (cleanMention === "글쓴이") {
        // @글쓴이 멘션 시 작성자의 첫 댓글을 찾음 (있다면)
        target = comments.find(c => c.userId === article.userId);
      } else {
        // 기존 로직(혹시 모를 @닉네임 대응)
        // ...하지만 요구사항은 '숫자만 써도' 이므로 숫자가 우선
      }
    } else {
      // FAQ/Others: 닉네임 매칭
      target = comments.find(c => c.nickName === cleanMention);
    }

    if (!target || !target.commentId) return;

    const el = commentRefs.current[target.commentId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.remove("highlight-flash");
      void el.offsetWidth;
      el.classList.add("highlight-flash");
    }
  };

  // 특정 commentId로 스크롤 이동
  const scrollToComment = (commentId: number) => {
    const el = commentRefs.current[commentId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.remove("highlight-flash");
      void el.offsetWidth;
      el.classList.add("highlight-flash");
    }
  };

  // 답글 버튼 클릭 -> @Index 입력
  const handleReplyClick = (index: number, nickname: string, userId: number) => {
    // Community라면 @숫자 또는 @글쓴이, 그외에는 @닉네임
    let mentionObj = nickname;
    if (article?.articleType === ArticleType.COMMUNITY) {
      if (userId === article.userId) {
        mentionObj = "글쓴이";
      } else {
        mentionObj = `${index + 1}`;
      }
    }

    const mention = `@${mentionObj} `;
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
    // Community의 경우 숫자로 된 멘션(@1, @12 등)도 파악
    const parts = text.split(/(@\S+)/g);

    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        // Community: @익명1, @1 등 어떤 포맷이든 파싱해서 @1 형태로 보여줌
        let displayMention = part;
        let isClickable = false;

        if (article?.articleType === ArticleType.COMMUNITY) {
          const clean = part.replace("@", "");

          // 1. "글쓴이" 인 경우
          if (clean === "글쓴이") {
            displayMention = "@글쓴이";
            isClickable = true;
          }
          // 2. "익명N" 인 경우 -> "@N" 으로 변환
          else if (clean.startsWith("익명")) {
            const numStr = clean.replace("익명", "");
            if (!isNaN(Number(numStr))) {
              displayMention = `@${numStr}`;
              isClickable = true;
            }
          }
          // 3. 그냥 숫자 "N" 인 경우 -> "@N" 유지
          else if (!isNaN(Number(clean))) {
            displayMention = part;
            isClickable = true;
          }
        } else {
          // 다른 게시판은 닉네임 그대로
          isClickable = true;
        }

        // 파란색 스타일 적용
        const mentionClass = "cursor-pointer font-medium hover:underline text-blue-500";

        return (
          <span
            key={i}
            onClick={() => isClickable && handleMentionClick(part)}
            className={isClickable ? mentionClass : ""}
          >
            {displayMention}
          </span>
        );
      } else {
        return <span key={i}>{part}</span>;
      }
    });
  };

  const getArticleTypeBadge = (type: ArticleType) => {
    const badges = {
      [ArticleType.NOTICE]: { label: "공지", bg: "bg-red-100", text: "text-red-600" },
      [ArticleType.FAQ]: { label: "FAQ", bg: "bg-blue-100", text: "text-[#333]" },
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
          <>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full text-2xl font-bold text-[#111] mb-2 px-4 py-3 border border-[#ddd] rounded-lg focus:outline-none focus:border-[#111]"
              placeholder="제목을 입력하세요"
            />
            <CheckboxStyle
              checked={isSecret}
              onChange={(checked) => setIsSecret(checked)}
              label="비밀글 설정"
            />
          </>
        ) : (
          <h1 className="text-2xl font-bold text-[#111] mb-4 flex items-center gap-2">
            {article.isSecret && <span className="text-sm text-gray-500 border border-gray-300 rounded px-2 py-0.5">🔒 비밀글</span>}
            {article.title}
          </h1>
        )}

        <div className="flex justify-between items-center pb-4 mb-6 border-b border-gray-200">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-medium text-[#333]">{article.isSecret ? "익명" : (article.nickName ?? "알 수 없음")}</span>
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
          (article.isSecret && (!user || (user.userId !== article.userId && user.role !== 'ADMIN'))) ? (
            <div className="py-20 text-center text-gray-500 bg-gray-50 rounded-lg">
              <p className="text-lg font-bold mb-2">비밀글입니다.</p>
              <p className="text-sm">작성자와 관리자만 볼 수 있습니다.</p>
            </div>
          ) : (
            <div
              dangerouslySetInnerHTML={{ __html: article.content }}
              className="prose max-w-none text-[#333] leading-relaxed"
            />
          )
        )}
      </div>

      {/* 댓글 영역 */}
      {/* 댓글 영역 - NOTICE는 숨김 */}
      {article.articleType !== ArticleType.NOTICE && (
        <div className="bg-white border border-[#ddd] rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#111] mb-4">
            댓글 <span className="text-[#999] font-normal text-base">({comments.length})</span>
          </h2>

          {comments.length === 0 ? (
            <p className="text-gray-400 text-center py-8">댓글이 없습니다.</p>
          ) : (
            <div className="space-y-4 mb-6">
              {comments.map((comment, index) => {
                const { label: displayName, originalCommentId } = getDisplayNickNameObj(comment, index);

                return (
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
                        <span
                          className={`text-sm font-bold text-[#333] ${originalCommentId ? 'cursor-pointer hover:underline' : ''}`}
                          onClick={() => originalCommentId && scrollToComment(originalCommentId)}
                        >
                          {displayName}
                        </span>
                        <button
                          onClick={() => handleReplyClick(index, comment.nickName || "", comment.userId)}
                          className="text-xs text-gray-500 hover:text-[#111] font-medium px-1.5 py-0.5 border border-gray-200 rounded transition-colors"
                        >
                          답글
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
                );
              })}
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

          {/* 댓글 작성: Notice는 아예 숨김, FAQ는 관리자만, Community는 누구나 */}
          (article.articleType !== ArticleType.FAQ || user?.role === 'ADMIN') ? (
          user ? (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <label className="block text-sm font-bold text-[#333] mb-2">
              댓글 작성
            </label>
            <textarea
              id="comment-textarea"
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              rows={4}
              placeholder="댓글을 입력하세요 (예: @닉네임 으로 멘션 가능)"
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
              댓글을 작성하려면 <NavLink to="/login" className="text-[#333] hover:underline font-medium">로그인</NavLink>하세요.
            </p>
          </div>
          )
          ) : null
        </div>
      )}

      {/* 이전글 / 다음글 네비게이션 */}
      <div className="w-full mx-auto mt-10 border-t border-gray-200">
        {prevArticle && (
          <div
            className="flex justify-between items-center py-4 px-2 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => navigate(`/articles/${prevArticle.articleId}`)}
          >
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">다음글</span>
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
              <span className="text-gray-400 text-sm">이전글</span>
              <span className="text-[#333] font-medium">{nextArticle.title}</span>
            </div>
            <span className="text-xs text-gray-400">{formatDateTime(nextArticle.createdAt)}</span>
          </div>
        )}
      </div>

    </div>
  );
}
