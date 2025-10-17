import type { Category } from "../types/types";

interface ModalCategoryProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[]; // 기존 Category 타입 그대로 사용
  onSelectCategory: (category: Category) => void; // Category 객체 그대로
}

export default function ModalCategory({
  isOpen,
  onClose,
  categories,
  onSelectCategory,
}: ModalCategoryProps) {
  if (!isOpen) return null;

  return (
    <div className="content-wrap" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>카테고리 선택</h2>
        <ul className="category-list">
          {categories.map((cat) => (
            <li key={cat.categoryId}>
              <button
                className="category-btn"
                onClick={() => {
                  onSelectCategory(cat);
                  onClose();
                }}
              >
                {cat.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
