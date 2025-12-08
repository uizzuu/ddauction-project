import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { findEmail } from "../../common/api";

export default function FindEmail() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState(""); // 전화번호
  const [userName, setUserName] = useState(""); // 실명
  const [email, setEmail] = useState(""); // 결과 이메일
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setEmail("");

    try {
      const foundEmail = await findEmail(phone, userName);
      setEmail(foundEmail);
      setMessage("가입된 이메일이 확인되었습니다.");
    } catch (err: any) {
      console.error("이메일 찾기 오류:", err);
      setMessage(err.message || "이메일 찾기에 실패했습니다. 잠시 후 다시 시도해주세요.");
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

      <div className="bg-white p-10 md:p-14 border border-gray-200 shadow-sm w-full max-w-[460px]">
        <h2 className="text-xl font-bold mb-6 text-center text-[#333]">이메일 찾기</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <input
              type="text"
              placeholder="가입한 전화번호를 입력하세요"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-[4px] focus:outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111] transition-colors"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <input
              type="text"
              placeholder="가입한 이름을 입력하세요"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-[4px] focus:outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111] transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full text-white font-bold py-4 mt-4 hover:bg-[#333] transition-colors flex justify-center items-center rounded-[4px] bg-gray-300"
          >
            이메일 찾기
          </button>
        </form>

        {message && <p className="mt-4 text-sm text-center text-[#ff4d4f]">{message}</p>}
        {email && (
          // Success Message (Overrides red message color above if success)
          <div className="mt-4 p-4 bg-gray-50 text-center rounded border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">확인된 이메일</p>
            <strong className="text-lg text-[#333]">{email}</strong>
          </div>
        )}

        <div className="flex justify-center items-center gap-4 mt-8 text-sm text-gray-400">
          <span className="cursor-pointer hover:text-gray-600" onClick={() => navigate("/login")}>로그인</span>
          <span className="w-[1px] h-3 bg-gray-300"></span>
          <span className="cursor-pointer hover:text-gray-600" onClick={() => navigate("/find-password")}>비밀번호 찾기</span>
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
