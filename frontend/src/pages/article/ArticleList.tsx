import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getArticles } from "../../common/api";
import type { ArticleDto, User } from "../../common/types";
import { ArticleType } from "../../common/types";
import { formatShortDate } from "../../common/util";

interface Props {
  user: User | null;
}

export default function ArticleList({ user }: Props) {
  const [articles, setArticles] = useState<ArticleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getArticles({ boardId: 1 }) // 1번 게시판 글만 조회
      .then(setArticles)
      .catch(() => console.log("게시글 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

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

  if (loading) return (
    <div className="max-w-[1280px] mx-auto py-8 flex items-center justify-center">
      <div className="text-gray-500">로딩 중...</div>
    </div>
  );

  return (
    <div className="max-w-[1280px] mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#111]">커뮤니티</h1>
        {user && (
          <button
            onClick={() => navigate("/articles/new")}
            className="px-6 py-2.5 bg-[#111] text-white rounded-lg font-bold text-sm hover:bg-[#333] transition-colors shadow-sm"
          >
            글쓰기
          </button>
        )}
      </div>

      {articles.length === 0 ? (
        <div className="bg-white border border-[#ddd] rounded-lg p-12 text-center">
          <p className="text-gray-400">게시글이 없습니다.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#ddd] rounded-lg overflow-hidden shadow-sm">
          {/* Header */}
          <div className="bg-gray-50 border-b border-[#ddd] px-6 py-3 flex items-center gap-4 text-sm font-bold text-[#666]">
            <div className="w-20 pl-[6px]">유형</div>
            <div className="flex-1">제목</div>
            <div className="w-32 text-center hidden md:block">작성자</div>
            <div className="w-28 text-center hidden sm:block">작성일</div>
          </div>

          {/* Article List */}
          <div className="divide-y divide-gray-100">
            {articles.map((article) => (
              <div
                key={article.articleId}
                onClick={() => navigate(`/articles/${article.articleId}`)}
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-4"
              >
                <div className="w-20 flex-shrink-0">
                  {getArticleTypeBadge(article.articleType)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-[#111] truncate">
                    {article.title}
                  </h3>
                </div>
                <div className="w-32 text-center text-sm text-[#666] hidden md:block flex-shrink-0">
                  {article.nickName ?? "알 수 없음"}
                </div>
                <div className="w-28 text-center text-sm text-[#999] hidden sm:block flex-shrink-0">
                  {formatShortDate(article.createdAt)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
