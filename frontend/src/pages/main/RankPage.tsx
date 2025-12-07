import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchFilteredProducts, API_BASE_URL } from "../../common/api";
import { sortProducts } from "../../common/util";
import type { Product } from "../../common/types";
import ProductCard from "../../components/ui/ProductCard";
import FilterBar from "../../components/modal/FilterBar";
import SideFilterModal from "../../components/modal/SideFilterModal";

export default function RankPage() {
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedCategory, setSelectedCategory] = useState("");
    const [isSideModalOpen, setIsSideModalOpen] = useState(false);

    useEffect(() => {
        const loadRanking = async () => {
            setLoading(true);
            try {
                // 1. 전체 상품 가져오기 (혹은 필터링된 상품)
                // 인기순 정렬을 위해 일단 많이 가져옴
                const data = await fetchFilteredProducts({
                    productStatus: "ACTIVE", // 판매중인 상품만 랭킹에 표시
                    category: selectedCategory || undefined,
                });

                // 2. 인기순(찜 수) 정렬 - 클라이언트 사이드
                const sorted = await sortProducts(data, "popularity", API_BASE_URL);

                // 3. 상위 100개만 표시
                setProducts(sorted.slice(0, 100));
            } catch (err) {
                console.error("랭킹 로드 실패", err);
            } finally {
                setLoading(false);
            }
        };

        loadRanking();
    }, [selectedCategory]);

    return (
        <div className="container">

            <div className="mb-8 text-left">
                <h1 className="text-3xl font-bold mb-2">Hot Items</h1>
                <p className="text-gray-500 -mt-[6px]">지금 가장 핫한 아이템들을 만나보세요!</p>
            </div>


            {/* Filter Bar & Modal */}
            <div className="mb-6">
                <FilterBar
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                    onOpenSideModal={() => setIsSideModalOpen(true)}
                />
            </div>

            <SideFilterModal
                isOpen={isSideModalOpen}
                onClose={() => setIsSideModalOpen(false)}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
            />

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
                                {/* 랭킹 배지 제거됨 (ProductCard 내부로 이동) */}
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
