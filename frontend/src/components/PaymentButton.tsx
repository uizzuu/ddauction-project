import { useState } from "react";
import type { Product, User } from "../types/types";
import { preparePayment, completePayment } from "../services/api";

// PortOne 전역 타입 선언
declare global {
  interface Window {
    IMP?: {
      init: (code: string) => void;
      request_pay: (
        data: {
          pg: string;
          pay_method: string;
          merchant_uid: string;
          name: string;
          amount: number;
          buyer_email: string;
          buyer_name: string;
          buyer_tel: string;
        },
        callback: (response: {
          success: boolean;
          error_msg?: string;
          imp_uid?: string;
          merchant_uid?: string;
        }) => void
      ) => void;
    };
  }
}

type Props = {
  product: Product;
  user: User;
  isWinner: boolean; // 최고낙찰자 여부 (서버 기준)
  onPaymentComplete?: () => void;
};

export default function PaymentButton({ product, user, isWinner, onPaymentComplete }: Props) {
  const [loading, setLoading] = useState(false);

  const isPaid = ["COMPLETED", "PAID", "SUCCESS"].includes((product as any).paymentStatus ?? "");

  // 결제 처리 함수
  // const handlePayment = async () => {
  //   if (!window.IMP) {
  //     alert("결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
  //     return;
  //   }

  //   setLoading(true);
  //   try {
  //     // 1) 결제 정보 준비 (JWT는 services/api에서 자동 첨부)
  //     const paymentInfo = await preparePayment(product.productId);

  //     // 1-1) PortOne 초기화 보장 (멱등)
  //     try {
  //       const code = (import.meta as any).env?.VITE_PORTONE_CODE as string | undefined;
  //       if (window.IMP && typeof window.IMP.init === "function" && code) {
  //         window.IMP.init(code);
  //       }
  //     } catch (e) {
  //       console.warn("IMP.init 실패(무시 가능):", e);
  //     }

  //     // 2) 결제창 호출
  //     try {
  //       window.IMP.request_pay(
  //         {
  //           pg: "html5_inicis.INIpayTest",
  //           pay_method: "card",
  //           merchant_uid: paymentInfo.merchantUid,
  //           name: paymentInfo.name,
  //           amount: paymentInfo.amount,
  //           buyer_email: paymentInfo.buyerEmail,
  //           buyer_name: paymentInfo.buyerName,
  //           buyer_tel: paymentInfo.buyerTel,
  //         },
  //         async (response) => {
  //           // 3) 결제 완료 콜백
  //           setLoading(false);

  //           if (response.success && response.imp_uid && response.merchant_uid) {
  //             try {
  //               // 4) 서버 검증
  //               const result = await completePayment(response.imp_uid, product.productId, response.merchant_uid);

  //               if (result?.code === 0 || result?.success === true) {
  //                 alert("결제가 완료되었습니다!");
  //                 onPaymentComplete?.();
  //               } else {
  //                 alert(`결제 실패: ${result?.message ?? "서버 응답을 확인하세요."}`);
  //               }
  //             } catch (err) {
  //               console.error("결제 검증 실패:", err);
  //               alert("결제 검증 중 오류가 발생했습니다.");
  //             }
  //           } else {
  //             alert(`결제 실패: ${response.error_msg || "알 수 없는 오류"}`);
  //           }
  //         }
  //       );
  //     } catch (e) {
  //       console.error("결제창 호출 실패:", e);
  //       setLoading(false);
  //       alert("결제창 호출 중 오류가 발생했습니다.");
  //     }
  //   } catch (err) {
  //     console.error("결제 준비 실패:", err);
  //     alert("결제 준비 중 오류가 발생했습니다.");
  //     setLoading(false);
  //   }
  // };

  // 결제 처리 함수
const handlePayment = async () => {
  console.log("=== 결제 프로세스 시작 ===");
  console.log("Product:", product);
  console.log("User:", user);
  
  if (!window.IMP) {
    console.error(" window.IMP가 없습니다!");
    alert("결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
    return;
  }
  console.log(" window.IMP 로드 완료");

  setLoading(true);
  try {
    // 1) 결제 정보 준비 (JWT는 services/api에서 자동 첨부)
    console.log(" preparePayment 호출...");
    const paymentInfo = await preparePayment(product.productId, user.userId);
    console.log(" 결제 정보 받음:", paymentInfo);

    // 1-1) PortOne 초기화 보장 (멱등)
    try {
      const code = (import.meta as any).env?.VITE_PORTONE_CODE as string | undefined;
      console.log("PortOne 코드:", code ? "있음" : " 없음!");
      
      if (window.IMP && typeof window.IMP.init === "function" && code) {
        window.IMP.init(code);
        console.log(" IMP.init 호출 완료");
      }
    } catch (e) {
      console.warn("IMP.init 실패(무시 가능):", e);
    }

    // 2) 결제창 호출
    try {
      const paymentData = {
        pg: "html5_inicis.INIpayTest",
        pay_method: "card",
        merchant_uid: paymentInfo.merchantUid,
        name: paymentInfo.name,
        amount: paymentInfo.amount,
        buyer_email: paymentInfo.buyerEmail,
        buyer_name: paymentInfo.buyerName,
        buyer_tel: paymentInfo.buyerTel,
      };
      
      console.log(" 결제창 호출 데이터:", paymentData);
      
      window.IMP.request_pay(
        paymentData,
        async (response) => {
          console.log("결제창 응답:", response);
          
          // 3) 결제 완료 콜백
          setLoading(false);

          if (response.success && response.imp_uid && response.merchant_uid) {
            console.log(" 결제 성공! 서버 검증 시작...");
            try {
              // 4) 서버 검증
              const result = await completePayment(response.imp_uid, product.productId, response.merchant_uid);
              console.log("서버 검증 결과:", result);

              if (result?.code === 0 || result?.success === true) {
                alert("결제가 완료되었습니다!");
                onPaymentComplete?.();
              } else {
                alert(`결제 실패: ${result?.message ?? "서버 응답을 확인하세요."}`);
              }
            } catch (err) {
              console.error(" 결제 검증 실패:", err);
              alert("결제 검증 중 오류가 발생했습니다.");
            }
          } else {
            console.error(" 결제 실패:", response.error_msg);
            alert(`결제 실패: ${response.error_msg || "알 수 없는 오류"}`);
          }
        }
      );
    } catch (e) {
      console.error(" 결제창 호출 실패:", e);
      setLoading(false);
      alert("결제창 호출 중 오류가 발생했습니다.");
    }
  } catch (err) {
    console.error(" 결제 준비 실패:", err);
    alert("결제 준비 중 오류가 발생했습니다.");
    setLoading(false);
  }
};

  // 이미 결제 완료된 경우
  if (isPaid) {
    return (
      <div
        style={{
          padding: "12px",
          backgroundColor: "#10b981",
          color: "white",
          borderRadius: "8px",
          textAlign: "center",
          fontWeight: "bold",
        }}
      >
        ✓ 결제 완료
      </div>
    );
  }

  // 최고낙찰자가 아니면 안내 표시
  if (!isWinner) {
    return (
      <div
        style={{
          padding: 12,
          borderRadius: 8,
          textAlign: "center",
          backgroundColor: "#fee2e2",
          color: "#b91c1c",
          fontWeight: 600,
        }}
      >
        최고낙찰자만 결제할 수 있습니다.
      </div>
    );
  }

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      style={{
        padding: "12px 24px",
        backgroundColor: loading ? "#9ca3af" : "#ef4444",
        color: "white",
        border: "none",
        borderRadius: "8px",
        fontSize: "16px",
        fontWeight: "bold",
        cursor: loading ? "not-allowed" : "pointer",
        width: "100%",
        transition: "all 0.2s",
      }}
    >
      {loading ? "처리 중..." : "💳 결제하기"}
    </button>
  );
}
