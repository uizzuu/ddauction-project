export type Page = "main" | "login" | "signup" | "register" | "list";

export interface User {
  id?: number;
  username: string;
  email?: string;
}

export interface Product {
  id: number;
  title: string;
  description?: string;
  startPrice?: number;
  currentPrice: string;
  endTime: string;
  endDate?: string;
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
  startPrice: string;
  endDate: string;
}