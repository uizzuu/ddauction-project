export type Page = "main" | "login" | "signup" | "register" | "list";

export interface User {
  userId: number; // App과 ProductRegister에서 일치하도록 userId 사용
  username: string;
  nickName: string;
  email?: string;
}

export interface Product {
  id: number;
  title: string;
  description?: string;
  price?: number;
  auctionEndTime: string;
  categoryId?: number;
  imageUrl?: string;
}

export interface LoginForm {
  username: string;
  password: string;
}

export interface SignupForm {
  username: string;
  email: string;
  password: string;
  passwordConfirm?: string;
}

export interface ProductForm {
  title: string;
  description: string;
  price: string;       // number가 아닌 string으로 폼에서 입력
  auctionEndTime: string;
  categoryId?: number;
  imageUrl?: string;
}
