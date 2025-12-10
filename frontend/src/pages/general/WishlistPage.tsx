import { useState, useEffect } from "react";
import { Heart, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as API from "../../common/api";
import type { Product } from "../../common/types";
import ProductCard from "../../components/ui/ProductCard";
import CheckboxStyle from "../../components/ui/CheckboxStyle";

export default function WishlistPage() {
    const navigate = useNavigate();
    const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadWishlist = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const products = await API.fetchMyLikes(token);
                // 중복 제거 (productId 기준)
                const uniqueProducts = Array.from(
                    new Map(products.map((item) => [item.productId, item])).values()
                ).map(p => ({ ...p, isBookmarked: true })); // 찜 목록이므로 true 강제

                setWishlistItems(uniqueProducts);
                // 모두 선택하지 않음 (초기값)
            } catch (err: any) {
                console.error("찜 목록 로드 실패:", err);
                if (err.status === 401 || err.message?.includes("401")) {
                    alert("로그인이 만료되었습니다. 다시 로그인해주세요.");
                    localStorage.removeItem("token");
                    navigate("/login");
                }
            } finally {
                setLoading(false);
            }
        };

        loadWishlist();
    }, [navigate]);

    const handleSelect = (id: number) => {
        setSelectedItems(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedItems.length === wishlistItems.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(wishlistItems.map(i => i.productId));
        }
    };

    const handleRemoveSelected = async () => {
        const token = localStorage.getItem("token");
        if (!token || selectedItems.length === 0) return;

        if (!confirm(`선택한 ${selectedItems.length}개 상품을 찜 목록에서 삭제하시겠습니까?`)) return;

        try {
            await API.removeWishlistItems(selectedItems, token);
            setWishlistItems(prev => prev.filter(item => !selectedItems.includes(item.productId)));
            setSelectedItems([]);
            // 이벤트 발생 (헤더 업데이트용 - 만약 찜 카운트가 있다면)
            window.dispatchEvent(new Event("cart-updated"));
        } catch (err) {
            console.error("선택 항목 삭제 실패:", err);
            alert("삭제 중 오류가 발생했습니다.");
        }
    };

    if (loading) {
        return <div className="containerr px-4 py-8 flex justify-center">로딩 중...</div>;
    }

    return (
        <div className="containerr px-4 py-8">
            <h2 className="text-2xl font-bold text-[#111] mb-8 flex items-center gap-2">
                <Heart className="text-[#666]" />
                찜 목록
            </h2>

            {wishlistItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-[#f9f9f9] rounded-lg border border-[#eee]">
                    <Heart size={48} className="text-[#ddd] mb-4" />
                    <p className="text-[#666] mb-6">찜한 상품이 없습니다.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-2 bg-[#111] text-white rounded hover:bg-[#333] transition-colors"
                    >
                        쇼핑 계속하기
                    </button>
                </div>
            ) : (
                <div>
                    {/* Select All Tool Bar */}
                    <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-6">
                        <div className="flex items-center gap-2">
                            <CheckboxStyle
                                checked={selectedItems.length === wishlistItems.length && wishlistItems.length > 0}
                                onChange={() => handleSelectAll()}
                                label={`전체 선택 (${selectedItems.length}/${wishlistItems.length})`}
                            />
                        </div>
                        <button
                            onClick={handleRemoveSelected}
                            className={`flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded transition-colors ${selectedItems.length > 0
                                ? "text-red-500 hover:bg-red-50"
                                : "text-gray-300 cursor-not-allowed"
                                }`}
                            disabled={selectedItems.length === 0}
                        >
                            <Trash2 size={16} />
                            선택 삭제
                        </button>
                    </div>

                    {/* Grid Layout */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-8">
                        {wishlistItems.map((item) => (
                            <div key={item.productId} className="relative group/wish">
                                {/* Checkbox Overlay - Moved outside/above card as requested */}
                                <div>
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <CheckboxStyle
                                            checked={selectedItems.includes(item.productId)}
                                            onChange={() => handleSelect(item.productId)}
                                        />
                                    </div>
                                </div>

                                {/* Product Card */}
                                <div className={selectedItems.includes(item.productId) ? "opacity-100" : ""}>
                                    <ProductCard key={item.productId} product={item} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
