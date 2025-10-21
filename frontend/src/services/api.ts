import type {
  User,
  Bid,
  LoginForm,
  SignupForm,
  Product,
  Category,
  CreateProductRequest,
} from "../types/types";

const API_BASE = "/api";
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

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
    typeof o.price === "number" &&
    typeof o.createdAt === "string"
  );
}

function isProduct(obj: unknown): obj is Product {
  if (typeof obj !== "object" || obj === null) return false;
  const o = obj as Record<string, unknown>;

  const bidsValid = o.bids === undefined || (Array.isArray(o.bids) && o.bids.every(isBid));

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

// ------------------- API 함수 ------------------- //

// 로그인
export async function login(form: LoginForm): Promise<User> {
  const response = await fetch(`${API_BASE_URL}${API_BASE}/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });

  if (!response.ok) throw new Error("로그인 실패");

  const data: unknown = await response.json();
  if (!isUser(data)) throw new Error("API 반환값이 User 타입과 일치하지 않음");
  return data;
}

// 회원가입
export async function signup(form: SignupForm): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${API_BASE}/users/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });

  if (!response.ok) throw new Error("회원가입 실패");
}

// 상품 목록 조회
export async function getProducts(): Promise<Product[]> {
  const response = await fetch(`${API_BASE_URL}${API_BASE}/products`);
  if (!response.ok) throw new Error("상품 목록 조회 실패");

  const data: unknown = await response.json();
  if (!isProductArray(data)) throw new Error("API 반환값이 Product[] 타입과 일치하지 않음");
  return data;
}

// 상품 등록
export async function createProduct(productData: CreateProductRequest): Promise<Product> {
  const response = await fetch(`${API_BASE_URL}${API_BASE}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productData),
  });

  if (!response.ok) throw new Error("상품 등록 실패");

  const data: unknown = await response.json();
  if (!isProduct(data)) throw new Error("API 반환값이 Product 타입과 일치하지 않음");
  return data;
}

// 카테고리 목록 조회
export async function getCategories(): Promise<Category[]> {
  const response = await fetch(`${API_BASE_URL}${API_BASE}/categories`);
  if (!response.ok) throw new Error("카테고리 조회 실패");

  const data: unknown = await response.json();
  if (!isCategoryArray(data)) throw new Error("API 반환값이 Category[] 타입과 일치하지 않음");
  return data;
}