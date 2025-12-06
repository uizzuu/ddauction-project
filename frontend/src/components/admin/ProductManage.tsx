import type { Product, EditProductForm } from "../../common/types";
import { PRODUCT_STATUS, CATEGORY_OPTIONS, PRODUCT_CATEGORY_LABELS, type ProductCategoryType } from "../../common/enums";

type Props = {
  products: Product[];
  editingProductId: number | null;
  editProductForm: EditProductForm;
  setEditProductForm: React.Dispatch<React.SetStateAction<EditProductForm>>;
  handleEditProductClick: (product: Product) => void;
  handleSaveProductClick: (productId: number) => void;
  handleCancelProductClick: () => void;
  handleDeleteProduct: (productId: number) => void;

  // 필터링 관련 props
  filterKeyword: string;
  setFilterKeyword: React.Dispatch<React.SetStateAction<string>>;
  filterCategory: ProductCategoryType | null;
  setFilterCategory: React.Dispatch<React.SetStateAction<ProductCategoryType | null>>;
  fetchProducts: () => void;
};

export default function ProductManage({
  products,
  editingProductId,
  editProductForm,
  setEditProductForm,
  handleEditProductClick,
  handleSaveProductClick,
  handleCancelProductClick,
  handleDeleteProduct,
  // 필터링 props
  filterKeyword,
  setFilterKeyword,
  filterCategory,
  setFilterCategory,
  fetchProducts,
}: Props) {
  const handleProductStatusChange = (value: string) => {
    if (PRODUCT_STATUS.includes(value as Product["productStatus"])) {
      setEditProductForm({
        ...editProductForm,
        productStatus: value as Product["productStatus"],
      });
    }
  };

  return (
    <div className="bg-white p-5 rounded-lg shadow-[0_0_8px_rgba(0,0,0,0.1)] mb-5">
      <h3>상품 관리</h3>
      {/* --- 상품 필터 UI --- */}
      <div style={{ marginBottom: "1rem" }}>
        <input
          placeholder="상품명 검색"
          value={filterKeyword}
          onChange={(e) => setFilterKeyword(e.target.value)}
        />
        <select
          value={filterCategory ?? ""}
          onChange={(e) =>
            setFilterCategory((e.target.value || null) as ProductCategoryType | null)
          }
        >
          <option value="">전체 카테고리</option>
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button onClick={fetchProducts}>검색</button>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>상품명</th>
            <th>카테고리</th>
            <th>가격</th>
            <th>상태</th>
            <th>액션</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.productId}>
              <td>{p.productId}</td>
              <td>
                {editingProductId === p.productId ? (
                  <input
                    value={editProductForm.title ?? ""}
                    onChange={(e) =>
                      setEditProductForm({
                        ...editProductForm,
                        title: e.target.value,
                      })
                    }
                  />
                ) : (
                  p.title
                )}
              </td>
              <td>
                {editingProductId === p.productId ? (
                  <select
                    value={editProductForm.productCategoryType ?? ""}
                    onChange={(e) =>
                      setEditProductForm({
                        ...editProductForm,
                        productCategoryType: (e.target.value || null) as ProductCategoryType | null,
                      })
                    }
                  >
                    <option value="">카테고리 선택</option>
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  p.productCategoryType
                    ? PRODUCT_CATEGORY_LABELS[p.productCategoryType]
                    : "-"
                )}
              </td>
              <td>
                {editingProductId === p.productId ? (
                  <input
                    type="number"
                    value={editProductForm.startingPrice ?? 0}
                    onChange={(e) =>
                      setEditProductForm({
                        ...editProductForm,
                        startingPrice: e.target.value,
                      })
                    }
                  />
                ) : (
                  p.startingPrice ?? 0
                )}
              </td>
              <td>
                {editingProductId === p.productId ? (
                  <select
                    value={editProductForm.productStatus ?? PRODUCT_STATUS[0]}
                    onChange={(e) => handleProductStatusChange(e.target.value)}
                  >
                    <option value="ACTIVE">판매중</option>
                    <option value="SOLD">판매완료</option>
                    <option value="CLOSED">비활성</option>
                  </select>
                ) : (
                  p.productStatus ?? "-"
                )}
              </td>
              <td>
                {editingProductId === p.productId ? (
                  <>
                    <button onClick={() => handleSaveProductClick(p.productId)}>
                      저장
                    </button>
                    <button onClick={handleCancelProductClick}>취소</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleEditProductClick(p)}>
                      수정
                    </button>
                    <button
                      className="bg-[#f5a623] text-white hover:bg-[#d48806] py-[5px] px-[10px] cursor-pointer border-none rounded"
                      onClick={() => handleDeleteProduct(p.productId)}
                    >
                      삭제
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}