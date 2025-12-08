import type * as TYPE from "./types";
import { normalizeProduct } from "./util";
import type { SortOption } from "./util";

const SPRING_API = "/api";
const PYTHON_API = "/ai";
export const API_BASE_URL =
  import.meta.env.MODE === "production"
    ? ""
    : import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
export const AI_BASE_URL =
  import.meta.env.MODE === "production"
    ? ""
    : import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// ===================== 타입가드 =====================

function isBid(obj: unknown): obj is TYPE.Bid {
  if (typeof obj !== "object" || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.bidId === "number" &&
    typeof o.userId === "number" &&
    typeof o.bidPrice === "number" &&
    typeof o.createdAt === "string"
  );
}

function isProduct(obj: unknown): obj is TYPE.Product {
  if (typeof obj !== "object" || obj === null) return false;
  const o = obj as Record<string, unknown>;
  const bidsValid =
    o.bids === undefined || (Array.isArray(o.bids) && o.bids.every(isBid));
  return (
    typeof o.productId === "number" &&
    typeof o.title === "string" &&
    (o.auctionEndTime === undefined || o.auctionEndTime === null || typeof o.auctionEndTime === "string") &&
    bidsValid
  );
}

function isProductArray(obj: unknown): obj is TYPE.Product[] {
  return Array.isArray(obj) && obj.every(isProduct);
}

// ===================== 헬퍼 =====================

// token이 없는 경우 처리
function ensureToken(token?: string) {
  if (!token) throw new Error("로그인이 필요합니다.");
  return token;
}

// 공통 fetch 함수
async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      throw new Error(data.error || text);
    } catch {
      throw new Error(text);
    }
  }
  return res.json();
}

// ===================== API =====================

// 인증 헤더를 포함한 fetch Wrapper
async function authFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  return fetch(url, { ...options, headers });
}

// 입찰 등록
export async function placeBid(productId: number, bidPrice: number, token?: string) {
  const t = ensureToken(token);
  return fetchJson(`${API_BASE_URL}${SPRING_API}/bid/${productId}/bid`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
    body: JSON.stringify({ bidPrice }),
  });
}

// 상품 조회
export const fetchProductById = (productId: number) =>
  fetchJson<TYPE.Product>(`${API_BASE_URL}${SPRING_API}/products/${productId}`);

// 찜 수 조회
export const fetchBookmarkCount = (productId: number) =>
  fetchJson<number>(`${API_BASE_URL}${SPRING_API}/bookmarks/count?productId=${productId}`);

// 찜 여부 조회
export const fetchBookmarkCheck = (productId: number, token?: string) =>
  fetchJson<boolean>(`${API_BASE_URL}${SPRING_API}/bookmarks/check?productId=${productId}`, {
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });

// 주소 변환 (Reverse Geocoding)
export const reverseGeocode = (latitude: number, longitude: number) =>
  fetchJson<string>(`${API_BASE_URL}${SPRING_API}/geo/reverse?latitude=${latitude}&longitude=${longitude}`);

// 찜 토글
export const toggleBookmark = async (productId: number, token?: string) => {
  const t = ensureToken(token);
  const res = await fetch(`${API_BASE_URL}${SPRING_API}/bookmarks/toggle?productId=${productId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
  });
  if (!res.ok) throw new Error("찜하기 실패");
  return res.text();
};

// 모든 입찰 내역 조회
export const fetchAllBids = (productId: number, token?: string) =>
  fetchJson<TYPE.Bid[]>(`${API_BASE_URL}${SPRING_API}/bid/${productId}/bids`, {
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });

// 최고 입찰가 조회
export const fetchHighestBid = (productId: number) =>
  fetchJson<number>(`${API_BASE_URL}${SPRING_API}/products/${productId}/highest-bid`);

// 낙찰자 조회
export const fetchWinner = (productId: number, token?: string) =>
  fetchJson<TYPE.WinnerCheckResponse>(`${API_BASE_URL}${SPRING_API}/bid/${productId}/winner`, {
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });

// 판매자 신고
export const reportSeller = (sellerId: number, reason: string, token?: string) => {
  const t = ensureToken(token);
  return fetchJson<string>(`${API_BASE_URL}${SPRING_API}/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
    body: JSON.stringify({ targetId: sellerId, reason }),
  });
};

// 상품 수정
export const editProduct = (productId: number, payload: any, token?: string) => {
  const t = ensureToken(token);
  return fetchJson<TYPE.Product>(`${API_BASE_URL}${SPRING_API}/products/${productId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
    body: JSON.stringify(payload),
  });
};

// 상품 삭제
export const deleteProduct = (productId: number, token?: string) => {
  const t = ensureToken(token);
  return fetch(`${API_BASE_URL}${SPRING_API}/products/${productId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
  }).then(res => {
    if (!res.ok) throw new Error("삭제 실패");
    return true;
  });
};

// RAG 챗봇
export async function queryRAG(query: string): Promise<TYPE.RAGResponse> {
  const request: TYPE.RAGRequest = { query };

  const response = await fetch(`${API_BASE_URL}${PYTHON_API}/chat/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`RAG 질의 실패: ${errorText || response.statusText}`);
  }

  return response.json();
}

export async function getArticles(params?: {
  boardId?: number;
}): Promise<TYPE.ArticleDto[]> {
  const query = params?.boardId ? `?boardId=${params.boardId}` : "";
  const response = await authFetch(
    `${API_BASE_URL}${SPRING_API}/articles${query}`
  );
  if (!response.ok) throw new Error("게시글 목록 조회 실패");
  return response.json();
}

export async function getArticleById(id: number): Promise<TYPE.ArticleDto> {
  const response = await authFetch(`${API_BASE_URL}${SPRING_API}/articles/${id}`);
  if (!response.ok) throw new Error("게시글 조회 실패");
  return response.json();
}

export async function createArticle(
  articleData: TYPE.ArticleForm
): Promise<TYPE.ArticleDto> {
  const response = await authFetch(`${API_BASE_URL}${SPRING_API}/articles`, {
    method: "POST",
    body: JSON.stringify(articleData),
  });
  if (!response.ok) throw new Error("게시글 생성 실패");
  const result = await response.json();
  return result.data; // Extract data from wrapper
}

export async function updateArticle(
  id: number,
  articleData: TYPE.ArticleForm
): Promise<TYPE.ArticleDto> {
  const response = await authFetch(
    `${API_BASE_URL}${SPRING_API}/articles/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(articleData),
    }
  );
  if (!response.ok) throw new Error("게시글 수정 실패");
  return response.json();
}

