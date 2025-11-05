<<<<<<< HEAD
import { useState, useEffect } from "react"; // 🔹 useEffect 추가
=======
// import { useEffect, useState } from "react";
// import { Routes, Route, useLocation } from "react-router-dom";
// import ArticleForm from "./pages/ArticleForm";
// import ArticleDetail from "./pages/ArticleDetail";
// import SearchPage from "./pages/SearchPage";
// import {
//   HeaderMain,
//   HeaderSub,
//   Main,
//   Login,
//   Signup,
//   ProductList,
//   ProductRegister,
//   MyPage,
//   ProductDetail,
//   ArticleList,
//   AdminPage,
// } from "./import/import";
// import "./import/import.css";
// import type { User, Category } from "./types/types";
// import { API_BASE_URL } from "./services/api";

// export default function App() {
//   const [user, setUser] = useState<User | null>(null);
//   const [category, setCategory] = useState<Category[]>([]);
//   const location = useLocation();

//   // 앱 시작 시 세션에서 로그인 상태 가져오기
//   useEffect(() => {
//     fetch(`${API_BASE_URL}/api/users/me`, {
//       method: "GET",
//       credentials: "include", // 쿠키 포함
//     })
//       .then(res => {
//         if (!res.ok) throw new Error("세션 없음");
//         return res.json();
//       })
//       .then(data => setUser(data))
//       .catch(() => setUser(null));
//   }, []);

//   const noHeaderPaths = ["/login", "/signup"];
//   const showHeader = !noHeaderPaths.includes(location.pathname);

//   return (
//     <div style={{ minHeight: "100vh" }}>
//       {showHeader && <HeaderMain user={user} setUser={setUser} />}
//       {showHeader && <HeaderSub category={category} setCategory={setCategory} />}
//       <Routes>
//         <Route path="/" element={<Main />} />
//         <Route path="/login" element={<Login setUser={setUser} />} />
//         <Route path="/signup" element={<Signup />} />
//         <Route path="/auction" element={<ProductList />} />
//         <Route path="/register" element={<ProductRegister user={user} />} />
//         <Route path="/mypage" element={<MyPage user={user} setUser={setUser} />} />
//         <Route path="/products/:id" element={<ProductDetail user={user} setUser={setUser} />} />
//         <Route path="/community" element={<ArticleList user={user} />} />
//         <Route path="/articles/new" element={<ArticleForm userId={user?.userId ?? null} />} />
//         <Route path="/articles/:id/edit" element={<ArticleForm userId={user?.userId ?? null} />} />
//         <Route path="/articles/:id" element={<ArticleDetail user={user} />} />
//         <Route path="/search" element={<SearchPage />} />
//         <Route path="/admin" element={user?.role === "ADMIN" ? (<AdminPage user={user} />
//         ) : (<div style={{ padding: "20px" }}>
//           접근 권한이 없습니다. 관리자만 접근 가능합니다.
//         </div>)} />
//       </Routes>
//     </div>
//   );
// }

import { useEffect, useState } from "react";
>>>>>>> 38e217f1fd6bb40ed328539545fddb13d58d817a
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

<<<<<<< HEAD
=======
  // 1) 앱 시작 시 localStorage에서 복원 + 토큰으로 me 호출해 최신화
  useEffect(() => {
    // localStorage 복원
    try {
      const cached = localStorage.getItem("user");
      if (cached) setUser(JSON.parse(cached) as User);
    } catch (e) {
      console.error("user 복원 실패:", e);
    }

    // 토큰이 있으면 /me 호출하여 최신 프로필 동기화
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/users/me`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          // 401 등 토큰 무효 시 정리
          if (res.status === 401) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");
          }
          setUser(null);
          return;
        }

        const me: User = await res.json();
        setUser(me);
        // 최신 사용자 정보 로컬에도 반영
        try {
          localStorage.setItem("user", JSON.stringify(me));
        } catch {}
      } catch (e) {
        console.error("/me 요청 실패:", e);
      }
    })();
  }, []);

  // 2) user 상태가 바뀔 때 localStorage 동기화 (로그아웃/프로필수정 등)
  useEffect(() => {
    try {
      if (user) localStorage.setItem("user", JSON.stringify(user));
      else localStorage.removeItem("user");
    } catch {}
  }, [user]);

  // 로그인/회원가입 페이지에서는 헤더 숨김
>>>>>>> 38e217f1fd6bb40ed328539545fddb13d58d817a
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

  return (
    <div style={{ minHeight: "100vh" }}>
      {showHeader && <HeaderMain user={user} setUser={setUser} />}
      {showHeader && (
        <HeaderSub category={category} setCategory={setCategory} />
      )}

      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
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
<<<<<<< HEAD
        <Route path="/admin" element={user?.role === "ADMIN" ? (<AdminPage />) : (<div style={{ padding: "20px" }}>접근 권한이 없습니다. 관리자만 접근 가능합니다.</div>)} />
        <Route
          path="/mypage/qna/new"
          element={user ? (<UserQnaForm />) : (<div style={{ padding: "20px" }}>로그인이 필요합니다.</div>)}
        />
        <Route
          path="/oauth2/redirect"
          element={<OAuthCallback setUser={setUser} />}
        />
        <Route
          path="/payment"
          element={
            user?.isWinner ? (
              <PaymentPage />
            ) : (
              <div style={{ padding: "20px" }}>최고낙찰자만 접근 가능합니다.</div>
            )
          }
        />
        <Route path="/find-email" element={<FindEmail />} />
        <Route path="/find-password" element={<FindPassword />} />
=======
        <Route
          path="/admin"
          element={
            user?.role === "ADMIN" ? (
              <AdminPage user={user} />
            ) : (
              <div style={{ padding: "20px" }}>
                접근 권한이 없습니다. 관리자만 접근 가능합니다.
              </div>
            )
          }
        />
>>>>>>> 38e217f1fd6bb40ed328539545fddb13d58d817a
      </Routes>
    </div>
  );
}

