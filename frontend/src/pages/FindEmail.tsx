import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../common/api";

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
      const res = await fetch(`${API_BASE_URL}/api/auth/email-find`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, userName }),
      });

      if (res.ok) {
        const data = await res.json();
        setEmail(data.email);
        setMessage("가입된 이메일이 확인되었습니다.");
      } else {
        const data = await res.text();
        setMessage(data || "입력한 정보와 일치하는 사용자가 없습니다.");
      }
    } catch (err) {
      console.error("이메일 찾기 오류:", err);
      setMessage("이메일 찾기에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>이메일 찾기</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="가입한 전화번호를 입력하세요"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input"
            required
          />
          <input
            type="text"
            placeholder="가입한 이름을 입력하세요"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="input mt-2"
            required
          />
          <button type="submit" className="btn-submit mt-2">
            이메일 찾기
          </button>
        </form>

        {message && <p className="mt-4">{message}</p>}
        {email && (
          <p className="mt-2">
            확인된 이메일: <strong>{email}</strong>
          </p>
        )}

        <button
          onClick={() => navigate("/login")}
          className="auth-link-btn mt-2"
        >
          로그인으로 돌아가기
        </button>
      </div>
    </div>
  );
}
