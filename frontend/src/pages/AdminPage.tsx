// src/pages/AdminPage.tsx
import type { User } from "../types/types";

type Props = {
  user: User | null;
};

export default function AdminPage({ user }: Props) {
  if (!user) {
    return (
      <div style={{ padding: "20px" }}>
        <p>로그인이 필요합니다.</p>
      </div>
    );
  }

  if (user.role !== "ADMIN") {
    return (
      <div style={{ padding: "20px" }}>
        <p>접근 권한이 없습니다. 관리자만 접근 가능합니다.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>관리자 페이지</h2>
      <p>환영합니다, {user.nickName} 님</p>
      <p>여기는 기능이 없는 더미 페이지입니다.</p>
    </div>
  );
}
