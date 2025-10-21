import { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import ArticleForm from "./pages/ArticleForm";
import ArticleDetail from "./pages/ArticleDetail";
import {
  HeaderMain,
  HeaderSub,
  Main,
  Login,
  Signup,
  ProductList,
  ProductRegister,
  MyPage,
  ProductDetail,
  ArticleList,
} from "./import/import";
import "./import/import.css";
import type { User, Category } from "./types/types";
import { API_BASE_URL } from "./services/api";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [category, setCategory] = useState<Category[]>([]);
  const location = useLocation();

  // 앱 시작 시 세션에서 로그인 상태 가져오기
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/users/me`, {
      method: "GET",
      credentials: "include", // 쿠키 포함
    })
      .then(res => {
        if (!res.ok) throw new Error("세션 없음");
        return res.json();
      })
      .then(data => setUser(data))
      .catch(() => setUser(null));
  }, []);

  const noHeaderPaths = ["/login", "/signup"];
  const showHeader = !noHeaderPaths.includes(location.pathname);

  return (
    <div style={{ minHeight: "100vh" }}>
      {showHeader && <HeaderMain user={user} setUser={setUser} />}
      {showHeader && <HeaderSub category={category} setCategory={setCategory} />}
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/auction" element={<ProductList />} />
        <Route path="/register" element={<ProductRegister user={user} />} />
        <Route path="/mypage" element={<MyPage user={user} setUser={setUser} />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/community" element={<ArticleList user={user} />} />
        <Route path="/articles/new" element={<ArticleForm userId={user?.userId ?? null} />} />
        <Route path="/articles/:id/edit" element={<ArticleForm userId={user?.userId ?? null} />} />
        <Route path="/articles/:id" element={<ArticleDetail user={user} />} />
      </Routes>
    </div>
  );
}