export async function deleteArticle(id: number): Promise<void> {
  const response = await authFetch(
    `${API_BASE_URL}${SPRING_API}/articles/${id}`,
    {
      method: "DELETE",
    }
  );
  if (!response.ok) throw new Error("게시글 삭제 실패");
}

export async function getCommentsByArticleId(
  articleId: number
): Promise<TYPE.CommentDto[]> {
  const response = await authFetch(
    `${API_BASE_URL}${SPRING_API}/articles/${articleId}/comments`
  );
  if (!response.ok) throw new Error("댓글 목록 조회 실패");
  return response.json();
}

export async function createComment(
  articleId: number,
  form: TYPE.CommentForm
): Promise<void> {
  const response = await authFetch(
    `${API_BASE_URL}${SPRING_API}/articles/${articleId}/comments`,
    {
      method: "POST",
      body: JSON.stringify(form),
    }
  );

  if (!response.ok) throw new Error("댓글 등록 실패");
}

export async function updateComment(
  commentId: number,
  form: TYPE.CommentForm
): Promise<void> {
  const response = await authFetch(
    `${API_BASE_URL}${SPRING_API}/comments/${commentId}`,
    {
      method: "PATCH",
      body: JSON.stringify(form),
    }
  );

  if (!response.ok) throw new Error("댓글 수정 실패");
}

export async function deleteComment(commentId: number): Promise<void> {
  const response = await authFetch(
    `${API_BASE_URL}${SPRING_API}/comments/${commentId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) throw new Error("댓글 삭제 실패");
}

// 로그인
export async function loginAPI(form: TYPE.LoginForm) {
  const response = await fetch(`${API_BASE_URL}${SPRING_API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "로그인 실패");
  }

  // body에서 token 받기 (백엔드가 이미 JSON으로 보냄)
  const data = await response.json();
  const token = data.token;

  if (!token) throw new Error("토큰을 받지 못했습니다");

  localStorage.setItem("token", token);

  const userResponse = await fetch(`${API_BASE_URL}${SPRING_API}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!userResponse.ok) throw new Error("사용자 정보를 가져오지 못했습니다");
  const userData: TYPE.User = await userResponse.json();
  return userData;
}

// 소셜 로그인 URL 반환
export function getSocialLoginURL(provider: "google" | "naver" | "kakao") {
  return `${API_BASE_URL}/oauth2/authorization/${provider}`;
}

// 로그아웃
export async function logout(): Promise<void> {
  const token = localStorage.getItem("token");
  try {
    await fetch(`${API_BASE_URL}${SPRING_API}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch (error) {
    console.warn("Logout API error (proceeding with local cleanup):", error);
  } finally {
    // 🔹 항상 로컬 토큰 삭제 (서버 오류가 나도 클라이언트는 로그아웃 처리)
    localStorage.removeItem("token");
    localStorage.removeItem("loginUser");
  }
}

// 회원가입
export async function signup(form: TYPE.SignupForm): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${SPRING_API}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });

  if (!response.ok) throw new Error("회원가입 실패");
}

export async function getProducts(): Promise<TYPE.Product[]> {
  const response = await authFetch(`${API_BASE_URL}${SPRING_API}/products`);
  if (!response.ok) throw new Error("상품 목록 조회 실패");

  const data: unknown = await response.json();
  if (!isProductArray(data))
    throw new Error("API 반환값이 Product[] 타입과 일치하지 않음");
  return data;
}

export async function createProduct(
  productData: TYPE.CreateProductRequest
): Promise<TYPE.Product> {
  const token = localStorage.getItem('token');

  // 2. 토큰 유효성 검사
  if (!token) {
    throw new Error("상품 등록 실패: 인증 토큰이 없습니다. 로그인이 필요합니다.");
  }

  console.log("🚀 [createProduct] Sending payload:", JSON.stringify(productData, null, 2));
  console.log("🔑 [createProduct] Token (last 10 chars):", token ? token.slice(-10) : "NONE");

  const response = await fetch(`${API_BASE_URL}${SPRING_API}/products`, {
    method: "POST",
    headers: {
      // ⭐ 토큰과 JSON 타입을 명시적으로 추가
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json", // JSON 데이터임을 명시
    },
    body: JSON.stringify(productData),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("상품 등록 실패: 인증이 만료되었거나 유효하지 않습니다.");
    }
    throw new Error(`상품 등록 실패: ${response.status}: ${response.statusText}`);
  }

  const data: unknown = await response.json();
  if (!isProduct(data))
    throw new Error("API 반환값이 Product 타입과 일치하지 않음");
  return data;
}

// 낙찰 정보 조회
export async function getWinningInfo(productId: number): Promise<{
  productId: number;
  productTitle: string;
  productImage: string | null;
  bidPrice: number;
  sellerName: string;
}> {
  const response = await authFetch(
    `${API_BASE_URL}${SPRING_API}/bid/${productId}/winning-info`
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "낙찰 정보 조회 실패");
  }
  return response.json();
}

