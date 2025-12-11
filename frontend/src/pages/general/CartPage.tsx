import { useState, useEffect } from "react";
import CheckboxStyle from "../../components/ui/CheckboxStyle";
import { Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatPrice, getCartItems, removeFromCart } from "../../common/util";
import { API_BASE_URL } from "../../common/api";
import type { CartItem } from "../../common/types";

export default function CartPage() {
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load cart items from LocalStorage
        const items = getCartItems();
        setCartItems(items);
        setSelectedItems(items.map(i => i.productId));
        setLoading(false);
    }, []);

    // Handlers
    const handleRemove = (id: number) => {
        removeFromCart(id);
        setCartItems(prev => prev.filter(item => item.productId !== id));
        setSelectedItems(prev => prev.filter(itemId => itemId !== id));
    };

    const handleSelect = (id: number) => {
        setSelectedItems(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedItems.length === cartItems.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(cartItems.map(i => i.productId));
        }
    };

    // Calculations
    const selectedCartItems = cartItems.filter(item => selectedItems.includes(item.productId));
    const totalProductPrice = selectedCartItems.reduce((acc, item) => acc + (item.startingPrice || 0) * item.quantity, 0);
    const totalShipping = selectedCartItems.reduce((acc, item) => acc + item.shipping, 0);
    const totalPrice = totalProductPrice + totalShipping;

    if (loading) {
        return <div className="container mx-auto px-4 py-8 flex justify-center">로딩 중...</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8 min-h-screen">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-2">
                <ShoppingBag className="text-[#111]" />
                장바구니
            </h2>

            {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-lg border border-gray-100">
                    <ShoppingBag size={48} className="text-gray-300 mb-4" />
                    <p className="text-gray-500 mb-6">장바구니에 담긴 상품이 없습니다.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-2 bg-[#333] text-white rounded hover:bg-[#555] transition-colors"
                    >
                        쇼핑 계속하기
                    </button>
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Cart List */}
                    <div className="flex-1">
                        {/* Select All */}
                        <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-4">
                            <div className="flex items-center gap-2">
                                <CheckboxStyle
                                    checked={selectedItems.length === cartItems.length && cartItems.length > 0}
                                    onChange={() => handleSelectAll()}
                                    label={`전체 선택 (${selectedItems.length}/${cartItems.length})`}
                                />
                            </div>
                            <button
                                onClick={() => setCartItems(prev => prev.filter(item => !selectedItems.includes(item.productId)))}
                                className="text-xs text-gray-500 hover:text-red-500"
                            >
                                선택 삭제
                            </button>
                        </div>

                        {/* Items */}
                        <div className="flex flex-col gap-4">
                            {cartItems.map((item) => (
                                <div key={item.productId} className="flex gap-4 p-4 bg-white border border-gray-100 rounded-lg hover:border-gray-200 transition-colors">
                                    <div className="pt-1">
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <CheckboxStyle
                                                checked={selectedItems.includes(item.productId)}
                                                onChange={() => handleSelect(item.productId)}
                                            />
                                        </div>
                                    </div>
                                    <div className="w-24 h-24 bg-gray-100 rounded overflow-hidden flex-shrink-0 cursor-pointer" onClick={() => navigate(`/products/${item.productId}`)}>
                                        {item.images && item.images.length > 0 ? (
                                            <img
                                                src={`${API_BASE_URL}${item.images[0].imagePath}`}
                                                alt={item.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">No Image</div>
                                        )}
                                    </div>
                                    <div className="flex-1 flex justify-between">
                                        <div>
                                            <h3
                                                className="font-medium text-gray-900 mb-1 cursor-pointer hover:underline"
                                                onClick={() => navigate(`/products/${item.productId}`)}
                                            >
                                                {item.title}
                                            </h3>
                                            <p className="text-sm text-gray-500 mb-2">{item.option}</p>
                                            <div className="text-sm font-bold text-gray-900">{formatPrice(item.startingPrice || 0)}</div>
                                        </div>
                                        <div className="flex flex-col items-end justify-between">
                                            <button
                                                onClick={() => handleRemove(item.productId)}
                                                className="text-gray-400 hover:text-red-500 p-1"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            <div className="text-xs text-gray-500">
                                                {item.shipping === 0 ? "무료배송" : `배송비 ${formatPrice(item.shipping)}`}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="w-full lg:w-80 flex-shrink-0">
                        <div className="bg-white p-6 border border-gray-200 rounded-lg sticky top-24">
                            <h3 className="font-bold text-lg mb-4">주문 예정 금액</h3>

                            <div className="flex justify-between mb-2 text-sm text-gray-600">
                                <span>상품 금액</span>
                                <span>{formatPrice(totalProductPrice)}</span>
                            </div>
                            <div className="flex justify-between mb-4 text-sm text-gray-600">
                                <span>배송비</span>
                                <span>+ {formatPrice(totalShipping)}</span>
                            </div>

                            <div className="border-t border-gray-100 pt-4 mb-6 flex justify-between items-center">
                                <span className="font-bold text-gray-900">총 결제 금액</span>
                                <span className="font-bold text-xl text-[#111]">{formatPrice(totalPrice)}</span>
                            </div>

                            {/* <button
                                className="w-full py-3 bg-[#111] text-white rounded-lg font-bold hover:bg-[#666] transition-colors flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                disabled={selectedItems.length === 0}
                                onClick={() => alert("주문 기능은 준비 중입니다.")}
                            >
                                주문하기 <ArrowRight size={16} />
                            </button> */}
                            <button
                                className="w-full py-3 bg-[#111] text-white rounded-lg font-bold hover:bg-[#666] transition-colors flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                disabled={selectedItems.length === 0}
                                onClick={() => {
                                    if (selectedItems.length === 0) {
                                        alert("결제할 상품을 선택해주세요.");
                                        return;
                                    }
                                    // 장바구니 결제 페이지로 이동
                                    const itemIds = selectedItems.join(",");
                                    navigate(`/payment?cart=true&items=${itemIds}`);
                                }}
                            >
                                주문하기 <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
