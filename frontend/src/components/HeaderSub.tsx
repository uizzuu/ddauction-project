import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import ModalCategory from "../components/ModalCategory";
import type { Category } from "../types/types";
import { API_BASE_URL } from "../services/api";
type Props = {
  category: Category[];
  setCategory: React.Dispatch<React.SetStateAction<Category[]>>;
};

export default function HeaderSub({ category, setCategory }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/categories`);
        if (!res.ok) throw new Error("카테고리 로드 실패");

        const data = await res.json();
        // 배열인지 확인하고 전체 저장
        const categoriesArray: Category[] = Array.isArray(data) ? data : [];
        setCategory(
          categoriesArray.sort((a, b) => a.categoryId - b.categoryId)
        );
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategories();
  }, [setCategory]);

  const handleProtectedNavigation = (path: string) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("로그인 후 이용할 수 있습니다!");
      return;
    }
    navigate(path);
  };

  return (
    <header className="header header-line header-sub">
      <div className="header-content height-50 flex-box flex-between">
        <nav className="nav" style={{ position: "relative" }}>
          <button
            ref={menuBtnRef}
            onClick={() => setIsModalOpen((prev) => !prev)}
            className="svg-wrap height-16"
          >
            <svg
              width="22"
              height="18"
              viewBox="0 0 22 18"
              fill="none"
              style={{
                color: isModalOpen ? "#b17576" : "#333",
                stroke: isModalOpen ? "#b17576" : "#333",
              }}
            >
              <path
                d="M1 1H21M1 9H21M1 17H21"
                strokeWidth="2"
                strokeLinecap="square"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <ModalCategory
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            categories={category}
            onSelectCategory={(cat) => console.log("선택한 카테고리:", cat)}
            targetRef={menuBtnRef}
          />

          <NavLink to="/" className="nav-link">
            홈
          </NavLink>
          <p className="test">1분경매</p>
          <NavLink to="/search" className="nav-link">
            통합검색
          </NavLink>
          <NavLink to="/community" className="nav-link">
            커뮤니티
          </NavLink>
        </nav>
        <nav className="flex-box gap-16 flex-center">
          <button
            onClick={() => handleProtectedNavigation("/register")}
            className="nav-link after color-777 flex-box flex-center gap-8"
          >
            <svg
              width="16"
              height="18"
              viewBox="0 0 16 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M4 5V4C4 2.93913 4.42143 1.92172 5.17157 1.17157C5.92172 0.421427 6.93913 0 8 0C9.06087 0 10.0783 0.421427 10.8284 1.17157C11.5786 1.92172 12 2.93913 12 4V5H15C15.552 5 16 5.449 16 6.007V16.008C16 17.108 15.105 18 14.006 18H1.994C1.4655 18 0.958626 17.7902 0.584736 17.4167C0.210846 17.0432 0.000530086 16.5365 0 16.008V6.008C0 5.45 0.445 5 1 5H4ZM5.2 5H10.8V4C10.8 3.25739 10.505 2.5452 9.9799 2.0201C9.4548 1.495 8.74261 1.2 8 1.2C7.25739 1.2 6.5452 1.495 6.0201 2.0201C5.495 2.5452 5.2 3.25739 5.2 4V5ZM4 6.2H1.2V16.008C1.2 16.444 1.556 16.8 1.994 16.8H14.006C14.2162 16.8 14.4179 16.7166 14.5667 16.5681C14.7156 16.4197 14.7995 16.2182 14.8 16.008V6.2H12V9H10.8V6.2H5.2V9H4V6.2Z"
                fill="#bbb"
              />
            </svg>
            <p>판매하기</p>
          </button>
          <button
            onClick={() => handleProtectedNavigation("/mypage")}
            className="nav-link color-777 flex-box flex-center gap-6"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 17 17"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M16.1542 16.147C15.6992 14.871 14.6942 13.744 13.2972 12.94C11.9002 12.136 10.1882 11.7 8.4272 11.7C6.6662 11.7 4.9542 12.136 3.5572 12.94C2.1602 13.744 1.1552 14.871 0.700195 16.147"
                stroke="#bbb"
                stroke-width="1.4"
                stroke-linecap="round"
              />
              <path
                d="M8.7002 8.70001C10.9093 8.70001 12.7002 6.90915 12.7002 4.70001C12.7002 2.49087 10.9093 0.700012 8.7002 0.700012C6.49106 0.700012 4.7002 2.49087 4.7002 4.70001C4.7002 6.90915 6.49106 8.70001 8.7002 8.70001Z"
                stroke="#bbb"
                stroke-width="1.4"
                stroke-linecap="round"
              />
            </svg>
            <p>마이페이지</p>
          </button>
        </nav>
      </div>
    </header>
  );
}
