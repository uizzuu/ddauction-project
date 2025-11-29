export const ROLE = ["ADMIN", "USER", "BANNED"] as const;
export type Role = (typeof ROLE)[number];

export const PRODUCT_STATUS = ["ACTIVE", "CLOSED", "SOLD"] as const;
export type ProductStatus = (typeof PRODUCT_STATUS)[number];

export const PAYMENT_STATUS = ["PENDING", "PAID", "COMPLETED", "FAILED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUS)[number];

export const CHAT_TYPE = ["PRIVATE", "PUBLIC"] as const;
export type ChatType = (typeof CHAT_TYPE)[number];

export const PRODUCT_TYPE = ["AUCTION", "USED", "STORE"] as const;
export type ProductType = (typeof PRODUCT_TYPE)[number];

export const PRODUCT_CATEGORY_TYPE = [
  "ELECTRONICS",
  "APPLIANCES",
  "FURNITURE_INTERIOR",
  "KITCHENWARE",
  "FOODS",
  "KIDS",
  "BOOKS",
  "STATIONERY",
  "CLOTHING",
  "ACCESSORIES",
  "BEAUTY",
  "SPORTS",
  "ENTERTAINMENT",
  "TICKETS",
  "PET",
  "PLANTS",
  "ETC"
] as const;
export type ProductCategoryType = (typeof PRODUCT_CATEGORY_TYPE)[number];

// 카테고리 한글 매핑
export const PRODUCT_CATEGORY_LABELS: Record<ProductCategoryType, string> = {
  ELECTRONICS: "디지털기기",
  APPLIANCES: "생활가전",
  FURNITURE_INTERIOR: "가구/인테리어",
  KITCHENWARE: "생활/주방",
  FOODS: "식품",
  KIDS: "유아동",
  BOOKS: "도서",
  STATIONERY: "문구류",
  CLOTHING: "의류",
  ACCESSORIES: "잡화",
  BEAUTY: "뷰티/미용",
  SPORTS: "스포츠레저",
  ENTERTAINMENT: "취미/게임/음반",
  TICKETS: "티켓/교환권",
  PET: "반려동물용품",
  PLANTS: "식물",
  ETC: "기타 물품"
};

// SelectBox용 옵션 배열
export const CATEGORY_OPTIONS = PRODUCT_CATEGORY_TYPE.map(code => ({
  value: code,
  label: PRODUCT_CATEGORY_LABELS[code]
}));