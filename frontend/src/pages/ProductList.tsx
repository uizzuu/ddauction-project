import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Product } from "../types/types";
import { API_BASE_URL } from "../services/api";

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 1; // 한 페이지당 보여줄 상품 개수
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products`);
        if (res.ok) {
          const data: Product[] = await res.json();
          // 진행 중인 경매만 필터링
          const now = new Date();
          const activeProducts = data.filter(
            (p) =>
              p.productStatus === "ACTIVE" &&
              new Date(p.auctionEndTime).getTime() > now.getTime()
          );
          setProducts(activeProducts);
        }
      } catch (err) {
        console.error("서버 연결 실패", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const totalPages = Math.ceil(products.length / pageSize);
  const currentProducts = products.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );

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

  const goPrevPage = () => {
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };

  const goNextPage = () => {
    if (currentPage + 1 < totalPages) setCurrentPage(currentPage + 1);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div>
        <h2 className="title-32 mb-1rem">진행중인 경매</h2>

        {products.length === 0 ? (
          <div className="empty-state">
            <p>진행 중인 경매가 없습니다</p>
          </div>
        ) : (
          <>
            <div className="product-grid">
              {currentProducts.map((product) => (
                <div
                  key={product.productId}
                  className="product-card"
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/products/${product.productId}`)}
                >
                  <div className="product-image height-220">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.title} />
                    ) : (
                      <div className="no-image-txt">이미지 없음</div>
                    )}
                  </div>

                  <div className="product-info">
                    <h3 className="title-24 mb-10 text-nowrap color-333 text-ellipsis">
                      {product.title}
                    </h3>
                    <p className="product-price">{formatPrice(product.startingPrice)}</p>
                    <p className="product-time">종료: {formatDate(product.auctionEndTime)}</p>
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

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="pagination flex-box gap-8" style={{ marginTop: "2rem" }}>
                <button onClick={goPrevPage} disabled={currentPage === 0}>
                  이전
                </button>

                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={i === currentPage ? "active-page" : ""}
                  >
                    {i + 1}
                  </button>
                ))}

                <button onClick={goNextPage} disabled={currentPage + 1 === totalPages}>
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
