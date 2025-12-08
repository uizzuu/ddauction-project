import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { SignupForm } from "../../common/types";

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState<SignupForm & {
    address?: string;
    zipCode?: string;
    detailAddress?: string;
  }>({
    userName: "",
    nickName: "",
    email: "",
    password: "",
    phone: "",
    birthday: "",
    address: "",
    zipCode: "",
    detailAddress: ""
  });

  const [isComposing, setIsComposing] = useState({
    userName: false,
    nickName: false,
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
    birthday: "",
    address: "",
  });

  const isEmailValid = (email: string) =>
    /^[^\s@]+@[^\s@]+.[^\s@]+$/.test(email);

  const validateAll = () => {
    const newErrors = {
      userName: "",
      nickName: "",
      email: "",
      phone: "",
      password: "",
      passwordConfirm: "",
      submit: "",
      birthday: "",
      address: "",
      zipCode: "",
      detailAddress: "",
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

  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  const sendVerificationEmail = async () => {
    if (!isEmailValid(form.email)) {
      setEmailMessage("올바른 이메일을 입력해주세요");
      return;
    }
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      if (!res.ok) throw new Error(await res.text());
      setEmailMessage("인증 메일이 발송되었습니다.");
    } catch (err: any) {
      setEmailMessage(err.message || "인증 메일 발송 실패");
    }
  };

  const verifyEmailCode = async () => {
    try {
      const res = await fetch(`/api/auth/verify-email?email=${encodeURIComponent(form.email)}&code=${encodeURIComponent(verificationCode)}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(await res.text());
      setIsEmailVerified(true);
      setEmailMessage("이메일 인증 완료!");
    } catch (err: any) {
      setEmailMessage(err.message || "인증 실패");
    }
  };


  const handleSearchAddress = () => {
    // @ts-ignore
    new window.daum.Postcode({
      oncomplete: function (data: any) {
        setForm((prev) => ({
          ...prev,
          address: data.address,
          zipCode: data.zonecode,
          detailAddress: "",
        }));
      },
    }).open();
  };

  const handleSubmit = async () => {
    if (!validateAll()) return;

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      alert("회원가입 성공!");
      navigate("/login");
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        submit: err.message || "회원가입 실패",
      }));
    }
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

      <div className="bg-white p-10 border border-gray-200 shadow-sm rounded-lg w-full max-w-[460px]">
        <h2 className="text-xl font-bold mb-6 text-center text-[#333]">회원가입</h2>

        <div className="flex flex-col gap-4 box-border">
          {/* --- 기본 정보 --- */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-col">
              <input
                type="text"
                placeholder="이름"
                value={form.userName}
                onCompositionStart={() => setIsComposing((prev) => ({ ...prev, userName: true }))}
                onCompositionEnd={() => setIsComposing((prev) => ({ ...prev, userName: false }))}
                onChange={(e) => {
                  let val = e.target.value;
                  if (!isComposing.userName) val = val.replace(/[^가-힣a-zA-Z]/g, "");
                  setForm((prev) => ({ ...prev, userName: val }));
                  setErrors((prev) => ({ ...prev, userName: val ? "" : "이름을 입력해주세요" }));
                }}
                className={`w-full px-4 py-3 border ${errors.userName ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111] transition-colors rounded-[4px]`}
              />
              {errors.userName && <p className="text-xs text-red-500 mt-1">{errors.userName}</p>}
            </div>

            <div className="flex flex-col">
              <input
                type="text"
                placeholder="닉네임"
                value={form.nickName}
                onCompositionStart={() => setIsComposing((prev) => ({ ...prev, nickName: true }))}
                onCompositionEnd={() => setIsComposing((prev) => ({ ...prev, nickName: false }))}
                onChange={(e) => {
                  let val = e.target.value;
                  if (!isComposing.nickName) val = val.replace(/[^가-힣a-zA-Z0-9]/g, "");
                  setForm((prev) => ({ ...prev, nickName: val }));
                  let msg = "";
                  if (!val) msg = "닉네임을 입력해주세요";
                  else if (val.length < 3 || val.length > 12) msg = "닉네임은 3~12자여야 합니다";
                  setErrors((prev) => ({ ...prev, nickName: msg }));
                }}
                className={`w-full px-4 py-3 border ${errors.nickName ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111] transition-colors rounded-[4px]`}
              />
              {errors.nickName && <p className="text-xs text-red-500 mt-1">{errors.nickName}</p>}
            </div>
          </div>

          {/* --- 이메일 & 인증 --- */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="이메일"
                value={form.email}
                onChange={(e) => {
                  const val = e.target.value.replace(/[ㄱ-ㅎㅏ-ㅣ가-힣\s]/g, "");
                  setForm((prev) => ({ ...prev, email: val }));
                  setIsEmailVerified(false);
                  setErrors((prev) => ({ ...prev, email: "" }));
                }}
                className={`flex-1 min-w-0 px-4 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111] transition-colors rounded-[4px]`}
              />
              <button
                onClick={sendVerificationEmail}
                className="px-4 py-3 bg-[#333] text-white text-sm whitespace-nowrap hover:bg-black transition-colors rounded-[4px]"
              >
                인증 메일
              </button>
            </div>
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            {emailMessage && <p className="text-xs text-blue-500">{emailMessage}</p>}

            {!isEmailVerified && (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="인증 코드"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className={`flex-1 min-w-0 px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111] transition-colors rounded-[4px]`}
                />
                <button
                  onClick={verifyEmailCode}
                  className="flex-shrink-0 px-4 py-3 border border-solid border-gray-300 text-[#333] text-sm whitespace-nowrap hover:bg-gray-50 transition-colors rounded-[4px]"
                >
                  확인
                </button>
              </div>
            )}
          </div>

          {/* --- 전화번호 & 생일 --- */}
          <div className="flex flex-col gap-2">
            <input
              type="tel"
              placeholder="전화번호 (숫자만 입력)"
              value={form.phone}
              onChange={(e) => {
                const filtered = e.target.value.replace(/[^0-9]/g, "").slice(0, 11);
                setForm((prev) => ({ ...prev, phone: filtered }));
                let msg = "";
                if (!filtered) msg = "전화번호를 입력해주세요";
                else if (filtered.length < 10) msg = "전화번호는 10~11자리 숫자여야 합니다";
                setErrors((prev) => ({ ...prev, phone: msg }));
              }}
              className={`w-full px-4 py-3 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111] transition-colors rounded-[4px]`}
            />
            {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}

            <input
              type="date"
              placeholder="생일"
              value={form.birthday}
              onChange={(e) => setForm((prev) => ({ ...prev, birthday: e.target.value }))}
              className={`w-full px-4 py-3 border ${errors.birthday ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111] transition-colors bg-white rounded-[4px]`}
            />
            {errors.birthday && <p className="text-xs text-red-500">{errors.birthday}</p>}
          </div>

          {/* --- 주소 --- */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="우편번호"
                value={form.zipCode}
                readOnly
                className="w-1/3 px-4 py-3 border border-gray-300 bg-gray-50 text-gray-500 focus:outline-none rounded-[4px]"
              />
              <button
                type="button"
                onClick={handleSearchAddress}
                className="flex-1 px-4 py-3 border border-solid border-gray-300 text-[#333] text-sm hover:bg-gray-50 transition-colors rounded-[4px]"
              >
                주소 검색
              </button>
            </div>
            <input
              type="text"
              placeholder="주소"
              value={form.address}
              readOnly
              className="w-full px-4 py-3 border border-gray-300 bg-gray-50 text-gray-500 focus:outline-none rounded-[4px]"
            />
            <input
              type="text"
              placeholder="상세주소"
              value={form.detailAddress}
              onChange={(e) => setForm((prev) => ({ ...prev, detailAddress: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111] transition-colors rounded-[4px]"
            />
            {errors.address && <p className="text-xs text-red-500">{errors.address}</p>}
          </div>

          {/* --- 비밀번호 --- */}
          <div className="flex flex-col gap-2">
            <input
              type="password"
              placeholder="비밀번호 (8자리, 대소문자/숫자/특수문자)"
              value={form.password}
              onChange={(e) => {
                const val = e.target.value.replace(/\s+/g, "");
                setForm((prev) => ({ ...prev, password: val }));
                const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!*@#]).{8,}$/;
                let msg = "";
                if (!val) msg = "비밀번호를 입력해주세요";
                else if (!pattern.test(val)) msg = "비밀번호는 8자리 이상, 대소문자+숫자+특수문자 !*@# 1개 이상 포함";
                setErrors((prev) => ({
                  ...prev,
                  password: msg,
                  passwordConfirm: passwordConfirm && passwordConfirm !== val ? "비밀번호가 일치하지 않습니다" : "",
                }));
              }}
              className={`w-full px-4 py-3 border ${errors.password ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111] transition-colors rounded-[4px]`}
            />
            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}

            <input
              type="password"
              placeholder="비밀번호 확인"
              value={passwordConfirm}
              onChange={(e) => {
                const val = e.target.value.replace(/\s+/g, "");
                setPasswordConfirm(val);
                setErrors((prev) => ({
                  ...prev,
                  passwordConfirm: val && val !== form.password ? "비밀번호가 일치하지 않습니다" : "",
                }));
              }}
              onPaste={(e) => e.preventDefault()}
              className={`w-full px-4 py-3 border ${errors.passwordConfirm ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111] transition-colors rounded-[4px]`}
            />
            {errors.passwordConfirm && <p className="text-xs text-red-500">{errors.passwordConfirm}</p>}
          </div>

          {errors.submit && <p className="text-xs text-red-500 text-center">{errors.submit}</p>}

          <button
            onClick={handleSubmit}
            disabled={!isEmailVerified}
            className={`w-full py-4 mt-4 font-bold text-white transition-colors ${!isEmailVerified ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#888] hover:bg-[#333]'} rounded-[4px]`}
          >
            가입하기
          </button>

          <div className="flex justify-center items-center gap-4 mt-4 text-sm text-gray-400">
            <span className="cursor-pointer hover:text-gray-600" onClick={() => navigate("/login")}>로그인하기</span>
            <span className="w-[1px] h-3 bg-gray-300"></span>
            <span className="cursor-pointer hover:text-gray-600" onClick={() => navigate("/")}>메인으로</span>
          </div>
        </div>
      </div>
      <div className="mt-8 text-xs text-gray-400">
        &copy; DDAUCTION Corp.
      </div>
    </div>
  );
}