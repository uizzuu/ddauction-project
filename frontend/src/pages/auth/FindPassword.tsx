import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { resetPassword } from "../../common/api";

export default function FindPassword() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"email" | "phone">("email");

  // 인증 상태
  const [isVerified, setIsVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [userName, setUserName] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"info" | "success" | "error">("info");

  // 인증 코드 발송
  const sendCode = async () => {
    setMessage("");
    setMessageType("info");
    try {
      let res;
      if (tab === "email") {
        if (!email) { setMessage("이메일을 입력해주세요."); setMessageType("error"); return; }
        // 백엔드: /api/auth/password-reset/send-code
        res = await fetch("/api/auth/password-reset/send-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
      } else {
        if (!phone) { setMessage("전화번호를 입력해주세요."); setMessageType("error"); return; }
        // 백엔드: /api/sms/reset/send
        res = await fetch("/api/sms/reset/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone }),
        });
      }

      if (!res.ok) throw new Error(await res.text());
      setMessage("인증 번호가 발송되었습니다.");
      setMessageType("success");
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || "인증 번호 발송 실패");
      setMessageType("error");
    }
  };

  // 인증 코드 확인
  const verifyCode = async () => {
    setMessage("");
    setMessageType("info");
    try {
      let res;
      if (tab === "email") {
        // 기존 api/auth/verify-email?email=...&code=... 사용
        res = await fetch(
          `/api/auth/verify-email?email=${encodeURIComponent(email)}&code=${encodeURIComponent(verificationCode)}`,
          { method: "POST" }
        );
      } else {
        // 기존 api/sms/verify 사용
        res = await fetch("/api/sms/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, code: verificationCode }),
        });
      }

      if (!res.ok) throw new Error(await res.text());

      setIsVerified(true);
      setMessage("인증이 완료되었습니다. 새 비밀번호를 입력해주세요.");
      setMessageType("success");
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || "인증 실패");
      setMessageType("error");
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setMessageType("info");

    try {
      const payload: any = { userName, newPassword };
      if (tab === "email") payload.email = email;
      else payload.phone = phone;

      await resetPassword(payload);
      setMessage("비밀번호가 성공적으로 변경되었습니다.");
      setMessageType("success");
      // navigate("/login"); 
    } catch (err: any) {
      console.error("비밀번호 찾기 오류:", err);
      setMessage(err.message || "비밀번호 찾기에 실패했습니다. 잠시 후 다시 시도해주세요.");
      setMessageType("error");
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6f7] flex flex-col justify-center items-center py-10 px-4">
      <a href="/" className="relative block w-32 h-8 flex flex-shrink-0 mb-6" aria-label="DDANG 홈으로 이동">
        <img src="https://c.animaapp.com/vpqlbV8X/img/ddang.svg" alt="DDANG" className="w-full h-full object-contain" />
      </a>

      <div className="bg-white p-10 md:p-14 border border-gray-200 shadow-sm w-full max-w-[460px]">
        <h2 className="text-xl font-bold mb-6 text-center text-[#333]">비밀번호 재설정</h2>

        {/* 탭 선택 */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => { setTab("email"); setIsVerified(false); setMessage(""); }}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === "email" ? "border-b-2 border-[#333] text-[#333]" : "text-gray-400 hover:text-gray-600"}`}
          >
            이메일로 찾기
          </button>
          <button
            onClick={() => { setTab("phone"); setIsVerified(false); setMessage(""); }}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === "phone" ? "border-b-2 border-[#333] text-[#333]" : "text-gray-400 hover:text-gray-600"}`}
          >
            휴대폰으로 찾기
          </button>
        </div>

        <div className="flex flex-col gap-4">

          {/* 1단계: 정보 입력 및 인증 */}
          <div className="flex flex-col gap-3">
            {!isVerified && (
              <>
                <div className="flex gap-2">
                  {tab === "email" ? (
                    <input
                      type="email"
                      placeholder="가입한 이메일"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 min-w-0 px-4 py-3 border border-gray-300 rounded-[4px] focus:outline-none"
                    />
                  ) : (
                    <input
                      type="text"
                      placeholder="가입한 휴대전화번호 (숫자만)"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                      className="flex-1 min-w-0 px-4 py-3 border border-gray-300 rounded-[4px] focus:outline-none"
                    />
                  )}
                  <button onClick={sendCode} className="px-4 py-3 bg-[#333] text-white text-sm rounded-[4px] whitespace-nowrap">
                    인증번호 발송
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="인증번호 입력"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="flex-1 min-w-0 px-4 py-3 border border-gray-300 rounded-[4px] focus:outline-none"
                  />
                  <button onClick={verifyCode} className="px-4 py-3 border border-gray-300 text-[#333] text-sm rounded-[4px] hover:bg-gray-50 whitespace-nowrap">
                    확인
                  </button>
                </div>
              </>
            )}

            {/* 인증 완료시 읽기 전용으로 표시 */}
            {isVerified && (
              <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-[4px] text-gray-600">
                {tab === "email" ? email : phone} <span className="text-green-600 text-sm ml-2">✓ 인증완료</span>
              </div>
            )}
          </div>

          {/* 2단계: 본인 확인(이름) 및 새 비밀번호 (인증 후 표시) */}
          {isVerified && (
            <form onSubmit={handleReset} className="flex flex-col gap-3 animation-fade-in">
              <div className="flex flex-col gap-1">
                <input
                  type="text"
                  placeholder="가입한 이름 (본인 확인용)"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-[4px] focus:outline-none"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <input
                  type="password"
                  placeholder="새 비밀번호 (8자리 이상, 특수문자)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-[4px] focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full text-white font-bold py-4 mt-2 hover:bg-[#333] transition-colors flex justify-center items-center rounded-[4px] bg-gray-500"
              >
                비밀번호 변경하기
              </button>
            </form>
          )}
        </div>

        {message && (
          <p className={`mt-4 text-sm text-center ${messageType === "success" ? "text-green-600" : messageType === "error" ? "text-[#ff4d4f]" : "text-gray-600"}`}>
            {message}
          </p>
        )}

        <div className="flex justify-center items-center gap-4 mt-8 text-sm text-gray-400">
          <span className="cursor-pointer hover:text-gray-600" onClick={() => navigate("/login")}>로그인</span>
          <span className="w-[1px] h-3 bg-gray-300"></span>
          <span className="cursor-pointer hover:text-gray-600" onClick={() => navigate("/find-email")}>이메일 찾기</span>
          <span className="w-[1px] h-3 bg-gray-300"></span>
          <span className="cursor-pointer hover:text-gray-600" onClick={() => navigate("/signup")}>회원가입</span>
        </div>
      </div>

      <div className="mt-8 text-xs text-gray-400">
        &copy; DDAUCTION Corp.
      </div>
    </div>
  );
}
