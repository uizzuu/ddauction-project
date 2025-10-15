import { useState } from "react";

function App() {
  const [page, setPage] = useState("main");
  const [user, setUser] = useState(null);

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

function Main({ setPage, user, setUser }) {
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

function Login({ setPage, setUser }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data);
        setPage("main");
      } else {
        setError("로그인 실패");
      }
    } catch (err) {
      setError("서버 연결 실패");
    }
  };

  return (
    <div style={containerStyle}>
      <div style={formBoxStyle}>
        <h2 style={{ fontSize: "32px", marginBottom: "30px" }}>로그인</h2>

        <div>
          <input
            type="text"
            placeholder="아이디"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            style={inputStyle}
          />

          {error && (
            <p style={{ color: "#ff4444", marginBottom: "10px" }}>{error}</p>
          )}

          <button
            onClick={handleSubmit}
            style={{ ...buttonStyle, width: "100%", marginTop: "20px" }}
          >
            로그인
          </button>
        </div>

        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <button
            onClick={() => setPage("signup")}
            style={{
              color: "#999",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            회원가입하기
          </button>
          <span style={{ margin: "0 10px", color: "#666" }}>|</span>
          <button
            onClick={() => setPage("main")}
            style={{
              color: "#999",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            메인으로
          </button>
        </div>
      </div>
    </div>
  );
}

function Signup({ setPage }) {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (form.password !== form.passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다");
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password,
        }),
      });

      if (response.ok) {
        alert("회원가입 성공!");
        setPage("login");
      } else {
        setError("회원가입 실패");
      }
    } catch (err) {
      setError("서버 연결 실패");
    }
  };

  return (
    <div style={containerStyle}>
      <div style={formBoxStyle}>
        <h2 style={{ fontSize: "32px", marginBottom: "30px" }}>회원가입</h2>

        <div>
          <input
            type="text"
            placeholder="아이디"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            style={inputStyle}
          />
          <input
            type="email"
            placeholder="이메일"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="비밀번호 확인"
            value={form.passwordConfirm}
            onChange={(e) =>
              setForm({ ...form, passwordConfirm: e.target.value })
            }
            style={inputStyle}
          />

          {error && (
            <p style={{ color: "#ff4444", marginBottom: "10px" }}>{error}</p>
          )}

          <button
            onClick={handleSubmit}
            style={{ ...buttonStyle, width: "100%", marginTop: "20px" }}
          >
            회원가입
          </button>
        </div>

        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <button
            onClick={() => setPage("login")}
            style={{
              color: "#999",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            로그인하기
          </button>
          <span style={{ margin: "0 10px", color: "#666" }}>|</span>
          <button
            onClick={() => setPage("main")}
            style={{
              color: "#999",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            메인으로
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductRegister({ setPage, user }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    startPrice: "",
    endDate: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!user) {
      alert("로그인이 필요합니다");
      setPage("login");
      return;
    }

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        alert("물품 등록 성공!");
        setPage("list");
      } else {
        setError("물품 등록 실패");
      }
    } catch (err) {
      setError("서버 연결 실패");
    }
  };

  return (
    <div style={containerStyle}>
      <div style={{ ...formBoxStyle, maxWidth: "600px" }}>
        <h2 style={{ fontSize: "32px", marginBottom: "30px" }}>물품 등록</h2>

        <div>
          <input
            type="text"
            placeholder="물품명"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            style={inputStyle}
          />

          <textarea
            placeholder="상세 설명"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            style={{ ...inputStyle, minHeight: "120px", resize: "vertical" }}
          />

          <input
            type="number"
            placeholder="시작 가격"
            value={form.startPrice}
            onChange={(e) => setForm({ ...form, startPrice: e.target.value })}
            style={inputStyle}
          />

          <input
            type="datetime-local"
            placeholder="경매 종료일시"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            style={inputStyle}
          />

          {error && (
            <p style={{ color: "#ff4444", marginBottom: "10px" }}>{error}</p>
          )}

          <button
            onClick={handleSubmit}
            style={{ ...buttonStyle, width: "100%", marginTop: "20px" }}
          >
            등록하기
          </button>
        </div>

        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <button
            onClick={() => setPage("main")}
            style={{
              color: "#999",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductList({ setPage }) {
  const [products] = useState([
    {
      id: 1,
      title: "아이폰 14 Pro",
      currentPrice: "850,000원",
      endTime: "2시간 후",
    },
    {
      id: 2,
      title: "맥북 프로 M1",
      currentPrice: "1,200,000원",
      endTime: "5시간 후",
    },
    {
      id: 3,
      title: "에어팟 맥스",
      currentPrice: "450,000원",
      endTime: "1일 후",
    },
  ]);

  return (
    <div style={{ color: "white", padding: "20px", minHeight: "100vh" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px",
          borderBottom: "2px solid #333",
        }}
      >
        <h1
          style={{ fontSize: "32px", fontWeight: "bold", cursor: "pointer" }}
          onClick={() => setPage("main")}
        >
          ⚡ 땅땅옥션
        </h1>
        <button onClick={() => setPage("main")} style={buttonStyle}>
          메인으로
        </button>
      </header>

      <div style={{ maxWidth: "1200px", margin: "40px auto" }}>
        <h2 style={{ fontSize: "28px", marginBottom: "30px" }}>
          진행중인 경매
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "20px",
          }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              style={{
                background: "#2a2a2a",
                padding: "20px",
                borderRadius: "8px",
                border: "1px solid #444",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "200px",
                  background: "#1a1a1a",
                  marginBottom: "15px",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#666",
                }}
              >
                이미지
              </div>
              <h3 style={{ fontSize: "20px", marginBottom: "10px" }}>
                {product.title}
              </h3>
              <p
                style={{
                  color: "#ffcc00",
                  fontSize: "24px",
                  fontWeight: "bold",
                  marginBottom: "10px",
                }}
              >
                {product.currentPrice}
              </p>
              <p style={{ color: "#999", marginBottom: "15px" }}>
                종료: {product.endTime}
              </p>
              <button style={{ ...buttonStyle, width: "100%" }}>
                입찰하기
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const containerStyle = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "20px",
  color: "white",
};

const formBoxStyle = {
  background: "#2a2a2a",
  padding: "40px",
  borderRadius: "12px",
  width: "100%",
  maxWidth: "400px",
  border: "1px solid #444",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "15px",
  background: "#1a1a1a",
  border: "1px solid #444",
  borderRadius: "6px",
  color: "white",
  fontSize: "16px",
  boxSizing: "border-box",
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

export default App;
