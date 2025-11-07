import type { Product } from "../../types/types";
import { API_BASE_URL } from "../../services/api";

type Props = {
  bookmarkedProducts: Product[];
  getCategoryName: (categoryId?: number) => string;
  goToProductDetail: (productId: number) => void;
};

export default function BookmarkedProducts({
  bookmarkedProducts,
  getCategoryName,
  goToProductDetail,
}: Props) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <div className="title-24 mb-10">찜한 상품</div>

      {bookmarkedProducts.length === 0 ? (
        <p>찜한 상품이 없습니다.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {bookmarkedProducts.map((product) => (
            <li
              key={product.productId}
              style={{
                marginBottom: "10px",
                border: "1px solid #ddd",
                padding: "15px",
                borderRadius: "8px",
                display: "flex",
                gap: "15px",
                alignItems: "flex-start",
              }}
            >
              {/* 이미지 박스 */}
              <div
                style={{
                  flexShrink: 0,
                  width: "150px",
                  height: "150px",
                  borderRadius: "6px",
                  backgroundColor: "#eee",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  cursor: "pointer",
                }}
                onClick={() => goToProductDetail(product.productId)}
              >
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0].imagePath}
                    alt={product.title}
                    style={{
                      width: "150px",
                      height: "150px",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div className="no-image-txt">이미지 없음</div>
                )}
              </div>

              {/* 상품 정보 */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: "5px",
                }}
              >
                <div style={{ fontWeight: "bold", fontSize: "18px" }}>
                  {product.title} - {product.startingPrice?.toLocaleString()}원
                </div>
                <div>{product.content || "설명 없음"}</div>
                <div>카테고리: {getCategoryName(product.categoryId)}</div>
                <div>상품 상태: {product.productStatus}</div>
                <div>결제 상태: {product.paymentStatus}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