// 결제 준비 25.11.05 수정
export async function preparePayment(productId: number): Promise<{
  impCode: string;
  merchantUid: string;
  name: string;
  amount: number;
  buyerEmail: string;
  buyerName: string;
  buyerTel: string;
}> {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}${SPRING_API}/payments/portone/prepare`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ productId }),
    }
  );

  // 응답 본문은 한 번만 읽기
  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      `결제 준비 실패 (${response.status}): ${text || "서버 응답이 비어 있습니다."
      }`
    );
  }

  if (!text) {
    throw new Error("서버에서 빈 응답을 받았습니다. (preparePayment)");
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("서버 응답이 올바른 JSON 형식이 아닙니다.");
  }
}

// 결제 완료 검증

export async function completePayment(data: {
  imp_uid: string;
  productId: number;
  merchant_uid: string;
}): Promise<void> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("인증 토큰이 없습니다. 다시 로그인해주세요.");

  const response = await fetch(
    `${API_BASE_URL}${SPRING_API}/payments/portone/complete`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // 명시적으로 추가
      },
      body: JSON.stringify(data),
    }
  );

  const text = await response.text(); // 방어코드

  if (!response.ok) {
    let message = "결제 검증 실패";
    try {
      const err = JSON.parse(text);
      message = err.message || message;
    } catch {
      throw new Error(`${message} (HTTP ${response.status})`);
    }
  }
  if (text) {
    try {
      const result = JSON.parse(text);
      if (!result.success) throw new Error("결제 검증 실패");
    } catch {
      // 응답이 JSON이 아닐 경우 무시 (서버가 void 리턴하는 경우)
    }
  }
}

// 낙찰자 확인
export async function checkWinner(productId: number): Promise<{
  isWinner: boolean;
  bidPrice?: number;
  message?: string;
}> {
  const response = await authFetch(
    `${API_BASE_URL}${SPRING_API}/bid/${productId}/winner`
  );
  if (!response.ok) throw new Error("낙찰자 확인 실패");
  return response.json();
}

// QnA 목록 조회 (인증 불필요)
export async function getQnaList(productId: number): Promise<TYPE.ProductQna[]> {
  const response = await fetch(
    `${API_BASE_URL}${SPRING_API}/product-qnas/product/${productId}`
  );
  if (!response.ok) return [];
  return response.json();
}

// QnA 질문 등록
export async function createQna(data: {
  refId: number;
  productType: string;
  title: string;
  content: string;
}): Promise<void> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("인증 토큰이 없습니다. 다시 로그인해주세요.");

  console.log("📤 QnA 등록 요청:", data);

  const response = await fetch(`${API_BASE_URL}${SPRING_API}/product-qnas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const msg = await response.text();
    console.error("❌ QnA 등록 실패:", msg);
    throw new Error(msg || "질문 등록 실패");
  }
}

// QnA 질문 수정
export async function updateQna(
  qnaId: number,
  data: { title: string; content: string }
): Promise<void> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("인증 토큰이 없습니다. 다시 로그인해주세요.");

  const response = await fetch(`${API_BASE_URL}${SPRING_API}/product-qnas/${qnaId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const msg = await response.text();
    throw new Error(msg || "질문 수정 실패");
  }
}

// QnA 질문 삭제
export async function deleteQna(qnaId: number): Promise<void> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("인증 토큰이 없습니다. 다시 로그인해주세요.");

  const response = await fetch(`${API_BASE_URL}${SPRING_API}/product-qnas/${qnaId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const msg = await response.text();
    throw new Error(msg || "질문 삭제 실패");
  }
}

// QnA 답변 등록
export async function createQnaAnswer(
  qnaId: number,
  content: string
): Promise<void> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("인증 토큰이 없습니다. 다시 로그인해주세요.");

  console.log("📤 답변 등록 요청:", { productQnaId: qnaId, content });

  const response = await fetch(
    `${API_BASE_URL}${SPRING_API}/qna-reviews`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        productQnaId: qnaId,
        content,
      }),
    }
  );

  if (!response.ok) {
    const msg = await response.text();
    console.error("❌ 답변 등록 실패:", msg);
    throw new Error(msg || "답변 등록 실패");
  }
}

// QnA 답변 수정
export async function updateQnaAnswer(
  answerId: number,
  content: string
): Promise<void> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("인증 토큰이 없습니다. 다시 로그인해주세요.");

  const response = await fetch(
    `${API_BASE_URL}${SPRING_API}/qna-reviews/${answerId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    }
  );

  if (!response.ok) {
    const msg = await response.text();
    throw new Error(msg || "답변 수정 실패");
  }
}

// QnA 답변 삭제
export async function deleteQnaAnswer(answerId: number): Promise<void> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("인증 토큰이 없습니다. 다시 로그인해주세요.");

  const response = await fetch(
    `${API_BASE_URL}${SPRING_API}/qna-reviews/${answerId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const msg = await response.text();
    throw new Error(msg || "답변 삭제 실패");
  }
}

// Product 타입 확장: 결제 금액 필드 추가
export interface PaymentProduct extends TYPE.Product {
  paymentAmount?: number | null;
}

// 결제 완료 상품 목록 조회
export async function getPaymentProducts(): Promise<PaymentProduct[]> {
  const response = await authFetch(
    `${API_BASE_URL}${SPRING_API}/products/purchases`
  );
  if (!response.ok) {
    if (response.status === 401) throw new Error("로그인이 필요합니다.");
    throw new Error("결제 완료 상품 조회 실패");
  }
  return response.json();
}

// AI 상품 설명 생성
export async function generateAiDescription(
  productName: string,
  keywords: string[] = [],
  targetAudience: string = "일반 고객",
  tone: string = "전문적인, 신뢰감 있는"
): Promise<string> {
  const requestBody: TYPE.AiDescriptionRequest = {
    product_name: productName,
    keywords,
    target_audience: targetAudience,
    tone,
  };

  const response = await authFetch(`${API_BASE_URL}${PYTHON_API}/generate-description`, {
    method: "POST",
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) throw new Error("AI 생성 실패");

  const data: TYPE.AiDescriptionResponse = await response.json();
  return data.description;
}

// S3 이미지 업로드
export async function uploadImageToS3(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}${SPRING_API}/files/s3-upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) throw new Error("이미지 업로드 실패");

  const data = await response.json();
  return data.url;
}

