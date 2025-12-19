import React from "react";
import { AuctionBidding } from "../../../../components/product/AuctionBidding";
import type { Product, Bid } from "../../../../common/types";
import * as API from "../../../../common/api";
import { addToCart } from "../../../../common/util";
import { DELIVERY_TYPES, PRODUCT_TYPES } from "../../../../common/enums";
import type { DeliveryType } from "../../../../common/enums";

interface ActionBoxProps {
    product: Product;
    mergedBids: Bid[];
    currentHighestBid: number;
    isBookMarked: boolean;
    isWinner: boolean;
    editingProductId: number | null;

    handleToggleBookmark: () => void;
    handleReport: () => void;
    navigate: (path: string, state?: any) => void;
}

export const ActionBox: React.FC<ActionBoxProps> = ({
    product,
    mergedBids,
    currentHighestBid,
    isBookMarked,
    isWinner,
    editingProductId,

    handleToggleBookmark,
    handleReport,
    navigate,
}) => {
    const [bidValue, setBidValue] = React.useState("");

    if (editingProductId) return null;

    // ✅ 배송 방법 텍스트 계산 (enum 사용)
    const getDeliveryText = () => {
        // 무료배송이면 무료배송 표시
        if (product.deliveryIncluded === true) {
            return "무료배송";
        }

        // deliveryAvailable에서 배송 방법들 가져와서 한글로 변환
        if (product.deliveryAvailable) {
            const methods = product.deliveryAvailable.split(",").map(m => {
                const key = m.trim() as DeliveryType;
                return DELIVERY_TYPES[key] || m.trim();
            });
            return methods.join(", ");
        }

        // 배송비만 있는 경우
        const deliveryPrice = Number(product.deliveryPrice) || 0;
        if (deliveryPrice > 0) {
            return `${DELIVERY_TYPES.PARCEL} ${deliveryPrice.toLocaleString()}원`;
        }

        return DELIVERY_TYPES.PARCEL; // 기본값: "택배"
    };

    return (
        <div className="rounded-xl border border-gray-200 shadow-sm p-5 h-[400px] md:h-[300px] h-fit box-border flex flex-col bg-white">

            {/* Fixed Header Area */}
            <div className="mb-2 shrink-0">
                <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-800 text-lg text-nowrap">
                        {PRODUCT_TYPES.AUCTION
                            ? "입찰하기"
                            : PRODUCT_TYPES.STORE ? "스토어 구매" : "중고 거래"}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={handleReport}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-all"
                            title="신고하기"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                        </button>
                        <button
                            onClick={handleToggleBookmark}
                            className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${isBookMarked ? 'bg-pink-100 text-pink-500' : 'bg-gray-50 hover:bg-gray-100 text-gray-400'} `}
                            title="찜하기"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill={isBookMarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto scrollbar-hide mb-4 space-y-4 min-h-0">
                {PRODUCT_TYPES.AUCTION ? (
                    <div className="flex flex-col">
                        {/* Auction Bidding List */}
                        <AuctionBidding
                            mergedBids={mergedBids}
                        />
                    </div>
                ) : (
                    <div className="flex flex-col">
                        <div className="space-y-3">
                            {/* ✅ Delivery Info - 수정됨 */}
                            <div className="flex gap-3 justify-between items-start text-sm p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-500 font-medium text-nowrap">배송방법</span>
                                <span className={`font-bold ${product.deliveryIncluded === true ? 'text-green-600' : 'text-gray-800'}`}>
                                    {getDeliveryText()}
                                </span>
                            </div>

                            {/* Additional Info */}
                            <div className="text-xs text-gray-400 leading-relaxed px-1">
                                ❗ 결제 전 상품 정보를 다시 한 번 확인해주세요.
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom: Action Buttons (Fixed at Bottom) */}
            <div className="mt-auto pt-4 border-t border-gray-100 bg-white">
                {PRODUCT_TYPES.STORE ? (
                    <div className="flex gap-3 h-[56px]">
                        <button
                            onClick={() => {
                                addToCart(product);
                                alert("장바구니에 담겼습니다.");
                            }}
                            className="flex-1 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2"
                        >
                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            장바구니
                        </button>
                        <button
                            onClick={() => navigate(`/payment?productId=${product.productId}`)}
                            className="flex-1 bg-[#111] text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg shadow-black/10"
                        >
                            바로구매
                        </button>
                    </div>
                ) : PRODUCT_TYPES.USED ? (
                    <button
                        onClick={() => navigate("/user-chat", { state: { sellerId: product.sellerId, productId: product.productId } })}
                        className="w-full h-[56px] bg-[#f5f5f5] text-[#333] rounded-xl font-semibold hover:bg-[#eee] transition-colors flex items-center justify-center gap-2"
                    >
                        <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 5.92 2 10.75c0 2.8 1.5 5.25 3.84 6.88.24.17.38.48.33.77l-.46 2.37c-.08.41.38.74.74.53l3.36-1.95c.2-.12.44-.15.65-.08.82.26 1.7.41 2.6.41 5.52 0 10-3.92 10-8.75S17.52 2 12 2z" />
                        </svg>
                        판매자와 채팅하기
                    </button>
                ) : (
                    // Auction Controls
                    <div className="flex flex-col gap-3">
                        {isWinner ? (
                            <button
                                onClick={() => navigate(`/payment?productId=${product.productId}`)}
                                className="w-full h-[56px] bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl shadow-lg animate-pulse"
                            >
                                낙찰 상품 결제하기
                            </button>
                        ) : (
                            <>
                                {/* Quick Add Buttons */}
                                <div className="flex gap-2">
                                    {[1000, 5000, 10000].map((amt) => (
                                        <button
                                            key={amt}
                                            onClick={() => {
                                                const current = Number(bidValue || currentHighestBid || 0);
                                                setBidValue(String(current + amt));
                                            }}
                                            className="flex-1 py-1.5 text-xs font-bold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
                                        >
                                            +{amt.toLocaleString()}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-2 h-[50px]">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            value={bidValue ? Number(bidValue).toLocaleString() : ""}
                                            onChange={(e) => {
                                                const clean = e.target.value.replace(/[^0-9]/g, "");
                                                setBidValue(clean);
                                            }}
                                            placeholder={currentHighestBid > 0 ? `${currentHighestBid.toLocaleString()}` : "0"}
                                            className="w-full h-full pl-4 pr-8 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-sm font-bold text-gray-800 placeholder:text-gray-300"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">원</span>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            const token = localStorage.getItem("token");
                                            if (!token) {
                                                alert("로그인이 필요합니다.");
                                                return;
                                            }

                                            const bidNum = Number(bidValue);
                                            if (!bidValue || isNaN(bidNum) || bidNum <= 0) {
                                                alert("올바른 금액을 입력해주세요 (0보다 큰 숫자)");
                                                return;
                                            }

                                            if (bidNum <= currentHighestBid) {
                                                alert(`입찰가가 현재 최고 입찰가(${currentHighestBid.toLocaleString()}원)보다 높아야 합니다.`);
                                                return;
                                            }

                                            try {
                                                await API.placeBid(product.productId, bidNum, token);
                                                setBidValue("");
                                                alert("입찰에 성공했습니다!");
                                            } catch (error: any) {
                                                console.error(error);
                                                alert(error.message || "입찰에 실패했습니다.");
                                            }
                                        }}
                                        className="px-6 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all shadow-md active:scale-95 whitespace-nowrap"
                                    >
                                        입찰
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

        </div>
    );
};