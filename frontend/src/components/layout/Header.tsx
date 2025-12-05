import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import type { User } from "../../common/types";
import { logout, fetchSuggestions, fetchPopularKeywords, saveSearchLog } from "../../common/api";
import { RealTimeSearch } from "../../common/websocket";

import "../../css/modules.css";

type Props = {
    user: User | null;
    setUser: (user: User | null) => void;
};

export default function Header({ user, setUser }: Props) {
    const cartItemCount = 3;

    const navigate = useNavigate();
    const location = useLocation();
    const [searchKeyword, setSearchKeyword] = useState("");

    // 자동완성 관련 state
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    // 인기 검색어 state
    const [popularKeywords, setPopularKeywords] = useState<string[]>([]);
    // 실시간 검색어 (WebSocket)
    const { rankings, isConnected } = RealTimeSearch();

    // 어떤 탭을 보여줄지
    const [keywordTab, setKeywordTab] = useState<"popular" | "realtime">("popular");
    const [isShowingPopular, setIsShowingPopular] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleLogout = async () => {
        try {
            await logout();
            setUser(null);
            navigate("/");
        } catch (err) {
            console.error(err);
        }
    };

    // URL 쿼리 변화 감지 → input에 동기화
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const kw = params.get("keyword") || "";
        setSearchKeyword(kw);
    }, [location.search]);

    // 컴포넌트 마운트 시 인기 검색어 가져오기
    useEffect(() => {
        handleFetchPopularKeywords();
    }, []);

    // 외부 클릭 시 드롭다운 닫기
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // 인기 검색어 API 호출
    const handleFetchPopularKeywords = async () => {
        try {
            const keywords = await fetchPopularKeywords(10);
            setPopularKeywords(keywords);
            console.log("✅ 인기 검색어 로드:", keywords);
        } catch (error) {
            console.error("❌ 인기 검색어 조회 오류:", error);
            setPopularKeywords([]);
        }
    };

    // 자동완성 API 호출
    const handleFetchSuggestions = async (keyword: string) => {
        try {
            const results = await fetchSuggestions(keyword);
            setSuggestions(results);
            setShowSuggestions(results.length > 0);
            setIsShowingPopular(false);
        } catch (error) {
            console.error("❌ 자동완성 API 오류:", error);
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    // 검색어 입력 시 디바운스 처리
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchKeyword(value);
        setSelectedIndex(-1);

        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        // 입력값이 비어있으면 인기/실시간 검색어 표시
        if (value.trim() === "") {
            setSuggestions([]);
            setIsShowingPopular(true);
            const hasData = (keywordTab === "popular" && popularKeywords.length > 0) ||
                (keywordTab === "realtime" && rankings.length > 0);
            setShowSuggestions(hasData);
            return;
        }

        // 300ms 후 API 호출
        debounceTimer.current = setTimeout(() => {
            handleFetchSuggestions(value);
        }, 300);
    };

    // 검색 시 URL 쿼리로 이동
    // const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    //     e.preventDefault();

    //     let keyword = searchKeyword;
    //     const displayList = isShowingPopular
    //         ? (keywordTab === "popular" ? popularKeywords : rankings.map(r => r.keyword))
    //         : suggestions;

    //     if (selectedIndex >= 0 && selectedIndex < displayList.length) {
    //         keyword = displayList[selectedIndex];
    //     }

    //     const trimmed = keyword.trim();
    //     const query = new URLSearchParams();

    //     if (trimmed !== "") {
    //         query.append("keyword", trimmed);

    //         // 🆕 검색 로그 저장
    //         saveSearchLog(trimmed).catch(err =>
    //             console.error("검색 로그 저장 실패:", err)
    //         );
    //     }

    //     const params = new URLSearchParams(location.search);
    //     const currentCategory = params.get("category");
    //     if (currentCategory) query.append("category", currentCategory);

    //     navigate(`/search?${query.toString()}`);
    //     setShowSuggestions(false);
    // };

    // 연관 검색어 클릭
    const handleSuggestionClick = (suggestion: string) => {
        setSearchKeyword(suggestion);

        const query = new URLSearchParams();
        query.append("keyword", suggestion);

        // 🆕 검색 로그 저장
        saveSearchLog(suggestion).catch(err =>
            console.error("검색 로그 저장 실패:", err)
        );

        const params = new URLSearchParams(location.search);
        const currentCategory = params.get("category");
        if (currentCategory) query.append("category", currentCategory);

        navigate(`/search?${query.toString()}`);
        setShowSuggestions(false);
    };

    // 키보드 네비게이션
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const displayList = isShowingPopular
            ? (keywordTab === "popular" ? popularKeywords : rankings.map(r => r.keyword))
            : suggestions;

        if (!showSuggestions || displayList.length === 0) return;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < displayList.length - 1 ? prev + 1 : prev
                );
                break;
            case "ArrowUp":
                e.preventDefault();
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
                break;
            case "Escape":
                setShowSuggestions(false);
                setSelectedIndex(-1);
                break;
        }
    };

    // 검색창 포커스 시
    const handleInputFocus = () => {
        if (searchKeyword.trim() === "") {
            setIsShowingPopular(true);

            // 현재 탭에 데이터가 없으면 다른 탭으로 전환
            if (keywordTab === "realtime" && rankings.length === 0 && popularKeywords.length > 0) {
                setKeywordTab("popular");
                setShowSuggestions(true);
            } else if (keywordTab === "popular" && popularKeywords.length === 0 && rankings.length > 0) {
                setKeywordTab("realtime");
                setShowSuggestions(true);
            } else {
                const hasData = (keywordTab === "popular" && popularKeywords.length > 0) ||
                    (keywordTab === "realtime" && rankings.length > 0);
                setShowSuggestions(hasData);
            }
        } else if (suggestions.length > 0) {
            setShowSuggestions(true);
        }
    };

    // 표시할 목록 결정
    const displayList = isShowingPopular
        ? (keywordTab === "popular" ? popularKeywords : rankings.map(r => r.keyword))
        : suggestions;

    return (
        <header
            className="container"
            data-model-id="395:13790"
            role="banner"
        >
            {/* 1 */}
            <div className="flex w-full justify-end mt-1">
                <nav className="flex gap-2 text-light">
                    {user ? (
                        <>
                            <span>{user.nickName} 님</span>
                            {user.role === "ADMIN" && (
                                <NavLink to="/admin">
                                    관리자 페이지
                                </NavLink>
                            )}
                            <NavLink to="/mypage/qna/new">
                                1:1 문의
                            </NavLink>
                            <button onClick={handleLogout}>
                                로그아웃
                            </button>
                        </>
                    ) : (
                        <>
                            <NavLink to="/login" className="text-light">
                                로그인
                            </NavLink>
                            <NavLink to="/signup">
                                회원가입
                            </NavLink>
                            <NavLink to="/login">
                                1:1 문의
                            </NavLink>
                        </>
                    )}
                </nav>
            </div>

            {/* 2 */}
            <div className="flex items-center justify-between gap-5 relative">
                {/* 로고 */}
                <a
                    href="/"
                    className="relative block w-36 h-6 flex-shrink-0"
                    aria-label="DDANG 홈으로 이동"
                >
                    <img
                        src="https://c.animaapp.com/vpqlbV8X/img/ddang.svg"
                        alt="DDANG"
                        className="w-full h-full object-contain"
                    />
                </a>

                {/* 검색바 */}
                <div className="w-full">
                    <form
                        className="
                        header-search-form w-[450px] px-3 py-2 border border-[#111111] rounded-[0.4rem]
                        flex items-center gap-2 flex-1 grow flex relative"
                        role="search"
                        onSubmit={(e) => {
                            e.preventDefault();
                            console.log("Search submitted:", searchKeyword);
                        }}
                    >
                        <label htmlFor="search-input" className="sr-only">
                            검색
                        </label>
                        <input
                            id="search-input"
                            type="text"
                            value={searchKeyword}
                            placeholder="검색어를 입력하세요"
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            onFocus={handleInputFocus}
                            autoComplete="off"
                            className="search-input w-full"
                            aria-label="검색어 입력"
                        />

                        <button
                            type="button"
                            className="inline-flex flex-col items-start gap-2.5 p-[0.5px] relative flex-[0_0_auto]"
                            aria-label="검색 드롭다운"
                        >
                            <img
                                className="relative w-[9px] h-1.5 mt-[-0.50px] mb-[-0.50px] ml-[-0.50px] mr-[-0.50px]"
                                alt=""
                                src="https://c.animaapp.com/vpqlbV8X/img/vector.svg"
                            />
                        </button>

                        {/* 자동완성 또는 인기 검색어 드롭다운 */}
                        {showSuggestions && displayList.length > 0 && (
                            <div className="autocomplete-dropdown">
                                {/* 키워드 목록을 보여줄 때만 탭 표시 */}
                                {isShowingPopular && (
                                    <div className="keyword-tabs">
                                        <button
                                            className={`tab ${keywordTab === "realtime" ? "active" : ""}`}
                                            onClick={() => {
                                                setKeywordTab("realtime");
                                                setSelectedIndex(-1);
                                                setShowSuggestions(rankings.length > 0);
                                            }}
                                        >
                                            <span className="tab-icon">🔥</span>
                                            실시간 검색어
                                            {keywordTab === "realtime" && !isConnected && (
                                                <span className="connection-status"> (연결 중...)</span>
                                            )}
                                        </button>
                                        <button
                                            className={`tab ${keywordTab === "popular" ? "active" : ""}`}
                                            onClick={() => {
                                                setKeywordTab("popular");
                                                setSelectedIndex(-1);
                                                setShowSuggestions(popularKeywords.length > 0);
                                            }}
                                        >
                                            <span className="tab-icon">⭐</span>
                                            인기 검색어
                                        </button>
                                    </div>
                                )}

                                {displayList.map((item, index) => (
                                    <div
                                        key={index}
                                        className={`autocomplete-item ${selectedIndex === index ? "selected" : ""}`}
                                        onClick={() => handleSuggestionClick(item)}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                    >
                                        {isShowingPopular ? (
                                            <span className={`ranking-badge ${index < 3 ? "top3" : ""}`}>
                                                {index + 1}
                                            </span>
                                        ) : (
                                            <span className="search-icon">🔍</span>
                                        )}
                                        {item}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div
                            className="search-divider"
                            aria-hidden="true"
                        />

                        <button type="submit" aria-label="검색">
                            <img
                                className="relative flex-[0_0_auto]"
                                alt=""
                                src="https://c.animaapp.com/vpqlbV8X/img/search.svg"
                            />
                        </button>
                    </form>
                </div>

                {/* 아이콘 */}
                <nav
                    className="inline-flex items-center gap-4 relative flex-shrink-0"
                    aria-label="주요 메뉴"
                >
                    <button
                        className="icon-container"
                        aria-label="알림"
                    >
                        <img
                            className="icon-img"
                            alt=""
                            src="https://c.animaapp.com/vpqlbV8X/img/group@2x.png"
                        />
                    </button>

                    <button
                        className="icon-container"
                        aria-label="찜하기"
                    >
                        <img
                            className="icon-img"
                            alt=""
                            src="https://c.animaapp.com/vpqlbV8X/img/vector-1.svg"
                        />
                    </button>

                    <a
                        href="/mypage"
                        aria-label="마이페이지"
                        className="icon-container"
                    >
                        <img
                            className="icon-img"
                            alt=""
                            src="https://c.animaapp.com/vpqlbV8X/img/mypage.svg"
                        />
                    </a>

                    <a
                        href="/cart"
                        className="icon-container"
                        aria-label={`장바구니 ${cartItemCount}개 상품`}
                    >
                        <img
                            className="icon-img"
                            alt=""
                            src="https://c.animaapp.com/vpqlbV8X/img/group-1@2x.png"
                        />

                        {cartItemCount > 0 && (
                            <div
                                className="cart-badge-container absolute -top-1 -right-1"
                                aria-hidden="true"
                            >
                                <div
                                    className={`cart-badge-count 
                                        ${cartItemCount > 0
                                            ? 'opacity-100'
                                            : 'opacity-0 pointer-events-none'
                                        }`} >
                                    {cartItemCount}
                                </div>
                            </div>
                        )}
                    </a>
                </nav>
            </div>
        </header>
    );
}