// 🔹 공통 함수 (private 처럼 사용)
async function saveImageToDatabase(
  refId: number,
  imagePath: string,
  imageType: "PRODUCT" | "USER" | "REVIEW",
  productType?: string | null
): Promise<void> {
  const imageDto = {
    imagePath: imagePath,
    imageType: imageType,
    productType: productType || null,
    refId: refId,
  };
  const token = localStorage.getItem("token");

  console.log("🚀 [saveImageToDatabase] Payload:", JSON.stringify([imageDto], null, 2));
  console.log("🔑 [saveImageToDatabase] Token:", token ? token.slice(-10) : "NONE");

  const response = await fetch(`${API_BASE_URL}${SPRING_API}/images/batch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify([imageDto]),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("이미지 DB 저장 실패:", errorText);
    throw new Error("이미지 DB 저장 실패");
  }
}

// 🔹 상품 이미지 저장 (public)
export async function registerProductImage(
  productId: number,
  imagePath: string,
  productType: string
): Promise<void> {
  return saveImageToDatabase(productId, imagePath, "PRODUCT", productType);
}

// 🔹 유저 이미지 저장 (public)
export async function registerUserImage(
  userId: number,
  imagePath: string
): Promise<void> {
  return saveImageToDatabase(userId, imagePath, "USER");
}

// 🔹 리뷰 이미지 저장 (public)
export async function registerReviewImage(
  reviewId: number,
  imagePath: string
): Promise<void> {
  return saveImageToDatabase(reviewId, imagePath, "REVIEW");
}

// 상품 등록 (이미지 포함 전체 프로세스)
export async function registerProductWithImages(
  productData: {
    title: string;
    content: string;
    startingPrice: number;
    // ... other fields
    auctionEndTime?: string;
    productCategoryType: TYPE.ProductCategoryType | null;
    productStatus: TYPE.ProductStatus;
    productType: TYPE.ProductType;
    paymentStatus: TYPE.PaymentStatus;
    sellerId: number;

    // New Fields
    tag?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    deliveryAvailable?: string;
    // deliveryPrice, addPrice, discountRate, etc. should also be passed if needed
    originalPrice?: number;
    discountRate?: number;
    deliveryPrice?: number;
    deliveryAddPrice?: number;
    deliveryIncluded?: boolean;
    productBanner?: string; // If we decided to pass it here (Wait, StoreSection banner logic might differ)
  },
  images: File[]
): Promise<TYPE.Product> {
  // 1. 상품 등록
  const data: any = {
    ...productData,
    auctionEndTime: productData.auctionEndTime || null,
  };
  const product = await createProduct(data as TYPE.CreateProductRequest);

  if (!product.productId) {
    throw new Error("서버에서 productId를 받지 못했습니다.");
  }

  // 2. 이미지 업로드 및 DB 등록
  for (let i = 0; i < images.length; i++) {  // ✅ 순차 처리로 변경 (디버깅 쉽게)
    const file = images[i];
    console.log(`이미지 ${i + 1}/${images.length} 처리 중:`, file.name);

    try {
      const s3Url = await uploadImageToS3(file);
      console.log(`S3 업로드 성공:`, s3Url);

      await registerProductImage(product.productId, s3Url, productData.productType);
      console.log(`DB 저장 완료`);
    } catch (err) {
      console.error(`이미지 ${i + 1} 처리 실패:`, err);
      throw err;  // 하나라도 실패하면 전체 실패
    }
  }

  console.log("=== 모든 이미지 등록 완료 ===");

  return product;
}

// admin 관련 API (api.ts에 추가하지 않고 AdminPage에서만 사용)
export const fetchStatsApi = async () => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE_URL}${SPRING_API}/admin/stats`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
  });

  if (!res.ok) throw new Error("통계 데이터 조회 실패");

  return res.json() as Promise<{
    userCount: number;
    productCount: number;
    reportCount: number;
  }>;
};

// 관리자 회원 목록 조회 (필터 적용 가능)
export async function getUsers(
  field?: "userName" | "nickName" | "email" | "phone",
  keyword?: string
): Promise<TYPE.User[]> {
  let url = `${API_BASE_URL}${SPRING_API}/users`;
  if (field && keyword) {
    url += `?${field}=${encodeURIComponent(keyword)}`;
  }
  const token = localStorage.getItem("token");
  return fetchJson<TYPE.User[]>(url, {
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
}

// 관리자 회원 수정
export async function editUser(
  userId: number,
  payload: { nickName: string; password?: string; phone: string }
): Promise<void> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE_URL}${SPRING_API}/users/${userId}/admin`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("회원 수정 실패");
}

// 관리자 회원 역할 변경
export async function updateUserRole(userId: number, role: TYPE.User["role"]): Promise<void> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE_URL}${SPRING_API}/users/${userId}/admin`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) throw new Error("회원 역할 변경 실패");
}

