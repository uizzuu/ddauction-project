import React from "react";
import { AuctionBidding } from "../../../../components/product/AuctionBidding";
import type { Product, Bid } from "../../../../common/types";

interface ActionBoxProps {
    product: Product;
    mergedBids: Bid[];
    currentHighestBid: number;
    isBookMarked: boolean;
    isWinner: boolean;
    editingProductId: number | null;
    handlePlaceBid: (bidPrice: number) => void;
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
    handlePlaceBid,
    handleToggleBookmark,
    handleReport,
    navigate,
}) => {
    if (editingProductId) return null;

    return (
        <div className="rounded-xl border border-gray-200 shadow-sm p-5 sticky top-24 h-[400px] box-border flex flex-col">

            <div className="flex-1 overflow-y-auto scrollbar-hide">
                {product.productType === "AUCTION" ? (
                    <AuctionBidding
                        productId={product.productId}
                        mergedBids={mergedBids}
                        currentHighestBid={currentHighestBid}
                        placeBid={handlePlaceBid}
                    />
                ) : (
                    <div className="space-y-3 h-full">
                        <div className="flex justify-between items-center text-sm mb-4">
                            <span className="text-gray-500">배송방법</span>
                            <span className="font-bold text-gray-800">택배배송 (무료)</span>
                        </div>

                        {/* Action Buttons Row */}
                        <div className="flex gap-2 h-[56px]">
                            <button
                                onClick={handleToggleBookmark}
                                className={`w-[56px] flex items-center justify-center rounded-xl border-2 transition-all ${isBookMarked ? 'border-pink-500 bg-pink-50 text-pink-500' : 'border-gray-200 hover:border-gray-400 text-gray-300'}`}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill={isBookMarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </button>

                            {product.productType === 'STORE' ? (
                                <>
                                    <button
                                        onClick={() => {
                                            window.dispatchEvent(new Event("cart-updated"));
                                            alert("장바구니에 담겼습니다.");
                                        }}
                                        className="flex-1 bg-white border-2 border-gray-800 text-gray-900 rounded-xl font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                        </svg>
                                        장바구니
                                    </button>
                                    <button
                                        onClick={() => navigate(`/payment?productId=${product.productId}`)}
                                        className="flex-1 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-md"
                                    >
                                        구매하기
                                    </button>
                                </>
                            ) : (
                                <>
                                    {product.productType === 'USED' && (
                                        <button
                                            onClick={() => navigate("/user-chat", { state: { sellerId: product.sellerId, productId: product.productId } })}
                                            className="flex-1 bg-white border-2 border-yellow-400 text-black rounded-xl font-bold hover:bg-yellow-50 transition-colors"
                                        >
                                            1:1 채팅
                                        </button>
                                    )}
                                    <button
                                        onClick={() => navigate(`/payment?productId=${product.productId}`)}
                                        className="flex-1 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-md"
                                    >
                                        구매하기
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {isWinner && (
                    <button
                        onClick={() => navigate(`/payment?productId=${product.productId}`)}
                        className="w-full mt-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-4 rounded-xl shadow-lg animate-pulse"
                    >
                        🎉 낙찰 축하드립니다! 결제하기
                    </button>
                )}
            </div>

            <div className="mt-auto pt-4 border-t border-gray-100 text-center">
                <button
                    onClick={handleReport}
                    className="text-xs text-gray-400 hover:text-gray-600 underline flex items-center justify-center w-full gap-1"
                >
                    🚨 이 상품 신고하기
                </button>
            </div>
        </div>
    );
};
