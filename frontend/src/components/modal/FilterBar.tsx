import { Menu, ChevronDown, Check } from "lucide-react";
import React, { useRef, useEffect, useState } from "react";
import CheckboxStyle from "../ui/CheckboxStyle";
import { PRODUCT_CATEGORIES, type ProductCategoryType, DELIVERY_TYPES, type DeliveryType } from "../../common/enums";

const BENEFITS = [
    { id: "free_shipping", label: "배송비 무료" },
    { id: "discount", label: "할인 상품" },
    { id: "escrow", label: "안전결제 환영" },
    { id: "certified", label: "정품 인증" },
];

type Props = {
    selectedCategory: string;
    onCategoryChange: (cat: string) => void;
    onOpenSideModal: () => void;

    // Product Type Filter
    selectedProductType: string | null;
    onProductTypeChange: (type: string | null) => void;

    // Price Filters
    minPrice: number | undefined;
    maxPrice: number | undefined;
    minStartPrice: number | undefined;
    maxStartPrice: number | undefined;
    onPriceChange: (type: "current" | "start", min?: number, max?: number) => void;

    // Toggles
    excludeEnded: boolean;
    onExcludeEndedChange: (val: boolean) => void;

    // Multi-select Filters
    selectedDeliveryTypes: DeliveryType[];
    onDeliveryChange: (types: DeliveryType[]) => void;
    selectedBenefits: string[];
    onBenefitChange: (benefits: string[]) => void;
};

const TABS = [
    { id: "category", label: "카테고리" },
    { id: "price", label: "가격" },
    { id: "start_price", label: "경매시작가" },
    { id: "benefits", label: "혜택/할인" }, // Mock
    { id: "shipping", label: "배송비" }, // Mock
    { id: "soldout", label: "품절 제외" }, // Mock
    { id: "exclude_ended", label: "경매종료 제외" },
];

