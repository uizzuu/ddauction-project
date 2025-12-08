import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { User, LoginForm } from "../../common/types";
import { loginAPI, getSocialLoginURL } from "../../common/api";

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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateAll()) return;

    try {
      const userData = await loginAPI(form);
      setUser(userData);
      navigate("/");
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, submit: err.message || "로그인 실패" }));
    }
  };

  const handleSocialLogin = (provider: "google" | "naver" | "kakao") => {
    window.location.href = getSocialLoginURL(provider);
  };

  return (
    <div className="min-h-screen bg-[#f5f6f7] flex flex-col justify-center items-center py-10 px-4">
      {/* Logo Area */}
      <a
        href="/"
        className="relative block w-32 h-8 flex flex-shrink-0 mb-6"
        aria-label="DDANG 홈으로 이동"
      >
        <img
          src="https://c.animaapp.com/vpqlbV8X/img/ddang.svg"
          alt="DDANG"
          className="w-full h-full object-contain"
        />
      </a>

      <div className="bg-white p-10 md:p-14 border border-gray-200 shadow-sm  w-full max-w-[460px]">
        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Email */}
          <div className="flex flex-col gap-1">
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
              className={`w-full px-4 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-[4px] focus:outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111] transition-colors`}
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1">
            <input
              type="password"
              placeholder="비밀번호"
              value={form.password}
              onChange={(e) => {
                const val = e.target.value;
                setForm((prev) => ({ ...prev, password: val }));
                setErrors((prev) => ({
                  ...prev,
                  password: val && val.length < 8 ? "비밀번호는 8자리 이상이어야 합니다" : "",
                }));
              }}
              className={`w-full px-4 py-3 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-[4px] focus:outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111] transition-colors`}
            />
            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
          </div>

          {errors.submit && <p className="text-xs text-red-500 text-center">{errors.submit}</p>}

          <button
            type="submit"
            className="w-full text-white font-bold py-4 mt-4 hover:bg-[#333] transition-colors flex justify-center items-center rounded-[4px] bg-gray-300"
          >
            로그인
          </button>
        </form>

        {/* Links */}
        <div className="flex justify-center items-center gap-4 mt-5 text-sm text-gray-400">
          <span className="cursor-pointer hover:text-gray-600" onClick={() => navigate("/find-email")}>이메일 찾기</span>
          <span className="w-[1px] h-3 bg-gray-300"></span>
          <span className="cursor-pointer hover:text-gray-600" onClick={() => navigate("/find-password")}>비밀번호 찾기</span>
          <span className="w-[1px] h-3 bg-gray-300"></span>
          <span className="cursor-pointer hover:text-gray-600" onClick={() => navigate("/signup")}>회원가입</span>
        </div>

        {/* Social Login */}
        <div className="mt-10 pt-10 border-t border-gray-100 flex flex-col items-center">
          {/* <span className="text-xs text-gray-400 mb-4">SNS 계정으로 로그인</span> */}
          <div className="flex gap-4">
            <button
              onClick={() => handleSocialLogin("naver")}
              className="w-12 h-12 rounded-full border border-[#e5e7eb] bg-[#03c75a] flex items-center justify-center hover:bg-gray-50 transition-colors overflow-hidden"
              title="네이버 로그인"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 19.1 17.5" className="w-4 h-4" fill="#fff">
                <path d="M12.59 0 12.59 8.83 6.54 0 0 0 0 17.5 6.51 17.5 6.51 8.67 12.56 17.5 19.1 17.5 19.1 0 12.59 0" />
              </svg>
            </button>
            <button
              onClick={() => handleSocialLogin("kakao")}
              className="w-12 h-12 rounded-full border border-[#e5e7eb] bg-[#FEE500] flex items-center justify-center hover:bg-gray-50 transition-colors"
              title="카카오 로그인"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" className="w-6 h-6">
                <path fill="#391B1B" fillRule="evenodd" clipRule="evenodd" d="M9.96052 3C5.83983 3 2.5 5.59377 2.5 8.79351C2.5 10.783 3.79233 12.537 5.75942 13.5807L4.9313 16.6204C4.85835 16.8882 5.1634 17.1029 5.39883 16.9479L9.02712 14.5398C9.33301 14.5704 9.64386 14.587 9.96052 14.587C14.0812 14.587 17.421 11.9932 17.421 8.79351C17.421 5.59377 14.0812 3 9.96052 3Z" />
              </svg>
            </button>
            <button
              onClick={() => handleSocialLogin("google")}
              className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors border border-solid border-[#f3f3f3]"
              title="구글 로그인"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            </button>
          </div>
        </div>

      </div>
      <div className="mt-8 text-xs text-gray-400">
        &copy; DDAUCTION Corp.
      </div>
    </div>
  );
}
