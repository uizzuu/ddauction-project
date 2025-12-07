import { useNavigate, useLocation } from "react-router-dom";

export default function ErrorPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const getErrorInfo = () => {
    const searchParams = new URLSearchParams(location.search);
    const errorCode = searchParams.get("code") || "404";
    const errorMessage =
      searchParams.get("message") || "페이지를 찾을 수 없습니다";

    const errorDetails: Record<string, { title: string; description: string }> =
    {
      "404": {
        title: "페이지를 찾을 수 없습니다",
        description: "요청하신 페이지가 존재하지 않거나 삭제되었습니다.",
      },
      "500": {
        title: "서버 에러가 발생했습니다",
        description:
          "일시적인 서버 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
      },
      "403": {
        title: "접근 권한이 없습니다",
        description: "이 페이지에 접근할 권한이 없습니다.",
      },
      "502": {
        title: "게이트웨이 오류",
        description: "서버와의 통신 중 문제가 발생했습니다.",
      },
    };

    return {
      code: errorCode,
      title: errorDetails[errorCode]?.title || "오류가 발생했습니다",
      description: errorDetails[errorCode]?.description || errorMessage,
    };
  };

  const error = getErrorInfo();

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <div className="w-[1280px] mx-auto flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="text-center">
        {/* 에러 코드 */}
        <div className="text-[72px] font-bold text-[#111] mb-5 leading-none">
          {error.code}
        </div>

        {/* 에러 제목 */}
        <h1 className="text-[28px] font-bold text-[#333] mb-3">
          {error.title}
        </h1>

        {/* 에러 설명 */}
        <p className="text-[16px] text-[#777] mb-10 leading-relaxed">
          {error.description}
        </p>

        {/* 버튼 그룹 */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleGoHome}
            className="px-8 py-4 bg-[#111] text-white text-[16px] font-bold rounded hover:bg-[#333] transition-colors"
          >
            홈으로
          </button>

          <button
            onClick={handleRefresh}
            className="px-8 py-4 bg-gray-100 text-[#333] text-[16px] font-bold rounded hover:bg-gray-200 transition-colors"
          >
            새로고침
          </button>
        </div>

        {/* 추가 정보 */}
        <div className="mt-10 pt-6 border-t border-gray-100">
          <p className="text-[14px] text-[#aaa]">
            문제가 지속되면 고객 지원팀에 문의해주세요.
          </p>
        </div>
      </div>
    </div>
  );
}
