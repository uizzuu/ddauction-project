import type {
  User,
  Bid,
  LoginForm,
  SignupForm,
  Product,
  Category,
  CreateProductRequest,
  ArticleDto,
  ArticleForm,
  CommentDto,
  CommentForm,
  RAGRequest,
  RAGResponse,
} from "./types";
import { jwtDecode } from "jwt-decode";
const API_BASE = "/api";
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// ------------------- 타입 가드 ------------------- //

function isUser(obj: unknown): obj is User {
  if (typeof obj !== "object" || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.userId === "number" &&
    typeof o.userName === "string" &&
    typeof o.nickName === "string" &&
    (o.email === undefined || typeof o.email === "string") &&
    (o.phone === undefined || typeof o.phone === "string")
  );
}

function isBid(obj: unknown): obj is Bid {
  if (typeof obj !== "object" || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.bidId === "number" &&
    typeof o.userId === "number" &&
    typeof o.bidPrice === "number" &&
    typeof o.createdAt === "string"
  );
}

function isProduct(obj: unknown): obj is Product {
  if (typeof obj !== "object" || obj === null) return false;
  const o = obj as Record<string, unknown>;

  const bidsValid =
    o.bids === undefined || (Array.isArray(o.bids) && o.bids.every(isBid));

  return (
    typeof o.productId === "number" &&
    typeof o.title === "string" &&
    typeof o.auctionEndTime === "string" &&
    bidsValid
  );
}

function isProductArray(obj: unknown): obj is Product[] {
  return Array.isArray(obj) && obj.every(isProduct);
}

function isCategory(obj: unknown): obj is Category {
  if (typeof obj !== "object" || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return typeof o.categoryId === "number" && typeof o.name === "string";
}

function isCategoryArray(obj: unknown): obj is Category[] {
  return Array.isArray(obj) && obj.every(isCategory);
}

// ------------------- 공통 fetch ------------------- //

async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  return fetch(url, { ...options, headers });
}

// ------------------- API 함수 ------------------- //

