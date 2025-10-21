import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Product } from "../types/types";
import { API_BASE_URL } from "../services/api";

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products`);
        if (res.ok) {
          const data: Product[] = await res.json();
          setProducts(data);
        }
      } catch (err) {
        console.error("서버 연결 실패", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const formatPrice = (price?: number) => {
    if (!price) return "가격 미정";
    return `${price.toLocaleString()}원`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}일 후`;
    if (hours > 0) return `${hours}시간 후`;
    return "곧 종료";
  };

  if (loading) {
    return (
      <div className="loading-container">
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="product-list-container">
      <div className="content-wrapper">
        <h2 className="page-title">진행중인 경매</h2>

        {products.length === 0 ? (
          <div className="empty-state">
            <p>진행 중인 경매가 없습니다</p>
          </div>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <div
                key={product.productId}
                className="product-card"
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/products/${product.productId}`)}
              >
                <div className="product-image">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.title} />
                  ) : (
                    <div className="no-image">이미지 없음</div>
                  )}
                </div>

                <div className="product-info">
                  <h3 className="product-title">{product.title}</h3>
                  {/* price → startingPrice */}
                  <p className="product-price">{formatPrice(product.startingPrice)}</p>
                  <p className="product-time">
                    종료: {formatDate(product.auctionEndTime)}
                  </p>
                  <button
                    className="btn-bid"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/products/${product.productId}`);
                    }}
                  >
                    입찰하기
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}