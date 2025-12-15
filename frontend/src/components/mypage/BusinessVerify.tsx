// BusinessVerify.tsx
import { useState } from "react";
import * as API from "../../common/api";
// 💡 공통 타입 파일에서 BusinessVerifyResponse 인터페이스를 import 합니다.
// (경로는 프로젝트 구조에 맞게 수정해주세요. 예를 들어, '../../types' 등)
import type { BusinessVerifyResponse } from '../../common/types';


// 💡 1. API 응답 타입 정의 (로컬 정의 삭제)

type Props = {
  userId: number;
  onVerified: (businessNumber: string) => void; // 인증 완료 후 번호 전달
  onCancel?: () => void;           // 선택적 취소 콜백
};

// ⭐️⭐️ PropsWithLogout 대신, onLogout이 필요 없으므로 기본 Props 타입만 사용합니다. ⭐️⭐️
export default function BusinessVerify({ userId, onVerified, onCancel }: Props) {
  const [businessNumber, setBusinessNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async () => {
    if (!businessNumber) return;

    setLoading(true);
    setError("");
    try {
      // 2. 💡 API 호출 시 반환 타입을 import한 타입으로 지정
      const result: BusinessVerifyResponse = await API.verifyBusiness(userId, businessNumber);

      if (result.valid) { // valid가 true면 성공
        onVerified(businessNumber);

        // ⭐️⭐️⭐️ 핵심 로직: 토큰 즉시 갱신 (A 방식) ⭐️⭐️⭐️

        if (result.newToken) {
          // 1. 로컬 저장소의 기존 토큰을 새 토큰으로 덮어씁니다.
          localStorage.setItem('token', result.newToken);

          // 💡 갱신 성공 흐름 시각화: 

          alert("✅ 사업자 인증 완료! 스토어 물품 등록이 허용되었습니다.");
        } else {
          // 백엔드 설정 오류 등에 대비
          alert("사업자 인증 완료! 하지만 토큰 갱신 정보가 누락되었습니다. (문제가 있다면 재로그인 필요)");
        }

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