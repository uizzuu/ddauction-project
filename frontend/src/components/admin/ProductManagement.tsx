import type { Product, Category, EditProductForm } from "../../common/types";
import { PRODUCT_STATUS } from "../../common/enums";

type Props = {
  products: Product[];
  categories: Category[];
  editingProductId: number | null;
  editProductForm: EditProductForm;
  setEditProductForm: React.Dispatch<React.SetStateAction<EditProductForm>>;
  handleEditProductClick: (product: Product) => void;
  handleSaveProductClick: (productId: number) => void;
  handleCancelProductClick: () => void;
  handleDeleteProduct: (productId: number) => void;

  // 필터링 관련 props 추가
  filterKeyword: string;
  setFilterKeyword: React.Dispatch<React.SetStateAction<string>>;
  filterCategory: number | null;
  setFilterCategory: React.Dispatch<React.SetStateAction<number | null>>;
  fetchProducts: () => void;
};

export default function ProductManagement({
  products,
  categories,
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
    <div className="admin-section">
      <h3>상품 관리</h3>
      {/* --- 상품 필터 UI (AdminPage에서 이동) --- */}
      <div style={{ marginBottom: "1rem" }}>
        <input
          placeholder="상품명 검색"
          value={filterKeyword}
          onChange={(e) => setFilterKeyword(e.target.value)}
        />
        <select
          value={filterCategory ?? ""}
          onChange={(e) =>
            setFilterCategory(e.target.value ? Number(e.target.value) : null)
          }
        >
          <option value="">전체 카테고리</option>
          {categories.map((c) => (
            <option key={c.categoryId} value={c.categoryId}>
              {c.name}
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
                    value={editProductForm.categoryId ?? ""}
                    onChange={(e) =>
                      setEditProductForm({
                        ...editProductForm,
                        categoryId: Number(e.target.value),
                      })
                    }
                  >
                    {categories.map((c) => (
                      <option key={c.categoryId} value={c.categoryId}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  p.categoryName ??
                  categories.find((c) => c.categoryId === p.categoryId)?.name ??
                  "-"
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
                      className="delete-btn"
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
