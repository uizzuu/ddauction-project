import { Routes, Route, useLocation } from "react-router-dom";
import { useState } from "react";
import ArticleForm from "./pages/ArticleForm";
import ArticleDetail from "./pages/ArticleDetail";
import ArticleList from "./pages/ArticleList";
import {
  HeaderMain,
  HeaderSub,
  Main,
  Login,
  Signup,
  ProductList,
  ProductRegister,
  MyPage,
  ProductDetail
} from "./import/import";
import "./import/import.css";
import type { User, Category } from "./types/types";



export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [category, setCategory] = useState<Category[]>([]);
  const location = useLocation();

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
