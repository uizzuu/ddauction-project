export const ROLE = ["ADMIN", "USER", "BANNED"] as const;
export type Role = (typeof ROLE)[number];

export const PRODUCT_STATUS = ["ACTIVE", "CLOSED", "SOLD"] as const;
export type ProductStatus = (typeof PRODUCT_STATUS)[number];

export const PAYMENT_STATUS = ["PENDING", "PAID", "COMPLETED", "FAILED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUS)[number];

export const CHAT_TYPE = ["PRIVATE", "PUBLIC"] as const;
export type ChatType = (typeof CHAT_TYPE)[number];