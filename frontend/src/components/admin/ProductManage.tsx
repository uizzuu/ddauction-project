import type { Product, EditProductForm } from "../../common/types";
import { PRODUCT_STATUS, CATEGORY_OPTIONS, PRODUCT_CATEGORIES, type ProductCategoryType } from "../../common/enums";
import { Search } from "lucide-react";
import CustomSelect from "../common/CustomSelect";

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
    <div>
      <h2 className="text-xl font-bold text-[#111] mb-6">상품 관리</h2>

      {/* Filter Section */}
      <div className="mb-6 flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-[#666] mb-1.5">상품명 검색</label>
          <div className="relative">
            <input
              placeholder="상품명을 입력하세요"
              value={filterKeyword}
              onChange={(e) => setFilterKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchProducts()}
              className="w-full px-3 py-2 pr-10 border border-[#ddd] rounded-lg bg-white text-[#111] text-sm focus:outline-none focus:ring-1 focus:ring-[#111] focus:border-[#111]"
            />
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999]" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#666] mb-1.5">카테고리</label>
          <CustomSelect
            value={filterCategory ?? ""}
            onChange={(value) =>
              setFilterCategory((value || null) as ProductCategoryType | null)
            }
            options={[
              { value: "", label: "전체 카테고리" },
              ...CATEGORY_OPTIONS,
            ]}
          />
        </div>
        <button
          onClick={fetchProducts}
          className="px-6 py-2 bg-[#111] text-white rounded-lg text-sm font-medium hover:bg-[#333] transition-colors"
        >
          검색
        </button>
      </div>

      {/* Table */}
      <div className="border border-[#eee] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#f9f9f9] border-b-2 border-[#eee]">
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">상품명</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">카테고리</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">가격</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">상태</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">관리</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#eee]">
            {products.map((p) => (
              <tr key={p.productId} className="hover:bg-[#f9f9f9] transition-colors">
                <td className="px-4 py-3 text-sm text-[#111]">{p.productId}</td>
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
                      className="px-2 py-1 border border-[#ddd] rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-[#111]"
                    />
                  ) : (
                    <span className="text-[#111]">{p.title}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  {editingProductId === p.productId ? (
                    <CustomSelect
                      value={editProductForm.productCategoryType ?? ""}
                      onChange={(value) =>
                        setEditProductForm({
                          ...editProductForm,
                          productCategoryType: (value || null) as ProductCategoryType | null,
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
                      className="px-2 py-1 border border-[#ddd] rounded text-sm w-24 focus:outline-none focus:ring-1 focus:ring-[#111]"
                    />
                  ) : (
                    <span className="text-[#111]">{p.startingPrice?.toLocaleString()}원</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  {editingProductId === p.productId ? (
                    <CustomSelect
                      value={editProductForm.productStatus ?? PRODUCT_STATUS[0]}
                      onChange={(value) => handleProductStatusChange(value)}
                      options={[
                        { value: "ACTIVE", label: "판매중" },
                        { value: "SOLD", label: "판매완료" },
                        { value: "CLOSED", label: "비활성" },
                      ]}
                      className="w-full"
                    />
                  ) : (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.productStatus === "ACTIVE" ? "bg-green-50 text-green-700" :
                      p.productStatus === "SOLD" ? "bg-gray-100 text-gray-700" :
                        "bg-red-50 text-red-700"
                      }`}>
                      {p.productStatus === "ACTIVE" ? "판매중" :
                        p.productStatus === "SOLD" ? "판매완료" : "비활성"}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  {editingProductId === p.productId ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveProductClick(p.productId)}
                        className="px-3 py-1 bg-[#111] text-white rounded text-xs font-medium hover:bg-[#333] transition-colors"
                      >
                        저장
                      </button>
                      <button
                        onClick={handleCancelProductClick}
                        className="px-3 py-1 bg-white border border-[#ddd] text-[#666] rounded text-xs font-medium hover:bg-[#f9f9f9] transition-colors"
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditProductClick(p)}
                        className="px-3 py-1 bg-white border border-[#ddd] text-[#666] rounded text-xs font-medium hover:bg-[#f9f9f9] transition-colors"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.productId)}
                        className="px-3 py-1 bg-[#666] text-white rounded text-xs font-medium hover:bg-[#888] transition-colors"
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