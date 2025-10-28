// src/pages/OAuthCallback.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import type { User } from "../types/types";

type Props = {
  setUser: (user: User) => void;
};

export default function OAuthCallback({ setUser }: Props) {
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (!token) {
      alert("OAuth 로그인에 실패했습니다.");
      navigate("/login");
      return;
    }

    try {
      // ✅ 토큰 저장
      localStorage.setItem("token", token);

      // ✅ 토큰 디코딩 (App.tsx와 동일한 방식)
      const decoded = jwtDecode<{
        userId: number;
        userName: string;
        nickName: string;
        role?: "ADMIN" | "USER" | "BANNED";
      }>(token);

      // ✅ 전역 상태 업데이트
      setUser({
        userId: decoded.userId,
        userName: decoded.userName,
        nickName: decoded.nickName,
        role: decoded.role,
      });

      // ✅ 메인 페이지로 이동
      navigate("/");
    } catch (err) {
      console.error("JWT 파싱 실패", err);
      localStorage.removeItem("token");
      navigate("/login");
    }
  }, [navigate, setUser]);

  return (
    <div style={{ textAlign: "center", paddingTop: "100px" }}>
      <h3>소셜 로그인 처리 중입니다...</h3>
      <p>잠시만 기다려 주세요.</p>
    </div>
  );
}
