import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { resetPassword } from "../common/api";

export default function FindPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(""); // 전화번호
  const [userName, setUserName] = useState(""); // 실명
  const [newPassword, setNewPassword] = useState(""); // 새 비밀번호
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    try {
      await resetPassword({ email, phone, userName, newPassword });
      setMessage("비밀번호가 성공적으로 변경되었습니다.");
      // 필요 시 로그인 페이지로 자동 이동
      // navigate("/login");
    } catch (err: any) {
      console.error("비밀번호 찾기 오류:", err);
      setMessage(err.message || "비밀번호 찾기에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>비밀번호 재설정</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="가입한 이메일을 입력하세요"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            required
          />
          <input
            type="text"
            placeholder="가입한 전화번호를 입력하세요"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input mt-2"
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
          <input
            type="password"
            placeholder="새 비밀번호를 입력하세요"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="input mt-2"
            required
          />
          <button type="submit" className="btn-submit mt-2">
            비밀번호 재설정
          </button>
        </form>

        {message && <p className="mt-4">{message}</p>}

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
