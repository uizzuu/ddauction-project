export type Page = "main" | "login" | "signup" | "register" | "list";

export interface User {
  username: string;
  email?: string;
}

export interface Product {
  id: number;
  title: string;
  currentPrice: string;
  endTime: string;
}

export interface PaginationProps {
  page: number;
  setPage: (page: number) => void;
}
