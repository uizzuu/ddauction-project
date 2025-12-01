import type * as TYPE from "./types";
import { jwtDecode } from "jwt-decode";

const SPRING_API = "/api";
const PYTHON_API = "/ai";
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// ===================== 타입가드 =====================

function isUser(obj: unknown): obj is TYPE.User {
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
    typeof o.auctionEndTime === "string" &&
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
  return fetchJson(`${API_BASE_URL}/api/bid/${productId}/bid`, {
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

// 찜 토글
export const toggleBookmark = (productId: number, token?: string) => {
  const t = ensureToken(token);
  return fetchJson<string>(`${API_BASE_URL}${SPRING_API}/bookmarks/toggle?productId=${productId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
  });
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
  return response.json();
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
export async function login(form: TYPE.LoginForm): Promise<TYPE.User> {
  const response = await fetch(`${API_BASE_URL}${SPRING_API}/auth/login`, {
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
  } as TYPE.User;
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
  const response = await authFetch(`${API_BASE_URL}${SPRING_API}/products`, {
    method: "POST",
    body: JSON.stringify(productData),
  });

  if (!response.ok) throw new Error("상품 등록 실패");

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
