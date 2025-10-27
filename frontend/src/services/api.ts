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
} from "../types/types";
import {jwtDecode} from "jwt-decode";
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
  const decoded = jwtDecode<{ email: string; nickName: string; role?: string }>(token);

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

export async function getArticles(): Promise<ArticleDto[]> {
  const response = await authFetch(`${API_BASE_URL}${API_BASE}/articles`);
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
  const response = await authFetch(`${API_BASE_URL}${API_BASE}/articles/${id}`, {
    method: "PUT",
    body: JSON.stringify(articleData),
  });
  if (!response.ok) throw new Error("게시글 수정 실패");
  return response.json();
}

export async function deleteArticle(id: number): Promise<void> {
  const response = await authFetch(`${API_BASE_URL}${API_BASE}/articles/${id}`, {
    method: "DELETE",
  });
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
  const response = await authFetch(`${API_BASE_URL}${API_BASE}/comments/${commentId}`, {
    method: "PATCH",
    body: JSON.stringify(form),
  });

  if (!response.ok) throw new Error("댓글 수정 실패");
}

export async function deleteComment(commentId: number): Promise<void> {
  const response = await authFetch(`${API_BASE_URL}${API_BASE}/comments/${commentId}`, {
    method: "DELETE",
  });

  if (!response.ok) throw new Error("댓글 삭제 실패");
}
