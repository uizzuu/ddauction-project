import { ROLE, PAYMENT_STATUS, PRODUCT_STATUS, CHAT_TYPE, PRODUCT_TYPE, IMAGE_TYPE } from './enums';
import type { ProductCategoryType } from './enums';

// Re-export ProductCategoryType so it's available when importing from types.ts
export type { ProductCategoryType };

export type Role = (typeof ROLE)[number];
export type ProductStatus = (typeof PRODUCT_STATUS)[number];
export type PaymentStatus = (typeof PAYMENT_STATUS)[number];
export type ChatType = (typeof CHAT_TYPE)[number];
export type ProductType = (typeof PRODUCT_TYPE)[number];
export type ImageType = (typeof IMAGE_TYPE)[number];

export interface User {
  userId: number;
  userName: string;
  nickName: string;
  password?: string;
  email?: string;
  phone?: string;
  birthday?: string;
  createdAt?: string;
  updatedAt?: string;
  role?: Role;
  token?: string;
  isWinner?: boolean;
}

export interface Bid {
  bidId: number;
  userId: number;
  bidPrice: number;
  isWinning: boolean;
  createdAt: string;
}

export interface Image {
  imageId: number;
  refId: number;
  imagePath: string;
  productType?: ProductType; // PRODUCT 이미지일 경우 (옵셔널)
  imageType: ImageType;
}

// 상품 조회/표시에 사용할 타입
export interface Product {
  productId: number;
  sellerId: number;
  sellerNickName: string;
  title: string;
  content?: string;
  startingPrice?: number;
  images?: Image[];
  auctionEndTime: string;
  productStatus: ProductStatus;
  paymentStatus: PaymentStatus;
  createdAt?: string;
  updatedAt?: string;
  bidId?: number;
  bidPrice?: number | null;
  paymentId?: number | null;
  bid?: Bid | null;
  bids?: Bid[]; // 입찰기록
  imageUrl?: string;
  productCategoryType?: ProductCategoryType | null;
  productType?: ProductType; // 상품 타입 추가 (경매/중고/스토어)

  // 정렬 로직 (인기순)을 위해 ProductSearchPage에서 사용되는 필드를 옵셔널로 추가
  bookmarkCount?: number;
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
  birthday: string;
}

// 상품 등록 폼 데이터 타입
export interface ProductForm {
  title: string;
  content: string;
  startingPrice: string; // 숫자 입력 후 문자열로 변환하여 저장
  auctionEndTime: string;
  productCategoryType: ProductCategoryType | null;
  productType: ProductType; // 상품 타입 필드 추가
  images?: File[];
}

// 상품 수정 데이터 타입
export type EditProductForm = {
  title: string;
  content: string;
  productCategoryType: ProductCategoryType | null;
  startingPrice?: string;
  productStatus: ProductStatus;
  auctionEndTime: string;
  productType: ProductType; // 상품 타입 필드 추가
  images?: File[];
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
  auctionEndTime: string;
  sellerId: number;
  productCategoryType: ProductCategoryType | null;
  productType: ProductType; // 상품 타입 필드 추가
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

export interface SelectStyleProps {
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


// 리뷰 타입
export interface Review {
  reviewId: number;
  refId: number;        // 실제 참조 대상 ID (상품ID 등)
  content: string;
  nickName: string;
  rating: number;
  productType: ProductType;
  createdAt: string;
  updatedAt: string;
  images: Image[];
}

// 상품 QnA 타입
export interface ProductQna {
  productQnaId: number;
  userId: number;
  nickName: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  refId: number;
  productType: ProductType;
  answers?: QnaReview[];
}

// QnA 리뷰 타입
export interface QnaReview {
  qnaReviewId: number;
  qnaUserId: number;
  productQnaId: number;
  content: string;
  nickName: string;
  createdAt: string;
  updatedAt: string;
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


// 최종낙찰 후 결제창 관련 타입 추가

export interface WinnerCheckResponse {
  isWinner: boolean;
  bidPrice?: number;
  message?: string;
}

export interface WinningInfo {
  productId: number;
  productTitle: string;
  productImage: string | null;
  bidPrice: number;
  sellerName: string;
  paymentStatus?: PaymentStatus;
}

export interface PaymentPrepareResponse {
  impCode: string;
  merchantUid: string;
  name: string;
  amount: number;
  buyerEmail: string;
  buyerName: string;
  buyerTel: string;
}

// RAG 챗봇 관련 타입
export interface RAGDocument {
  filename: string;          // source → filename
  content_snippet: string;   // content → content_snippet
}

export interface RAGRequest {
  query: string;
}

export interface RAGResponse {
  response: string;
  sources: RAGDocument[];    // documents → sources
}

export interface ChatMessage {
  id: string;
  query: string;
  response: RAGResponse;
  timestamp: string;
}

// 최소 유저 정보 타입 (백엔드 Users 엔티티 일부)
export interface ChatUser {
  userId: number;
  nickName: string;
}

// 백엔드 PrivateChat 엔티티 기반
export interface PrivateChat {
  chatId: number;
  content: string;
  createdAt: string;
  user: User;               // ★ user는 반드시 존재한다
  chatRoomId: number;       // ★ 없으면 추가
  targetUserId?: number;    // ★ websocket 메시지 받을 때 필요함
}

// 백엔드 PublicChat 엔티티 기반
export interface PublicChat {
  user?: User;
  content: string;
  type: "PUBLIC";
  createdAt?: string;
}

// WebSocket 메시지 송수신용 타입
export interface ChatMessagePayload {
  type: "PRIVATE" | "PUBLIC";
  userId: number;
  content: string;
  nickName: string;
  targetUserId?: number;
  productId?: number;
  chatRoomId?: number;
}

// UserChat 컴포넌트 props 타입
export interface UserChatProps {
  user: User | null;
}

// AROverlayModal 컴포넌트 props 타입
export interface AROverlayProps {
  productId: number;
}

//상품 내용 추천 관련 타입

export interface AiDescriptionRequest {
  product_name: string;
  keywords: string[];
  target_audience: string;
  tone: string;
}

export interface AiDescriptionResponse {
  description: string;
}
