import type { Role, ProductStatus, PaymentStatus, ImageType, ProductType, ProductCategoryType, NotificationStatus, ArticleType, DeliveryType } from './enums';

export interface CartItem extends Product {
  quantity: number;
  option?: string;
  shipping: number;
}

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
  businessNumber?: string;
  provider?: string;
  images?: Image[];
  address?: string;
  detailAddress?: string;
  zipCode?: string;
}

export interface Bid {
  bidId: number;
  userId: number;
  bidPrice: number;
  isWinning: boolean;
  createdAt: string;
  // New Fields for MyPage
  productName?: string;
  bidTime?: string;     // Alias for createdAt or specific bid timestamp
  bidAmount?: number;   // Alias for bidPrice
  userNickName?: string; // Sometimes needed for list display
  productId?: number;
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
  sellerProfileImage?: string;
  title: string;
  content?: string;
  startingPrice?: number;  // AUCTION: 시작 입찰가
  images?: Image[];
  auctionEndTime?: string; // Optional for non-auction items
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

  // New Fields
  tag?: string;
  address?: string;
  deliveryAvailable?: string; // Comma separated
  productBanners?: string[]; // List of URLs
  originalPrice?: number;    // USED: 판매가
  salePrice?: number;        // STORE: 판매가
  discountRate?: number;     // STORE: 할인율
  deliveryPrice?: number;
  deliveryAddPrice?: number;
  deliveryIncluded?: boolean;
  deliveryType?: DeliveryType;

  // 정렬 로직 (인기순)을 위해 ProductSearchPage에서 사용되는 필드를 옵셔널로 추가
  bookmarkCount?: number;
  isBookmarked?: boolean;
  viewCount?: number;

  bidCount?: number;
  highestBidPrice?: number;
}


export interface LoginForm {
  email: string;
  phone?: string;
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
  startingPrice: string;   // AUCTION: 시작 입찰가
  salePrice?: string;      // STORE: 판매가 (NEW)
  originalPrice?: string;  // USED: 판매가
  auctionEndTime: string;
  productCategoryType: ProductCategoryType | null;
  productType: ProductType; // 상품 타입 필드 추가
  images?: File[];

  // New Fields
  tag?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  deliveryAvailable?: string[]; // Frontend uses array, convert to string for backend
  productBanners?: File[]; // Store only (Multi-upload)
  discountRate?: string;   // STORE: 할인율
  deliveryPrice?: string;
  deliveryAddPrice?: string;
  deliveryIncluded?: boolean;
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
  images?: (File | Image)[];
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
  auctionEndTime?: string | null;
  sellerId: number;
  productCategoryType: ProductCategoryType | null;
  productType: ProductType; // 상품 타입 필드 추가
  productStatus: ProductStatus;

  // New Fields
  tag?: string;
  address?: string; // "AddressString"
  deliveryAvailable?: string; // "GS,CU"
  productBanners?: string[]; // URLs after upload 
  originalPrice?: number;
  salePrice?: number;        // ✅ STORE: 최종 판매가 (NEW)
  discountRate?: number;
  deliveryPrice?: number;
  deliveryAddPrice?: number;
  deliveryIncluded?: boolean;
}

// 게시판
export interface ArticleDto {
  articleId: number;
  userId: number;
  nickName: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  articleType: ArticleType;
  isSecret: boolean;
}

export interface ArticleForm {
  title: string;
  content: string;
  userId?: number;
  articleType: ArticleType;
  isSecret: boolean;
}

export interface CommentDto {
  commentId: number;
  articleId: number;
  userId: number;
  nickName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  articleTitle?: string;
}

export interface CommentForm {
  content: string;
  articleId?: number; // POST 시에는 URL에 포함되므로 optional
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
  userId: number;      // reporterId → userId
  refId: number;       // targetId → refId
  reportType?: string; // 추가
  userName?: string;   // 추가 (백엔드에서 제공)
  reason: string;
  answer?: string; // 추가
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
  isSecret: boolean;
  isSecretComment: boolean;
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
  isDeleted: boolean;       // Soft Delete
  nickName?: string;
}

// 백엔드 PublicChat 엔티티 기반
export interface PublicChat {
  publicChatId?: number;    // ID 추가
  user?: User;
  content: string;
  type: "PUBLIC";
  createdAt?: string;
  isDeleted: boolean;       // Soft Delete
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
  user: User;
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

export interface BusinessVerifyProps {
  userId: number;
  onVerified: () => void;
  onCancel?: () => void;
}

export interface BusinessVerifyResponse {
  businessNumber: string;
  valid: boolean;
  // 백엔드에서 새로 발급된 토큰이 담기는 필드
  newToken?: string;
}

//알림 타입
export type Notification = {
  notificationId: number;
  userId?: number;
  notificationStatus?: NotificationStatus;
  content: string;
  isRead: boolean;
  createdAt: string;
};

// [⭐ 추가할 부분: ChatRoomListDto 인터페이스 ⭐]
export interface ChatRoomListDto {
  chatRoomId: number;
  productId: number;
  productTitle: string;
  targetUserId: number;
  targetNickName: string;
  lastMessage: string;
  lastMessageTime: string; // ISO 8601 string
  unreadCount: number;
}

// AdminChatRoomListDto 정의 (백엔드와 필드 일치)
export interface AdminChatRoomListDto {
  chatRoomId: number;
  productId: number;
  productTitle: string;

  // 판매자 정보
  sellerId: number;
  sellerNickName: string;

  // 구매자 정보
  buyerId: number;
  buyerNickName: string;

  // 메시지 정보
  lastMessage: string;
  lastMessageTime: string; // ISO String
}

// 목록 타입을 유니온으로 재정의
export type ChatListItem = ChatRoomListDto | AdminChatRoomListDto | User;