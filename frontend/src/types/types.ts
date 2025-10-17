export interface User {
  userId: number;
  userName: string;
  nickName: string;
  email?: string;
  phone?: string;
}

export interface Product {
  productId: number;
  title: string;
  content?: string; // 백엔드에서 오는 내용
  description?: string; // 프론트에서 표시용
  price?: number;
  imageUrl?: string;
  auctionEndTime: string;
  productStatus?: string;
  paymentStatus?: string;
  categoryId?: number;
  sellerId?: number;
  oneMinuteAuction?: boolean;
}

export interface Category {
  categoryId: number;
  name: string;
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface SignupForm {
  userName: string;
  nickName: string;
  email: string;
  password: string;
  phone: string;
}

export interface ProductForm {
  title: string;
  content: string;
  price: number;
  imageUrl: string;
  oneMinuteAuction: boolean;
  auctionEndTime: string;
  categoryId: number | null;
}

// 상품 등록을 위한 타입
export interface CreateProductRequest {
  title: string;
  content: string;
  price: number;
  imageUrl: string;
  oneMinuteAuction: boolean;
  auctionEndTime: string;
  categoryId: number;
  sellerId: number;
  productStatus: string;
  paymentStatus: string;
}
