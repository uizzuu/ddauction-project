// BusinessVerify.tsx
import { useState } from "react";
import * as API from "../../common/api";

type Props = {
  userId: number;
  onVerified: (businessNumber: string) => void; // 인증 완료 후 번호 전달
  onCancel?: () => void;           // 선택적 취소 콜백
};

export default function BusinessVerify({ userId, onVerified, onCancel }: Props) {
  const [businessNumber, setBusinessNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async () => {
    setLoading(true);
    setError("");
    try {
      await API.verifyBusiness(userId, businessNumber); // DB에 저장
      onVerified(businessNumber); // 부모에게 번호 전달
      alert("사업자 인증 완료!");
    } catch (err: any) {
      setError(err.message || "인증 실패");
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
