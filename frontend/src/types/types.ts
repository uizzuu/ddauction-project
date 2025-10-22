export interface User {
  userId: number;
  userName: string;
  nickName: string;
  email?: string;
  phone?: string;
}

export interface Bid {
  bidId: number;
  userId: number;
  price: number;
  createdAt: string;
}

export interface Product {
  productId: number;
  title: string;
  content?: string;
  description?: string;
  price?: number;
  startingPrice?: number;
  imageUrl?: string;
  auctionEndTime: string;
  createdAt?: string;
  updatedAt?: string;
  productStatus?: string;
  paymentStatus?: string;
  categoryId?: number;
  categoryName?: string;
  sellerId?: number;
  sellerName?: string;
  oneMinuteAuction?: boolean;
  bidderId?: number;
  amount?: number;
  bids?: Bid[]; // 입찰 기록
  bid?: Bid; // 🔥 현재 최고 입찰 추가
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

//게시판
export interface ArticleDto {
  articleId: number;
  userId: number;
  nickName: string;
  boardId: number;
  boardName: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}
export interface ArticleForm {
  title: string;
  content: string;
  boardId: number;
  userId?: number;
}

export interface CommentDto {
  commentId: number;
  articleId: number;
  userId: number;
  nickName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommentForm {
  content: string;
  userId: number;
}

// 공통 UI 타입들
export interface Option {
  value: string;
  label: string;
}

export interface SelectBoxProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
}
