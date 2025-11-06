import { useState, useEffect } from "react"; // 🔹 useEffect 추가
import { Routes, Route, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode"; // 🔹 JWT decode 라이브러리 추가
import ArticleForm from "./pages/ArticleForm";
import ArticleDetail from "./pages/ArticleDetail";
import SearchPage from "./pages/SearchPage";
import UserQnaForm from "./pages/UserQnaForm";
import PaymentPage from "./pages/PaymentPage";
import FindEmail from "./pages/FindEmail";
import FindPassword from "./pages/FindPassword";
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
  AdminPage,
} from "./import/import";
import "./import/import.css";
import type { User, Category } from "./types/types";
import OAuthCallback from "./pages/OAuthCallback";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [category, setCategory] = useState<Category[]>([]);
  const location = useLocation();

  const noHeaderPaths = ["/login", "/signup"];
  const showHeader = !noHeaderPaths.includes(location.pathname);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      // 🔹 JWT payload 타입 지정
      const decoded = jwtDecode<{
        userId: number;
        userName: string;
        nickName: string;
        role?: "ADMIN" | "USER" | "BANNED";
        isWinner?: boolean;
      }>(token);

      // 🔹 setUser에 nickName 포함
      setUser({
        userId: decoded.userId,
        userName: decoded.userName,
        nickName: decoded.nickName,
        role: decoded.role,
        isWinner: decoded.isWinner ?? false,
      });
    } catch (e) {
      console.error("JWT decode 실패", e);
      localStorage.removeItem("token");
      setUser(null);
    }
  }, []);

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
        <Route path="/products/:id" element={<ProductDetail user={user} setUser={setUser} />} />
        <Route path="/community" element={<ArticleList user={user} />} />
        <Route path="/articles/new" element={<ArticleForm userId={user?.userId ?? null} />} />
        <Route path="/articles/:id/edit" element={<ArticleForm userId={user?.userId ?? null} />} />
        <Route path="/articles/:id" element={<ArticleDetail user={user} />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/admin" element={user?.role === "ADMIN" ? (<AdminPage />) : (<div style={{ padding: "20px" }}>접근 권한이 없습니다. 관리자만 접근 가능합니다.</div>)} />
        <Route
          path="/mypage/qna/new"
          element={user ? (<UserQnaForm />) : (<div style={{ padding: "20px" }}>로그인이 필요합니다.</div>)}
        />
        <Route
          path="/oauth2/redirect"
          element={<OAuthCallback setUser={setUser} />}
        />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/find-email" element={<FindEmail />} />
        <Route path="/find-password" element={<FindPassword />} />
      </Routes>
    </div>
  );
}
