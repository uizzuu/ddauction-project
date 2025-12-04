// pages/VerifyPage.tsx
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

// 백엔드 verify-email 호출 함수 (쿼리 파라미터 방식)
async function verifyEmail(email: string, code: string) {
  return axios.post(
    `/api/auth/verify-email?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`
  );
}

export default function VerifyPage() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const email = params.get("email");
    const code = params.get("code");

    if (!email || !code) {
      alert("이메일 인증 정보가 없습니다.");
      navigate("/signup");
      return;
    }

    verifyEmail(email, code)
      .then(() => {
        alert("이메일 인증 완료! 이제 회원가입을 진행할 수 있습니다.");
        navigate("/signup");
      })
      .catch((err: any) => {
        console.error(err);
        const message =
          err.response?.data?.message || err.message || "인증 실패";
        alert("이메일 인증 실패: " + message);
        navigate("/signup");
      });
  }, [location, navigate]);

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      이메일 인증 중입니다...
      <br />
      잠시만 기다려주세요.
    </div>
  );
}
