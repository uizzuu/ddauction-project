import { useNavigate } from "react-router-dom";
import type { Product } from "../../common/types";
import { formatPrice, calculateRemainingTime, formatTimeAgo } from "../../common/util";
import { Heart, Truck, ChevronRight } from "lucide-react";

type Props = {
    product: Product;
};

export default function ProductCard({ product }: Props) {
    const navigate = useNavigate();

    // 임시 카테고리 표시 (Used) - 실제 데이터 없으면 "기타"
    const categoryName = "기타";
    // 임시 할인율 (Store) - 실제 데이터 없으면 0
    const discountRate = 20;

    const handleCardClick = () => {
        navigate(`/products/${product.productId}`);
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
                    className="absolute top-3 right-3 z-10 p-1 hover:scale-110 transition-transform"
                    onClick={(e) => {
                        e.stopPropagation();
                        // 찜하기 로직 연동 필요
                        console.log("찜하기 클릭", product.productId);
                    }}
                >
                    <Heart size={20} className="text-[#333] hover:fill-[#b17576] hover:text-[#b17576]" />
                </button>
            </div>

            {/* 2. Content Area */}
            <div className="flex flex-col px-1">
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
                <h3 className="text-[13px] font-normal text-[#111] leading-tight mb-1.5 line-clamp-2 min-h-[32px] break-keep">
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
                                <span className="text-[11px] text-[#b17576] font-bold">현재가</span>
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
                                <span className="text-[15px] font-bold text-[#b17576]">{discountRate}%</span>
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
