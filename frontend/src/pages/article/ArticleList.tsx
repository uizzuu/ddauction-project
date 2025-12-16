import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom"; // useSearchParams 추가
import { getArticles } from "../../common/api";
import type { ArticleDto, User } from "../../common/types";
import { ArticleType } from "../../common/types";
import { formatShortDate } from "../../common/util";

// 사용 가능한 탭 키 목록을 정의합니다.
const TABS = [
  ArticleType.COMMUNITY,
  ArticleType.NOTICE,
  ArticleType.FAQ,
];
type TabKey = ArticleType | "COMMUNITY"; // 실제 탭 키 타입

interface Props {
  user: User | null;
}

export default function ArticleList({ user }: Props) {
  const navigate = useNavigate();
  // URL 쿼리 파라미터를 관리합니다.
  const [searchParams, setSearchParams] = useSearchParams();

  // URL에서 'tab' 파라미터를 읽습니다.
  const urlTab = searchParams.get("tab") as TabKey | null;

  // 1. activeTab 상태를 URL에서 가져오거나 기본값으로 설정합니다.
  // URL 파라미터가 유효한 탭 키가 아닐 경우 기본값 COMMUNITY를 사용합니다.
  const initialTab: TabKey = (urlTab && TABS.includes(urlTab as ArticleType))
    ? urlTab
    : ArticleType.COMMUNITY;

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [articles, setArticles] = useState<ArticleDto[]>([]);
  const [loading, setLoading] = useState(true);

  // 슬라이딩 언더바 관련 state & ref
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // 언더바 위치 업데이트 함수
  const updateUnderlinePosition = (currentTab: TabKey) => {
    const tabs = [
      { key: ArticleType.COMMUNITY },
      { key: ArticleType.NOTICE },
      { key: ArticleType.FAQ },
    ];
    // 현재 활성화된 탭의 인덱스를 찾습니다.
    const index = tabs.findIndex((t) => t.key === currentTab);
    const el = tabRefs.current[index];
    if (el) {
      setUnderlineStyle({
        left: el.offsetLeft,
        width: el.offsetWidth,
      });
    }
  };

  // 2. URL 파라미터 변경을 감지하고 activeTab을 업데이트합니다.
  useEffect(() => {
    // searchParams의 'tab'이 변경되면 activeTab 상태를 업데이트합니다.
    const currentUrlTab = searchParams.get("tab") as TabKey | null;
    const newTab: TabKey = (currentUrlTab && TABS.includes(currentUrlTab as ArticleType))
      ? currentUrlTab
      : ArticleType.COMMUNITY;
      
    setActiveTab(newTab);
    // 탭이 변경되었으므로 언더바 위치를 업데이트합니다.
    updateUnderlinePosition(newTab);

  }, [searchParams]); // searchParams가 변경될 때마다 실행

  // 3. activeTab 변경 시 (URL 변경으로 인한) API 호출
  useEffect(() => {
    // API 호출 전에 로딩 상태를 true로 설정합니다.
    setLoading(true);

    const params = { articleType: activeTab };
    
    // API 호출 (필터링)
    getArticles(params)
      .then(setArticles)
      .catch(() => console.log("게시글 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));

  }, [activeTab]); // activeTab이 변경될 때마다 실행 (URL 변경 감지 후 실행)


  // 4. 초기 렌더링 후 언더바 위치 설정 (마운트 시)
  useEffect(() => {
    // DOM이 완전히 렌더링되고 ref가 설정된 후 언더바 위치 계산
    requestAnimationFrame(() => {
      setTimeout(() => {
        // 초기 activeTab을 기준으로 위치를 설정합니다.
        updateUnderlinePosition(initialTab); 
      }, 50); 
    });
  }, []); // [] : 최초 마운트 시 한 번만 실행

  // 탭 클릭 핸들러: URL 쿼리 파라미터를 변경합니다.
  const handleTabClick = (tabKey: TabKey) => {
    // URL 쿼리 파라미터를 업데이트합니다. 
    // 이 변경은 위의 useEffect([searchParams])를 트리거하고 activeTab이 업데이트됩니다.
    setSearchParams({ tab: tabKey });
  };
  
  // (생략된 기타 함수 및 렌더링 로직은 동일)
  const getArticleTypeBadge = (type: ArticleType) => {
    // ... (기존 코드와 동일)
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
    <div className="max-w-[1280px] mx-auto px-4 xl:px-0 py-8 flex items-center justify-center ">
      <div className="text-gray-500">로딩 중...</div>
    </div>
  );

  return (
    <div className="max-w-[1280px] mx-auto py-8 px-5 px-4 xl:px-0">
      <div className="flex md:flex-row justify-between items-start md:items-center mb-6 gap-4">
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
          { key: ArticleType.COMMUNITY, label: "자유게시판" },
          { key: ArticleType.NOTICE, label: "공지사항" },
          { key: ArticleType.FAQ, label: "FAQ" },
        ].map((tab, index) => (
          <button
            key={tab.key}
            ref={(el) => { tabRefs.current[index] = el; }}
            onClick={() => handleTabClick(tab.key as TabKey)} // 핸들러 변경
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