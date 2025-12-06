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
    const [lastScrollY, setLastScrollY] = useState(0);
    const [isScrollDown, setIsScrollDown] = useState(false);
    const [isSticky, setIsSticky] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // 스크롤 방향 감지 (10px 이상 차이날 때만)
            if (Math.abs(currentScrollY - lastScrollY) > 5) {
                setIsScrollDown(currentScrollY > lastScrollY && currentScrollY > 100);
                setLastScrollY(currentScrollY);
            }

            setIsSticky(currentScrollY > 10);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScrollY]);

    // 실시간 검색어 & 최근 검색어
    const [popularKeywords, setPopularKeywords] = useState<string[]>([]); // API 인기 검색어
    const { rankings, isConnected } = RealTimeSearch(); // WebSocket 실시간
    const [recentKeywords, setRecentKeywords] = useState<string[]>([]); // 로컬스토리지 최근검색어
    const [isAutoSave, setIsAutoSave] = useState(true); // 자동저장 여부

    const [isShowingPopular, setIsShowingPopular] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [searchKeyword, setSearchKeyword] = useState("");

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
            setShowSuggestions(true);
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
        const currentDisplayList = isShowingPopular ? popularKeywords : suggestions;

        if (selectedIndex >= 0 && selectedIndex < currentDisplayList.length) {
            keyword = currentDisplayList[selectedIndex];
        }

        const trimmed = keyword.trim();
        const query = new URLSearchParams();

        if (trimmed !== "") {
            query.append("keyword", trimmed);

            // 🆕 검색 로그 저장 (API)
            saveSearchLog(trimmed).catch(err => console.error("검색 로그 저장 실패:", err));
            // 로컬 저장
            saveRecentKeyword(trimmed);
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
        saveSearchLog(suggestion).catch(err => console.error("검색 로그 저장 실패:", err));
        saveRecentKeyword(suggestion);

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
        const currentDisplayList = isShowingPopular ? popularKeywords : suggestions;

        // 드롭다운이 안 보이면 키보드 네비게이션 비활성화
        if (!showSuggestions) return;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                if (currentDisplayList.length > 0) {
                    setSelectedIndex(prev =>
                        prev < currentDisplayList.length - 1 ? prev + 1 : prev
                    );
                }
                break;
            case "ArrowUp":
                e.preventDefault();
                if (currentDisplayList.length > 0) {
                    setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
                }
                break;
            case "Enter":
                // 키보드로 선택한 항목이 있으면 input에 입력만 하고 검색 안 함
                if (selectedIndex >= 0 && currentDisplayList.length > 0) {
                    e.preventDefault();
                    setSearchKeyword(currentDisplayList[selectedIndex]);
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

    // 최근 검색어 로드
    useEffect(() => {
        const saved = localStorage.getItem("recent_searches");
        if (saved) {
            setRecentKeywords(JSON.parse(saved));
        }
    }, []);

    // 최근 검색어 저장
    const saveRecentKeyword = (keyword: string) => {
        if (!isAutoSave || !keyword.trim()) return;

        const newKeywords = [keyword, ...recentKeywords.filter(k => k !== keyword)].slice(0, 10);
        setRecentKeywords(newKeywords);
        localStorage.setItem("recent_searches", JSON.stringify(newKeywords));
    };

    // 최근 검색어 삭제
    const removeRecentKeyword = (keyword: string) => {
        const newKeywords = recentKeywords.filter(k => k !== keyword);
        setRecentKeywords(newKeywords);
        localStorage.setItem("recent_searches", JSON.stringify(newKeywords));
    };

    // 검색창 포커스 시
    const handleInputFocus = () => {
        if (searchKeyword.trim() === "") {
            setShowSuggestions(true);
        }
    };

    return (
        <div className={`sticky top-0 z-50 bg-white transition-shadow duration-300 ${isSticky ? "shadow-sm" : ""}`}>
            {/* 상단 네비 */}
            <div
                className={`w-full max-w-[1280px] mx-auto flex justify-end overflow-hidden transition-all duration-300 ease-in-out ${isScrollDown ? "max-h-0 opacity-0" : "max-h-[40px] opacity-100 pt-2"}`}
            >
                <nav className="flex gap-4 text-sm text-[#aaa]">
                    {user ? (
                        <>
                            <span>{user.nickName} 님</span>
                            {user.role === "ADMIN" && (
                                <NavLink to="/admin" className="hover:text-[#666] transition-colors">
                                    관리자 페이지
                                </NavLink>
                            )}
                            <NavLink to="/mypage/qna/new" className="hover:text-[#666] transition-colors">
                                1:1 문의
                            </NavLink>
                            <button onClick={handleLogout} className="hover:text-[#666] transition-colors">
                                로그아웃
                            </button>
                        </>
                    ) : (
                        <>
                            <NavLink to="/login" className="hover:text-[#666] transition-colors">
                                로그인
                            </NavLink>
                            <NavLink to="/signup" className="hover:text-[#666] transition-colors">
                                회원가입
                            </NavLink>
                            <NavLink
                                to="/mypage/qna/new"
                                onClick={(e) => handleProtectedNavigation(e, "/mypage/qna/new")}
                                className="hover:text-[#666] transition-colors"
                            >
                                1:1 문의
                            </NavLink>
                        </>
                    )}
                </nav>
            </div>
            {/* 메인헤더 */}
            <div className="w-full bg-white py-2">
                <div className="w-full max-w-[1280px] mx-auto flex gap-3 items-center">
                    {/* 로고 */}
                    <a
                        href="/"
                        className="relative block w-32 h-8 flex flex-shrink-0"
                        aria-label="DDANG 홈으로 이동"
                    >
                        <img
                            src="https://c.animaapp.com/vpqlbV8X/img/ddang.svg"
                            alt="DDANG"
                            className="w-full h-full object-contain"
                        />
                    </a>

                    {/* 검색바 */}
                    <div
                        className={`search-container ${showSuggestions ? "active" : ""}`}
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
                                className="w-full border-none outline-none bg-transparent h-full ring-0 text-sm text-[#333] placeholder-[#aaa]"
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
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowSuggestions(!showSuggestions);
                                    if (!showSuggestions) {
                                        inputRef.current?.focus();
                                    }
                                }}
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

                        {/* Dropdown */}
                        {showSuggestions && (
                            <div className="autocomplete-dropdown">
                                {searchKeyword ? (
                                    /* 1. 자동완성 목록 (검색어 있을 때) */
                                    suggestions.length > 0 && suggestions.map((item, index) => (
                                        <div
                                            key={index}
                                            className={`autocomplete-item ${selectedIndex === index ? "selected" : ""}`}
                                            onClick={() => handleSuggestionClick(item)}
                                            onMouseEnter={() => setSelectedIndex(index)}
                                        >
                                            <span className="text-base opacity-60">🔍</span>
                                            {item.split(new RegExp(`(${searchKeyword})`, "gi")).map((part, i) =>
                                                part.toLowerCase() === searchKeyword.toLowerCase() ? (
                                                    <span key={i} className="text-[#b17576] font-bold">{part}</span>
                                                ) : (
                                                    part
                                                )
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    /* 2. 최근 검색어 + 인기 검색어 (검색어 없을 때) */
                                    <div className="p-5">
                                        {/* 최근 검색어 */}
                                        <div className="mb-6">
                                            <div className="flex justify-between items-center mb-3">
                                                <h3 className="text-sm font-bold text-[#333]">최근 검색어</h3>
                                                {recentKeywords.length > 0 && (
                                                    <button
                                                        onClick={() => {
                                                            setRecentKeywords([]);
                                                            localStorage.removeItem("recent_searches");
                                                        }}
                                                        className="text-xs text-[#999] hover:text-[#666] underline"
                                                    >
                                                        전체삭제
                                                    </button>
                                                )}
                                            </div>
                                            {recentKeywords.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {recentKeywords.map((keyword, index) => (
                                                        <div key={index} className="px-3 py-1.5 bg-white border border-[#ddd] rounded-full flex items-center gap-2 text-sm text-[#555] cursor-pointer hover:bg-[#f5f5f5]">
                                                            <span onClick={() => handleSuggestionClick(keyword)}>{keyword}</span>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    removeRecentKeyword(keyword);
                                                                }}
                                                                className="text-[#bbb] hover:text-[#999]"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-[#aaa] py-2">최근 검색 내역이 없습니다.</p>
                                            )}
                                        </div>

                                        {/* 인기 검색어 */}
                                        <div>
                                            <h3 className="text-sm font-bold text-[#333] mb-3">인기 검색어</h3>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                                {popularKeywords.map((keyword, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center gap-3 cursor-pointer hover:bg-[#fafafa] p-1 rounded"
                                                        onClick={() => handleSuggestionClick(keyword)}
                                                    >
                                                        <span className={`w-5 font-bold ${index < 3 ? "text-[#b17576]" : "text-[#333]"}`}>
                                                            {index + 1}
                                                        </span>
                                                        <span className="text-sm text-[#333] truncate">{keyword}</span>
                                                        {/* 등락폭은 API 데이터 부재로 생략, 추후 추가 가능 */}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Footer Controls */}
                                <div className="flex justify-between items-center px-4 py-3 bg-[#f9f9f9] border-t border-[#eee]">
                                    <div
                                        className="flex items-center gap-2 text-xs text-[#777] cursor-pointer"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsAutoSave(!isAutoSave);
                                        }}
                                    >
                                        <div className={`w-8 h-4 rounded-full relative transition-colors ${isAutoSave ? "bg-[#b17576]" : "bg-[#ddd]"}`}>
                                            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${isAutoSave ? "left-4.5" : "left-0.5"}`} style={{ left: isAutoSave ? '18px' : '2px' }} />
                                        </div>
                                        자동저장 {isAutoSave ? "끄기" : "켜기"}
                                    </div>
                                    <button
                                        className="text-xs text-[#777] hover:text-[#333]"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowSuggestions(false);
                                        }}
                                    >
                                        닫기
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 아이콘 */}
                    <nav
                        className="flex items-center gap-3 relative flex-shrink-0 ml-auto"
                        aria-label="주요 메뉴"
                    >
                        <button
                            className="p-1 hover:opacity-70 transition-opacity"
                            aria-label="알림"
                        >
                            <img
                                className="w-6 h-6"
                                alt=""
                                src="https://c.animaapp.com/vpqlbV8X/img/group@2x.png"
                            />
                        </button>

                        <button
                            className="p-1 hover:opacity-70 transition-opacity"
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
                            className="p-1 hover:opacity-70 transition-opacity"
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
                            className="p-1 hover:opacity-70 transition-opacity relative"
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
            </div>
            {/* PC 카테고리 탭 (Full Width Border) */}
            <div
                className={`hidden md:block w-full bg-white overflow-hidden transition-all duration-300 ease-in-out ${isScrollDown ? "max-h-0 opacity-0 border-none" : "max-h-[60px] opacity-100 border-b"}`}
            >
                <div className="w-full max-w-[1280px] mx-auto">
                    <nav className="flex gap-6" aria-label="카테고리">
                        <NavLink
                            to="/"
                            className={({ isActive }) => `nav-tab ${isActive || location.pathname === '/' ? "active" : "inactive"}`}
                        >
                            추천
                        </NavLink>
                        <NavLink
                            to="/search"
                            className={({ isActive }) => `nav-tab ${isActive ? "active" : "inactive"}`}
                        >
                            상품검색
                        </NavLink>
                        <NavLink
                            to="/register"
                            onClick={(e) => handleProtectedNavigation(e, "/register")}
                            className={({ isActive }) => `nav-tab ${isActive ? "active" : "inactive"}`}
                        >
                            상품등록
                        </NavLink>
                        <NavLink
                            to="/community"
                            className={({ isActive }) => `nav-tab ${isActive ? "active" : "inactive"}`}
                        >
                            커뮤니티
                        </NavLink>
                        <NavLink
                            to="/chat"
                            onClick={(e) => handleProtectedNavigation(e, "/chat")}
                            className={({ isActive }) => `nav-tab ${isActive ? "active" : "inactive"}`}
                        >
                            챗봇문의
                        </NavLink>
                    </nav>
                </div>
            </div>
        </div>
    );
}