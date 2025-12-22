import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Product, Bid } from "../../common/types";
import { formatPrice, calculateRemainingTime, formatTimeAgo } from "../../common/util";
import { Heart, Truck, ChevronRight, Minus } from "lucide-react";
import { toggleBookmark, fetchBookmarkCheck, API_BASE_URL } from "../../common/api";
import { DELIVERY_TYPES, PRODUCT_CATEGORIES, PRODUCT_STATUS, PRODUCT_TYPES } from "../../common/enums";

type Props = {
  product: Product;
  rank?: number;
  rankChange?: "UP" | "DOWN" | "SAME";
  mergedBids?: Bid[];       // 외부에서 계산된 모든 입찰 (선택적)
  highestBid?: number;      // 최고 입찰가 (선택적)
  hideHeart?: boolean;      // 찜 아이콘 숨김 여부 (편집 모드 등)
};

export default function ProductCard({ product, rank, rankChange, mergedBids: externalBids, highestBid: externalHighestBid, hideHeart }: Props) {
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(!!product.isBookmarked);

  useEffect(() => {
    setIsLiked(!!product.isBookmarked);

    const token = localStorage.getItem("token");
    if (token) {
      fetchBookmarkCheck(product.productId, token)
        .then(checked => {
          setIsLiked(checked);
        })
        .catch(err => {
          console.error("찜 확인 실패", err);
        });
    }
  }, [product.productId, product.isBookmarked]);

  const now = new Date();

  const isAuctionTimeEnded =
    product.productType === PRODUCT_TYPES.AUCTION &&
    product.auctionEndTime &&
    new Date(product.auctionEndTime) <= now;

  const isClosed =
    product.productStatus === PRODUCT_STATUS.CLOSED || isAuctionTimeEnded;

  const isSold =
    product.productStatus === PRODUCT_STATUS.SOLD;


  // Image Brightness Analysis
  const [isDarkImage, setIsDarkImage] = useState(false);

  useEffect(() => {
    if (product.images && product.images.length > 0) {
      const baseUrl = product.images[0].imagePath.startsWith('http')
        ? product.images[0].imagePath
        : `${API_BASE_URL}${product.images[0].imagePath}`;

      const imgSrc = `${baseUrl}?v=${Date.now()}`;

      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = imgSrc;

      import("fast-average-color").then(module => {
        const fac = new module.FastAverageColor();
        fac.getColorAsync(img)
          .then(color => {
            setIsDarkImage(color.isDark);
          })
          .catch(() => { });
      });
    }
  }, [product.images]);

  // ✅ 입찰 정보 계산 (우선순위: props > 백엔드 집계 > product.bids 계산)
  const getBidInfo = () => {
    // 1. 외부에서 전달된 props가 있으면 사용
    if (externalBids !== undefined && externalHighestBid !== undefined) {
      return { bidCount: externalBids.length, highestBidPrice: externalHighestBid };
    }

    // 2. 백엔드에서 계산된 집계 데이터가 있으면 사용
    if (product.bidCount !== undefined && product.highestBidPrice !== undefined) {
      return { bidCount: product.bidCount, highestBidPrice: product.highestBidPrice };
    }

    // 3. product.bids에서 직접 계산
    const bids = product.bids || [];
    let maxBid = Number(product.startingPrice) || 0;

    if (bids.length > 0) {
      const maxBidPrice = Math.max(...bids.map(bid => Number(bid.bidPrice) || 0));
      maxBid = Math.max(maxBid, maxBidPrice);
    }

    return { bidCount: bids.length, highestBidPrice: maxBid };
  };

  const bidInfo = getBidInfo();

  // ✅ 가격 정보 계산 (타입별 분기)
  const getPriceInfo = () => {
    if (product.productType === PRODUCT_TYPES.STORE) {
      const salePrice = Number(product.salePrice) || 0;
      const discountRate = Number(product.discountRate) || 0;

      let originalPrice = 0;
      if (discountRate > 0 && salePrice > 0) {
        originalPrice = Math.round(salePrice / (1 - discountRate / 100));
      }

      return {
        originalPrice,
        finalPrice: salePrice,
        discountRate,
        hasDiscount: discountRate > 0
      };
    } else if (product.productType === PRODUCT_TYPES.USED) {
      const price = Number(product.originalPrice) || 0;
      return {
        originalPrice: 0,
        finalPrice: price,
        discountRate: 0,
        hasDiscount: false
      };
    } else {
      // AUCTION
      return {
        originalPrice: 0,
        finalPrice: Number(product.startingPrice) || 0,
        discountRate: 0,
        hasDiscount: false
      };
    }
  };

  const priceInfo = getPriceInfo();

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
    setIsLiked(!prev);

    try {
      await toggleBookmark(product.productId, token);
      window.dispatchEvent(new Event("cart-updated"));
      window.dispatchEvent(new Event("wishlist-updated"));
    } catch (err) {
      console.error(err);
      setIsLiked(prev);
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
            src={product.images[0].imagePath.startsWith('http')
              ? product.images[0].imagePath
              : `${API_BASE_URL}${product.images[0].imagePath}`}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="flex justify-center items-center w-full h-full text-[#aaa] text-xs"></div>
        )}

        {/* Status Overlay (Sold/Closed) */}
        {/* Status Overlay */}
        {(isClosed || isSold) && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
            <span className="text-white font-bold text-lg border border-white px-4 py-1.5 rounded">
              {isSold ? "판매완료" : "경매 종료"}
            </span>
          </div>
        )}

        {/* Top-Left Badge (Black Square) */}
        <div className="absolute top-3 left-3 w-6 h-6 bg-black flex items-center justify-center rounded-[4px] z-10">
          <span className="text-white text-xs font-bold leading-none">
            {product.productType === PRODUCT_TYPES.AUCTION ? "A" : product.productType === PRODUCT_TYPES.STORE ? "S" : "U"}
          </span>
        </div>

        {/* Top-Right Heart Icon */}
        {!hideHeart && (
          <button
            className="absolute top-3 right-3 z-10 hover:scale-110 transition-transform"
            onClick={handleLike}
          >
            <Heart
              size={20}
              className={isLiked
                ? "fill-red-500 text-red-500 drop-shadow-sm"
                : ""}
              color={isLiked ? undefined : (isDarkImage ? "white" : "#111")}
            />
          </button>
        )}
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
        <div>
          {product.productType === PRODUCT_TYPES.AUCTION && product.auctionEndTime && (
            <span className="flex items-center gap-0.5 text-[0.8rem] font-bold text-[#333]">
              {calculateRemainingTime(product.auctionEndTime)}
            </span>
          )}
          {product.productType === PRODUCT_TYPES.USED && (
            <span className="flex items-center gap-0.5 text-[0.8rem] font-bold text-[#333]">
              {product.productCategoryType
                ? PRODUCT_CATEGORIES[product.productCategoryType]
                : "카테고리 없음"}
            </span>
          )}
          {product.productType === PRODUCT_TYPES.STORE && (
            <div
              className="flex items-center gap-0.5 text-[0.8rem] font-bold text-[#333] hover:underline cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                if (product.sellerId) {
                  navigate(`/users/${product.sellerId}`);
                }
              }}
            >
              <span>{product.sellerNickName || "브랜드명"}</span>
              <ChevronRight size={10} />
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-[0.95rem] font-semibold text-[#111] mb-2 leading-tight line-clamp-2 break-keep truncate">
          {product.title}
        </h3>

        {/* Price Area */}
        <div className="mt-auto">
          {product.productType === PRODUCT_TYPES.AUCTION ? (
            /* AUCTION: 시작가(startingPrice) + 현재가 표시 */
            <div className="flex flex-col">
              <div className="text-[0.85rem] text-[#999] line-through decoration-slate-300">
                시작가 {formatPrice(product.startingPrice)}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-[0.85rem] text-[#111] font-bold">현재가</span>
                <span className="text-[0.95rem] font-bold text-[#333]">
                  {formatPrice(bidInfo.highestBidPrice)}
                </span>
              </div>
            </div>
          ) : product.productType === PRODUCT_TYPES.STORE ? (
            /* STORE: salePrice 사용 */
            <div className="flex flex-col">
              {priceInfo.hasDiscount && (
                <div className="text-[0.85rem] text-[#999] line-through decoration-slate-300">
                  {formatPrice(priceInfo.originalPrice)}
                </div>
              )}
              <div className="flex items-center gap-1.5">
                {priceInfo.hasDiscount && (
                  <span className="text-[0.85rem] font-bold text-[#111]">{priceInfo.discountRate}%</span>
                )}
                <span className="text-[0.95rem] font-bold text-[#333]">
                  {formatPrice(priceInfo.finalPrice)}
                </span>
              </div>
            </div>
          ) : (
            /* USED: originalPrice 사용 */
            <div className="flex flex-col">
              <span className="text-[0.95rem] font-bold text-[#333]">
                {formatPrice(priceInfo.finalPrice)}
              </span>
            </div>
          )}
        </div>

        {/* Footer Info Area */}
        <div className="mt-2 text-[0.85rem] text-[#999] font-medium flex items-center gap-1">
          {product.productType === PRODUCT_TYPES.AUCTION ? (
            /* AUCTION: 입찰 건수 표시 */
            <span className="text-[#aaa]">입찰 {bidInfo.bidCount}건</span>
          ) : product.productType === PRODUCT_TYPES.STORE ? (
            /* STORE: deliveryIncluded 체크 */
            <div className="flex items-center gap-1">
              <Truck size={10} />
              <span>{product.deliveryIncluded === true ? "무료배송" : `배송비 ${formatPrice(product.deliveryPrice)}`}</span>
            </div>
          ) : (
            /* USED: 실제 주소 사용 */
            <div className="flex items-center gap-1 min-w-0">
              <span className="truncate">{product.address || (product.deliveryAvailable ? (DELIVERY_TYPES[product.deliveryAvailable.split(",")[0].trim() as keyof typeof DELIVERY_TYPES] || product.deliveryAvailable) : "")}</span>
              <span className="w-[1px] h-[8px] flex-shrink-0 bg-[#ddd] inline-block mx-0.5"></span>
              <span className="text-nowrap flex-shrink-0">{formatTimeAgo(product.createdAt)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}