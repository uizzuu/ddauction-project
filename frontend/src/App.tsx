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
import UserChat from "./components/chat/UserChat";
import VerifyPage from "./pages/VerifyPage";

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
  ErrorPage,
  OAuth2Redirect,
} from "./common/import";
import "./common/import.css";
import type { User } from "./common/types";

// 유효한 경로 패턴 정의
const VALID_PATHS = [
  "/",
  "/login",
  "/signup",
  "/auction",
  "/register",
  "/mypage",
  "/mypage/qna/new",
  "/community",
  "/articles/new",
  "/search",
  "/admin",
  "/payment",
  "/find-email",
  "/find-password",
  "/oauth2/redirect",
  "/error",
   "/verify",
];

// 동적 경로 패턴 (예: /products/123, /articles/456 등)
const DYNAMIC_PATH_PATTERNS = [
  /^\/products\/\d+$/,
  /^\/articles\/\d+$/,
  /^\/articles\/\d+\/edit$/,
];

// 현재 경로가 유효한지 확인
const isValidPath = (pathname: string): boolean => {
  // 정확한 경로 확인
  if (VALID_PATHS.includes(pathname)) {
    return true;
  }

  // 동적 경로 패턴 확인
  if (DYNAMIC_PATH_PATTERNS.some((pattern) => pattern.test(pathname))) {
    return true;
  }

  return false;
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const location = useLocation();
  const [isInvalidPath, setIsInvalidPath] = useState(false);

  const noHeaderPaths = ["/login", "/signup"];
  const showHeader = !noHeaderPaths.includes(location.pathname);

  // 경로 유효성 확인
  useEffect(() => {
    const valid = isValidPath(location.pathname);
    setIsInvalidPath(!valid);
  }, [location.pathname]);

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
      }>(token);

      // 🔹 setUser에 nickName 포함
      setUser({
        userId: decoded.userId,
        userName: decoded.userName,
        nickName: decoded.nickName,
        role: decoded.role,
      });
    } catch (e) {
      console.error("JWT decode 실패", e);
      localStorage.removeItem("token");
      setUser(null);
    }
  }, []);

  // 유효하지 않은 경로면 에러 페이지 표시
  if (isInvalidPath) {
    return (
      <div style={{ minHeight: "100vh" }}>
        <HeaderMain user={user} setUser={setUser} />
        <HeaderSub />
        <ErrorPage />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      {showHeader && <HeaderMain user={user} setUser={setUser} />}
      {showHeader && (
        <HeaderSub />
      )}
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route
          path="/oauth2/redirect"
          element={<OAuth2Redirect setUser={setUser} />}
        />
        <Route path="/signup" element={<Signup />} />
        <Route path="/auction" element={<ProductList />} />
        <Route path="/register" element={<ProductRegister user={user} />} />
        <Route
          path="/mypage"
          element={<MyPage user={user} setUser={setUser} />}
        />
        <Route
          path="/products/:id"
          element={<ProductDetail user={user} setUser={setUser} />}
        />
        <Route path="/community" element={<ArticleList user={user} />} />
        <Route
          path="/articles/new"
          element={<ArticleForm userId={user?.userId ?? null} />}
        />
        <Route
          path="/articles/:id/edit"
          element={<ArticleForm userId={user?.userId ?? null} />}
        />
        <Route path="/articles/:id" element={<ArticleDetail user={user} />} />
        <Route path="/search" element={<SearchPage />} />
        <Route
          path="/admin"
          element={
            user?.role === "ADMIN" ? (
              <AdminPage />
            ) : (
              <div style={{ padding: "20px" }}>
                접근 권한이 없습니다. 관리자만 접근 가능합니다.
              </div>
            )
          }
        />
        <Route
          path="/mypage/qna/new"
          element={
            user ? (
              <UserQnaForm />
            ) : (
              <div style={{ padding: "20px" }}>로그인이 필요합니다.</div>
            )
          }
        />
        {/* <Route
          path="/payment"
          element={
            user?.isWinner ? (
              <PaymentPage />
            ) : (
              <div style={{ padding: "20px" }}>최고낙찰자만 접근 가능합니다.</div>
            )
          }
        /> */}
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/find-email" element={<FindEmail />} />
        <Route path="/find-password" element={<FindPassword />} />

        {/* 에러 페이지 - 마지막에 정의 (와일드카드는 마지막!) */}
        <Route path="/error" element={<ErrorPage />} />
        <Route path="*" element={<ErrorPage />} />
        {/* 채팅 */}
        <Route
          path="/chat"
          element={
            user ? (
              <UserChat user={user} />
            ) : (
              <div style={{ padding: "20px" }}>로그인이 필요합니다.</div>
            )
          }
        />

        <Route path="/verify" element={<VerifyPage />} /> {/* 이메일 인증용 */}
      </Routes>
    </div>
  );
}
