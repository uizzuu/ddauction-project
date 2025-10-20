import type {
  User,
  LoginForm,
  SignupForm,
  Product,
  Category,
  CreateProductRequest,
} from "../types/types";

const API_BASE = "/api";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// 로그인
export async function login(form: LoginForm): Promise<User> {
  const response = await fetch(`${API_BASE_URL}${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });

  if (!response.ok) {
    throw new Error("로그인 실패");
  }
  return response.json();
}

// 회원가입
export async function signup(form: SignupForm): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${API_BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });

  if (!response.ok) {
    throw new Error("회원가입 실패");
  }
}

// 상품 목록 조회
export async function getProducts(): Promise<Product[]> {
  const response = await fetch(`${API_BASE_URL}${API_BASE}/products`);

  if (!response.ok) {
    throw new Error("상품 목록 조회 실패");
  }
  return response.json();
}

// 상품 등록
export async function createProduct(
  productData: CreateProductRequest
): Promise<Product> {
  const response = await fetch(`${API_BASE_URL}${API_BASE}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productData),
  });

  if (!response.ok) {
    throw new Error("상품 등록 실패");
  }
  return response.json();
}

// 카테고리 목록 조회
export async function getCategories(): Promise<Category[]> {
  const response = await fetch(`${API_BASE_URL}${API_BASE}/categories`);

  if (!response.ok) {
    throw new Error("카테고리 조회 실패");
  }
  return response.json();
}
