import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { PRODUCT_CATEGORIES, type ProductCategoryType, DELIVERY_TYPES, type DeliveryType } from "../../common/enums";

const BENEFITS = [
    { id: "free_shipping", label: "배송비 무료" },
    { id: "discount", label: "할인 상품" },
    { id: "escrow", label: "안전결제 환영" },
    { id: "certified", label: "정품 인증" },
];

type Props = {
    isOpen: boolean;
    onClose: () => void;

    selectedCategory: string;
    onCategoryChange: (cat: string) => void;

    minPrice?: number;
    maxPrice?: number;
    minStartPrice?: number;
    maxStartPrice?: number;
    onPriceChange: (type: "current" | "start", min?: number, max?: number) => void;

    excludeEnded: boolean;
    onExcludeEndedChange: (val: boolean) => void;

    selectedDeliveryTypes: DeliveryType[];
    onDeliveryChange: (types: DeliveryType[]) => void;

    selectedBenefits: string[];
    onBenefitChange: (benefits: string[]) => void;

    selectedProductType: string | null;
    onProductTypeChange: (type: string | null) => void;
};

export default function SideFilterModal({
    isOpen, onClose,
    selectedCategory, onCategoryChange,
    minPrice, maxPrice, minStartPrice, maxStartPrice, onPriceChange,
    excludeEnded, onExcludeEndedChange,
    selectedDeliveryTypes, onDeliveryChange,
    selectedBenefits, onBenefitChange,
    selectedProductType, onProductTypeChange
}: Props) {
    const [animate, setAnimate] = useState(false);

    // Local state for Price Inputs (to allow typing before commit)
    const [localMin, setLocalMin] = useState<string>("");
    const [localMax, setLocalMax] = useState<string>("");
    const [localMinStart, setLocalMinStart] = useState<string>("");
    const [localMaxStart, setLocalMaxStart] = useState<string>("");

    useEffect(() => {
        if (isOpen) {
            setAnimate(true);
            document.body.style.overflow = "hidden";

            // Initialize local inputs from props
            setLocalMin(minPrice ? minPrice.toString() : "");
            setLocalMax(maxPrice ? maxPrice.toString() : "");
            setLocalMinStart(minStartPrice ? minStartPrice.toString() : "");
            setLocalMaxStart(maxStartPrice ? maxStartPrice.toString() : "");

        } else {
            const timer = setTimeout(() => setAnimate(false), 300);
            document.body.style.overflow = "auto";
            return () => clearTimeout(timer);
        }
    }, [isOpen, minPrice, maxPrice, minStartPrice, maxStartPrice]); // Re-sync if props change externally

    if (!isOpen && !animate) return null;

    // Helper for Numeric Input
    const handleNumberInput = (setter: (val: string) => void, val: string) => {
        if (/^\d*$/.test(val)) setter(val);
    };

    // Commit Price changes (onBlur or Enter)
    const commitPrice = (type: "current" | "start") => {
        if (type === "current") {
            onPriceChange("current",
                localMin ? Number(localMin) : undefined,
                localMax ? Number(localMax) : undefined
            );
        } else {
            onPriceChange("start",
                localMinStart ? Number(localMinStart) : undefined,
                localMaxStart ? Number(localMaxStart) : undefined
            );
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, type: "current" | "start") => {
        if (e.key === "Enter") {
            commitPrice(type);
        }
    };

    const handleReset = () => {
        onCategoryChange("");
        onProductTypeChange(null);
        onPriceChange("current", undefined, undefined);
        onPriceChange("start", undefined, undefined);
        onExcludeEndedChange(false);
        onDeliveryChange([]);
        onBenefitChange([]);

        // Update local state visuals
        setLocalMin("");
        setLocalMax("");
        setLocalMinStart("");
        setLocalMaxStart("");
    };

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
                    relative w-[85%] max-w-[360px] h-full bg-white shadow-xl transition-transform duration-300 ease-out flex flex-col
                    ${isOpen ? "translate-x-0" : "-translate-x-full"}
                `}
            >
                {/* Header */}
                <div className="h-[56px] flex items-center justify-between px-5 border-b border-[#eee]">
                    <h2 className="font-bold text-lg">필터</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-8 pb-10">

                    {/* 1. Category */}
                    <div>
                        <h3 className="font-bold mb-3 text-[15px]">카테고리</h3>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => onCategoryChange("")}
                                className={`
                                    px-3 py-2 rounded-[8px] text-[14px] border transition-colors
                                    ${selectedCategory === "" ? "bg-[#333] text-white border-[#333]" : "bg-gray-100 text-[#666] border-transparent hover:bg-gray-200"}
                                `}
                            >
                                전체
                            </button>
                            {(Object.keys(PRODUCT_CATEGORIES) as ProductCategoryType[]).map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => onCategoryChange(cat)}
                                    className={`
                                        px-3 py-2 rounded-[8px] text-[14px] border transition-colors
                                        ${selectedCategory === cat ? "bg-[#333] text-white border-[#333]" : "bg-gray-100 text-[#666] border-transparent hover:bg-gray-200"}
                                    `}
                                >
                                    {PRODUCT_CATEGORIES[cat]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 1.5 Product Type */}
                    <div>
                        <h3 className="font-bold mb-3 text-[15px]">상품 유형</h3>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { label: "전체", value: null },
                                { label: "경매", value: "AUCTION" },
                                { label: "중고거래", value: "USED" },
                                { label: "스토어", value: "STORE" },
                            ].map((type) => (
                                <button
                                    key={type.label}
                                    onClick={() => onProductTypeChange(type.value as string | null)}
                                    className={`
                                        px-3 py-2 rounded-[8px] text-[14px] border transition-colors
                                        ${selectedProductType === type.value
                                            ? "bg-[#333] text-white border-[#333]"
                                            : "bg-gray-100 text-[#666] border-transparent hover:bg-gray-200"}
                                    `}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 2. Price */}
                    <div>
                        <h3 className="font-bold mb-3 text-[15px]">가격</h3>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                className="w-full bg-[#f5f5f5] text-sm px-3 py-3 rounded border border-transparent focus:bg-white focus:border-[#333] outline-none"
                                placeholder="최소"
                                value={localMin}
                                onChange={(e) => handleNumberInput(setLocalMin, e.target.value)}
                                onBlur={() => commitPrice("current")}
                                onKeyDown={(e) => handleKeyDown(e, "current")}
                            />
                            <span className="text-[#999] text-sm">~</span>
                            <input
                                type="text"
                                className="w-full bg-[#f5f5f5] text-sm px-3 py-3 rounded border border-transparent focus:bg-white focus:border-[#333] outline-none"
                                placeholder="최대"
                                value={localMax}
                                onChange={(e) => handleNumberInput(setLocalMax, e.target.value)}
                                onBlur={() => commitPrice("current")}
                                onKeyDown={(e) => handleKeyDown(e, "current")}
                            />
                        </div>
                    </div>

                    {/* 3. Start Price */}
                    <div>
                        <h3 className="font-bold mb-3 text-[15px]">시작가</h3>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                className="w-full bg-[#f5f5f5] text-sm px-3 py-3 rounded border border-transparent focus:bg-white focus:border-[#333] outline-none"
                                placeholder="최소"
                                value={localMinStart}
                                onChange={(e) => handleNumberInput(setLocalMinStart, e.target.value)}
                                onBlur={() => commitPrice("start")}
                                onKeyDown={(e) => handleKeyDown(e, "start")}
                            />
                            <span className="text-[#999] text-sm">~</span>
                            <input
                                type="text"
                                className="w-full bg-[#f5f5f5] text-sm px-3 py-3 rounded border border-transparent focus:bg-white focus:border-[#333] outline-none"
                                placeholder="최대"
                                value={localMaxStart}
                                onChange={(e) => handleNumberInput(setLocalMaxStart, e.target.value)}
                                onBlur={() => commitPrice("start")}
                                onKeyDown={(e) => handleKeyDown(e, "start")}
                            />
                        </div>
                    </div>

                    {/* 4. Product Status (Exclude Ended) */}
                    <div>
                        <h3 className="font-bold mb-3 text-[15px]">경매 상태</h3>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                className="accent-black w-5 h-5"
                                checked={excludeEnded}
                                onChange={(e) => onExcludeEndedChange(e.target.checked)}
                            />
                            <span className="text-[#333] text-sm">경매 종료된 상품 제외</span>
                        </label>
                    </div>

                    {/* 5. Shipping */}
                    <div>
                        <h3 className="font-bold mb-3 text-[15px]">배송 방법</h3>
                        <div className="flex flex-col gap-2.5">
                            {(Object.keys(DELIVERY_TYPES) as DeliveryType[]).map((type) => (
                                <label key={type} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="accent-black w-5 h-5"
                                        checked={selectedDeliveryTypes.includes(type)}
                                        onChange={(e) => {
                                            if (e.target.checked) onDeliveryChange([...selectedDeliveryTypes, type]);
                                            else onDeliveryChange(selectedDeliveryTypes.filter(t => t !== type));
                                        }}
                                    />
                                    <span className="text-sm text-[#333]">{DELIVERY_TYPES[type]}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* 6. Benefits */}
                    <div>
                        <h3 className="font-bold mb-3 text-[15px]">혜택/할인</h3>
                        <div className="flex flex-col gap-2.5">
                            {BENEFITS.map((b) => (
                                <label key={b.id} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="accent-black w-5 h-5"
                                        checked={selectedBenefits.includes(b.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) onBenefitChange([...selectedBenefits, b.id]);
                                            else onBenefitChange(selectedBenefits.filter(id => id !== b.id));
                                        }}
                                    />
                                    <span className="text-sm text-[#333]">{b.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-4 border-t border-[#eee] bg-white">
                    <button
                        onClick={handleReset}
                        className="w-full h-[48px] flex items-center justify-center rounded-[8px] border border-[#ddd] text-sm font-medium hover:bg-gray-50 text-[#333]"
                    >
                        필터 초기화
                    </button>
                </div>
            </div>
        </div>
    );
}
