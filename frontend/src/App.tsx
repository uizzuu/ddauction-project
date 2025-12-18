import "./common/import.css";
import { useState, useEffect } from "react"; // 🔹 useEffect 추가
import { Routes, Route, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode"; // 🔹 JWT decode 라이브러리 추가
import {
  Header,
  Main,
  Login,
  Signup,
  ProductList,
  ProductRegister,
  ProductEdit,
  MyPage,
  ProductDetail,
  ArticleList,
  AdminPage,
  ErrorPage,
  OAuth2Redirect,
  FloatingWidgets,
  VerifyPage,
  ArticleForm,
  ArticleDetail,
  SearchPage,
  UserQnaForm,
  PaymentPage,
  FindEmail,
  FindPassword,
  UserChat,
  PublicChat,
  CartPage,
  RankPage,
  WishlistPage,
  UserProfilePage,
  ReviewWritePage,
  ImageSearchPage,
  TermsAgreement
} from "./common/import";
import type { User } from "./common/types";
import { ROLE, type Role } from "./common/enums";

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
  "/wishlist",
  "/error",
  "/public-chat",
  "/user-chat",
  "/verify",
  "/cart",
  "/rank",
  "/image-search",
  "/terms"
];

// 동적 경로 패턴 (예: /products/123, /articles/456 등)
const DYNAMIC_PATH_PATTERNS = [
  /^\/products\/\d+$/,
  /^\/products\/\d+\/edit$/,
  /^\/articles\/\d+$/,
  /^\/articles\/\d+\/edit$/,
  /^\/users\/\d+$/,
  /^\/reviews\/\d+$/,
  /^\/reviews\/write\/\d+$/,
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

  const noHeaderPaths = ["/login", "/signup", "/find-email", "/find-password", "/terms"];
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
        role?: Role;
        businessNumber?: string;
      }>(token);
      console.log("🔍 JWT decoded:", decoded); // ✅ 추가
      console.log("🔍 businessNumber:", decoded.businessNumber); // ✅ 추가

      // 🔹 setUser에 nickName 포함
      setUser({
        userId: decoded.userId,
        userName: decoded.userName,
        nickName: decoded.nickName,
        role: decoded.role,
        businessNumber: decoded.businessNumber,
      });
      console.log("🔍 setUser 완료"); // ✅ 추가
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
        <Header user={user} setUser={setUser} />

        <ErrorPage />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      {showHeader && (
        <>
          <Header user={user} setUser={setUser} />

        </>
      )}
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route
          path="/oauth2/redirect"
          element={<OAuth2Redirect setUser={setUser} />}
        />
        <Route path="/signup" element={<Signup />} />
        <Route path="/terms" element={<TermsAgreement />} />
        <Route path="/auction" element={<ProductList />} />
        <Route path="/register" element={<ProductRegister user={user} />} />
        <Route path="/products/:productId/edit" element={<ProductEdit user={user} />} />
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
          element={<ArticleForm user={user} />}
        />
        <Route
          path="/articles/:id/edit"
          element={<ArticleForm user={user} />}
        />
        <Route path="/articles/:id" element={<ArticleDetail user={user} />} />
        <Route path="/search" element={<SearchPage />} />
        <Route
          path="/admin"
          element={
            user?.role === ROLE.ADMIN ? (
              <AdminPage user={user!} />
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
        <Route path="/cart" element={user ? <CartPage /> : <div style={{ padding: "20px" }}>로그인이 필요합니다.</div>} />
        <Route path="/wishlist" element={user ? <WishlistPage /> : <div style={{ padding: "20px" }}>로그인이 필요합니다.</div>} />

        <Route path="/reviews/write/:productId" element={user ? <ReviewWritePage /> : <div style={{ padding: "20px" }}>로그인이 필요합니다.</div>} />
        <Route path="/rank" element={<RankPage />} />
        <Route path="/users/:userId" element={<UserProfilePage />} />
        <Route path="/image-search" element={<ImageSearchPage />} />

        {/* 에러 페이지 - 마지막에 정의 (와일드카드는 마지막!) */}
        <Route path="/error" element={<ErrorPage />} />
        <Route path="*" element={<ErrorPage />} />
        {/* 채팅 */}
        <Route
          path="/public-chat"
          element={
            user ? (
              <PublicChat user={user} />
            ) : (
              <div style={{ padding: "20px" }}>로그인이 필요합니다.</div>
            )
          }
        />
        <Route
          path="/user-chat"
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
      <FloatingWidgets />
    </div>
  );
}