// 관리자 상품 조회 (필터 적용 가능)
export async function fetchAdminProducts(keyword?: string, category?: TYPE.ProductCategoryType | null): Promise<TYPE.Product[]> {
  let url = `${API_BASE_URL}${SPRING_API}/products/search?`;
  if (keyword) url += `keyword=${encodeURIComponent(keyword)}&`;
  if (category) url += `category=${category}&`;
  const token = localStorage.getItem("token");
  return fetchJson<TYPE.Product[]>(url, {
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
}

// 관리자 상품 삭제
export async function deleteAdminProduct(productId: number): Promise<void> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE_URL}${SPRING_API}/products/${productId}`, {
    method: "DELETE",
    headers: { Authorization: token ? `Bearer ${token}` : "" },
  });
  if (!res.ok) throw new Error("상품 삭제 실패");
}

// 관리자 신고 목록 조회
export async function getReports(): Promise<TYPE.Report[]> {
  const token = localStorage.getItem("token");
  return fetchJson<TYPE.Report[]>(`${API_BASE_URL}${SPRING_API}/reports/admin`, {
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
}

// 관리자 신고 상태 변경
export async function updateReportStatus(reportId: number, status: boolean): Promise<void> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE_URL}${SPRING_API}/reports/${reportId}/status?status=${status}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
  });
  if (!res.ok) throw new Error("신고 상태 변경 실패");
}

// 관리자 문의 목록 조회
export async function getInquiries(): Promise<TYPE.Inquiry[]> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE_URL}${SPRING_API}/inquiry/admin`, {
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!res.ok) throw new Error("문의 목록 조회 실패");

  const data: { articleId: number; title: string; content: string; createdAt: string; updatedAt: string }[] = await res.json();

  return data.map((d, idx) => {
    const [questionPart, answerPart] = d.content.split("[답변]:");
    return {
      inquiryId: d.articleId,
      title: d.title,
      question: questionPart.trim(),
      createdAt: d.createdAt,
      answers: answerPart
        ? [
          {
            inquiryReviewId: idx + 1,
            answer: answerPart.trim(),
            nickName: "관리자",
            createdAt: d.updatedAt,
          },
        ]
        : [],
      newAnswer: "",
    };
  });
}

// 관리자 문의 답변 등록
export async function saveInquiryAnswer(inquiryId: number, answer: string): Promise<void> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE_URL}${SPRING_API}/inquiry/${inquiryId}/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
    body: JSON.stringify({ answer }),
  });
  if (!res.ok) throw new Error("문의 답변 등록 실패");
}

export async function fetchChatUsers(currentUserId: number) {
  const res = await fetch(`${API_BASE_URL}${SPRING_API}/chats/users`, { credentials: "include" });
  if (!res.ok) throw new Error("유저 목록 가져오기 실패");
  const data = (await res.json()) as { userId: number; nickName: string }[];
  return data.filter((u) => u.userId !== currentUserId);
}

export async function fetchRecentPublicChats(): Promise<TYPE.PublicChat[]> {
  const res = await fetch(`${API_BASE_URL}${SPRING_API}/chats/public/recent`, { credentials: "include" });
  if (!res.ok) throw new Error("공개 채팅 불러오기 실패");
  return (await res.json()) as TYPE.PublicChat[];
}

// QR 코드 이미지 가져오기
export const fetchQrCodeImage = async (productId: number): Promise<string> => {
  const res = await fetch(`${API_BASE_URL}${SPRING_API}/qrcode/${productId}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
};

// 배경 제거 (Python FastAPI) 스프링 거칠필요없음 로컬에서 테스트 안함
export const removeProductBackground = async (productId: number): Promise<string> => {
  const res = await fetch(`${AI_BASE_URL}/remove-bg`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_id: productId }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return `data:image/png;base64,${data.image_base64}`;
};

// 상품 데이터 가져오기
export const fetchProductByQr = async (productId: string): Promise<TYPE.Product> => {
  const res = await fetch(`${API_BASE_URL}${SPRING_API}/products/${productId}`);
  if (!res.ok) throw new Error("상품 조회 실패");
  return res.json();
};

// 이메일 찾기
export async function findEmail(phone: string, userName: string): Promise<string> {
  const res = await fetch(`${API_BASE_URL}${SPRING_API}/auth/email-find`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, userName }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "입력한 정보와 일치하는 사용자가 없습니다.");
  }

  const data: { email: string } = await res.json();
  return data.email;
}

// 비밀번호 재설정
export async function resetPassword(params: {
  email: string;
  phone: string;
  userName: string;
  newPassword: string;
}): Promise<void> {
  const res = await fetch(`${API_BASE_URL}${SPRING_API}/auth/password-reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "입력한 정보와 일치하는 사용자가 없습니다.");
  }
}

// 신상품 가져오기
export async function fetchLatestProducts(): Promise<TYPE.Product[]> {
  const res = await fetch(`${API_BASE_URL}${SPRING_API}/products`);
  if (!res.ok) throw new Error("상품 불러오기 실패");
  const data: TYPE.Product[] = await res.json();
  return data
    .sort(
      (a, b) =>
        new Date(b.createdAt || "").getTime() -
        new Date(a.createdAt || "").getTime()
    )
    .slice(0, 10);
}

// 배너 상품 가져오기
// 배너 상품 가져오기
export async function fetchBannerProducts(): Promise<
  { id: number; image?: string; text: string; product?: TYPE.Product; link?: string }[]
