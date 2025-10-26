import { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
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

  return (
    <header className="header header-line header-sub">
      <div className="header-content height-50">
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
          <NavLink to="/search" className="nav-link">
            통합검색
          </NavLink>
          <NavLink to="/community" className="nav-link">
            커뮤니티
          </NavLink>
          <NavLink to="/auction" className="nav-link test">
            경매목록
          </NavLink>
          <NavLink to="/register" className="nav-link test">
            상품등록
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
