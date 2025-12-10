import React from "react";
import type { Product, ProductForm } from "../../common/types";
import {
  PRODUCT_CATEGORIES,
  CATEGORY_OPTIONS,
} from "../../common/enums";
import type { ProductCategoryType } from "../../common/enums";



// 카테고리 코드(string)를 받아 한글 이름으로 변환하는 함수
const getCategoryName = (categoryCode: string | null | undefined): string => {
  if (!categoryCode) return "N/A";
  // 타입 단언을 사용하여 안전하게 매핑
  return PRODUCT_CATEGORIES[categoryCode as ProductCategoryType] || "기타";
};

// 상품 상태 코드(string)를 받아 한글 이름으로 변환하는 함수
// const getProductStatusLabel = (status: string | null | undefined): string => {
//     switch (status) {
//         case "ACTIVE": return "판매중";
//         case "SOLD": return "판매완료";
//         case "CLOSED": return "경매종료";
//         default: return status || "알 수 없음";
//     }
// }

type Props = {
  sellingProducts: Product[];
  editingProductId: number | null;
  productForm: ProductForm & { productStatus: string };
  goToProductDetail: (productId: number) => void;
  handleEditProduct: (product: Product) => void;
  handleChangeProductForm: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  handleSaveProduct: () => Promise<void>;
  handleCancelProductEdit: () => void;
};

export default function MySellingProducts({
  sellingProducts,
  editingProductId,
  productForm,
  goToProductDetail,
  handleEditProduct,
  handleChangeProductForm,
  handleSaveProduct,
  handleCancelProductEdit,
}: Props) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <div className="title-24 mb-2.5">판매 중인 상품</div>
      {sellingProducts.length === 0 ? (
        <p>판매 중인 상품이 없습니다.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {sellingProducts
            .sort(
              (a, b) =>
                new Date(b.createdAt || "").getTime() -
                new Date(a.createdAt || "").getTime()
            )
            .map((product) => (
              <li
                key={product.productId}
                style={{
                  marginBottom: "10px",
                  border: "1px solid #ddd",
                  padding: "15px",
                  borderRadius: "8px",
                }}
                onClick={() => goToProductDetail(product.productId)}
              >
                <div style={{ display: "flex", gap: "15px" }}>
                  {/* 이미지 박스 */}
                  <div className="bid-box w-[200px] h-[200px] overflow-hidden p-0">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        style={{
                          width: "200px",
                          height: "200px",
                          objectFit: "cover",
                          cursor: "pointer",
                        }}
                        onClick={() => goToProductDetail(product.productId)}
                        onError={(e) => {
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            parent.innerHTML =
                              '<></>';
                          }
                        }}
                      />
                    ) : (
                      <div
                        className="no-image-txt w-fit"
                        style={{
                          width: "200px",
                          height: "200px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "#eee",
                          color: "#999",
                        }}
                      ></div>
                    )}
                  </div>

                  {/* 상품 정보 */}
                  <div className="w-full">
                    <div style={{ fontWeight: "bold", fontSize: "18px" }}>
                      {product.title}
                    </div>
                    <div>설명: {product.content}</div>
                    <div>가격: {product.startingPrice?.toLocaleString()}원</div>
                    <div>카테고리: {getCategoryName(product.productCategoryType)}</div>
                    <div>상품 상태: {product.productStatus}</div>
                    <div>결제 상태: {product.paymentStatus}</div>
                    <div>
                      경매 종료:{" "}
                      {new Date(product.auctionEndTime || "").toLocaleString()}
                    </div>
                    <div>
                      판매자: {product.sellerNickName} (ID: {product.sellerId})
                    </div>
                  </div>

                  {/* 상품 수정 버튼 */}
                  <button
                    className="search-btn bg-transparent h-fit"
                    onClick={() => handleEditProduct(product)}
                  >
                    상품 수정
                  </button>
                </div>

                {/* 상품 수정 폼 */}
                {editingProductId === product.productId && (
                  <div
                    style={{
                      marginTop: "15px",
                      padding: "10px",
                      border: "1px solid #ccc",
                      borderRadius: "8px",
                      background: "#f9f9f9",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      <input
                        name="title"
                        value={productForm.title}
                        onChange={handleChangeProductForm}
                        placeholder="상품명"
                        className="input"
                      />
                      <input
                        name="startingPrice"
                        type="number"
                        value={productForm.startingPrice}
                        onChange={handleChangeProductForm}
                        placeholder="가격"
                        className="input"
                      />
                      <textarea
                        name="content"
                        value={productForm.content}
                        onChange={handleChangeProductForm}
                        placeholder="설명"
                        rows={3}
                        className="textarea"
                      />
                      <select
                        name="productCategoryType"
                        value={productForm.productCategoryType ?? ""}
                        onChange={handleChangeProductForm}
                      >
                        <option value="">카테고리 선택</option>
                        {CATEGORY_OPTIONS.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>

                      <select
                        name="productStatus"
                        value={productForm.productStatus}
                        onChange={handleChangeProductForm}
                      >
                        <option value="ACTIVE">판매중</option>
                        <option value="SOLD">판매완료</option>
                        <option value="PAUSED">일시중지</option>
                      </select>

                      <div className="flex gap-2 w-full mt-2.5">
                        <button
                          className="search-btn"
                          onClick={handleSaveProduct}
                        >
                          저장
                        </button>
                        <button
                          className="search-btn"
                          onClick={handleCancelProductEdit}
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
