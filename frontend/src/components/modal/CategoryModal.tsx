import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import type { Option } from "../../common/types";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Option[];
  onSelectCategory: (option: Option) => void;
  targetRef: React.RefObject<HTMLButtonElement | null>;
}

export default function CategoryModal({
  isOpen,
  onClose,
  categories,
  onSelectCategory,
  targetRef,
}: CategoryModalProps) {
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
      className="absolute z-[1000] w-full max-w-[180px] bg-white rounded-2xl overflow-hidden overflow-y-auto shadow-[0_4px_16px_rgba(175,175,175,0.2)]"
      style={{ top: position.top, left: position.left }}
    >
      {/* 전체 카테고리 클릭 시 전체 검색으로 이동 */}
      <p
        className="block w-full text-left cursor-pointer transition-colors text-[13px] font-medium bg-[#111] text-white py-3 px-6 hover:bg-[#8c5d5e]"
        onClick={() => {
          navigate("/search");
          onClose();
        }}
      >
        전체 카테고리
      </p>
      <ul className="list-none py-4 m-0 flex flex-col gap-3">
        {categories.map((cat) => (
          <li key={cat.value}>
            <button
              className="block w-full text-left px-6 py-0 cursor-pointer transition-colors text-[13px] font-medium hover:text-[#111]"
              onClick={() => {
                onSelectCategory(cat);
                navigate(`/search?category=${cat.value}`);
                onClose();
              }}
            >
              {cat.label}
            </button>
          </li>
        ))}
      </ul>
    </div>,
    document.body
  );
}