> {
  try {
    const [topRes, latestRes, endingRes] = await Promise.all([
      fetch(`${API_BASE_URL}${SPRING_API}/products/top-bookmarked`),
      fetch(`${API_BASE_URL}${SPRING_API}/products/latest`),
      fetch(`${API_BASE_URL}${SPRING_API}/products/ending-soon`),
    ]);

    // Helper to safely extract array
    const extractArray = async (res: Response): Promise<TYPE.Product[]> => {
      if (!res.ok) return [];
      try {
        const data = await res.json();
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.content)) return data.content; // Page wrapper
        if (data && Array.isArray(data.data)) return data.data; // Wrapper
        return [];
      } catch {
        return [];
      }
    };

    const topData = await extractArray(topRes);
    const latestData = await extractArray(latestRes);
    const endingData = await extractArray(endingRes);

    const banners: { id: number; image?: string; text: string; product?: TYPE.Product; link?: string }[] = [];

    // 1. Top Banner
    let topProduct = topData[0] || latestData[0];
    if (topProduct) {
      banners.push({
        id: 1,
        image: topProduct.images?.[0]?.imagePath,
        text: "실시간 인기 급상승 경매 🔥",
        product: topProduct,
      });
    }

    // 2. Latest Banner (Unique)
    let latestProduct = latestData[0];
    if (latestProduct && latestProduct.productId === topProduct?.productId && latestData.length > 1) {
      latestProduct = latestData[1];
    }
    // If different from top, add
    if (latestProduct && latestProduct.productId !== topProduct?.productId) {
      banners.push({
        id: 2,
        image: latestProduct.images?.[0]?.imagePath,
        text: "새로 등록된 핫한 아이템 ✨",
        product: latestProduct,
      });
    }

    // 3. Ending Banner (Unique)
    let endingProduct = endingData[0];
    // Avoid duplicates
    if (!endingProduct || endingProduct.productId === topProduct?.productId || endingProduct.productId === latestProduct?.productId) {
      const potential = latestData.find(p => p.productId !== topProduct?.productId && p.productId !== latestProduct?.productId);
      if (potential) endingProduct = potential;
    }

    if (endingProduct && endingProduct.productId !== topProduct?.productId && endingProduct.productId !== latestProduct?.productId) {
      banners.push({
        id: 3,
        image: endingProduct.images?.[0]?.imagePath,
        text: "마감 임박! 마지막 기회를 잡으세요 ⚡",
        product: endingProduct,
      });
    }

    // Fallback Logic
    if (banners.length < 3) {
      const staticBanners = [
        {
          id: 101,
          text: "나만의 보물찾기, 땅땅옥션 💎",
          image: topProduct?.images?.[0]?.imagePath || "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1280&q=80",
          link: "/search"
        },
        {
          id: 102,
          text: "더 많은 경매 보러가기 🚀",
          image: latestProduct?.images?.[0]?.imagePath || "https://images.unsplash.com/photo-1531297461136-82lwDe8c2e0b?auto=format&fit=crop&w=1280&q=80",
          link: "/search?sort=latest"
        },
        {
          id: 103,
          text: "지금 가장 핫한 상품을 만나보세요 🔥",
          image: endingProduct?.images?.[0]?.imagePath || "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=1280&q=80",
          link: "/search?sort=popular"
        }
      ];

      let staticIndex = 0;
      while (banners.length < 3 && staticIndex < staticBanners.length) {
        const sb = staticBanners[staticIndex];
        // Ensure ID uniqueness roughly
        if (!banners.find(b => b.id === sb.id)) {
          banners.push({
            id: sb.id,
            image: sb.image,
            text: sb.text,
            link: sb.link,
            product: undefined
          });
        }
        staticIndex++;
      }
    }

    return banners;

  } catch (err) {
    console.error("배너 상품 불러오기 실패:", err);
    return [];
  }
}

// 유저 정보
export async function fetchMe(token: string): Promise<TYPE.User> {
  const res = await fetch(`${API_BASE_URL}${SPRING_API}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("유저 정보 불러오기 실패");
  return res.json();
}

// 판매 상품
export async function fetchSellingProducts(userId: number): Promise<TYPE.Product[]> {
  const res = await fetch(`${API_BASE_URL}${SPRING_API}/products/seller/${userId}`);
  if (!res.ok) throw new Error("판매 상품 조회 실패");
  const data: Partial<TYPE.Product>[] = await res.json();
  return data.map(normalizeProduct);
}

// 찜 상품
export async function fetchMyLikes(token: string): Promise<TYPE.Product[]> {
  const res = await fetch(`${API_BASE_URL}${SPRING_API}/bookmarks/mypage?t=${Date.now()}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });
  if (!res.ok) {
    const error: any = new Error(`찜 상품 조회 실패 (${res.status})`);
    error.status = res.status;
    throw error;
  }
  const data: Partial<TYPE.Product>[] = await res.json();
  return data.map(normalizeProduct);
}

// 신고 내역
export async function fetchReports(token: string): Promise<TYPE.Report[]> {
  const res = await fetch(`${API_BASE_URL}${SPRING_API}/reports/mypage`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("신고 내역 조회 실패");
  return res.json();
}

// QnA
export async function fetchMyQnas(userId: number): Promise<TYPE.ProductQna[]> {
  const res = await fetch(`${API_BASE_URL}${SPRING_API}/qna/user/${userId}`);
  if (!res.ok) throw new Error("Q&A 조회 실패");
  return res.json();
}

// 1:1 문의
export async function fetchMyInquiries(token: string): Promise<TYPE.Inquiry[]> {
  const res = await fetch(`${API_BASE_URL}${SPRING_API}/inquiry/user`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("문의 내역 조회 실패");
  const dataFromServer: any[] = await res.json();
  return dataFromServer.map((i) => ({
    inquiryId: i.inquiryId,
    title: i.title,
    question: i.content,
    createdAt: i.createdAt,
    answers: (i.answers ?? []).map((a: { inquiryReviewId: any; answer: any; nickName: any; createdAt: any; }) => ({
      inquiryReviewId: a.inquiryReviewId,
      answer: a.answer,
      nickName: a.nickName ?? "익명",
      createdAt: a.createdAt ?? new Date().toISOString(),
    })),
  }));
}

// 리뷰
export async function fetchMyReviews(userId: number): Promise<{ reviews: TYPE.Review[]; averageRating: number }> {
  const res = await fetch(`${API_BASE_URL}${SPRING_API}/reviews/user/${userId}`);
  const avgRes = await fetch(`${API_BASE_URL}/reviews/user/${userId}/average`);
  if (!res.ok || !avgRes.ok) throw new Error("리뷰 조회 실패");

  const reviews: TYPE.Review[] = await res.json();
  const { averageRating } = await avgRes.json();
  return { reviews, averageRating };
}

// 리뷰 등록
export async function submitReview(
  targetUserId: number,
  data: { rating: number; comments: string },
  token: string
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}${SPRING_API}/reviews/${targetUserId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "리뷰 등록 실패");
  }

  return res.json();
}

// 상품 검색
export async function fetchProductsBySearch(query: string, page: number = 0): Promise<TYPE.Product[]> {
  const response = await fetch(`${API_BASE_URL}${SPRING_API}/products/search?query=${encodeURIComponent(query)}&page=${page}`);
  if (!response.ok) throw new Error("상품 검색 실패");
  return response.json();
}

