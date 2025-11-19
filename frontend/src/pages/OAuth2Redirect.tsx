import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { User } from "../types/types";

type Props = {
  setUser: (user: User) => void;
};

export default function OAuth2Redirect({ setUser }: Props) {
  const navigate = useNavigate();

  useEffect(() => {
    const handleOAuth2Redirect = async () => {
      try {
        // URL에서 token 파라미터 추출
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");

        if (!token) {
          console.error("Token not found in URL");
          navigate("/login?error=no_token");
          return;
        }

        console.log("✅ OAuth2 토큰 받음:", token.substring(0, 20) + "...");

        // localStorage에 토큰 저장
        localStorage.setItem("token", token);

        // 사용자 정보 조회
        const userResponse = await fetch("/api/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          console.log("✅ 사용자 정보 조회 성공:", userData);
          setUser(userData);
          navigate("/"); // 메인 페이지로 리다이렉트
        } else {
          console.error("사용자 정보 조회 실패");
          navigate("/login?error=user_info");
        }
      } catch (error) {
        console.error("OAuth2 리다이렉트 처리 중 오류:", error);
        navigate("/login?error=oauth_error");
      }
    };

    handleOAuth2Redirect();
  }, [navigate, setUser]);

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      fontSize: "18px",
    }}>
      <p>OAuth 로그인 처리 중...</p>
    </div>
  );
}