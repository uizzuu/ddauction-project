export const ROLE = { ADMIN: "ADMIN", USER: "USER", SELLER: "SELLER", BANNED: "BANNED" } as const;
export type Role = typeof ROLE[keyof typeof ROLE];

export const PRODUCT_STATUS = {
  ACTIVE: "ACTIVE",
  CLOSED: "CLOSED",
  SOLD: "SOLD"
} as const;
export type ProductStatus = typeof PRODUCT_STATUS[keyof typeof PRODUCT_STATUS];
export const PRODUCT_STATUS_VALUES = Object.values(PRODUCT_STATUS) as ProductStatus[];

export const PAYMENT_STATUS = { PENDING: "PENDING", PAID: "PAID", COMPLETED: "COMPLETED", FAILED: "FAILED" } as const;
export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];

export const CHAT_TYPE = { PRIVATE: "PRIVATE", PUBLIC: "PUBLIC" } as const;
export type ChatType = typeof CHAT_TYPE[keyof typeof CHAT_TYPE];

// Product Type Definition (Consolidated)
export const PRODUCT_TYPES = {
  AUCTION: "경매",
  USED: "중고",
  STORE: "스토어",
} as const;
export type ProductType = keyof typeof PRODUCT_TYPES;
export const PRODUCT_TYPE_KEYS = Object.keys(PRODUCT_TYPES) as ProductType[];

// Article Types (Consolidated)
export const ARTICLE_TYPES = {
  NOTICE: "NOTICE",
  COMMUNITY: "COMMUNITY",
  FAQ: "FAQ"
} as const;
export type ArticleType = typeof ARTICLE_TYPES[keyof typeof ARTICLE_TYPES];

export const ARTICLE_TYPE_LABELS: Record<keyof typeof ARTICLE_TYPES, string> = {
  NOTICE: "공지사항",
  COMMUNITY: "자유",
  FAQ: "FAQ",
};
export const ARTICLE_TYPE_KEYS = Object.keys(ARTICLE_TYPES) as ArticleType[];

export const REPORT_TYPE = {
  PRODUCT: "PRODUCT",
  ARTICLE: "ARTICLE",
  PUBLIC_CHAT: "PUBLIC_CHAT",
  COMMENT: "COMMENT",
}
export type Report = typeof REPORT_TYPE[keyof typeof REPORT_TYPE];

export const IMAGE_TYPE = { PRODUCT: "PRODUCT", REVIEW: "REVIEW", USER: "USER" } as const;
export type ImageType = typeof IMAGE_TYPE[keyof typeof IMAGE_TYPE];

// Product Categories (Consolidated)
export const PRODUCT_CATEGORIES = {
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
} as const;

export type ProductCategoryType = keyof typeof PRODUCT_CATEGORIES;
export const PRODUCT_CATEGORY_KEYS = Object.keys(PRODUCT_CATEGORIES) as ProductCategoryType[];

// SSelectStyle용 옵션 배열
// SSelectStyle용 옵션 배열
export const CATEGORY_OPTIONS = PRODUCT_CATEGORY_KEYS.map(code => ({
  value: code,
  label: PRODUCT_CATEGORIES[code]
}));

// 배송 방법
// 배송 방법 (Consolidated)
export const DELIVERY_TYPES = {
  PARCEL: "택배",
  GS: "GS반값택배",
  CU: "CU알뜰택배",
  MAIL: "일반우편",
  SEMIREGISTERED: "준등기",
  REGISTERED: "등기",
  QUICK: "퀵서비스",
  MEETUP: "직거래",
  PICKUP: "방문수령"
} as const;
export type DeliveryType = keyof typeof DELIVERY_TYPES;
export const DELIVERY_TYPE_KEYS = Object.keys(DELIVERY_TYPES) as DeliveryType[];

// 택배사 옵션
export const COURIER_OPTIONS = [
  { value: "CJ", label: "CJ대한통운" },
  { value: "POST", label: "우체국택배" },
  { value: "HANJIN", label: "한진택배" },
  { value: "LOTTE", label: "롯데택배" },
  { value: "LOGEN", label: "로젠택배" },
] as const;

export type CourierType = (typeof COURIER_OPTIONS)[number]["value"];
export const NOTIFICATION_STATUS = [
  "NEW_COMMENT",
  "BID_WIN",
  "BID_LOSE",
  "MESSAGE",
  "FOLLOW",
  "SYSTEM",
] as const;

export type NotificationStatus = (typeof NOTIFICATION_STATUS)[number];