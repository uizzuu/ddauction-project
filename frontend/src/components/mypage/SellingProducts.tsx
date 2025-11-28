import React from "react";
import type { Product, Category, ProductForm } from "../../common/types";

type Props = {
  sellingProducts: Product[];
  editingProductId: number | null;
  productForm: ProductForm & { productStatus: string };
  categories: Category[];
  getCategoryName: (categoryId?: number) => string;
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

export default function SellingProducts({
  sellingProducts,
  editingProductId,
  productForm,
  categories,
  getCategoryName,
  goToProductDetail,
  handleEditProduct,
  handleChangeProductForm,
  handleSaveProduct,
  handleCancelProductEdit,
}: Props) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <div className="title-24 mb-10">판매 중인 상품</div>
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
                  <div className="bid-box width-200 height-200 overflow-hidden p-0">
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
                              '<div class="no-image-txt">이미지 없음</div>';
                          }
                        }}
                      />
                    ) : (
                      <div
                        className="no-image-txt width-fit"
                        style={{
                          width: "200px",
                          height: "200px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "#eee",
                          color: "#999",
                        }}
                      >
                        이미지 없음
                      </div>
                    )}
                  </div>

                  {/* 상품 정보 */}
                  <div className="width-full">
                    <div style={{ fontWeight: "bold", fontSize: "18px" }}>
                      {product.title}
                    </div>
                    <div>설명: {product.content}</div>
                    <div>가격: {product.startingPrice?.toLocaleString()}원</div>
                    <div>카테고리: {getCategoryName(product.categoryId)}</div>
                    <div>상품 상태: {product.productStatus}</div>
                    <div>결제 상태: {product.paymentStatus}</div>
                    <div>
                      경매 종료:{" "}
                      {new Date(product.auctionEndTime).toLocaleString()}
                    </div>
                    <div>
                      1분 경매: {product.oneMinuteAuction ? "예" : "아니오"}
                    </div>
                    <div>
                      판매자: {product.sellerNickName} (ID: {product.sellerId})
                    </div>
                  </div>

                  {/* 상품 수정 버튼 */}
                  <button
                    className="search-btn bg-transparent height-fit"
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
                        name="categoryId"
                        value={productForm.categoryId ?? ""}
                        onChange={handleChangeProductForm}
                      >
                        <option value="">카테고리 선택</option>
                        {categories.map((c) => (
                          <option key={c.categoryId} value={c.categoryId}>
                            {c.name}
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

                      <div className="flex-box gap-8 width-full mt-10">
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
