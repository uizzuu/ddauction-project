import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { SignupForm } from "../types/types";

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState<SignupForm>({
    userName: "",
    nickName: "",
    email: "",
    password: "",
    phone: "",
  });
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (
      !form.userName ||
      !form.nickName ||
      !form.email ||
      !form.password ||
      !form.phone
    ) {
      setError("모든 필드를 입력해주세요");
      return;
    }

    if (form.password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다");
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        alert("회원가입 성공!");
        navigate("/login");
      } else {
        setError("회원가입 실패");
      }
    } catch {
      setError("서버 연결 실패");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 className="auth-title">회원가입</h2>

        <div className="form-group">
          <input
            type="text"
            placeholder="이름"
            value={form.userName}
            onChange={(e) => setForm({ ...form, userName: e.target.value })}
            className="input"
          />
          <input
            type="text"
            placeholder="닉네임"
            value={form.nickName}
            onChange={(e) => setForm({ ...form, nickName: e.target.value })}
            className="input"
          />
          <input
            type="email"
            placeholder="이메일"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="input"
          />
          <input
            type="tel"
            placeholder="전화번호 (010-0000-0000)"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="input"
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="input"
          />
          <input
            type="password"
            placeholder="비밀번호 확인"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            className="input"
          />
        </div>

        {error && <p className="error-message">{error}</p>}

        <button onClick={handleSubmit} className="btn-submit">
          회원가입
        </button>

        <div className="auth-links">
          <button onClick={() => navigate("/login")} className="link-button">
            로그인하기
          </button>
          <span className="divider">|</span>
          <button onClick={() => navigate("/")} className="link-button">
            메인으로
          </button>
        </div>
      </div>
    </div>
  );
}
