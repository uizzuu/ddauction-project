export interface User {
  userId: number;
  userName: string;
  nickName: string;
  email?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
  role?: "ADMIN" | "USER" | "BANNED";
  token?: string;
}

export interface Bid {
  bidId: number;
  userId: number;
  price: number;
  createdAt: string;
}

// 상품 조회/표시에 사용할 타입
export interface Product {
  productId: number;
  title: string;
  content?: string;
  startingPrice?: number;     // 또는 string으로 정의 가능
  imageUrl?: string;
  oneMinuteAuction?: boolean;
  auctionEndTime: string;
  productStatus?: string;
  categoryId?: number;
  categoryName?: string;
  sellerId?: number;
  sellerNickName?: string;    // 백엔드 필드 명
  description?: string;
  price?: number;
  createdAt?: string;
  updatedAt?: string;
  paymentStatus?: string;
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

// 상품 등록 폼 데이터 타입
export interface ProductForm {
  title: string;
  content: string;
  startingPrice: string;  // 숫자 입력 후 문자열로 변환하여 저장
  imageUrl: string;
  oneMinuteAuction: boolean;
  auctionEndTime: string;
  categoryId: number | null;
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
  productStatus: string;  // "ACTIVE" 등을 전달
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

// 신고 타입
export interface Report {
  reportId: number;
  reporterId: number;
  targetId: number;
  reason: string;
  status: boolean;
}

// Q&A 타입
export interface Qna {
  qnaId: number;
  title: string;
  question: string;
  createdAt: string;
  answers: QnaAnswer[];
}

export interface QnaAnswer {
  qnaReviewId: number;
  answer: string;
  nickName: string;
  createdAt: string;
}

// 신고 타입
export interface Report {
  reportId: number;
  reporterId: number;
  targetId: number;
  reason: string;
  status: boolean;
}

// Q&A 타입
export interface Qna {
  qnaId: number;
  title: string;
  question: string;
  createdAt: string;
  updatedAt?: string;
  boardId?: number;
  productId?: number;
  userId: number;
  nickName?: string;
}

export interface QnaAnswer {
  qnaReviewId: number;
  answer: string;
  nickName: string;
  createdAt: string;
}