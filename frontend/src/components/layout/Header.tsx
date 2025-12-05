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
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // 보호된 경로 이동 핸들러
    const handleProtectedNavigation = (e: React.MouseEvent, path: string) => {
        if (!user) {
            e.preventDefault();
            const goLogin = window.confirm("로그인이 필요한 서비스입니다.\n로그인 페이지로 이동하시겠습니까?");
            if (goLogin) {
                navigate("/login", { state: { from: path } });
            }
        }
    };



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

            // API 응답 후에만 드롭다운 표시
            setIsShowingPopular(false);
            setShowSuggestions(true);
        } catch (error) {
            console.error("❌ 자동완성 API 오류:", error);
            setSuggestions([]);
            setShowSuggestions(true);
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

        if (value.trim() === "") {
            setSuggestions([]);
            setIsShowingPopular(true);
            const hasData = (keywordTab === "popular" && popularKeywords.length > 0) ||
                (keywordTab === "realtime" && rankings.length > 0);
            setShowSuggestions(hasData);
            return;
        }

        // API 응답 대기 (즉시 드롭다운 표시하지 않음)
        setIsShowingPopular(false);

        debounceTimer.current = setTimeout(() => {
            handleFetchSuggestions(value);
        }, 300);
    };

    // 검색 시 URL 쿼리로 이동
    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        let keyword = searchKeyword;
        const displayList = isShowingPopular
            ? (keywordTab === "popular" ? popularKeywords : rankings.map(r => r.keyword))
            : suggestions;

        if (selectedIndex >= 0 && selectedIndex < displayList.length) {
            keyword = displayList[selectedIndex];
        }

        const trimmed = keyword.trim();
        const query = new URLSearchParams();

        if (trimmed !== "") {
            query.append("keyword", trimmed);

            // 🆕 검색 로그 저장
            saveSearchLog(trimmed).catch(err =>
                console.error("검색 로그 저장 실패:", err)
            );
        }

        const params = new URLSearchParams(location.search);
        const currentCategory = params.get("category");
        if (currentCategory) query.append("category", currentCategory);

        navigate(`/search?${query.toString()}`);
        setShowSuggestions(false);
    };

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

        // 검색바로 포커스 이동
        inputRef.current?.focus();
    };

    // 키보드 네비게이션
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const displayList = isShowingPopular
            ? (keywordTab === "popular" ? popularKeywords : rankings.map(r => r.keyword))
            : suggestions;

        // 드롭다운이 안 보이면 키보드 네비게이션 비활성화
        if (!showSuggestions) return;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                if (displayList.length > 0) {
                    setSelectedIndex(prev =>
                        prev < displayList.length - 1 ? prev + 1 : prev
                    );
                }
                break;
            case "ArrowUp":
                e.preventDefault();
                if (displayList.length > 0) {
                    setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
                }
                break;
            case "Enter":
                // 키보드로 선택한 항목이 있으면 input에 입력만 하고 검색 안 함
                if (selectedIndex >= 0 && displayList.length > 0) {
                    e.preventDefault();
                    setSearchKeyword(displayList[selectedIndex]);
                    setShowSuggestions(false);
                    setSelectedIndex(-1);
                }
                // selectedIndex === -1 이면 그냥 form submit (검색 실행)
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
        }
    };

    // 표시할 목록 결정
    const displayList = isShowingPopular
        ? (keywordTab === "popular" ? popularKeywords : rankings.map(r => r.keyword))
        : suggestions;

    return (
        <header
            className="header-wrapper-sticky"
            data-model-id="395:13790"
            role="banner"
        >
            <div className="container">
                {/* 상단 네비 */}
                <div className="flex w-full justify-end mt-1">
                    <nav className="flex gap-4 text-light text-xs text-gray-500">
                        {user ? (
                            <>
                                <span>{user.nickName} 님</span>
                                {user.role === "ADMIN" && (
                                    <NavLink to="/admin" className="hover:text-black">
                                        관리자 페이지
                                    </NavLink>
                                )}
                                <NavLink to="/mypage/qna/new" className="hover:text-black">
                                    1:1 문의
                                </NavLink>
                                <button onClick={handleLogout} className="hover:text-black">
                                    로그아웃
                                </button>
                            </>
                        ) : (
                            <>
                                <NavLink to="/login" className="hover:text-black">
                                    로그인
                                </NavLink>
                                <NavLink to="/signup" className="hover:text-black">
                                    회원가입
                                </NavLink>
                                <NavLink
                                    to="/mypage/qna/new"
                                    onClick={(e) => handleProtectedNavigation(e, "/mypage/qna/new")}
                                    className="hover:text-black"
                                >
                                    1:1 문의
                                </NavLink>
                            </>
                        )}
                    </nav>
                </div>

                {/* 메인 헤더 */}
                <div className="sticky top-0 z-50 bg-white w-full hidden md:block shadow-sm">
                    <div className="header-pc-sticky container mx-auto border-none">
                        {/* 로고 */}
                        <a
                            href="/"
                            className="relative block w-32 h-8 flex-shrink-0"
                            aria-label="DDANG 홈으로 이동"
                        >
                            <img
                                src="https://c.animaapp.com/vpqlbV8X/img/ddang.svg"
                                alt="DDANG"
                                className="w-full h-full object-contain"
                            />
                        </a>

                        {/* 검색바 */}
                        <div className="flex-1 max-w-xl">
                            <div
                                className={`search-container ${showSuggestions && displayList.length > 0 ? "active" : ""}`}
                                ref={searchRef}
                                onClick={() => inputRef.current?.focus()}
                            >
                                <form
                                    className={`search-bar ${showSuggestions ? "active" : ""}`}
                                    role="search"
                                    onSubmit={handleSearch}
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
                                        className="search-input w-full border-none outline-none bg-transparent h-full ring-0"
                                        aria-label="검색어 입력"
                                        ref={inputRef}
                                    />

                                    {searchKeyword && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearchKeyword("");
                                                setSuggestions([]);
                                                setIsShowingPopular(true);
                                                const hasData = (keywordTab === "popular" && popularKeywords.length > 0) ||
                                                    (keywordTab === "realtime" && rankings.length > 0);
                                                setShowSuggestions(hasData);
                                                inputRef.current?.focus();
                                            }}
                                            className="text-gray-400 hover:text-gray-600 p-1"
                                            aria-label="검색어 삭제"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        className={`dropdown-arrow ${showSuggestions ? "active" : ""}`}
                                        aria-label="검색 드롭다운"
                                    >
                                        <img
                                            className="relative w-[9px] h-1.5 mt-[-0.50px] mb-[-0.50px] ml-[-0.50px] mr-[-0.50px]"
                                            alt=""
                                            src="https://c.animaapp.com/vpqlbV8X/img/vector.svg"
                                        />
                                    </button>

                                    <div
                                        className="search-divider"
                                        aria-hidden="true"
                                    />

                                    <button type="submit" aria-label="검색" className="pl-2">
                                        <img
                                            className="relative flex-[0_0_auto]"
                                            alt=""
                                            src="https://c.animaapp.com/vpqlbV8X/img/search.svg"
                                        />
                                    </button>
                                </form>

                                {/* 자동완성 드롭다운 */}
                                {showSuggestions && displayList.length > 0 && (
                                    <div className="autocomplete-dropdown">
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

                                        {displayList.length > 0 ? (
                                            displayList.map((item, index) => (
                                                <div
                                                    key={index}
                                                    className={`py-3 px-4 cursor-pointer flex items-center gap-2 text-sm text-[#333] transition-colors border-b border-[#f0f0f0] 
                                                    ${selectedIndex === index ? "selected" : "hover:bg-[#f5f5f5]"} 
                                                    ${index === displayList.length - 1 ? "border-b-0" : ""}`}
                                                    onClick={() => handleSuggestionClick(item)}
                                                    onMouseEnter={() => setSelectedIndex(index)}
                                                >
                                                    {isShowingPopular ? (
                                                        <span className={`ranking-badge ${index < 3 ? "top3" : ""}`}>
                                                            {index + 1}
                                                        </span>
                                                    ) : (
                                                        <span className="text-base opacity-60">🔍</span>
                                                    )}
                                                    {item}
                                                </div>
                                            ))
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 아이콘 */}
                        <nav
                            className="header-icon-container"
                            aria-label="주요 메뉴"
                        >
                            <button
                                className="header-icon-link"
                                aria-label="알림"
                            >
                                <img
                                    className="w-6 h-6"
                                    alt=""
                                    src="https://c.animaapp.com/vpqlbV8X/img/group@2x.png"
                                />
                            </button>

                            <button
                                className="header-icon-link"
                                aria-label="찜하기"
                            >
                                <img
                                    className="w-6 h-6"
                                    alt=""
                                    src="https://c.animaapp.com/vpqlbV8X/img/vector-1.svg"
                                />
                            </button>

                            <NavLink
                                to="/mypage"
                                onClick={(e) => handleProtectedNavigation(e, "/mypage")}
                                aria-label="마이페이지"
                                className="header-icon-link"
                            >
                                <img
                                    className="w-6 h-6"
                                    alt=""
                                    src="https://c.animaapp.com/vpqlbV8X/img/mypage.svg"
                                />
                            </NavLink>

                            <NavLink
                                to="/cart"
                                onClick={(e) => handleProtectedNavigation(e, "/cart")}
                                className="header-icon-link relative"
                                aria-label={`장바구니 ${cartItemCount}개 상품`}
                            >
                                <img
                                    className="w-6 h-6"
                                    alt=""
                                    src="https://c.animaapp.com/vpqlbV8X/img/group-1@2x.png"
                                />

                                {cartItemCount > 0 && (
                                    <div className="cart-badge-container">
                                        <div className="cart-badge-count">{cartItemCount}</div>
                                    </div>
                                )}
                            </NavLink>
                        </nav>
                    </div>
                    {/* PC 카테고리 탭 (Full Width Border) */}
                    <div className="hidden md:block w-full border-b bg-white">
                        <div className="container mx-auto">
                            <nav className="flex gap-6" aria-label="카테고리">
                                <NavLink
                                    to="/"
                                    className={({ isActive }) => `nav-tab-pc ${isActive || location.pathname === '/' ? "active" : "inactive"}`}
                                >
                                    추천
                                </NavLink>
                                {/* <NavLink
                                    to="/ranking"
                                    className={({ isActive }) => `nav-tab-pc ${isActive ? "active" : "inactive"}`}
                                >
                                    랭킹
                                </NavLink>
                                <NavLink
                                    to="/sale"
                                    className={({ isActive }) => `nav-tab-pc ${isActive ? "active" : "inactive"}`}
                                >
                                    세일
                                </NavLink>
                                <NavLink
                                    to="/event"
                                    className={({ isActive }) => `nav-tab-pc ${isActive ? "active" : "inactive"}`}
                                >
                                    이벤트
                                </NavLink> */}
                                <NavLink
                                    to="/register"
                                    onClick={(e) => handleProtectedNavigation(e, "/register")}
                                    className={({ isActive }) => `nav-tab-pc ${isActive ? "active" : "inactive"}`}
                                >
                                    상품등록
                                </NavLink>
                                <NavLink
                                    to="/community"
                                    className={({ isActive }) => `nav-tab-pc ${isActive ? "active" : "inactive"}`}
                                >
                                    커뮤니티
                                </NavLink>
                                <NavLink
                                    to="/chat"
                                    onClick={(e) => handleProtectedNavigation(e, "/chat")}
                                    className={({ isActive }) => `nav-tab-pc ${isActive ? "active" : "inactive"}`}
                                >
                                    챗봇문의
                                </NavLink>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}