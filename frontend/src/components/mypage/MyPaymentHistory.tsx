import { useEffect, useState } from "react";
import * as API from "../../common/api";
import type { Product } from "../../common/types";

type Props = {
  token: string;
};

// Product 타입 확장: 결제 금액 필드 추가
interface PaymentProduct extends Product {
  paymentAmount?: number | null;
}

export default function MyPaymentHistory({ token }: Props) {
  const [products, setProducts] = useState<PaymentProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentProducts = async () => {
      try {
        const data = await API.getPaymentProducts();
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
              src={`${API.API_BASE_URL}${p.images[0].imagePath}`}
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
