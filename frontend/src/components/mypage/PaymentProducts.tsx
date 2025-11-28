import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../common/api";
import type { Product } from "../../common/types";

type Props = {
  token: string;
};

// Product 타입 확장: 결제 금액 필드 추가
interface PaymentProduct extends Product {
  paymentAmount?: number | null;
}

export default function PaymentProducts({ token }: Props) {
  const [products, setProducts] = useState<PaymentProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentProducts = async () => {
      try {
        // Backend에서 로그인 사용자 기준 구매 완료 상품 조회 URL
        const res = await fetch(`${API_BASE_URL}/api/products/purchases`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          if (res.status === 401) throw new Error("로그인이 필요합니다.");
          throw new Error("결제 완료 상품 조회 실패");
        }

        // Product에 paymentAmount 필드가 포함되어 내려온다고 가정
        const data: PaymentProduct[] = await res.json();
        setProducts(data);
      } catch (err) {
        console.error(err);
        alert(err instanceof Error ? err.message : "서버 오류");
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentProducts();
  }, [token]);

  if (loading) return <p>불러오는 중...</p>;
  if (products.length === 0) return <p>결제 완료 상품이 없습니다.</p>;

  return (
    <div>
      {products.map((p) => (
        <div
          key={p.productId}
          style={{
            display: "flex",
            gap: "20px",
            padding: "10px",
            borderBottom: "1px solid #ddd",
          }}
        >
          {p.images?.[0]?.imagePath && (
            <img
              src={`${API_BASE_URL}${p.images[0].imagePath}`}
              alt={p.title}
              style={{ width: "80px", height: "80px", objectFit: "cover" }}
            />
          )}
          <div>
            <p style={{ fontWeight: "bold" }}>{p.title}</p>
            <p>
              가격:{" "}
              {p.paymentAmount?.toLocaleString() ??
                p.startingPrice?.toLocaleString() ??
                "정보 없음"}{" "}
              원
            </p>
            <p>상태: {p.productStatus}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
