export type Page = "main" | "login" | "signup" | "register" | "list" | "mypage";

export interface User {
  userId: number; // App과 ProductRegister에서 일치하도록 userId 사용
  username: string;
  nickName: string;
  email?: string;
}

export interface Product {
  productId: number;
  sellerId?: number;
  title: string;
  content?: string;           // 백엔드에서 오는 내용
  description?: string;       // 프론트에서 표시용
  price?: number;
  auctionEndTime?: string;
  imageUrl?: string;
  oneMinuteAuction?: boolean;
  productStatus?: string;
  paymentStatus?: string;
  amount?: number;
  createdAt?: string;
  updatedAt?: string;
  categoryId?: number;

  // 객체 연동
  category?: { categoryId: number; name: string };
  bidder?: { userId: number; username: string };
}

export interface LoginForm {
  username: string;
  password: string;
}

export interface SignupForm {
  username: string;
  email: string;
  password: string;
  passwordConfirm?: string;
}

export interface ProductForm {
  title: string;
  description: string;
  price: string;       // number가 아닌 string으로 폼에서 입력
  auctionEndTime: string;
  categoryId?: number;
  imageUrl?: string;
}
