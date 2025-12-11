import { useEffect, useState, useRef } from "react";
import { fetchRanking } from "../../common/api";
import type { Product } from "../../common/types";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import { PRODUCT_CATEGORIES } from "../../common/enums";
import ProductCard from "../../components/ui/ProductCard";

// 카테고리용 화살표 컴포넌트
function CategoryNextArrow({ onClick, visible }: { onClick: () => void; visible: boolean }) {
    if (!visible) return null;
    return (
        <button
            onClick={onClick}
            className="absolute top-1/2 -translate-y-1/2 right-0 md:-right-12 z-10 p-2 text-gray-400 hover:text-black cursor-pointer transition-all bg-white/80 md:bg-transparent rounded-full shadow-sm md:shadow-none"
        >
            <ChevronRight size={28} />
        </button>
    );
}

function CategoryPrevArrow({ onClick, visible }: { onClick: () => void; visible: boolean }) {
    if (!visible) return null;
    return (
        <button
            onClick={onClick}
            className="absolute top-1/2 -translate-y-1/2 left-0 md:-left-12 z-10 p-2 text-gray-400 hover:text-black cursor-pointer transition-all bg-white/80 md:bg-transparent rounded-full shadow-sm md:shadow-none"
        >
            <ChevronLeft size={28} />
        </button>
    );
}

export default function RankPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState("");

    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);
    const [showInfoModal, setShowInfoModal] = useState(false);

    const today = new Date();
    const formattedDate = `${String(today.getMonth() + 1).padStart(2, "0")}.${String(
        today.getDate()
    ).padStart(2, "0")}. ${String(today.getHours()).padStart(2, "0")}:${String(
        today.getMinutes()
    ).padStart(2, "0")}`;

    // 랭킹 API 호출
    useEffect(() => {
        const loadRanking = async () => {
            setLoading(true);
            try {
                const data = await fetchRanking(selectedCategory || undefined);
                setProducts(data);
            } catch (err) {
                console.error("랭킹 로드 실패", err);
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };
        loadRanking();
    }, [selectedCategory]);

    // 스크롤 체크
    const checkScroll = () => {
        if (!scrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setShowLeftArrow(scrollLeft > 0);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    };

    const scroll = (direction: "left" | "right") => {
        if (!scrollRef.current) return;
        const scrollAmount = 300;
        scrollRef.current.scrollBy({
            left: direction === "left" ? -scrollAmount : scrollAmount,
            behavior: "smooth",
        });
    };

    // 초기 스크롤 체크 및 리사이즈 리스너
    useEffect(() => {
        checkScroll();
        window.addEventListener("resize", checkScroll);
        return () => window.removeEventListener("resize", checkScroll);
    }, []);

    // products 변경 시 스크롤 체크
    useEffect(() => {
        setTimeout(checkScroll, 100);
    }, [products]);

    // 클릭 외부 영역 시 Info 모달 닫기
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as HTMLElement;
            if (showInfoModal && !target.closest(".ranking-info-container")) {
                setShowInfoModal(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showInfoModal]);

    return (
        <div className="containerr mx-auto px-4 py-8 min-h-screen md:px-0">
            <div className="mb-8 flex justify-between items-end">
                <div className="text-left">
                    <h1 className="text-3xl font-bold mb-2">Hot Items</h1>
                    <p className="text-gray-500 -mt-[6px]">지금 가장 핫한 아이템들을 만나보세요!</p>
                </div>

                {/* Ranking Info */}
                <div className="relative ranking-info-container">
                    <button
                        onClick={() => setShowInfoModal(!showInfoModal)}
                        className="text-[14px] text-[#999] flex items-center gap-1 hover:text-[#333] mb-1"
                    >
                        <span>랭킹기준</span>
                        <Info size={14} />
                    </button>
                    {showInfoModal && (
                        <div className="absolute right-0 top-full mt-2 w-[280px] bg-white border border-[#eee] rounded-lg shadow-xl p-4 z-50 text-left animate-in fade-in zoom-in-95 duration-100">
                            <div className="absolute top-[-5px] right-[24px] w-2.5 h-2.5 bg-white border-t border-l border-[#eee] rotate-45"></div>
                            <h4 className="font-bold text-[#333] mb-2 text-[15px]">{formattedDate} 기준</h4>
                            <p className="text-[#666] text-[14px] leading-relaxed">
                                땅땅옥션에서 고객들이 가장 많이 조회한<br />
                                상품들의 랭킹을 제공하고 있습니다.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Category Tabs */}
            <div className="relative w-fit mx-auto max-w-full mb-6 group">
                <CategoryPrevArrow onClick={() => scroll("left")} visible={showLeftArrow} />
                <div
                    ref={scrollRef}
                    onScroll={checkScroll}
                    className="flex gap-2 overflow-x-auto category-scroll-container scroll-smooth"
                >
                    <button
                        onClick={() => setSelectedCategory("")}
                        className={`flex items-center justify-center px-4 py-2 rounded-[18px] text-[14px] font-medium whitespace-nowrap border transition-all flex-shrink-0 ${!selectedCategory
                            ? "bg-[#333] text-white border-[#333]"
                            : "bg-gray-100 text-[#666] border-transparent hover:bg-gray-200"
                            }`}
                    >
                        전체
                    </button>

                    {Object.entries(PRODUCT_CATEGORIES).map(([code, label]) => (
                        <button
                            key={code}
                            onClick={() => setSelectedCategory(code)}
                            className={`flex items-center justify-center px-4 py-2 rounded-[18px] text-[14px] font-medium whitespace-nowrap border transition-all flex-shrink-0 ${selectedCategory === code
                                ? "bg-[#333] text-white border-[#333]"
                                : "bg-gray-100 text-[#666] border-transparent hover:bg-gray-200"
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                <CategoryNextArrow onClick={() => scroll("right")} visible={showRightArrow} />
            </div>

            {/* Product Grid */}
            {loading ? (
                <div className="flex h-60 items-center justify-center text-gray-400">
                    랭킹을 집계하고 있습니다...
                </div>
            ) : products.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-12">
                    {products.map((product, index) => {
                        const rand = Math.random();
                        const rankChange = rand < 0.3 ? "UP" : rand < 0.6 ? "DOWN" : "SAME";
                        return (
                            <div key={product.productId} className="relative group">
                                <ProductCard
                                    product={product}
                                    rank={index + 1}
                                    rankChange={rankChange as "UP" | "DOWN" | "SAME"}
                                />
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex h-60 items-center justify-center text-gray-400">
                    현재 랭킹 정보가 없습니다.
                </div>
            )}
        </div>
    );
}