export default function FilterBar({
    selectedCategory, onCategoryChange, onOpenSideModal,
    minPrice, maxPrice, minStartPrice, maxStartPrice, onPriceChange,
    excludeEnded, onExcludeEndedChange,
    selectedDeliveryTypes, onDeliveryChange,
    selectedBenefits, onBenefitChange,
    selectedProductType, onProductTypeChange
}: Props) {
    const [openTab, setOpenTab] = useState<string | null>(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Temp state for price inputs
    const [tempMin, setTempMin] = useState<string>("");
    const [tempMax, setTempMax] = useState<string>("");

    // Temp state for multi-selects
    const [tempDelivery, setTempDelivery] = useState<DeliveryType[]>([]);
    const [tempBenefits, setTempBenefits] = useState<string[]>([]);

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
        if (tabId === "exclude_ended") {
            // Toggle Logic
            onExcludeEndedChange(!excludeEnded);
            setOpenTab(null); // Close any open dropdowns
            return;
        }

        if (openTab === tabId) {
            setOpenTab(null);
        } else {
            const rect = event.currentTarget.getBoundingClientRect();
            setDropdownPos({
                top: rect.bottom + 8,
                left: rect.left
            });
            setOpenTab(tabId);

            setOpenTab(tabId);

            setOpenTab(tabId);

            // Initialize temp state
            if (tabId === "price") {
                setTempMin(minPrice ? minPrice.toString() : "");
                setTempMax(maxPrice ? maxPrice.toString() : "");
            } else if (tabId === "start_price") {
                setTempMin(minStartPrice ? minStartPrice.toString() : "");
                setTempMax(maxStartPrice ? maxStartPrice.toString() : "");
            } else if (tabId === "shipping") {
                setTempDelivery([...selectedDeliveryTypes]);
            } else if (tabId === "benefits") {
                setTempBenefits([...selectedBenefits]);
            }
        }
    };

    const handleApply = () => {
        const min = tempMin ? isNaN(Number(tempMin)) ? undefined : Number(tempMin) : undefined;
        const max = tempMax ? isNaN(Number(tempMax)) ? undefined : Number(tempMax) : undefined;

        if (openTab === "price") {
            onPriceChange("current", min, max);
        } else if (openTab === "start_price") {
            onPriceChange("start", min, max);
        } else if (openTab === "shipping") {
            onDeliveryChange(tempDelivery);
        } else if (openTab === "benefits") {
            onBenefitChange(tempBenefits);
        }
        setOpenTab(null);
    };

    // Helper to format/parse number input if needed (simple version for now)
    const handleNumberInput = (setter: typeof setTempMin, val: string) => {
        // Allow only numbers
        if (/^\d*$/.test(val)) {
            setter(val);
        }
    };

    return (
        <div className="sticky top-[60px] z-30 bg-white border-b border-gray-100 scrollbar-hide">
            <div className="max-w-[1280px] mx-auto px-0">
                {/* 1. Product Type Filter (Top Row) */}
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                    {[
                        { label: "전체", value: null },
                        { label: "경매", value: "AUCTION" },
                        { label: "중고거래", value: "USED" },
                        { label: "스토어", value: "STORE" },
                    ].map((type) => (
                        <button
                            key={type.label}
                            onClick={() => onProductTypeChange(type.value)}
                            className={`
                                px-4 py-2 rounded-[18px] text-[14px] font-medium whitespace-nowrap border transition-all
                                ${selectedProductType === type.value
                                    ? "bg-[#333] text-white border-[#333]"
                                    : "bg-gray-100 text-[#666] border-transparent hover:bg-gray-200"}
                                }`}
                        >
                            {type.label}
                        </button>
                    ))}
                </div>

                {/* 2. Detailed Filters (Bottom Row) */}
                <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide relative">
                    <button
                        onClick={onOpenSideModal}
                        className="flex items-center gap-1 text-gray-700 transition-colors flex-shrink-0"
                    >
                        <Menu size={20} />
                    </button>

                    {TABS.map((tab) => {
                        const isCategoryTab = tab.id === "category";
                        const isExcludeEnded = tab.id === "exclude_ended";

                        let isActive = false;
                        if (isCategoryTab) isActive = !!selectedCategory || openTab === tab.id;
                        else if (isExcludeEnded) isActive = excludeEnded;
                        else if (tab.id === "price") isActive = (minPrice !== undefined || maxPrice !== undefined) || openTab === tab.id;
                        else if (tab.id === "start_price") isActive = (minStartPrice !== undefined || maxStartPrice !== undefined) || openTab === tab.id;
                        else if (tab.id === "shipping") isActive = selectedDeliveryTypes.length > 0 || openTab === tab.id;
                        else if (tab.id === "benefits") isActive = selectedBenefits.length > 0 || openTab === tab.id;
                        else isActive = openTab === tab.id;

                        let label = tab.label;
                        if (isCategoryTab && selectedCategory) label = PRODUCT_CATEGORIES[selectedCategory as ProductCategoryType];

                        const hasArrow = ["category", "price", "start_price", "benefits", "shipping"].includes(tab.id);
                        const isDropdownOpen = openTab === tab.id;

                        return (
                            <div key={tab.id} className="relative">
                                <button
                                    onClick={(e) => toggleTab(tab.id, e)}
                                    className={`
                                        flex items-center justify-center px-3 py-1.5 rounded-[18px] text-[14px] font-medium whitespace-nowrap border transition-all
                                        ${isActive
                                            ? "bg-[#333] text-white border-[#333]"
                                            : "bg-gray-100 text-[#666] border-transparent hover:bg-gray-200"}
                                    `}
                                >
                                    {label}
                                    {hasArrow && (
                                        <ChevronDown
                                            size={14}
                                            className={`ml-1 origin-center ${isDropdownOpen ? "rotate-180" : ""} ${isActive ? "text-white" : "text-[#999]"}`}
                                        />
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Dropdown Menu (Fixed) */}
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
                        {Object.entries(PRODUCT_CATEGORIES).map(([code, label]) => (
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

            {/* Price Dropdown */}
            {(openTab === "price" || openTab === "start_price") && (
                <div
                    ref={dropdownRef}
                    className="fixed w-[260px] bg-white border border-[#eee] rounded-lg shadow-xl z-50 p-4 animate-in fade-in zoom-in-95 duration-100"
                    style={{ top: dropdownPos.top, left: dropdownPos.left }}
                >
                    <h4 className="text-sm font-bold mb-3 text-[#333]">
                        {openTab === "price" ? "가격 설정" : "시작가 설정"}
                    </h4>
                    <div className="flex items-center gap-2 mb-4">
                        <input
                            type="text"
                            className="w-full bg-[#f5f5f5] text-sm px-3 py-2 rounded border border-transparent focus:bg-white focus:border-[#333] outline-none"
                            placeholder="최소"
                            value={tempMin}
                            onChange={(e) => handleNumberInput(setTempMin, e.target.value)}
                        />
                        <span className="text-[#999] text-sm">~</span>
                        <input
                            type="text"
                            className="w-full bg-[#f5f5f5] text-sm px-3 py-2 rounded border border-transparent focus:bg-white focus:border-[#333] outline-none"
                            placeholder="최대"
                            value={tempMax}
                            onChange={(e) => handleNumberInput(setTempMax, e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            className="flex-1 py-2 text-sm text-[#666] bg-gray-100 rounded hover:bg-gray-200"
                            onClick={() => setOpenTab(null)}
                        >
                            취소
                        </button>
                        <button
                            className="flex-1 py-2 text-sm text-white bg-[#333] rounded hover:bg-black font-medium"
                            onClick={handleApply}
                        >
                            적용
                        </button>
                    </div>
                </div>
            )}

            {/* Delivery & Benefits Dropdown */}
            {(openTab === "shipping" || openTab === "benefits") && (
                <div
                    ref={dropdownRef}
                    className="fixed w-[240px] bg-white border border-[#eee] rounded-lg shadow-xl z-50 p-4 animate-in fade-in zoom-in-95 duration-100"
                    style={{ top: dropdownPos.top, left: dropdownPos.left }}
                >
                    <h4 className="text-sm font-bold mb-3 text-[#333]">
                        {openTab === "shipping" ? "배송비 설정" : "혜택/할인 설정"}
                    </h4>
                    <div className="flex flex-col gap-2 mb-4">
                        {openTab === "shipping" ? (
                            (Object.keys(DELIVERY_TYPES) as DeliveryType[]).map((type) => (
                                <label key={type} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="accent-black w-4 h-4"
                                        checked={tempDelivery.includes(type)}
                                        onChange={(e) => {
                                            if (e.target.checked) setTempDelivery([...tempDelivery, type]);
                                            else setTempDelivery(tempDelivery.filter(t => t !== type));
                                        }}
                                    />
                                    <span className="text-sm text-[#333]">{DELIVERY_TYPES[type]}</span>
                                </label>
                            ))
                        ) : (
                            BENEFITS.map((b) => (
                                <label key={b.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                    <CheckboxStyle
                                        checked={tempBenefits.includes(b.id)}
                                        onChange={(checked) => {
                                            if (checked) setTempBenefits([...tempBenefits, b.id]);
                                            else setTempBenefits(tempBenefits.filter((id) => id !== b.id));
                                        }}
                                    />
                                    <span className="text-sm text-[#333]">{b.label}</span>
                                </label>
                            ))
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button
                            className="flex-1 py-2 text-sm text-[#666] bg-gray-100 rounded hover:bg-gray-200"
                            onClick={() => setOpenTab(null)}
                        >
                            취소
                        </button>
                        <button
                            className="flex-1 py-2 text-sm text-white bg-[#333] rounded hover:bg-black font-medium"
                            onClick={handleApply}
                        >
                            적용
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
