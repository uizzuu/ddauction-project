import { Menu, X, ChevronDown, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { PRODUCT_CATEGORY_LABELS, type ProductCategoryType } from "../../common/enums";

type Props = {
    selectedCategory: string;
    onCategoryChange: (cat: string) => void;
    onOpenSideModal: () => void;
};
const TABS = [
    { id: "category", label: "카테고리" },
    { id: "registered", label: "초기 등록가" }, // Mock
    { id: "benefits", label: "혜택/할인" }, // Mock
    { id: "shipping", label: "배송비" }, // Mock
    { id: "method", label: "배송방법" }, // Mock
    { id: "soldout", label: "품절 제외" }, // Mock
];

export default function FilterBar({ selectedCategory, onCategoryChange, onOpenSideModal }: Props) {
    // Only "category" tab has a real dropdown interaction here
    const [openTab, setOpenTab] = useState<string | null>(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenTab(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleTab = (tabId: string, event: React.MouseEvent<HTMLButtonElement>) => {
        if (openTab === tabId) {
            setOpenTab(null);
        } else {
            const rect = event.currentTarget.getBoundingClientRect();
            setDropdownPos({
                top: rect.bottom + 8,
                left: rect.left
            });
            setOpenTab(tabId);
        }
    };

    return (
        <div className="w-full border-b border-[#eee]">
            <div className="h-fit flex items-center py-1">
                {/* 1. Hamburger Button (Left) */}
                <button
                    onClick={onOpenSideModal}
                    className="mr-3 py-2 text-[#666] hover:text-[#111] transition-colors flex-shrink-0"
                    aria-label="필터 전체보기"
                >
                    <Menu size={20} />
                </button>

                {/* 2. Scrollable Tabs */}
                <div className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-2" ref={dropdownRef}>
                    {TABS.map((tab) => {
                        const isCategoryTab = tab.id === "category";
                        // Active condition:
                        // - if it's the category tab, it's active if a category is selected OR if the dropdown is open
                        // - for others, it's active if openTab matches (for mock purpose)
                        const isActive = isCategoryTab
                            ? !!selectedCategory || openTab === tab.id
                            : openTab === tab.id;

                        return (
                            <div key={tab.id} className="relative">
                                <button
                                    onClick={(e) => {
                                        if (isCategoryTab) {
                                            toggleTab(tab.id, e);
                                        } else {
                                            // Mock behavior for other tabs: just toggle 'active' visual state
                                            toggleTab(tab.id, e);
                                        }
                                    }}
                                    className={`
                                        flex items-center justify-center px-3 py-1.5 rounded-[18px] text-[13px] font-medium whitespace-nowrap border transition-all
                                        ${isActive
                                            ? "bg-[#333] text-white border-[#333]"
                                            : "bg-white text-[#666] border-[#eee] hover:bg-[#f9f9f9]"}
                                    `}
                                >
                                    {isCategoryTab && selectedCategory ? PRODUCT_CATEGORY_LABELS[selectedCategory as ProductCategoryType] : tab.label}
                                    {/* Dropdown arrow if it's a select-type tab */}
                                    {["category", "registered", "benefits", "shipping", "method"].includes(tab.id) && (
                                        <ChevronDown size={14} className={`ml-1 ${isActive ? "text-white" : "text-[#999]"}`} />
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Dropdown Menu (Fixed Position to avoid overflow clipping) */}
            {openTab === "category" && (
                <div
                    ref={dropdownRef}
                    className="fixed w-[200px] bg-white border border-[#eee] rounded-lg shadow-xl z-50 overflow-hidden text-left animate-in fade-in zoom-in-95 duration-100"
                    style={{ top: dropdownPos.top, left: dropdownPos.left }}
                >
                    <div className="max-h-[300px] overflow-y-auto py-1">
                        <button
                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center justify-between ${!selectedCategory ? "text-[#333] font-bold bg-gray-50" : "text-[#666]"}`}
                            onClick={() => {
                                onCategoryChange("");
                                setOpenTab(null);
                            }}
                        >
                            <span>전체</span>
                            {!selectedCategory && <Check size={14} className="text-[#333]" />}
                        </button>
                        {Object.entries(PRODUCT_CATEGORY_LABELS).map(([code, label]) => (
                            <button
                                key={code}
                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center justify-between ${selectedCategory === code ? "text-[#333] font-bold bg-gray-50" : "text-[#666]"}`}
                                onClick={() => {
                                    onCategoryChange(code);
                                    setOpenTab(null);
                                }}
                            >
                                <span>{label}</span>
                                {selectedCategory === code && <Check size={14} className="text-[#333]" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
