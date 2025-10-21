import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { User, LoginForm } from "../types/types";

type Props = {
  setUser: (user: User) => void;
};

export default function Login({ setUser }: Props) {
  const navigate = useNavigate();
  const [form, setForm] = useState<LoginForm>({ email: "", password: "" });
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    submit: "",
  });

  // 이메일 유효성 체크
  const isEmailValid = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateAll = () => {
    const newErrors = { email: "", password: "", submit: "" };

    if (!form.email) newErrors.email = "이메일을 입력해주세요";
    else if (!isEmailValid(form.email))
      newErrors.email = "올바른 이메일 형식이 아닙니다";

    if (!form.password) newErrors.password = "비밀번호를 입력해주세요";
    else if (form.password.length < 8)
      newErrors.password = "비밀번호는 8자리 이상이어야 합니다";

    setErrors(newErrors);
    return Object.values(newErrors).every((err) => !err);
  };

  const handleSubmit = async () => {
    if (!validateAll()) return;

    try {
      const response = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data);
        navigate("/");
      } else {
        const data = await response.json();
        setErrors((prev) => ({
          ...prev,
          submit: data.message || "로그인 실패",
        }));
      }
    } catch {
      setErrors((prev) => ({ ...prev, submit: "서버 연결 실패" }));
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 onClick={() => navigate("/")} className="auth-title img-link">
          {/* 로고 SVG 생략 */}
          Logo
        </h2>

        <div className="form-group">
          {/* 이메일 */}
          <input
            type="email"
            placeholder="이메일"
            value={form.email}
            onChange={(e) => {
              const val = e.target.value;
              setForm((prev) => ({ ...prev, email: val }));
              setErrors((prev) => ({
                ...prev,
                email: val && !isEmailValid(val) ? "올바른 이메일 형식이 아닙니다" : "",
              }));
            }}
            className="input"
          />
          {errors.email && <p className="error-message">{errors.email}</p>}

          {/* 비밀번호 */}
          <input
            type="password"
            placeholder="비밀번호"
            value={form.password}
            onChange={(e) => {
              const val = e.target.value;
              setForm((prev) => ({ ...prev, password: val }));
              setErrors((prev) => ({
                ...prev,
                password:
                  val && val.length < 8 ? "비밀번호는 8자리 이상이어야 합니다" : "",
              }));
            }}
            className="input"
          />
          {errors.password && <p className="error-message">{errors.password}</p>}
        </div>

        {errors.submit && <p className="error-message">{errors.submit}</p>}

        <button onClick={handleSubmit} className="btn-submit">
          로그인
        </button>

        <div className="auth-links">
          <button onClick={() => navigate("/find-id")} className="auth-link-btn">
            아이디 찾기
          </button>
          <button onClick={() => navigate("/find-password")} className="auth-link-btn">
            비밀번호 찾기
          </button>
          <button onClick={() => navigate("/signup")} className="auth-link-btn">
            회원가입
          </button>
        </div>
      </div>
    </div>
  );
}