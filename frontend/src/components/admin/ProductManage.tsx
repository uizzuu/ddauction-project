import type { Product, EditProductForm } from "../../common/types";
import {
  PRODUCT_STATUS,
  CATEGORY_OPTIONS,
  PRODUCT_CATEGORIES,
  type ProductCategoryType,
} from "../../common/enums";
import { Search } from "lucide-react";
import CustomSelect from "../ui/CustomSelect";
import { Link } from "react-router-dom";

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
  setFilterCategory: React.Dispatch<
    React.SetStateAction<ProductCategoryType | null>
  >;
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

  /** ✅ 가격 표시용 (읽기 전용) */
  const getPriceLabel = (p: Product) => {
    switch (p.productType) {
      case "AUCTION":
        return p.startingPrice != null
          ? `${p.startingPrice.toLocaleString()}원`
          : "-";
      case "STORE":
        return p.salePrice != null
          ? `${p.salePrice.toLocaleString()}원`
          : "-";
      case "USED":
        return p.originalPrice != null
          ? `${p.originalPrice.toLocaleString()}원`
          : "가격 협의";
      default:
        return "-";
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-[#111] mb-6">상품 관리</h2>

      {/* Filter Section */}
      <div className="mb-6 flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-[#666] mb-1.5">
            상품명 검색
          </label>
          <div className="relative">
            <input
              placeholder="상품명을 입력하세요"
              value={filterKeyword}
              onChange={(e) => setFilterKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchProducts()}
              className="w-full px-3 py-2 pr-10 border border-[#ddd] rounded-lg bg-white text-[#111] text-sm focus:outline-none focus:ring-1 focus:ring-[#111]"
            />
            <Search
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#666] mb-1.5">
            카테고리
          </label>
          <CustomSelect
            value={filterCategory ?? ""}
            onChange={(value) => {
              const newCategory = (value || null) as ProductCategoryType | null;
              setFilterCategory(newCategory);

              // ✅ 카테고리 변경 시 즉시 목록을 업데이트합니다.
              fetchProducts();
            }}
            options={[
              { value: "", label: "전체 카테고리" },
              ...CATEGORY_OPTIONS,
            ]}
          />
        </div>

        <button
          onClick={fetchProducts}
          className="px-6 py-2 bg-[#111] text-white rounded-lg text-sm font-medium hover:bg-[#333]"
        >
          검색
        </button>
      </div>

      {/* Table */}
      <div className="border border-[#eee] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#f9f9f9] border-b-2 border-[#eee]">
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#666]">
                ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#666]">
                상품명
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#666]">
                카테고리
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#666]">
                가격
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#666]">
                상태
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#666]">
                관리
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-[#eee]">
            {products.map((p) => (
              <tr
                key={p.productId}
                className="hover:bg-[#f9f9f9] transition-colors"
              >
                <td className="px-4 py-3 text-sm">{p.productId}</td>

                {/* ✅ 상품명 클릭 → 새 탭 */}
                <td className="px-4 py-3 text-sm">
                  {editingProductId === p.productId ? (
                    <input
                      value={editProductForm.title ?? ""}
                      onChange={(e) =>
                        setEditProductForm({
                          ...editProductForm,
                          title: e.target.value,
                        })
                      }
                      className="px-2 py-1 border border-[#ddd] rounded text-sm w-full"
                    />
                  ) : (
                    <Link
                      to={`/products/${p.productId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#111] hover:underline hover:text-blue-600 transition-colors"
                    >
                      {p.title}
                    </Link>
                  )}
                </td>

                <td className="px-4 py-3 text-sm">
                  {editingProductId === p.productId ? (
                    <CustomSelect
                      value={editProductForm.productCategoryType ?? ""}
                      onChange={(value) =>
                        setEditProductForm({
                          ...editProductForm,
                          productCategoryType: (value ||
                            null) as ProductCategoryType | null,
                        })
                      }
                      options={[
                        { value: "", label: "카테고리 선택" },
                        ...CATEGORY_OPTIONS,
                      ]}
                      className="w-full"
                    />
                  ) : (
                    <span className="text-[#666]">
                      {p.productCategoryType
                        ? PRODUCT_CATEGORIES[p.productCategoryType]
                        : "-"}
                    </span>
                  )}
                </td>

                <td className="px-4 py-3 text-sm">
                  <span className="text-[#111]">{getPriceLabel(p)}</span>
                </td>

                <td className="px-4 py-3 text-sm">
                  {editingProductId === p.productId ? (
                    <CustomSelect
                      value={
                        editProductForm.productStatus ?? PRODUCT_STATUS[0]
                      }
                      onChange={(value) =>
                        handleProductStatusChange(value)
                      }
                      options={[
                        { value: "ACTIVE", label: "판매중" },
                        { value: "SOLD", label: "판매완료" },
                        { value: "CLOSED", label: "비활성" },
                      ]}
                      className="w-full"
                    />
                  ) : (
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${p.productStatus === "ACTIVE"
                          ? "bg-green-50 text-green-700"
                          : p.productStatus === "SOLD"
                            ? "bg-gray-100 text-gray-700"
                            : "bg-red-50 text-red-700"
                        }`}
                    >
                      {p.productStatus === "ACTIVE"
                        ? "판매중"
                        : p.productStatus === "SOLD"
                          ? "판매완료"
                          : "비활성"}
                    </span>
                  )}
                </td>

                <td className="px-4 py-3 text-sm">
                  {editingProductId === p.productId ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleSaveProductClick(p.productId)
                        }
                        className="px-3 py-1 bg-[#111] text-white rounded text-xs"
                      >
                        저장
                      </button>
                      <button
                        onClick={handleCancelProductClick}
                        className="px-3 py-1 border rounded text-xs"
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleEditProductClick(p)
                        }
                        className="px-3 py-1 border rounded text-xs"
                      >
                        수정
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteProduct(p.productId)
                        }
                        className="px-3 py-1 bg-[#666] text-white rounded text-xs"
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
