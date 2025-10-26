import { useNavigate } from "react-router-dom";

export default function Main() {
  const navigate = useNavigate();

  return (
    <div className="main-container">
      <div className="main-content">
        <h1 className="title-56 mb-20 color-main">빠르고 확실한 경매</h1>
        <p className="text-24 mb-48 color-aaa">중고물품을 경매로 판매하고 구매하세요</p>

        <div className="main-actions">
          <button
            onClick={() => navigate("/register")}
            className="btn-primary btn-lg"
          >
            물품 등록
          </button>
          <button
            onClick={() => navigate("/auction")}
            className="btn-primary btn-lg"
          >
            경매 목록
          </button>
        </div>
      </div>
    </div>
  );
}
