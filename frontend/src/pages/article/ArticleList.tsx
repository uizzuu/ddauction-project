import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getArticles } from "../../common/api";
import type { ArticleDto, User } from "../../common/types";
import { ArticleType } from "../../common/types";
import { formatShortDate } from "../../common/util";

interface Props {
  user: User | null;
}

export default function ArticleList({ user }: Props) {
  const [activeTab, setActiveTab] = useState<ArticleType | "COMMUNITY">(ArticleType.COMMUNITY);

  const [articles, setArticles] = useState<ArticleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 슬라이딩 언더바 관련 state & ref
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // 언더바 위치 업데이트 함수
  const updateUnderlinePosition = () => {
    const tabs = [
      { key: ArticleType.COMMUNITY },
      { key: ArticleType.NOTICE },
      { key: ArticleType.FAQ },
    ];
    const index = tabs.findIndex((t) => t.key === activeTab);
    const el = tabRefs.current[index];
    if (el) {
      setUnderlineStyle({
        left: el.offsetLeft,
        width: el.offsetWidth,
      });
    }
  };

  // activeTab 변경 시 언더바 위치 조정
  useEffect(() => {
    updateUnderlinePosition();
  }, [activeTab]);

  // 초기 렌더링 후 언더바 위치 설정 (마운트 시)
  useEffect(() => {
    // DOM이 완전히 렌더링되고 ref가 설정된 후 언더바 위치 계산
    // requestAnimationFrame을 사용하여 브라우저가 DOM을 완전히 그린 후 실행
    requestAnimationFrame(() => {
      setTimeout(() => {
        updateUnderlinePosition();
      }, 50); // 50ms 후 실행하여 DOM 완전 렌더링 보장
    });
  }, []);

  useEffect(() => {
    // 탭 변경 시 API 호출 (필터링)
    const params = { articleType: activeTab };

    getArticles(params)
      .then(setArticles)
      .catch(() => console.log("게시글 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [activeTab]);

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

  const handleClickArticle = (article: ArticleDto) => {
    // 비밀글 체크
    navigate(`/articles/${article.articleId}`);
  };

  if (loading) return (
    <div className="max-w-[1280px] mx-auto py-8 flex items-center justify-center">
      <div className="text-gray-500">로딩 중...</div>
    </div>
  );

  return (
    <div className="max-w-[1280px] mx-auto py-8 px-5">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
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

      {/* 탭 네비게이션 */}
      <div className="relative flex gap-2 mb-6 border-b border-gray-200">
        {[
          // { key: "ALL", label: "전체" },
          { key: ArticleType.COMMUNITY, label: "자유게시판" },
          { key: ArticleType.NOTICE, label: "공지사항" },
          { key: ArticleType.FAQ, label: "FAQ" },
        ].map((tab, index) => (
          <button
            key={tab.key}
            ref={(el) => { tabRefs.current[index] = el; }}
            onClick={() => setActiveTab(tab.key as ArticleType | "COMMUNITY")}
            className={`
              relative z-10 px-4 py-2 text-sm font-bold transition-colors whitespace-nowrap
              ${activeTab === tab.key ? "text-[#111]" : "text-gray-500 hover:text-[#333]"}
            `}
          >
            {tab.label}
          </button>
        ))}
        {/* Sliding Underline */}
        <div
          className="absolute bottom-0 h-0.5 bg-[#111] transition-all duration-300 ease-in-out"
          style={{
            left: `${underlineStyle.left}px`,
            width: `${underlineStyle.width}px`,
          }}
        />
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
                onClick={() => handleClickArticle(article)}
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-4"
              >
                <div className="w-20 flex-shrink-0">
                  {getArticleTypeBadge(article.articleType)}
                </div>
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <h3 className="text-sm font-medium text-[#111] truncate">
                    {article.isSecret ? (
                      <span className="flex items-center gap-1 text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        비밀글입니다.
                      </span>
                    ) : (
                      article.title
                    )}
                  </h3>
                </div>
                <div className="w-32 text-center text-sm text-[#666] hidden md:block flex-shrink-0">
                  {article.isSecret ? "익명" : article.nickName ?? "알 수 없음"}
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
