import { useState, useEffect } from "react";
import { Heart, Trash2, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatPrice } from "../../common/util";
import { fetchMyLikes, API_BASE_URL } from "../../common/api";
import type { Product } from "../../common/types";

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
                const products = await fetchMyLikes(token);
                setWishlistItems(products);
                setSelectedItems(products.map(p => p.productId));
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

    const handleRemove = async (id: number) => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/bookmarks/${id}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                setWishlistItems(prev => prev.filter(item => item.productId !== id));
                setSelectedItems(prev => prev.filter(itemId => itemId !== id));
            } else {
                alert("찜 삭제 실패");
            }
        } catch (err) {
            console.error("찜 삭제 중 오류:", err);
            alert("찜 삭제 중 오류가 발생했습니다.");
        }
    };

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
            await Promise.all(
                selectedItems.map(id =>
                    fetch(`${API_BASE_URL}/api/bookmarks/${id}`, {
                        method: "DELETE",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    })
                )
            );
            setWishlistItems(prev => prev.filter(item => !selectedItems.includes(item.productId)));
            setSelectedItems([]);
        } catch (err) {
            console.error("선택 항목 삭제 실패:", err);
            alert("삭제 중 오류가 발생했습니다.");
        }
    };

    if (loading) {
        return <div className="container px-4 py-8 flex justify-center">로딩 중...</div>;
    }

    return (
        <div className="container px-4 py-8">
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
                    {/* Select All */}
                    <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-4">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={selectedItems.length === wishlistItems.length && wishlistItems.length > 0}
                                onChange={handleSelectAll}
                                className="w-4 h-4 text-[#111] rounded border-gray-300 focus:ring-[#111]"
                            />
                            <span className="text-sm text-[#666]">전체 선택 ({selectedItems.length}/{wishlistItems.length})</span>
                        </label>
                        <button
                            onClick={handleRemoveSelected}
                            className="text-xs text-[#666] hover:text-[#111] disabled:opacity-50"
                            disabled={selectedItems.length === 0}
                        >
                            선택 삭제
                        </button>
                    </div>

                    {/* Grid Layout */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        {wishlistItems.map((item) => (
                            <div key={item.productId} className="bg-white border border-gray-100 rounded-lg overflow-hidden hover:border-gray-200 hover:shadow-md transition-all">
                                {/* Checkbox */}
                                <div className="p-3 flex items-center justify-between border-b border-gray-100">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedItems.includes(item.productId)}
                                            onChange={() => handleSelect(item.productId)}
                                            className="w-4 h-4 text-[#111] rounded border-gray-300 focus:ring-[#111]"
                                        />
                                        <span className="text-xs text-[#666]">선택</span>
                                    </label>
                                    <button
                                        onClick={() => handleRemove(item.productId)}
                                        className="text-[#999] hover:text-[#111] p-1"
                                        title="찜 삭제"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                {/* Image */}
                                <div
                                    className="aspect-square bg-gray-100 cursor-pointer overflow-hidden"
                                    onClick={() => navigate(`/products/${item.productId}`)}
                                >
                                    {item.images && item.images.length > 0 ? (
                                        <img
                                            src={`${API_BASE_URL}${item.images[0].imagePath}`}
                                            alt={item.title}
                                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">No Image</div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="p-4">
                                    <h3
                                        className="font-medium text-[#111] mb-2 cursor-pointer hover:underline line-clamp-2"
                                        onClick={() => navigate(`/products/${item.productId}`)}
                                    >
                                        {item.title}
                                    </h3>
                                    <div className="text-lg font-bold text-[#111] mb-2">{formatPrice(item.startingPrice || 0)}</div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => navigate(`/products/${item.productId}`)}
                                            className="flex-1 py-2 bg-white border border-[#111] text-[#111] rounded text-sm font-medium hover:bg-gray-50 transition-colors"
                                        >
                                            상세보기
                                        </button>
                                        <button
                                            onClick={() => {
                                                // Add to cart logic (if implemented)
                                                alert("장바구니 담기 기능은 준비 중입니다.");
                                            }}
                                            className="p-2 bg-[#111] text-white rounded hover:bg-[#333] transition-colors"
                                            title="장바구니 담기"
                                        >
                                            <ShoppingBag size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
