import { useState } from "react";


export default function PaymentPage() {
   // ← 컴포넌트 내부에서 호출
  const [useRecentAddress, setUseRecentAddress] = useState(true);
  const [useRecentPayment, setUseRecentPayment] = useState(true);

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <h1 style={{ marginBottom: "20px" }}>결제 페이지</h1>

      {/* 주문 정보 */}
      <section style={{ marginBottom: "30px" }}>
        <h2>주문 정보</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <input type="text" placeholder="주문자" />
          <input type="email" placeholder="이메일" />
          <input type="tel" placeholder="일반전화" />
          <input type="tel" placeholder="휴대전화" />
          <input type="text" placeholder="주소" />
        </div>
      </section>

      {/* 배송지 선택 */}
      <section style={{ marginBottom: "30px" }}>
        <h2>배송지</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <label>
            <input
              type="radio"
              checked={useRecentAddress}
              onChange={() => setUseRecentAddress(true)}
            />
            최근 배송지 사용
          </label>
          <label>
            <input
              type="radio"
              checked={!useRecentAddress}
              onChange={() => setUseRecentAddress(false)}
            />
            직접 입력
          </label>
          {!useRecentAddress && <input type="text" placeholder="배송지 입력" />}
        </div>
      </section>

      {/* 주문 상품 */}
      <section style={{ marginBottom: "30px" }}>
        <h2>주문 상품</h2>
        <div style={{ border: "1px solid #ccc", padding: "10px" }}>
          <p>상품명: 낙찰받은 상품 예시</p>
          <p>가격: 100,000원</p>
          <p>수량: 1개</p>
        </div>
      </section>

      {/* 할인 / 부가 결제 */}
      <section style={{ marginBottom: "30px" }}>
        <h2>할인 / 부가 결제</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <input type="number" placeholder="적립금 사용" />
          <p>적용 금액: 0원</p>
        </div>
      </section>

      {/* 결제 정보 */}
      <section style={{ marginBottom: "30px" }}>
        <h2>결제 정보</h2>
        <div style={{ border: "1px solid #ccc", padding: "10px", display: "flex", flexDirection: "column", gap: "5px" }}>
          <p>주문상품: 100,000원</p>
          <p>배송비: 3,000원</p>
          <p>할인/부가결제: 0원</p>
          <p><strong>최종 결제 금액: 103,000원</strong></p>
        </div>
      </section>

      {/* 결제 수단 */}
      <section style={{ marginBottom: "30px" }}>
        <h2>결제 수단</h2>
        <label>
          <input
            type="radio"
            checked={useRecentPayment}
            onChange={() => setUseRecentPayment(true)}
          />
          최근 결제 수단 사용
        </label>
        <label>
          <input
            type="radio"
            checked={!useRecentPayment}
            onChange={() => setUseRecentPayment(false)}
          />
          다른 결제 수단 선택
        </label>
        {!useRecentPayment && <input type="text" placeholder="카드/계좌 정보 입력" />}
      </section>

      {/* 결제 버튼 */}
      <button
        style={{
          width: "100%",
          padding: "15px",
          fontSize: "18px",
          backgroundColor: "#ff6600",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
        }}
        onClick={() => alert("결제 처리 (프론트 UI)") }
      >
        103,000원 결제하기
      </button>
    </div>
  );
}
