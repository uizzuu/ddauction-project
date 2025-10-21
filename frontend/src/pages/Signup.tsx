import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { SignupForm } from "../types/types";
import { API_BASE_URL } from "../services/api";

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
  const [errors, setErrors] = useState({
    userName: "",
    nickName: "",
    email: "",
    phone: "",
    password: "",
    passwordConfirm: "",
    submit: "",
  });

  // 이메일 유효성 체크
  const isEmailValid = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateAll = () => {
    const newErrors = {
      userName: "",
      nickName: "",
      email: "",
      phone: "",
      password: "",
      passwordConfirm: "",
      submit: "",
    };

    if (!form.userName) newErrors.userName = "이름을 입력해주세요";
    if (!form.nickName) newErrors.nickName = "닉네임을 입력해주세요";
    else if (form.nickName.length < 3 || form.nickName.length > 12)
      newErrors.nickName = "닉네임은 3~12자여야 합니다";

    if (!form.email) newErrors.email = "이메일을 입력해주세요";
    else if (!isEmailValid(form.email))
      newErrors.email = "올바른 이메일 형식이 아닙니다";

    if (!form.phone) newErrors.phone = "전화번호를 입력해주세요";
    else if (form.phone.length < 10 || form.phone.length > 11)
      newErrors.phone = "전화번호는 10~11자리 숫자여야 합니다";

    if (!form.password) newErrors.password = "비밀번호를 입력해주세요";
    else if (form.password.length < 8)
      newErrors.password = "비밀번호는 8자리 이상이어야 합니다";

    if (!passwordConfirm)
      newErrors.passwordConfirm = "비밀번호 확인을 입력해주세요";
    else if (passwordConfirm !== form.password)
      newErrors.passwordConfirm = "비밀번호가 일치하지 않습니다";

    setErrors(newErrors);
    return Object.values(newErrors).every((err) => !err);
  };

  const handleSubmit = async () => {
    if (!validateAll()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        alert("회원가입 성공!");
        navigate("/login");
      } else {
        const data = await response.json();
        setErrors((prev) => ({
          ...prev,
          submit: data.message || "회원가입 실패",
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
          회원가입
        </h2>

        <div className="form-group">
          {/* 이름 */}
          <input
            type="text"
            placeholder="이름"
            value={form.userName}
            onChange={(e) => {
              const filtered = e.target.value.replace(/[^가-힣a-zA-Z]/g, "");
              setForm({ ...form, userName: filtered });
              setErrors((prev) => ({
                ...prev,
                userName: filtered ? "" : "이름을 입력해주세요",
              }));
            }}
            className="input"
          />
          {errors.userName && (
            <p className="error-message">{errors.userName}</p>
          )}

          {/* 닉네임 */}
          <input
            type="text"
            placeholder="닉네임"
            value={form.nickName}
            onChange={(e) => {
              const filtered = e.target.value.replace(/[^가-힣a-zA-Z0-9]/g, "");
              setForm({ ...form, nickName: filtered });
              let msg = "";
              if (!filtered) msg = "닉네임을 입력해주세요";
              else if (filtered.length < 3 || filtered.length > 12)
                msg = "닉네임은 3~12자여야 합니다";
              setErrors((prev) => ({ ...prev, nickName: msg }));
            }}
            className="input"
          />
          {errors.nickName && (
            <p className="error-message">{errors.nickName}</p>
          )}

          {/* 이메일 */}
          <input
            type="email"
            placeholder="이메일"
            value={form.email}
            onChange={(e) => {
              const val = e.target.value;
              setForm({ ...form, email: val });
              const msg =
                val && !isEmailValid(val)
                  ? "올바른 이메일 형식이 아닙니다"
                  : "";
              setErrors((prev) => ({ ...prev, email: msg }));
            }}
            className="input"
          />
          {errors.email && <p className="error-message">{errors.email}</p>}

          {/* 전화번호 */}
          <input
            type="tel"
            placeholder="전화번호 (숫자만 입력)"
            value={form.phone}
            onChange={(e) => {
              const filtered = e.target.value
                .replace(/[^0-9]/g, "")
                .slice(0, 11);
              setForm({ ...form, phone: filtered });
              let msg = "";
              if (!filtered) msg = "전화번호를 입력해주세요";
              else if (filtered.length < 10)
                msg = "전화번호는 10~11자리 숫자여야 합니다";
              setErrors((prev) => ({ ...prev, phone: msg }));
            }}
            className="input"
          />
          {errors.phone && <p className="error-message">{errors.phone}</p>}

          {/* 비밀번호 */}
          <input
            type="password"
            placeholder="비밀번호 (8자리 이상, 숫자+특수문자 !*@# 포함)"
            value={form.password}
            onChange={(e) => {
              const val = e.target.value;
              setForm({ ...form, password: val });

              // 비밀번호 패턴 체크
              const pattern = /^(?=.*[0-9])(?=.*[!*@#])[a-zA-Z0-9!*@#]{8,}$/;
              let msg = "";
              if (!val) msg = "비밀번호를 입력해주세요";
              else if (!pattern.test(val))
                msg =
                  "비밀번호는 8자리 이상, 숫자와 !*@# 중 1개 이상 포함해야 합니다";

              setErrors((prev) => ({
                ...prev,
                password: msg,
                passwordConfirm:
                  passwordConfirm && passwordConfirm !== val
                    ? "비밀번호가 일치하지 않습니다"
                    : "",
              }));
            }}
            className="input"
          />
          {errors.password && (
            <p className="error-message">{errors.password}</p>
          )}

          {/* 비밀번호 확인 */}
          <input
            type="password"
            placeholder="비밀번호 확인"
            value={passwordConfirm}
            onChange={(e) => {
              const val = e.target.value;
              setPasswordConfirm(val);
              setErrors((prev) => ({
                ...prev,
                passwordConfirm:
                  val && val !== form.password
                    ? "비밀번호가 일치하지 않습니다"
                    : "",
              }));
            }}
            onPaste={(e) => e.preventDefault()} // 붙여넣기 막기
            className="input"
          />
          {errors.passwordConfirm && (
            <p className="error-message">{errors.passwordConfirm}</p>
          )}
        </div>

        {errors.submit && <p className="error-message">{errors.submit}</p>}

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
// 