/**
 * 키워드, 카테고리, 상태, 정렬 옵션을 통합하여 상품 목록을 조회합니다.
 * @param params - 검색 및 필터링 파라미터
 * @returns Product 배열
 */
export async function fetchFilteredProducts(params: {
  keyword?: string;
  category?: string; // categoryCode (PRODUCT_CATEGORY_TYPE)
  productStatus?: string; // "ACTIVE" (거래 가능만)
  productType?: string; // "AUCTION", "USED", "STORE"
  sort?: SortOption; // "latest", "priceAsc" 등
  minPrice?: number;
  maxPrice?: number;
  minStartPrice?: number;
  maxStartPrice?: number;
}): Promise<TYPE.Product[]> {
  // 1. 쿼리 스트링 생성
  const query = new URLSearchParams();
  if (params.keyword) query.append("keyword", params.keyword);
  if (params.category) query.append("productCategoryType", params.category);
  if (params.productStatus) query.append("productStatus", params.productStatus);
  if (params.productType) query.append("productType", params.productType);
  if (params.sort) query.append("sort", params.sort);
  if (params.minPrice !== undefined) query.append("minPrice", params.minPrice.toString());
  if (params.maxPrice !== undefined) query.append("maxPrice", params.maxPrice.toString());
  if (params.minStartPrice !== undefined) query.append("minStartPrice", params.minStartPrice.toString());
  if (params.maxStartPrice !== undefined) query.append("maxStartPrice", params.maxStartPrice.toString());

  const response = await fetch(`${API_BASE_URL}${SPRING_API}/products/search?${query.toString()}`);
  if (!response.ok) throw new Error("상품 검색 실패");
  return response.json();
}

export async function submitUserQna(title: string, content: string): Promise<void> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE_URL}${SPRING_API}/inquiry`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: JSON.stringify({ title, question: content }),
  });

  if (!res.ok) {
    let errMsg = "1:1 문의 제출 실패";
    try {
      const errData = await res.json();
      errMsg = errData.message || errMsg;
    } catch {
      throw new Error(errMsg);
    }
    throw new Error(errMsg);
  }
}

// 내 정보 수정
export async function updateMyInfo(userId: number, payload: {
  nickName: string;
  password?: string;
  phone: string;
}): Promise<TYPE.User> {
  const res = await fetch(`${API_BASE_URL}${SPRING_API}/users/${userId}/mypage`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "정보 수정 실패");
  }
  return res.json();
}

// 회원 탈퇴
export async function withdrawUser(userId: number, token: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}${SPRING_API}/users/${userId}/withdraw`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "회원탈퇴 실패");
  }
}

// 상품 수정 (FormData 버전)
export async function updateProductWithImages(
  productId: number,
  formData: FormData
): Promise<TYPE.Product> {
  const res = await fetch(`${API_BASE_URL}${SPRING_API}/products/${productId}`, {
    method: "PUT",
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "상품 수정 실패");
  }

  return normalizeProduct(await res.json());
}

// 신고 내역 조회 (이미 fetchReports가 있지만 명확성을 위해 이름 변경)
export async function fetchMyReports(token: string): Promise<TYPE.Report[]> {
  const res = await fetch(`${API_BASE_URL}${SPRING_API}/reports/mypage`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("신고 내역 조회 실패");
  return res.json();
}

// 자동완성 API
export const fetchSuggestions = async (keyword: string) => {
  if (keyword.trim() === "") return [];
  try {
    const response = await fetch(
      `${API_BASE_URL}${SPRING_API}/autocomplete?keyword=${encodeURIComponent(keyword)}&limit=10`
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data.success && data.suggestions ? data.suggestions : [];
  } catch {
    return [];
  }
};

// 🆕 인기 검색어 API
export const fetchPopularKeywords = async (limit: number = 10): Promise<string[]> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}${SPRING_API}/autocomplete/popular?limit=${limit}`
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data.success && data.keywords ? data.keywords : [];
  } catch {
    return [];
  }
};
// 검색 로그 저장
export const saveSearchLog = async (keyword: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}${SPRING_API}/search/log`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ keyword }),
  });

  if (!response.ok) {
    throw new Error("검색 로그 저장 실패");
  }
};

// ===================== 채팅 관리 (Admin) =====================

export async function deletePublicChat(publicChatId: number): Promise<void> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE_URL}${SPRING_API}/chats/public/${publicChatId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("공개 채팅 삭제 실패");
}

export async function deletePrivateChat(privateChatId: number): Promise<void> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE_URL}${SPRING_API}/chats/private/${privateChatId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("개인 채팅 삭제 실패");
}

export async function searchPublicChats(keyword: string): Promise<TYPE.PublicChat[]> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE_URL}${SPRING_API}/chats/admin/search/public?keyword=${encodeURIComponent(keyword)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("공개 채팅 검색 실패");
  return res.json();
}

export async function searchPrivateChats(keyword: string): Promise<TYPE.PrivateChat[]> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE_URL}${SPRING_API}/chats/admin/search/private?keyword=${encodeURIComponent(keyword)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("개인 채팅 검색 실패");
  return res.json();
}
// ===================== MyPage API Functions =====================

