import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getWinningInfo, preparePayment, completePayment } from "../services/api";
import type { WinningInfo } from "../types/types";

//  PortOne 타입 선언
declare global {
  interface Window {
    IMP?: {
      init: (impCode: string) => void;
      request_pay: (
        params: {
          pg: string;
          pay_method: string;
          merchant_uid: string;
          name: string;
          amount: number;
          buyer_email: string;
          buyer_name: string;
          buyer_tel: string;
          buyer_addr?: string;
          buyer_postcode?: string;
        },
        callback: (response: {
          success: boolean;
          imp_uid?: string;
          merchant_uid?: string;
          error_msg?: string;
        }) => void
      ) => void;
    };
  }
}

export default function PaymentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = Number(searchParams.get("productId"));

  const [winningInfo, setWinningInfo] = useState<WinningInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // 배송지 정보
  const [address, setAddress] = useState("");
  const [postcode, setPostcode] = useState("");
  const [phone, setPhone] = useState("");

  // 결제 수단
  const [paymentMethod, setPaymentMethod] = useState("card");

  useEffect(() => {
    if (!productId || isNaN(productId)) {
      alert("잘못된 접근입니다.");
      navigate("/");
      return;
    }

    fetchWinningInfo();
  }, [productId, navigate]);

  // ✅ PortOne 스크립트 로드
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.iamport.kr/v1/iamport.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const fetchWinningInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("로그인이 필요합니다.");
        navigate("/login");
        return;
      }

      // ✅ API 함수 사용
      const data = await getWinningInfo(productId);
      setWinningInfo(data);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "낙찰 정보 조회 중 오류가 발생했습니다.");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!winningInfo) return;

    // 필수 입력 검증
    if (!address.trim()) {
      alert("배송지를 입력해주세요.");
      return;
    }
    if (!phone.trim()) {
      alert("전화번호를 입력해주세요.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("로그인이 필요합니다.");
        navigate("/login");
        return;
      }

      // 1️⃣ 결제 준비 (✅ API 함수 사용)
      const prepareData = await preparePayment(productId);

      // 2️⃣ PortOne 결제창 호출
      if (!window.IMP) {
        alert("결제 모듈 로딩 중입니다. 잠시 후 다시 시도해주세요.");
        return;
      }

      window.IMP.init(prepareData.impCode);

      window.IMP.request_pay(
        {
          pg: "html5_inicis",
          pay_method: paymentMethod,
          merchant_uid: prepareData.merchantUid,
          name: prepareData.name,
          amount: prepareData.amount,
          buyer_email: prepareData.buyerEmail,
          buyer_name: prepareData.buyerName,
          buyer_tel: phone,
          buyer_addr: address,
          buyer_postcode: postcode,
        },
        async (response) => {
          if (response.success && response.imp_uid) {
            try {
              //  결제 완료 검증 ( API 함수 사용)
              await completePayment({
                imp_uid: response.imp_uid,
                productId: productId,
                merchant_uid: response.merchant_uid!,
              });

              alert("결제가 완료되었습니다!");
              navigate(`/products/${productId}`);
            } catch (err) {
              alert(err instanceof Error ? err.message : "결제 검증 실패");
            }
          } else {
            alert("결제 실패: " + (response.error_msg || "알 수 없는 오류"));
          }
        }
      );
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "결제 처리 중 오류가 발생했습니다.");
    }
  };

  if (loading) {
    return (
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          padding: "20px",
          textAlign: "center",
        }}
      >
        <p>불러오는 중...</p>
      </div>
    );
  }

  if (!winningInfo) {
    return (
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          padding: "20px",
          textAlign: "center",
        }}
      >
        <p>낙찰 정보를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <h1 style={{ marginBottom: "30px", fontSize: "2rem", fontWeight: "bold" }}>
        결제하기
      </h1>

      {/* 주문 상품 */}
      <section
        style={{
          marginBottom: "30px",
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "20px",
        }}
      >
        <h2 style={{ marginBottom: "15px", fontSize: "1.3rem" }}>주문 상품</h2>
        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          {winningInfo.productImage && (
            <img
              src={winningInfo.productImage}
              alt={winningInfo.productTitle}
              style={{
                width: "120px",
                height: "120px",
                objectFit: "cover",
                borderRadius: "8px",
              }}
            />
          )}
          <div>
            <p style={{ fontSize: "1.1rem", fontWeight: "bold" }}>
              {winningInfo.productTitle}
            </p>
            <p style={{ color: "#666", marginTop: "8px" }}>
              판매자: {winningInfo.sellerName}
            </p>
            <p
              style={{
                fontSize: "1.3rem",
                fontWeight: "bold",
                color: "#ff6600",
                marginTop: "10px",
              }}
            >
              {winningInfo.bidPrice.toLocaleString()}원
            </p>
          </div>
        </div>
      </section>

      {/* 배송지 정보 */}
      <section
        style={{
          marginBottom: "30px",
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "20px",
        }}
      >
        <h2 style={{ marginBottom: "15px", fontSize: "1.3rem" }}>배송지 정보</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <input
            type="text"
            placeholder="우편번호"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            style={{
              padding: "12px",
              border: "1px solid #ddd",
              borderRadius: "6px",
              fontSize: "1rem",
            }}
          />
          <input
            type="text"
            placeholder="주소 *"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            style={{
              padding: "12px",
              border: "1px solid #ddd",
              borderRadius: "6px",
              fontSize: "1rem",
            }}
            required
          />
          <input
            type="tel"
            placeholder="전화번호 *"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{
              padding: "12px",
              border: "1px solid #ddd",
              borderRadius: "6px",
              fontSize: "1rem",
            }}
            required
          />
        </div>
      </section>

      {/* 결제 수단 */}
      <section
        style={{
          marginBottom: "30px",
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "20px",
        }}
      >
        <h2 style={{ marginBottom: "15px", fontSize: "1.3rem" }}>결제 수단</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="radio"
              value="card"
              checked={paymentMethod === "card"}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            <span>신용카드</span>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="radio"
              value="vbank"
              checked={paymentMethod === "vbank"}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            <span>가상계좌</span>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="radio"
              value="trans"
              checked={paymentMethod === "trans"}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            <span>실시간 계좌이체</span>
          </label>
        </div>
      </section>

      {/* 최종 결제 금액 */}
      <section
        style={{
          marginBottom: "30px",
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "20px",
          backgroundColor: "#f9f9f9",
        }}
      >
        <h2 style={{ marginBottom: "15px", fontSize: "1.3rem" }}>
          최종 결제 금액
        </h2>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "1.1rem",
            marginBottom: "10px",
          }}
        >
          <span>낙찰가</span>
          <span>{winningInfo.bidPrice.toLocaleString()}원</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "1.1rem",
            marginBottom: "10px",
          }}
        >
          <span>배송비</span>
          <span>무료</span>
        </div>
        <hr style={{ margin: "15px 0", border: "none", borderTop: "1px solid #ddd" }} />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "1.5rem",
            fontWeight: "bold",
            color: "#ff6600",
          }}
        >
          <span>총 결제 금액</span>
          <span>{winningInfo.bidPrice.toLocaleString()}원</span>
        </div>
      </section>

      {/* 결제 버튼 */}
      <button
        onClick={handlePayment}
        style={{
          width: "100%",
          padding: "18px",
          fontSize: "1.2rem",
          fontWeight: "bold",
          backgroundColor: "#ff6600",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        {winningInfo.bidPrice.toLocaleString()}원 결제하기
      </button> 
    </div>
  );
}