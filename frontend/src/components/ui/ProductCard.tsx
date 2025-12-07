import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Product } from "../../common/types";
import { formatPrice, calculateRemainingTime, formatTimeAgo } from "../../common/util";
import { Heart, Truck, ChevronRight, ChevronUp, ChevronDown, Minus } from "lucide-react";
import { toggleBookmark } from "../../common/api";

type Props = {
    product: Product;
    rank?: number;
    rankChange?: "UP" | "DOWN" | "SAME";
};

export default function ProductCard({ product, rank, rankChange }: Props) {
    const navigate = useNavigate();
    // 1. Initialize state from prop
    const [isLiked, setIsLiked] = useState(!!product.isBookmarked);

    // 2. Sync state with prop updates (e.g. valid when parent refetches)
    useEffect(() => {
        setIsLiked(!!product.isBookmarked);
    }, [product.isBookmarked]);

    // 임시 카테고리 표시 (Used) - 실제 데이터 없으면 "기타"
    const categoryName = "기타";
    // 임시 할인율 (Store) - 실제 데이터 없으면 0
    const discountRate = 20;

    const handleCardClick = () => {
        navigate(`/products/${product.productId}`);
    };

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();

        const token = localStorage.getItem("token");
        if (!token) {
            alert("로그인이 필요합니다.");
            return;
        }

        const prev = isLiked;
        setIsLiked(!prev); // Optimistic Update

        try {
            await toggleBookmark(product.productId, token);
            // 헤더 카운트 즉시 업데이트
            window.dispatchEvent(new Event("cart-updated"));
            console.log("Like toggled, event dispatched");
        } catch (err) {
            console.error(err);
            setIsLiked(prev); // Revert
            const msg = err instanceof Error ? err.message : "알 수 없는 오류";
            alert(`찜하기 실패: ${msg}`);
        }
    };

    return (
        <div
            className="flex flex-col gap-2 group cursor-pointer w-full relative"
            onClick={handleCardClick}
        >
            {/* 1. Image Area */}
            <div className="w-full bg-[#f8f8f8] overflow-hidden relative aspect-square rounded-[10px] border border-[#f0f0f0]">
                {product.images && product.images.length > 0 ? (
                    <img
                        src={product.images[0].imagePath}
                        alt={product.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                            const parent = e.currentTarget.parentElement;
                            if (parent) parent.innerHTML = '<div class="flex justify-center items-center w-full h-full text-[#aaa] text-xs">이미지 없음</div>';
                        }}
                    />
                ) : (
                    <div className="flex justify-center items-center w-full h-full text-[#aaa] text-xs">이미지 없음</div>
                )}

                {/* Status Overlay (Sold/Closed) */}
                {product.productStatus !== "ACTIVE" && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white font-bold text-lg border border-white px-3 py-1 rounded">
                            {product.productStatus === "SOLD" ? "판매완료" : "거래종료"}
                        </span>
                    </div>
                )}

                {/* Top-Left Badge (Black Square) */}
                <div className="absolute top-3 left-3 w-6 h-6 bg-black flex items-center justify-center rounded-[4px] z-10">
                    <span className="text-white text-xs font-bold leading-none">
                        {product.productType === "AUCTION" ? "A" : product.productType === "STORE" ? "S" : "U"}
                    </span>
                </div>

                {/* Top-Right Heart Icon */}
                <button
                    className="absolute top-3 right-3 z-10 hover:scale-110 transition-transform"
                    onClick={handleLike}
                >
                    <Heart
                        size={20}
                        className={isLiked ? "fill-[#111] text-[#111]" : "text-[#333] hover:fill-[#111] hover:text-[#111]"}
                    />
                </button>
            </div>

            {/* 2. Content Area */}
            <div className="flex flex-col px-1">
                {/* Optional Rank Badge Row */}
                {rank && (
                    <div className="flex items-center gap-1 mb-1">
                        <span className="font-bold text-lg leading-none">{rank}</span>
                        <div className="flex items-center justify-center w-4 h-4">
                            {rankChange === "UP" && (
                                <svg
                                    width="9"
                                    height="6"
                                    viewBox="0 0 9 6"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="rotate-180 mb-[1px]"
                                >
                                    <path
                                        d="M8.5 0.25C8.5961 0.25 8.68396 0.304985 8.72559 0.391602C8.76720 0.478214 8.75534 0.581213 8.69531 0.65625L4.69531 5.65625C4.64787 5.71555 4.57595 5.75 4.5 5.75C4.42405 5.75 4.35213 5.71555 4.30469 5.65625L0.304688 0.65625C0.244658 0.581213 0.232795 0.478214 0.274414 0.391602C0.316044 0.304985 0.403899 0.25 0.5 0.25H8.5Z"
                                        fill="#EF4444"
                                        stroke="#EF4444"
                                        strokeWidth="0.5"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            )}
                            {rankChange === "DOWN" && (
                                <svg
                                    width="9"
                                    height="6"
                                    viewBox="0 0 9 6"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="mb-[1px]"
                                >
                                    <path
                                        d="M8.5 0.25C8.5961 0.25 8.68396 0.304985 8.72559 0.391602C8.76720 0.478214 8.75534 0.581213 8.69531 0.65625L4.69531 5.65625C4.64787 5.71555 4.57595 5.75 4.5 5.75C4.42405 5.75 4.35213 5.71555 4.30469 5.65625L0.304688 0.65625C0.244658 0.581213 0.232795 0.478214 0.274414 0.391602C0.316044 0.304985 0.403899 0.25 0.5 0.25H8.5Z"
                                        fill="#3B82F6"
                                        stroke="#3B82F6"
                                        strokeWidth="0.5"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            )}
                            {(!rankChange || rankChange === "SAME") && <Minus size={16} className="text-gray-400" />}
                        </div>
                    </div>
                )}

                {/* Type-Specific Header Info */}
                <div className="mb-1 min-h-[16px]">
                    {product.productType === "AUCTION" && product.auctionEndTime && (
                        <span className="text-[11px] text-[#888]">
                            {/* 보여줄 데이터 포맷 고민: 남은 시간 상세 or 간단히 */}
                            {calculateRemainingTime(product.auctionEndTime)}
                        </span>
                    )}
                    {product.productType === "USED" && (
                        /* 중고는 상단에 특별한 정보가 없으면 공백 혹은 카테고리 등 표시 */
                        <span className="text-[11px] text-[#888]">
                            {/* 카테고리나 브랜드 명 */}
                        </span>
                    )}
                    {product.productType === "STORE" && (
                        <div className="flex items-center gap-0.5 text-[11px] font-bold text-[#333]">
                            <span>{product.sellerNickName || "브랜드명"}</span>
                            <ChevronRight size={10} />
                        </div>
                    )}
                </div>

                {/* Title */}
                <h3 className="text-[14px] font-normal text-[#111] leading-tight mb-1.5 line-clamp-2 min-h-[32px] break-keep">
                    {product.title}
                </h3>

                {/* Price Area */}
                <div className="mt-auto">
                    {product.productType === "AUCTION" ? (
                        <div className="flex flex-col">
                            <div className="text-[11px] text-[#999] line-through decoration-slate-300">
                                시작가 {formatPrice(product.startingPrice)}
                            </div>
                            <div className="flex items-baseline gap-1 mt-0.5">
                                <span className="text-[11px] text-[#111] font-bold">현재가</span>
                                <span className="text-[15px] font-bold text-[#333]">
                                    {formatPrice(product.bidPrice || product.startingPrice)}
                                </span>
                            </div>
                        </div>
                    ) : product.productType === "STORE" ? (
                        <div className="flex flex-col">
                            <div className="text-[11px] text-[#999] line-through decoration-slate-300">
                                {formatPrice(Math.round((product.startingPrice || 0) * 1.2))} {/* 임시 원가 */}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[15px] font-bold text-[#111]">{discountRate}%</span>
                                <span className="text-[15px] font-bold text-[#333]">
                                    {formatPrice(product.startingPrice)}
                                </span>
                            </div>
                        </div>
                    ) : (
                        // USED
                        <div className="flex flex-col">
                            <span className="text-[15px] font-bold text-[#333]">
                                {formatPrice(product.startingPrice)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Footer Info Area */}
                <div className="mt-2 text-[10px] text-[#999] font-medium flex items-center gap-1">
                    {product.productType === "AUCTION" ? (
                        <span className="text-[#aaa]">입찰 {product.bids?.length || 0}건</span>
                    ) : product.productType === "STORE" ? (
                        <div className="flex items-center gap-1">
                            <Truck size={10} />
                            <span>무료배송</span>
                        </div>
                    ) : (
                        // USED - Location | Time ago
                        <div className="flex items-center gap-1">
                            <span>서울 강남구</span> {/* 임시 지역 */}
                            <span className="w-[1px] h-[8px] bg-[#ddd] inline-block mx-0.5"></span>
                            <span>{formatTimeAgo(product.createdAt)}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
