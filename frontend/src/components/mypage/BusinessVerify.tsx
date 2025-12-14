// BusinessVerify.tsx
import { useState } from "react";
import * as API from "../../common/api";

type Props = {
  userId: number;
  onVerified: (businessNumber: string) => void; // 인증 완료 후 번호 전달
  onCancel?: () => void;           // 선택적 취소 콜백
};

// 로그아웃 기능을 포함하기 위해 Props 타입을 확장합니다.
type PropsWithLogout = Props & {
  onLogout: () => void; // 로그아웃을 처리하고 로그인 페이지로 이동시키는 함수
};

// ⭐️⭐️ PropsWithLogout 타입을 사용하고 onLogout을 props로 받도록 수정 ⭐️⭐️
export default function BusinessVerify({ userId, onVerified, onCancel, onLogout }: PropsWithLogout) {
  const [businessNumber, setBusinessNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async () => {
    if (!businessNumber) return;

    setLoading(true);
    setError("");
    try {
      const result: { businessNumber: string; valid: boolean } = await API.verifyBusiness(userId, businessNumber);

      if (result.valid) { // valid가 true면 성공
        onVerified(businessNumber);

        // ⭐️⭐️⭐️ 토큰 삭제 및 재로그인 유도 로직 (B 방식) ⭐️⭐️⭐️
        alert("사업자 인증 완료! 최신 권한 적용을 위해 다시 로그인합니다.");

        // 1. 로컬 저장소에서 기존 토큰을 삭제 (인증 정보 무효화)
        localStorage.removeItem('accessToken');

        // 2. 로그아웃 상태로 전환하고 로그인 페이지로 이동
        onLogout();
        // 이 함수 호출 후 사용자는 로그인 페이지로 리디렉션되며, 
        // 새로 로그인할 때 DB의 최신 정보(사업자 번호)가 담긴 토큰을 받게 됩니다.

      } else { // valid가 false면 실패
        setError("사업자 번호 인증 실패");
      }
    } catch (err: any) {
      setError(err.message || "인증 중 오류 발생");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50 space-y-2">
      <label className="block text-sm font-medium text-gray-700">사업자 등록번호</label>
      <input
        type="text"
        value={businessNumber}
        onChange={(e) => setBusinessNumber(e.target.value)}
        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleVerify}
          disabled={loading || !businessNumber}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
        >
          {loading ? "인증 중..." : "인증하기"}
        </button>
        <button
          onClick={() => onCancel?.()}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
        >
          취소
        </button>
      </div>
    </div>
  );
}