export async function fetchCurrentUser(token: string): Promise<TYPE.User> {
  const res = await fetch(`${API_BASE_URL}${SPRING_API}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const error: any = new Error(`유저 정보 불러오기 실패 (${res.status})`);
    error.status = res.status;
    throw error;
  }
  return res.json();
}

export async function updateUserProfile(userId: number, data: { nickName: string; password: string; phone: string }): Promise<TYPE.User> {
  const res = await fetch(`${API_BASE_URL}${SPRING_API}/users/${userId}/mypage`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error("정보 수정 실패: " + errorText);
  }
  return res.json();
}

export async function fetchUserQnas(userId: number): Promise<TYPE.ProductQna[]> {
  const res = await fetch(`${API_BASE_URL}${SPRING_API}/qna/user/${userId}`);
  if (!res.ok) throw new Error("Q&A 조회 실패");
  return res.json();
}



export async function fetchUserInquiries(token: string): Promise<any[]> {
  const res = await fetch(`${API_BASE_URL}${SPRING_API}/inquiry/user`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("문의 내역 조회 실패");
  return res.json();
}

// -------------------------------------------------------------------------
// User Profile & Reviews (New Features)
// -------------------------------------------------------------------------

// 1. Public User Profile
export async function fetchUserProfile(userId: number): Promise<TYPE.User> {
  // Use public endpoint if available, otherwise fallback to known pattern
  // Assuming /users/{userId} exposes public info
  const response = await fetch(`${API_BASE_URL}${SPRING_API}/users/${userId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });

  if (!response.ok) {
    // Fallback/Mock for development if backend isn't ready
    if (import.meta.env.DEV) {
      console.warn("Mocking user profile for DEV");
      return {
        userId,
        userName: "Mock User",
        nickName: `Seller_${userId}`,
        email: "hidden@email.com",
        role: "USER"
      };
    }
    throw new Error("유저 프로필 조회 실패");
  }
  return response.json();
}

// 2. User's Selling Products
export async function fetchUserSellingProducts(userId: number): Promise<TYPE.Product[]> {
  const response = await fetch(`${API_BASE_URL}${SPRING_API}/products/seller/${userId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });

  if (!response.ok) {
    if (import.meta.env.DEV) return []; // Return empty if not ready
    throw new Error("판매 상품 조회 실패");
  }
  return response.json();
}

// 3. User's Received Reviews
export async function fetchUserReviews(userId: number): Promise<TYPE.Review[]> {
  const response = await fetch(`${API_BASE_URL}${SPRING_API}/reviews/user/${userId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });

  if (!response.ok) {
    if (import.meta.env.DEV) return [];
    throw new Error("리뷰 목록 조회 실패");
  }
  return response.json();
}

// 4. Create Product Review
export async function createProductReview(data: {
  refId: number; // productId
  content: string;
  rating: number;
  productType: string;
}): Promise<void> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("로그인이 필요합니다.");

  const response = await fetch(`${API_BASE_URL}${SPRING_API}/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error("리뷰 등록 실패");
  }
}



export async function fetchAverageRating(userId: number): Promise<{ averageRating: number }> {
  const res = await fetch(`${API_BASE_URL}/reviews/user/${userId}/average`);
  if (!res.ok) throw new Error("평균 평점 조회 실패");
  return res.json();
}

// ===================== 색상 기반 이미지 추천 API =====================

/**
 * 색상 기반 유사 상품 검색 (Base64)
 */
export async function searchByColor(params: {
  image_base64: string;
  limit?: number;
  category_filter?: string;
  min_similarity?: number;
}): Promise<TYPE.Product[]> {
  const response = await fetch(
    `${AI_BASE_URL}${PYTHON_API}/recommendations/color`,  // Updated with ${PYTHON_API}
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_base64: params.image_base64,
        limit: params.limit || 10,
        category_filter: params.category_filter || null,
        min_similarity: params.min_similarity || 0.5,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("색상 검색 실패");
  }

  const data = await response.json();
  return data.recommendations || [];
}

/**
 * 이미지 파일 업로드로 색상 기반 검색
 */
export async function searchByImageFile(params: {
  file: File;
  limit?: number;
  category_filter?: string;
  min_similarity?: number;
}): Promise<TYPE.Product[]> {
  const formData = new FormData();
  formData.append("file", params.file);

  const queryParams = new URLSearchParams({
    limit: (params.limit || 10).toString(),
    min_similarity: (params.min_similarity || 0.5).toString(),
  });

  if (params.category_filter) {
    queryParams.append("category_filter", params.category_filter);
  }

  const response = await fetch(
    `${AI_BASE_URL}${PYTHON_API}/recommendations/color/upload?${queryParams}`,  // Updated with ${PYTHON_API}
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("이미지 업로드 검색 실패");
  }

  const data = await response.json();
  return data.recommendations || [];
}

/**
 * 이미지 품질 체크
 */
export async function checkImageQuality(imageBase64: string): Promise<{
  quality_score: number;
  width: number;
  height: number;
  file_size_kb: number;
  brightness: number;
  sharpness: number;
  issues: string[];
  recommendation: string;
}> {
  const response = await fetch(
    `${AI_BASE_URL}${PYTHON_API}/image/quality-check`,  // Updated with ${PYTHON_API}
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_base64: imageBase64 }),
    }
  );

  if (!response.ok) {
    throw new Error("이미지 품질 체크 실패");
  }

  const data = await response.json();
  return data.analysis;
}

/**
 * 이미지 자동 최적화
 */
export async function optimizeImage(imageBase64: string): Promise<string> {
  const response = await fetch(
    `${AI_BASE_URL}${PYTHON_API}/image/optimize`,  // Updated with ${PYTHON_API}
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_base64: imageBase64 }),
    }
  );

  if (!response.ok) {
    throw new Error("이미지 최적화 실패");
  }

  const data = await response.json();
  return data.optimized_image;
}

/**
 * 이미지 메타데이터 추출
 */
export async function extractImageMetadata(imageBase64: string): Promise<{
  width: number;
  height: number;
  format: string;
  mode: string;
  dominant_colors: string[];
  color_names: string[];
}> {
  const response = await fetch(
    `${AI_BASE_URL}${PYTHON_API}/image/metadata`,  // Updated with ${PYTHON_API}
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_base64: imageBase64 }),
    }
  );

  if (!response.ok) {
    throw new Error("메타데이터 추출 실패");
  }

  const data = await response.json();
  return data.metadata;
}




// 사업자 인증 요청
export async function verifyBusiness(userId: number, businessNumber: string): Promise<{ verified: boolean; companyName?: string }> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("로그인이 필요합니다.");

  const res = await fetch(`${API_BASE_URL}/api/business/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ userId, businessNumber }), // userId 포함
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "사업자 인증 실패");
  }

  return res.json();
}