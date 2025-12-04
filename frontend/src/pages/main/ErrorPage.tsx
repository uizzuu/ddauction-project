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
    <div className="container">
      <div className="flex-column flex-center mt-100">
        {/* 에러 코드 */}
        <div
          style={{
            fontSize: "72px",
            fontWeight: "700",
            color: "#b17576",
            marginBottom: "20px",
            lineHeight: "1",
          }}
        >
          {error.code}
        </div>

        {/* 에러 제목 */}
        <h1
          style={{
            fontSize: "28px",
            fontWeight: "700",
            color: "#333",
            marginBottom: "12px",
          }}
        >
          {error.title}
        </h1>

        {/* 에러 설명 */}
        <p
          style={{
            fontSize: "16px",
            color: "#777",
            marginBottom: "40px",
            lineHeight: "1.6",
          }}
        >
          {error.description}
        </p>

        {/* 버튼 그룹 */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={handleGoHome}
            style={{
              padding: "18px 60px",
              fontSize: "16px",
              fontWeight: "600",
              backgroundColor: "#b17576",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "all 0.2s",
              flex: "1",
              minWidth: "150px",
              whiteSpace: "nowrap"
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = "#8c5d5e";
              (e.target as HTMLButtonElement).style.transform =
                "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = "#b17576";
              (e.target as HTMLButtonElement).style.transform = "translateY(0)";
            }}
          >
            🏠 홈으로
          </button>

          <button
            onClick={handleRefresh}
            style={{
              padding: "18px 60px",
              fontSize: "16px",
              fontWeight: "600",
              backgroundColor: "#f0f0f0",
              color: "#333",
              border: "1px solid #ddd",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "all 0.2s",
              flex: "1",
              minWidth: "150px",
              whiteSpace: "nowrap"
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = "#e8e8e8";
              (e.target as HTMLButtonElement).style.transform =
                "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = "#f0f0f0";
              (e.target as HTMLButtonElement).style.transform = "translateY(0)";
            }}
          >
            🔄 새로고침
          </button>
        </div>

        {/* 추가 정보 */}
        <div
          style={{
            marginTop: "40px",
            paddingTop: "24px",
            borderTop: "1px solid #eee",
          }}
        >
          <p style={{ fontSize: "14px", color: "#aaa", margin: "0" }}>
            문제가 지속되면 고객 지원팀에 문의해주세요.
          </p>
        </div>
      </div>
    </div>
  );
}
