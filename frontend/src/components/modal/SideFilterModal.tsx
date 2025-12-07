import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { PRODUCT_CATEGORY_LABELS, type ProductCategoryType } from "../../common/enums";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    selectedCategory: string;
    onCategoryChange: (cat: string) => void;
    // Add more filter props as needed
};

export default function SideFilterModal({ isOpen, onClose, selectedCategory, onCategoryChange }: Props) {
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setAnimate(true);
            document.body.style.overflow = "hidden"; // Prevent background scroll
        } else {
            const timer = setTimeout(() => setAnimate(false), 300); // Wait for transition
            document.body.style.overflow = "auto";
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen && !animate) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-start">
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/50 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
                onClick={onClose}
            ></div>

            {/* Drawer */}
            <div
                className={`
                    relative w-[80%] max-w-[320px] h-full bg-white shadow-xl transition-transform duration-300 ease-out flex flex-col
                    ${isOpen ? "translate-x-0" : "-translate-x-full"}
                `}
            >
                {/* Header */}
                <div className="h-[50px] flex items-center justify-between px-4 border-b border-[#eee]">
                    <h2 className="font-bold text-lg">필터</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 content-area">
                    {/* Category Section */}
                    <div className="mb-8">
                        <h3 className="font-bold mb-3 text-[15px]">카테고리</h3>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => onCategoryChange("")}
                                className={`
                                    px-3 py-2 rounded-[8px] text-[13px] border transition-colors
                                    ${selectedCategory === "" ? "bg-black text-white border-black" : "bg-white text-[#666] border-[#eee] hover:bg-[#f9f9f9]"}
                                `}
                            >
                                전체
                            </button>
                            {(Object.keys(PRODUCT_CATEGORY_LABELS) as ProductCategoryType[]).map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => onCategoryChange(cat)}
                                    className={`
                                        px-3 py-2 rounded-[8px] text-[13px] border transition-colors
                                        ${selectedCategory === cat ? "bg-black text-white border-black" : "bg-white text-[#666] border-[#eee] hover:bg-[#f9f9f9]"}
                                    `}
                                >
                                    {PRODUCT_CATEGORY_LABELS[cat]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Mock Sections */}
                    <div className="mb-8">
                        <h3 className="font-bold mb-3 text-[15px]">가격</h3>
                        <div className="p-4 bg-gray-50 rounded text-center text-sm text-gray-500">가격 범위 설정 UI (준비중)</div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-4 border-t border-[#eee] grid grid-cols-2 gap-3">
                    <button
                        onClick={() => {
                            onCategoryChange("");
                            // Reset other filters
                        }}
                        className="h-[45px] flex items-center justify-center rounded-[8px] border border-[#ddd] text-sm font-medium hover:bg-gray-50"
                    >
                        초기화
                    </button>
                    <button
                        onClick={onClose}
                        className="h-[45px] flex items-center justify-center rounded-[8px] bg-black text-white text-sm font-bold hover:bg-[#333]"
                    >
                        결과 보기
                    </button>
                </div>
            </div>
        </div>
    );
}
