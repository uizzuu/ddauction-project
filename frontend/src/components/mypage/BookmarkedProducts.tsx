import type { Product } from "../../types/types";

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
      <h3>찜한 상품</h3>
      {bookmarkedProducts.length === 0 ? (
        <p>찜한 상품이 없습니다.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {bookmarkedProducts.map((product) => (
            <li
              key={product.productId}
              style={{
                marginBottom: "20px",
                border: "1px solid #eee",
                padding: "10px",
                borderRadius: "6px",
                display: "flex",
                gap: "15px",
                alignItems: "center",
              }}
            >
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  style={{
                    width: "150px",
                    cursor: "pointer",
                    flexShrink: 0,
                    borderRadius: "6px",
                  }}
                  onClick={() => goToProductDetail(product.productId)}
                />
              ) : (
                <div
                  style={{
                    width: "150px",
                    height: "150px",
                    background: "#eee",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#888",
                    borderRadius: "6px",
                    flexShrink: 0,
                  }}
                >
                  이미지 없음
                </div>
              )}
              <div>
                <div style={{ fontWeight: "bold", fontSize: "18px" }}>
                  {product.title} -{" "}
                  {product.startingPrice?.toLocaleString()}원
                </div>
                <div>{product.content}</div>
                <div>카테고리: {getCategoryName(product.categoryId)}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}