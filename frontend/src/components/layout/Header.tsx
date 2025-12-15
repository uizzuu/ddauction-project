import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import type { User, Notification } from "../../common/types"; // Notification 타입 추가
import { 
  logout, 
  fetchSuggestions, 
  fetchPopularKeywords, 
  saveSearchLog, 
  getNotifications, // 추가
  API_BASE_URL,     // 추가
} from "../../common/api";
import { NotificationModal } from "../../common/import";
import { RealTimeSearch } from "../../common/websocket";
import { getCartItems } from "../../common/util";

type Props = {
  user: User | null;
  setUser: (user: User | null) => void;
};

export default function Header({ user, setUser }: Props) {
  // console.log("🔍 Header user:", user);

  // ----------------------------------------------------
  // 🛒 장바구니 로직
  // ----------------------------------------------------
  const [cartItemCount, setCartItemCount] = useState(0);

  const updateCartCount = () => {
    const items = getCartItems();
    setCartItemCount(items.length);
  };

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    updateCartCount();
    const handleCartUpdate = () => updateCartCount();
    window.addEventListener("cart-updated", handleCartUpdate);
    return () => window.removeEventListener("cart-updated", handleCartUpdate);
  }, [user, location.pathname]);

  // ----------------------------------------------------
  // 🔔 [NEW] 알림 로직 (데이터 관리 & WebSocket)
  // ----------------------------------------------------
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // 읽지 않은 알림 개수 계산
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    // 로그아웃 상태면 알림 초기화 및 리턴
    if (!user) {
      setNotifications([]);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    // 1. 기존 알림 불러오기 (REST API)
    getNotifications(user.userId)
      .then((data) => {
        setNotifications(data);
      })
      .catch((err) => console.error("❌ 알림 로드 실패:", err));

    // 2. WebSocket 연결 (실시간 알림 수신)
    const wsUrl = API_BASE_URL.replace("http", "ws").replace("/api", "") +
      `/ws/notifications?userId=${user.userId}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("✅ WebSocket Connected (Header Notifications)");
    };

    ws.onmessage = (event) => {
      try {
        const newNoti: Notification = JSON.parse(event.data);
        console.log("📩 새 알림 도착:", newNoti);
        // 새 알림을 리스트 최상단에 추가
        setNotifications((prev) => [newNoti, ...prev]);
      } catch (e) {
        console.error("JSON 파싱 에러:", e);
      }
    };

    ws.onclose = () => {
      console.log("🔌 WebSocket Disconnected (Header)");
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [user]); // 유저 변경(로그인/로그아웃) 시 재실행

  // ----------------------------------------------------
  // 📜 스크롤 및 헤더 스타일 로직
  // ----------------------------------------------------
  const lastScrollY = useRef(0);
  const [isScrollDown, setIsScrollDown] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Header Sliding Indicator
  const navRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });

  useEffect(() => {
    if (navRef.current) {
      const activeTab = navRef.current.querySelector('.nav-tab.active') as HTMLElement;
      if (activeTab) {
        setIndicatorStyle({
          left: activeTab.offsetLeft,
          width: activeTab.offsetWidth,
          opacity: 1
        });
      } else {
        setIndicatorStyle(prev => ({ ...prev, opacity: 0 }));
      }
    }
  }, [location.pathname]);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          if (currentScrollY <= 0) {
            setIsSticky(false);
            setIsScrollDown(false);
            lastScrollY.current = 0;
            ticking = false;
            return;
          }

          const delta = Math.abs(currentScrollY - lastScrollY.current);
          const isScrollingDown = currentScrollY > lastScrollY.current;

          lastScrollY.current = currentScrollY;

          const threshold = isScrollingDown ? 15 : 5;
          if (delta < threshold) {
            ticking = false;
            return;
          }

          if (currentScrollY > 60) {
            setIsScrollDown(isScrollingDown);
            setIsSticky(true);
          } else {
            setIsScrollDown(false);
            setIsSticky(true);
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ----------------------------------------------------
  // 🔍 검색 관련 로직 (실시간 검색어, 최근 검색어, 자동완성)
  // ----------------------------------------------------
  const [popularKeywords, setPopularKeywords] = useState<string[]>([]);
  const { rankings } = RealTimeSearch();
  const [recentKeywords, setRecentKeywords] = useState<string[]>([]);
  const [isAutoSave, setIsAutoSave] = useState(true);

  const [isShowingPopular, setIsShowingPopular] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");

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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const kw = params.get("keyword") || "";
    setSearchKeyword(kw);
  }, [location.search]);

  useEffect(() => {
    handleFetchPopularKeywords();
  }, []);

  useEffect(() => {
    if (rankings.length > 0) {
      setPopularKeywords(rankings.map(item => item.keyword));
    }
  }, [rankings]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFetchPopularKeywords = async () => {
    try {
      const keywords = await fetchPopularKeywords(10);
      setPopularKeywords(keywords);
    } catch (error) {
      console.error("❌ 인기 검색어 조회 오류:", error);
      setPopularKeywords([]);
    }
  };

  const handleFetchSuggestions = async (keyword: string) => {
    try {
      const results = await fetchSuggestions(keyword);
      setSuggestions(results);
      setIsShowingPopular(false);
      setShowSuggestions(true);
    } catch (error) {
      console.error("❌ 자동완성 API 오류:", error);
      setSuggestions([]);
      setShowSuggestions(true);
    }
  };

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

    setIsShowingPopular(false);

    debounceTimer.current = setTimeout(() => {
      handleFetchSuggestions(value);
    }, 300);
  };

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
      saveSearchLog(trimmed).catch(err => console.error("검색 로그 저장 실패:", err));
      saveRecentKeyword(trimmed);
    }

    const params = new URLSearchParams(location.search);
    const currentCategory = params.get("category");
    if (currentCategory) query.append("category", currentCategory);

    navigate(`/search?${query.toString()}`);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchKeyword(suggestion);

    const query = new URLSearchParams();
    query.append("keyword", suggestion);

    saveSearchLog(suggestion).catch(err => console.error("검색 로그 저장 실패:", err));
    saveRecentKeyword(suggestion);

    const params = new URLSearchParams(location.search);
    const currentCategory = params.get("category");
    if (currentCategory) query.append("category", currentCategory);

    navigate(`/search?${query.toString()}`);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const currentDisplayList = isShowingPopular ? popularKeywords : suggestions;

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
        if (selectedIndex >= 0 && currentDisplayList.length > 0) {
          e.preventDefault();
          setSearchKeyword(currentDisplayList[selectedIndex]);
          setShowSuggestions(false);
          setSelectedIndex(-1);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("recent_searches");
    if (saved) {
      setRecentKeywords(JSON.parse(saved));
    }
  }, []);

  const saveRecentKeyword = (keyword: string) => {
    if (!isAutoSave || !keyword.trim()) return;
    const newKeywords = [keyword, ...recentKeywords.filter(k => k !== keyword)].slice(0, 10);
    setRecentKeywords(newKeywords);
    localStorage.setItem("recent_searches", JSON.stringify(newKeywords));
  };

  const removeRecentKeyword = (keyword: string) => {
    const newKeywords = recentKeywords.filter(k => k !== keyword);
    setRecentKeywords(newKeywords);
    localStorage.setItem("recent_searches", JSON.stringify(newKeywords));
  };

  const handleInputFocus = () => {
    if (searchKeyword.trim() === "") {
      setShowSuggestions(true);
    }
  };

  // ----------------------------------------------------
  // 🖥️ UI 렌더링
  // ----------------------------------------------------
  return (
    <div className={`sticky top-0 z-50 bg-white transition-shadow duration-300 ${isSticky ? "shadow-sm" : ""}`}>
      {/* 상단 네비 */}
      <div className={`w-full max-w-[1280px] mx-auto flex justify-end overflow-x-auto scrollbar-hide whitespace-nowrap px-4 xl:px-0 transition-all duration-300 ease-in-out ${isScrollDown ? "max-h-0 opacity-0" : "max-h-[40px] opacity-100 pt-2"}`}>
        <nav className="flex gap-3 md:gap-4 text-xs md:text-sm text-[#aaa] items-center min-w-max">
          {user ? (
            <>
              <span>{user.nickName} 님</span>
              {user.role === "ADMIN" && (
                <NavLink to="/admin" className="hover:text-[#666] transition-colors">
                  관리자 페이지
                </NavLink>
              )}
              <button onClick={handleLogout} className="hover:text-[#666] transition-colors">
                로그아웃
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="hover:text-[#666] transition-colors">
                로그인
              </NavLink>
              <NavLink to="/terms" className="hover:text-[#666] transition-colors">
                회원가입
              </NavLink>
            </>
          )}
        </nav>
      </div>

      {/* 메인헤더 */}
      <div className="w-full bg-white py-2">
        <div className="w-full max-w-[1280px] mx-auto flex flex-wrap md:flex-nowrap gap-y-3 md:gap-4 items-center px-4 xl:px-0">
          {/* 로고 */}
          <a
            href="/"
            className="relative block w-24 h-6 md:w-32 md:h-8 flex flex-shrink-0 order-1"
            aria-label="DDANG 홈으로 이동"
          >
            <img
              src="https://c.animaapp.com/vpqlbV8X/img/ddang.svg"
              alt="DDANG"
              className="w-full h-full object-contain"
            />
          </a>

          {/* 검색창 영역 */}
          <div
            className={`search-container w-full md:w-[450px] order-3 md:order-2 ${showSuggestions ? "active" : ""}`}
            ref={searchRef}
            onClick={() => inputRef.current?.focus()}
          >
            <form
              className={`search-bar w-full ${showSuggestions ? "active" : ""}`}
              role="search"
              onSubmit={handleSearch}
            >
              <label htmlFor="search-input" className="sr-only">검색</label>
              <input
                id="search-input"
                type="text"
                value={searchKeyword}
                placeholder="검색어를 입력하세요"
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={handleInputFocus}
                autoComplete="off"
                className="w-full border-none outline-none bg-transparent h-full ring-0 text-base md:text-[15px] text-[#333] placeholder-[#aaa]"
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
                  className="text-gray-300 hover:text-gray-400 p-1"
                  aria-label="검색어 삭제"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </button>
              )}

              <button
                type="button"
                className={`inline-flex flex-col items-start gap-2.5 p-[0.5px] relative flex-[0_0_auto] origin-center ${showSuggestions ? "rotate-180" : "rotate-0"}`}
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
                  style={{ filter: "invert(20%)" }}
                />
              </button>

              <div className="w-[1px] h-[14px] bg-[#888] ml-1" aria-hidden="true" />
              <button type="submit" aria-label="검색" className="ml-1">
                <img
                  className="relative flex-[0_0_auto] w-5 h-5 md:w-[22px] md:h-[22px]"
                  alt=""
                  src="https://c.animaapp.com/vpqlbV8X/img/search.svg"
                  style={{ filter: "invert(20%)" }}
                />
              </button>
            </form>

            {/* Suggestions Dropdown (생략 없이 기존 코드 유지) */}
            {showSuggestions && (
              <div className="autocomplete-dropdown">
                {searchKeyword ? (
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
                          <span key={i} className="text-[#111] font-bold">{part}</span>
                        ) : (
                          part
                        )
                      )}
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-5">
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-bold text-[#333]">최근 검색어</h3>
                        {recentKeywords.length > 0 && (
                          <button
                            onClick={() => {
                              setRecentKeywords([]);
                              localStorage.removeItem("recent_searches");
                            }}
                            className="text-[14px] text-[#999] hover:text-[#666] underline"
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
                        <p className="text-[14px] text-[#aaa] py-2">최근 검색 내역이 없습니다.</p>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-[#333] mb-3">실시간 검색어</h3>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                        {popularKeywords.map((keyword, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 cursor-pointer hover:bg-[#fafafa] p-1 rounded"
                            onClick={() => handleSuggestionClick(keyword)}
                          >
                            <span className={`w-5 font-bold ${index < 3 ? "text-[#111]" : "text-[#333]"}`}>
                              {index + 1}
                            </span>
                            <span className="text-[14px] text-[#333] truncate">{keyword}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-center px-4 py-3 bg-[#f9f9f9] border-t border-[#eee]">
                  <div
                    className="flex items-center gap-2 text-xs text-[#777] cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsAutoSave(!isAutoSave);
                    }}
                  >
                    <div className={`w-8 h-4 rounded-full relative transition-colors ${isAutoSave ? "bg-[#111]" : "bg-[#ddd]"}`}>
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

          {/* 아이콘 메뉴 */}
          <nav
            className="flex items-center gap-2 md:gap-3 relative flex-shrink-0 ml-auto order-2 md:order-3"
            aria-label="주요 메뉴"
          >
            {/* 🔔 알림 아이콘 & 배지 [수정됨] */}
            <div className="relative">
              <button
                className="p-1 hover:opacity-70 transition-opacity relative"
                aria-label={`알림 ${unreadCount > 0 ? unreadCount + '개' : ''}`}
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <img
                  className="w-5 h-5 md:w-[21px] md:h-[23px]"
                  alt="알림"
                  src="https://c.animaapp.com/vpqlbV8X/img/group@2x.png"
                  style={{ filter: "invert(20%)" }}
                />
                
                {/* 알림 배지 (장바구니와 동일 스타일) */}
                {user && unreadCount > 0 && (
                  <div className="absolute top-[0.5px] -right-[0.5px] w-4 h-4 bg-[--color-alert-red] rounded-full flex justify-center items-center pointer-events-none">
                    <div className="font-bold text-[10px] leading-[5px] text-white text-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </div>
                  </div>
                )}
              </button>

              {/* 알림 모달 (Props 전달) */}
              {user && (
                <NotificationModal
                  isOpen={showNotifications}
                  onClose={() => setShowNotifications(false)}
                  notifications={notifications}     // Header에서 관리하는 상태 전달
                  setNotifications={setNotifications} // 상태 변경 함수 전달
                />
              )}
            </div>

            <NavLink
              to="/wishlist"
              onClick={(e) => handleProtectedNavigation(e, "/wishlist")}
              className="p-1 hover:opacity-70 transition-opacity"
              aria-label="찜하기"
            >
              <img
                className="w-5 h-5 md:w-[23px] md:h-[23px]"
                alt=""
                src="https://c.animaapp.com/vpqlbV8X/img/vector-1.svg"
                style={{ filter: "invert(20%)" }}
              />
            </NavLink>

            <NavLink
              to="/mypage"
              onClick={(e) => handleProtectedNavigation(e, "/mypage")}
              aria-label="마이페이지"
              className="p-1 hover:opacity-70 transition-opacity"
            >
              <img
                className="w-5 h-5 md:w-[23px] md:h-[23px]"
                alt=""
                src="https://c.animaapp.com/vpqlbV8X/img/mypage.svg"
                style={{ filter: "invert(20%)" }}
              />
            </NavLink>

            <NavLink
              to="/cart"
              onClick={(e) => handleProtectedNavigation(e, "/cart")}
              className="p-1 hover:opacity-70 transition-opacity relative"
              aria-label={`장바구니 ${cartItemCount}개 상품`}
            >
              <img
                className="w-5 h-5 md:w-[21px] md:h-[23px]"
                alt=""
                src="https://c.animaapp.com/vpqlbV8X/img/group-1@2x.png"
                style={{ filter: "invert(20%)" }}
              />

              {cartItemCount > 0 && (
                <div className="absolute top-[0.5px] -right-[0.5px] w-4 h-4 bg-[--color-alert-red] rounded-full flex justify-center items-center ">
                  <div className="font-bold text-[10px] leading-[5px] text-white text-center">{cartItemCount}</div>
                </div>
              )}
            </NavLink>
          </nav>
        </div>
      </div>

      {/* 카테고리 탭 (PC/Mobile) */}
      <div
        className={`w-full bg-white transition-all duration-300 ease-in-out ${isScrollDown ? "max-h-0 opacity-0 border-none" : "max-h-[60px] opacity-100 border-b"}`}
      >
        <div className="w-full max-w-[1280px] mx-auto relative overflow-x-auto scrollbar-hide">
          <nav className="flex gap-4 md:gap-6 relative px-4 xl:px-0 whitespace-nowrap h-fit items-center" aria-label="카테고리" ref={navRef}>
            <NavLink
              to="/"
              className={({ isActive }) => `nav-tab ${isActive || location.pathname === '/' ? "active" : "inactive"}`}
            >
              추천
            </NavLink>
            <NavLink
              to="/rank"
              className={({ isActive }) => `nav-tab ${isActive ? "active" : "inactive"}`}
            >
              랭킹
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
              to="/public-chat"
              onClick={(e) => handleProtectedNavigation(e, "/public-chat")}
              className={({ isActive }) => `nav-tab ${isActive ? "active" : "inactive"}`}
            >
              공개채팅
            </NavLink>
            <NavLink
              to="/user-chat"
              onClick={(e) => handleProtectedNavigation(e, "/user-chat")}
              className={({ isActive }) => `nav-tab ${isActive ? "active" : "inactive"}`}
            >
              일대일채팅
            </NavLink>
            <NavLink
              to={user ? `/users/${user.userId}` : "/login"}
              onClick={(e) => handleProtectedNavigation(e, user ? `/users/${user.userId}` : "/login")}
              className={({ isActive }) => `nav-tab ${isActive ? "active" : "inactive"}`}
              style={({ isActive }) => isActive ? { color: "#111", fontWeight: 600 } : {}}
            >
              프로필
            </NavLink>
            <NavLink
              to="/reviews/write/1"
              onClick={(e) => handleProtectedNavigation(e, "/reviews/write/1")}
              className={({ isActive }) => `nav-tab ${isActive ? "active" : "inactive"}`}
            >
              리뷰작성
            </NavLink>
            <NavLink
              to="/image-search"
              className={({ isActive }) => `nav-tab ${isActive ? "active" : "inactive"} flex items-center gap-1.5`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              이미지검색
            </NavLink>

            {/* Sliding Indicator */}
            <div
              className="absolute bottom-0 h-[2px] bg-black transition-all duration-300 ease-out"
              style={{
                left: `${indicatorStyle.left}px`,
                width: `${indicatorStyle.width}px`,
                opacity: indicatorStyle.opacity
              }}
            />
          </nav>
        </div>
      </div>
    </div>
  );
}