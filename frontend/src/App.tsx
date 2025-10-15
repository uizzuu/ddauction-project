import { useState } from "react";
import Login from "./components/Login";
import Signup from "./components/Signup";
import ProductRegister from "./components/ProductRegister";
import ProductList from "./components/ProductList";
import type { User, Page } from "./types";

export default function App() {
  const [page, setPage] = useState<Page>("main");
  const [user, setUser] = useState<User | null>(null);

  const renderPage = () => {
    switch (page) {
      case "login":
        return <Login setPage={setPage} setUser={setUser} />;
      case "signup":
        return <Signup setPage={setPage} />;
      case "register":
        return <ProductRegister setPage={setPage} user={user} />;
      case "list":
        return <ProductList setPage={setPage} />;
      default:
        return <Main setPage={setPage} user={user} setUser={setUser} />;
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#1a1a1a" }}>
      {renderPage()}
    </div>
  );
}

// Main 컴포넌트
type MainProps = {
  setPage: (page: "main" | "login" | "signup" | "register" | "list") => void;
  user: User | null;
  setUser: (user: User | null) => void;
};

const buttonStyle = {
  padding: "12px 24px",
  background: "#000",
  color: "white",
  border: "1px solid #fff",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "16px",
  fontWeight: "bold",
};

function Main({ setPage, user, setUser }: MainProps) {
  return (
    <div style={{ color: "white", padding: "20px" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px",
          borderBottom: "2px solid #333",
        }}
      >
        <h1 style={{ fontSize: "32px", fontWeight: "bold" }}>⚡ 땅땅옥션</h1>
        <div>
          {user ? (
            <>
              <span style={{ marginRight: "20px" }}>{user.username}님</span>
              <button onClick={() => setUser(null)} style={buttonStyle}>
                로그아웃
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setPage("login")} style={buttonStyle}>
                로그인
              </button>
              <button
                onClick={() => setPage("signup")}
                style={{ ...buttonStyle, marginLeft: "10px" }}
              >
                회원가입
              </button>
            </>
          )}
        </div>
      </header>

      <div
        style={{ maxWidth: "1200px", margin: "40px auto", textAlign: "center" }}
      >
        <h2 style={{ fontSize: "48px", marginBottom: "20px" }}>
          빠른 경매, 확실한 거래
        </h2>
        <p style={{ fontSize: "20px", color: "#999", marginBottom: "40px" }}>
          중고물품을 경매로 판매하고 구매하세요
        </p>

        <div
          style={{
            display: "flex",
            gap: "20px",
            justifyContent: "center",
            marginTop: "40px",
          }}
        >
          <button
            onClick={() => setPage("register")}
            style={{ ...buttonStyle, fontSize: "18px", padding: "15px 40px" }}
          >
            물품 등록하기
          </button>
          <button
            onClick={() => setPage("list")}
            style={{
              ...buttonStyle,
              fontSize: "18px",
              padding: "15px 40px",
              background: "#333",
            }}
          >
            경매 목록 보기
          </button>
        </div>
      </div>
    </div>
  );
}
