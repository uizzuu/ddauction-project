export const PRODUCT_STATUS = ["ACTIVE", "CLOSED", "SOLD"] as const;
export type ProductStatus = (typeof PRODUCT_STATUS)[number];

export const PAYMENT_STATUS = ["PENDING", "COMPLETED", "FAILED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUS)[number];

export const ROLE = ["ADMIN", "USER", "BANNED"] as const;
export  type Role = (typeof ROLE)[number];

export interface User {
  userId: number;
  userName: string;
  nickName: string;
  password?: string;
  email?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
  role?: Role;
  token?: string;
}

export interface Bid {
  bidId: number;
  userId: number;
  bidPrice: number;
  isWinning: boolean;
  createdAt: string;
}

// 상품 조회/표시에 사용할 타입
export interface Product {
  productId: number;
  sellerId: number;
  sellerNickName: string;
  title: string;
  content?: string;
  startingPrice?: number;
  imageUrl?: string;
  oneMinuteAuction?: boolean;
  auctionEndTime: string;
  productStatus: ProductStatus;
  paymentStatus: PaymentStatus;
  createdAt?: string;
  updatedAt?: string;
  bidId?: number;
  bidPrice?: number | null;
  paymentId?: number | null;
  categoryId: number;
  categoryName?: string;
  bid?: Bid | null;
  bids?: Bid[]; // 입찰기록
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

// 상품 등록 폼 데이터 타입
export interface ProductForm {
  title: string;
  content: string;
  startingPrice: string; // 숫자 입력 후 문자열로 변환하여 저장
  imageUrl: string;
  oneMinuteAuction: boolean;
  auctionEndTime: string;
  categoryId: number | null;
}

// 상품 수정 데이터 타입
export type EditProductForm = {
  title: string;
  content: string;
  categoryId?: number;
  startingPrice?: number;
  productStatus: typeof PRODUCT_STATUS[number];
};

export interface EditUserForm {
  nickName: string;
  password: string;
  phone: string;
}

// 서버 요청에 사용할 상품 생성 타입
export interface CreateProductRequest {
  title: string;
  content: string;
  startingPrice: string;
  imageUrl: string;
  oneMinuteAuction: boolean;
  auctionEndTime: string;
  sellerId: number;
  categoryId: number;
  productStatus: ProductStatus;
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
  articleId: number;
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

export interface Report {
  reportId: number;
  reporterId: number;
  targetId: number;
  reason: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Board {
  boardId: number;
  boardName: string;
}

export interface Qna {
  qnaId: number;
  title: string;
  question: string;
  createdAt: string;
  updatedAt?: string;
  answers?: QnaAnswer[];
  boardId?: number;
  boardName?: string;
  productId?: number;
  userId: number;
  nickName?: string;
}

export interface QnaAnswer {
  qnaReviewId: number;
  answer: string;
  nickName: string;
  userId: number;
  role?: Role;
  createdAt: string;
  updatedAt: string;
  qnaUserId: number;
}

export interface Inquiry {
  inquiryId: number;
  title: string;
  question: string;
  createdAt: string;
  answers: {
    inquiryReviewId: number;
    answer: string;
    nickName: string;
    createdAt: string;
  }[];
  newAnswer?: string;
}

export type Review = {
  rating: number;
  comments: string;
  createdAt?: string;
}