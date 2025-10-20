import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ModalCategory from "../components/ModalCategory";
import type { Category } from "../types/types";
import { API_BASE_URL } from "../services/api";

type Props = {
  category: Category[];
  setCategory: React.Dispatch<React.SetStateAction<Category[]>>;
};

export default function HeaderSub({ category, setCategory }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/categories`);
        if (!res.ok) throw new Error("카테고리 로드 실패");
        const data: Category[] = await res.json();
        setCategory(data.sort((a, b) => a.categoryId - b.categoryId));
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategories();
  }, [setCategory]);

  return (
    <>
      <ModalCategory
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categories={category} // Category[] 그대로 넘김
        onSelectCategory={(cat) => console.log("선택한 카테고리:", cat)}
      />

      <header className="header header-line">
        <div className="header-content header-nav">
          <nav className="nav">
            <button
              onClick={() => setIsModalOpen(true)}
              className="menu img-link"
            >
              <svg
                width="22"
                height="18"
                viewBox="0 0 22 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 1H21M1 9H21M1 17H21"
                  stroke="#111111"
                  strokeWidth="2"
                  strokeLinecap="square"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <Link to="/" className="nav-link">
              홈
            </Link>
            <Link to="/register" className="nav-link">
              상품검색
            </Link>
            <Link to="/register" className="nav-link">
              1분경매
            </Link>
            <Link to="/register" className="nav-link">
              고객센터
            </Link>
            <Link to="/auction" className="nav-link test">
              경매목록
            </Link>
            <Link to="/register" className="nav-link test">
              상품등록
            </Link>
          </nav>
        </div>
      </header>
    </>
  );
}
