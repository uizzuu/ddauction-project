import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import type { Category } from "../types/types";

interface ModalCategoryProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onSelectCategory: (category: Category) => void;
  targetRef: React.RefObject<HTMLButtonElement | null>;
}

export default function ModalCategory({
  isOpen,
  onClose,
  categories,
  onSelectCategory,
  targetRef,
}: ModalCategoryProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // 모달 위치 계산
  useEffect(() => {
    if (isOpen && targetRef.current) {
      const rect = targetRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 10,
        left: rect.left + window.scrollX - 20,
      });
    }
  }, [isOpen, targetRef]);

  // 바깥 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        modalRef.current &&
        !modalRef.current.contains(e.target as Node) &&
        targetRef.current &&
        !targetRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose, targetRef]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={modalRef}
      className="modal-content"
      style={{ top: position.top, left: position.left }}
    >
      {/* 전체 카테고리 클릭 시 전체 검색으로 이동 */}
      <p
        className="category-btn all-category"
        onClick={() => {
          navigate("/search");
          onClose();
        }}
      >
        전체 카테고리
      </p>
      <ul className="category-list">
        {categories.map((cat) => (
          <li key={cat.categoryId}>
            <button
              className="category-btn"
              onClick={() => {
                onSelectCategory(cat);
                navigate(`/search?category=${cat.categoryId}`);
                onClose();
              }}
            >
              {cat.name}
            </button>
          </li>
        ))}
      </ul>
    </div>,
    document.body
  );
}