// 로그인
export async function login(form: LoginForm): Promise<User> {
  const response = await fetch(`${API_BASE_URL}${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });

  if (!response.ok) throw new Error("로그인 실패");

  // JWT는 Authorization 헤더에 담겨서 온다고 가정
  const token = response.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) throw new Error("토큰이 없습니다");

  localStorage.setItem("token", token); // 저장

  const data: unknown = await response.json();
  if (!isUser(data)) throw new Error("API 반환값이 User 타입과 일치하지 않음");
  // 🔹 JWT decode해서 nickName 포함
  const decoded = jwtDecode<{ email: string; nickName: string; role?: string }>(
    token
  );

  return {
    ...data,
    nickName: decoded.nickName, // JWT에서 가져온 닉네임
    role: decoded.role,
  } as User;
}

// 회원가입
export async function signup(form: SignupForm): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${API_BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });

  if (!response.ok) throw new Error("회원가입 실패");
}

// ------------------- 상품 API ------------------- //

export async function getProducts(): Promise<Product[]> {
  const response = await authFetch(`${API_BASE_URL}${API_BASE}/products`);
  if (!response.ok) throw new Error("상품 목록 조회 실패");

  const data: unknown = await response.json();
  if (!isProductArray(data))
    throw new Error("API 반환값이 Product[] 타입과 일치하지 않음");
  return data;
}

export async function createProduct(
  productData: CreateProductRequest
): Promise<Product> {
  const response = await authFetch(`${API_BASE_URL}${API_BASE}/products`, {
    method: "POST",
    body: JSON.stringify(productData),
  });

  if (!response.ok) throw new Error("상품 등록 실패");

  const data: unknown = await response.json();
  if (!isProduct(data))
    throw new Error("API 반환값이 Product 타입과 일치하지 않음");
  return data;
}

export async function getCategories(): Promise<Category[]> {
  const response = await authFetch(`${API_BASE_URL}${API_BASE}/categories`);
  if (!response.ok) throw new Error("카테고리 조회 실패");

  const data: unknown = await response.json();
  if (!isCategoryArray(data))
    throw new Error("API 반환값이 Category[] 타입과 일치하지 않음");
  return data;
}

// ------------------- 게시글 API ------------------- //

export async function getArticles(params?: {
  boardId?: number;
}): Promise<ArticleDto[]> {
  const query = params?.boardId ? `?boardId=${params.boardId}` : "";
  const response = await authFetch(
    `${API_BASE_URL}${API_BASE}/articles${query}`
  );
  if (!response.ok) throw new Error("게시글 목록 조회 실패");
  return response.json();
}

export async function getArticleById(id: number): Promise<ArticleDto> {
  const response = await authFetch(`${API_BASE_URL}${API_BASE}/articles/${id}`);
  if (!response.ok) throw new Error("게시글 조회 실패");
  return response.json();
}

export async function createArticle(
  articleData: ArticleForm
): Promise<ArticleDto> {
  const response = await authFetch(`${API_BASE_URL}${API_BASE}/articles`, {
    method: "POST",
    body: JSON.stringify(articleData),
  });
  if (!response.ok) throw new Error("게시글 생성 실패");
  return response.json();
}

export async function updateArticle(
  id: number,
  articleData: ArticleForm
): Promise<ArticleDto> {
  const response = await authFetch(
    `${API_BASE_URL}${API_BASE}/articles/${id}`,
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
    `${API_BASE_URL}${API_BASE}/articles/${id}`,
    {
      method: "DELETE",
    }
  );
  if (!response.ok) throw new Error("게시글 삭제 실패");
}

// ------------------- 댓글 API ------------------- //

export async function getCommentsByArticleId(
  articleId: number
): Promise<CommentDto[]> {
  const response = await authFetch(
    `${API_BASE_URL}${API_BASE}/articles/${articleId}/comments`
  );
  if (!response.ok) throw new Error("댓글 목록 조회 실패");
  return response.json();
}

export async function createComment(
  articleId: number,
  form: CommentForm
): Promise<void> {
  const response = await authFetch(
    `${API_BASE_URL}${API_BASE}/articles/${articleId}/comments`,
    {
      method: "POST",
      body: JSON.stringify(form),
    }
  );

  if (!response.ok) throw new Error("댓글 등록 실패");
}

export async function updateComment(
  commentId: number,
  form: CommentForm
): Promise<void> {
  const response = await authFetch(
    `${API_BASE_URL}${API_BASE}/comments/${commentId}`,
    {
      method: "PATCH",
      body: JSON.stringify(form),
    }
  );

  if (!response.ok) throw new Error("댓글 수정 실패");
}

export async function deleteComment(commentId: number): Promise<void> {
  const response = await authFetch(
    `${API_BASE_URL}${API_BASE}/comments/${commentId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) throw new Error("댓글 삭제 실패");
}

// ------------------- 결제 API ------------------- //

// 낙찰 정보 조회
export async function getWinningInfo(productId: number): Promise<{
  productId: number;
  productTitle: string;
  productImage: string | null;
  bidPrice: number;
  sellerName: string;
}> {
  const response = await authFetch(
    `${API_BASE_URL}${API_BASE}/bid/${productId}/winning-info`
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
    `${API_BASE_URL}${API_BASE}/payments/portone/prepare`,
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
      `결제 준비 실패 (${response.status}): ${
        text || "서버 응답이 비어 있습니다."
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
    `${API_BASE_URL}${API_BASE}/payments/portone/complete`,
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
    `${API_BASE_URL}${API_BASE}/bid/${productId}/winner`
  );
  if (!response.ok) throw new Error("낙찰자 확인 실패");
  return response.json();
}

// ------------------- RAG 챗봇 API ------------------- //

export async function queryRAG(query: string): Promise<RAGResponse> {
  const request: RAGRequest = { query };

  const response = await fetch(`${API_BASE_URL}${API_BASE}/chat/query`, {
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
