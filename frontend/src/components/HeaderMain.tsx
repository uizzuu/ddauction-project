import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import type { User } from "../types/types";

type Props = {
  user: User | null;
  setUser: (user: User | null) => void;
};

export default function HeaderMain({ user, setUser }: Props) {
  const navigate = useNavigate();
  const [searchKeyword, setSearchKeyword] = useState("");

  const handleLogout = () => {
    setUser(null);
    navigate("/");
  };

  // 🔥 검색 시 URL 쿼리로 이동
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchKeyword.trim() !== "") {
      navigate(`/search?keyword=${encodeURIComponent(searchKeyword.trim())}`);
      // 검색 후 초기화 원하면 아래 주석 해제
      // setSearchKeyword("");
    }
  };

  return (
    <header className="header">
      <div className="header-content">
        <div onClick={() => navigate("/")} className="logo img-link">
          {/* 로고 SVG */}
        </div>

        {/* 검색창 */}
        <form onSubmit={handleSearch} className="search-form flex gap-2">
          <input
            type="text"
            placeholder="검색어를 입력하세요"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="search-input border rounded-lg px-3 py-2 flex-1"
          />
          {/* 🔍 대신 검색 버튼 */}
          <button
            type="submit"
            className="search-button bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600 transition"
          >
            검색
          </button>
        </form>

        <nav className="nav">
          {user ? (
            <>
              <span className="nav-link user-info">{user.nickName} 님</span>
              <Link to="/myPage" className="nav-link test">
                마이페이지
              </Link>
              <button onClick={handleLogout} className="nav-link test">
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                로그인
              </Link>
              <Link to="/signup" className="nav-link">
                회원가입
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
