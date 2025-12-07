import type { Product, ProductCategoryType, ProductType } from "./types";
import { PRODUCT_STATUS, PAYMENT_STATUS, PRODUCT_CATEGORIES } from "./enums";

// SortOption
export type SortOption = "latest" | "oldest" | "priceAsc" | "priceDesc" | "timeLeft" | "popularity";

// 날짜 yyyy-MM-dd HH:mm:ss
export const formatDateTime = (isoString: string | undefined) => {
  if (!isoString) return "";
  const d = new Date(isoString);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hour = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const sec = String(d.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${min}:${sec}`;
};

// 짧은 날짜 MM.dd
export const formatShortDate = (isoString: string | undefined) => {
  if (!isoString) return "";
  const d = new Date(isoString);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${month}.${day}`;
};

// 남은 시간 “X일 X시간 X분 X초”
// 남은 시간 “X일 X시간 X분 X초”
export const calculateRemainingTime = (endTime: string | undefined) => {
  if (!endTime) return "";
  const now = new Date();
  const end = new Date(endTime);
  const diff = end.getTime() - now.getTime();
  if (diff <= 0) return "경매 종료";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return `${days}일 ${hours}시간 ${minutes}분 ${seconds}초`;
};

// X일 후 / X개월 후 / 곧 종료
export const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";

  const now = new Date();
  const diff = date.getTime() - now.getTime();
  if (diff <= 0) return "종료됨";

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  const remainDays = days % 30;

  if (years > 0) return months > 0 ? `${years}년 ${months}개월 후` : `${years}년 후`;
  if (months > 0) return remainDays > 0 ? `${months}개월 ${remainDays}일 후` : `${months}개월 후`;
  if (days > 0) return `${days}일 후`;
  if (hours > 0) return `${hours}시간 후`;
  if (minutes > 0) return `${minutes}분 후`;

  return "곧 종료";
};

// 방금 전 / X분 전 / X시간 전 / X일 전 (과거 기준)
export const formatTimeAgo = (dateString: string | undefined) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60 * 1000) return "방금 전";

  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 60) return `${minutes}분 전`;

  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 24) return `${hours}시간 전`;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 7) return `${days}일 전`;

  // 7일 이상이면 날짜 표시 (yyyy-MM-dd)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// 문자열을 한국 시간(+09:00) 기준으로 Date 변환
export const parseWithTZ = (s: string) => {
  if (!s) return new Date(0);
  if (/[Zz]|[+-]\d{2}:\d{2}$/.test(s)) return new Date(s);
  return new Date(`${s}+09:00`);
};

export const normalizeProduct = (
  p: Partial<Product>
): Product & { imageUrl: string } => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const defaultDateTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;

  return {
    productId: p.productId ?? 0,
    title: p.title ?? "제목 없음",
    content: p.content ?? "",
    startingPrice: p.startingPrice ?? 0,
    imageUrl: p.images?.[0]?.imagePath ?? "",
    auctionEndTime: p.auctionEndTime ?? defaultDateTime,
    productStatus: p.productStatus ?? PRODUCT_STATUS[0],
    paymentStatus: p.paymentStatus ?? PAYMENT_STATUS[0],
    productCategoryType: p.productCategoryType ?? null,
    productType: p.productType ?? ('AUCTION' as ProductType),
    sellerId: p.sellerId ?? 0,
    sellerNickName: p.sellerNickName ?? "익명",
    bidId: p.bidId,
    bidPrice: p.bidPrice,
    bids: (p.bids ?? []).map((b) => ({
      bidId: b.bidId ?? 0,
      bidPrice: b.bidPrice ?? 0,
      userId: b.userId ?? 0,
      isWinning: b.isWinning ?? false,
      createdAt: b.createdAt ?? defaultDateTime,
    })),
    bid: p.bid
      ? {
        bidId: p.bid.bidId ?? 0,
        bidPrice: p.bid.bidPrice ?? 0,
        userId: p.bid.userId ?? p.sellerId ?? 0,
        isWinning: p.bid.isWinning ?? false,
        createdAt: p.bid.createdAt ?? defaultDateTime,
      }
      : null,
  } as Product & { imageUrl: string };
};

// ============================
// 가격
// ============================

export const formatPrice = (price?: number) =>
  !price ? "가격 미정" : `${price.toLocaleString()}원`;

// ============================
// 검색 querystring 생성
// ============================

export const buildSearchQuery = (params: {
  keyword?: string;
  category?: string;
  page?: string | number;
}) => {
  const query = new URLSearchParams();
  if (params.keyword) query.append("keyword", params.keyword.trim());
  if (params.category) query.append("category", params.category);
  query.append("page", params.page?.toString() ?? "0");
  return query.toString();
};

// ============================
// 상품 정렬 로직
// ============================

export const sortProducts = async (
  data: Product[],
  sort: SortOption,
  apiBaseUrl: string
) => {
  if (sort === "popularity") {
    const withBookmark = await Promise.all(
      data.map(async (p) => {
        const res = await fetch(
          `${apiBaseUrl}/api/bookmarks/count?productId=${p.productId}`
        );
        const count = await res.json();
        return { ...p, bookmarkCount: count };
      })
    );
    return withBookmark.sort(
      (a, b) => (b.bookmarkCount ?? 0) - (a.bookmarkCount ?? 0)
    );
  }

  return [...data].sort((a, b) => {
    const ad = new Date(a.createdAt || "").getTime();
    const bd = new Date(b.createdAt || "").getTime();

    switch (sort) {
      case "latest":
        return bd - ad;
      case "oldest":
        return ad - bd;
      case "priceAsc":
        return (a.startingPrice ?? 0) - (b.startingPrice ?? 0);
      case "priceDesc":
        return (b.startingPrice ?? 0) - (a.startingPrice ?? 0);
      case "timeLeft":
        return (
          parseWithTZ(a.auctionEndTime || "").getTime() -
          parseWithTZ(b.auctionEndTime || "").getTime()
        );
      default:
        return 0;
    }
  });
};

// 카테고리 코드를 한글 이름으로 변환
export const getCategoryName = (
  categoryCode: string | null | undefined
): string => {
  if (!categoryCode) return "없음";
  return PRODUCT_CATEGORIES[categoryCode as ProductCategoryType] || "기타";
};