import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { User } from "../../common/types";
import { fetchMe } from "../../common/api";

type Props = {
  setUser: (user: User) => void;
};

export default function OAuth2Redirect({ setUser }: Props) {
  const navigate = useNavigate();

  useEffect(() => {
    const handleOAuth2Redirect = async () => {
      try {
        // URL에서 파라미터 추출
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");
        const error = params.get("error");
        const message = params.get("message");

        console.log("✅ URL 확인: ", window.location.href);

        // 에러 처리 (정지된 계정 등)
        if (error) {
          console.error("❌ OAuth2 login error:", error, message);
          if (message && (message.includes("정지") || message.includes("제한"))) {
            alert(message);
          } else if (message) {
            alert(message);
          }
          navigate("/login");
          return;
        }

        if (!token) {
          console.error("❌ Token not found in URL");
          navigate("/login?error=no_token");
          return;
        }

        console.log("✅ OAuth2 토큰 받음:", token.substring(0, 20) + "...");

        // localStorage에 토큰 저장
        localStorage.setItem("token", token);

        // 사용자 정보 조회
        console.log("🔄 사용자 정보 fetchMe 호출");
        const userData = await fetchMe(token);

        console.log("✅ 사용자 정보 조회 성공:", userData);
        setUser(userData);

        navigate("/");
      } catch (error) {
        console.error("❌ OAuth2 리다이렉트 처리 중 오류:", error);
        navigate("/login?error=oauth_error");
      }
    };

    handleOAuth2Redirect();
  }, [navigate, setUser]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        fontSize: "18px",
      }}
    >
      <p>OAuth 로그인 처리 중...</p>
    </div>
  );
}
