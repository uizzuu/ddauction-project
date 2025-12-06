import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchFilteredProducts } from "../../common/api";
import type { Product } from "../../common/types";
import { parseWithTZ } from "../../common/util";
import type { SortOption } from "../../common/util";
import ProductCard from "../../components/ui/ProductCard";
import { PRODUCT_CATEGORY_LABELS, type ProductCategoryType } from "../../common/enums";
import { SlidersHorizontal, ArrowUpDown } from "lucide-react";

export default function ProductSearchPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // State
  const [keyword, setKeyword] = useState("");
  const [categoryCode, setCategoryCode] = useState<string | "">("");
  const [activeOnly, setActiveOnly] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState<SortOption>("latest");
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Fetch logic
  const fetchProducts = async (
    kw: string = "",
    catCode: string | "" = "",
    active: boolean = false,
    sort: SortOption = "latest"
  ) => {
    setLoading(true);
    try {
      let data: Product[] = await fetchFilteredProducts({
        keyword: kw,
        category: catCode,
        productStatus: active ? "ACTIVE" : undefined,
        sort: sort,
      });

      // 거래 가능만 보기 필터 (클라이언트 사이드 추가 필터링)
      if (active) {
        const now = new Date();
        data = data.filter(
          (p) =>
            p.productStatus === "ACTIVE" &&
            (p.productType !== "AUCTION" || parseWithTZ(p.auctionEndTime).getTime() > now.getTime())
        );
      }
      setProducts(data);
    } catch (err) {
      console.error("❌ 상품 검색 중 오류 발생:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const kw = params.get("keyword") || "";
    const catCode = params.get("category") || "";

    setKeyword(kw);
    setCategoryCode(catCode);

    // activeOnly와 sortOption은 로컬 스테이트로 관리 (초기화시 리셋 안함)
    fetchProducts(kw, catCode, activeOnly, sortOption);
  }, [location.search, activeOnly, sortOption]);

  const handleCategoryClick = (cat: string) => {
    const params = new URLSearchParams(location.search);
    if (categoryCode === cat) {
      // Toggle off
      params.delete("category");
      setCategoryCode("");
    } else {
      params.set("category", cat);
      setCategoryCode(cat);
    }
    // keyword 유지
    navigate(`/search?${params.toString()}`);
  };

  const clearFilters = () => {
    setActiveOnly(false);
    navigate("/search");
  };

  return (
    <div className="container mx-auto px-4 md:px-0 py-8 min-h-[calc(100vh-120px)] max-w-[1280px]">

      {/* Page Title (Optional) */}
      <div className="flex flex-col md:flex-row gap-10">

        {/* Left Sidebar (Filters) */}
        <aside className="w-full md:w-[220px] shrink-0">

          {/* Status Filter */}
          <div className="filter-group">
            <h3 className="filter-header">필터</h3>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-[#333] hover:opacity-70 transition-opacity">
              <input
                type="checkbox"
                checked={activeOnly}
                onChange={(e) => setActiveOnly(e.target.checked)}
                className="w-4 h-4 accent-black"
              />
              <span>거래 가능만 보기</span>
            </label>
          </div>

          {/* Category Filter */}
          <div className="filter-group">
            <h3 className="filter-header">카테고리</h3>
            <div className="flex flex-col gap-2">
              <div
                onClick={() => {
                  const params = new URLSearchParams(location.search);
                  params.delete("category");
                  navigate(`/search?${params.toString()}`);
                }}
                className={`filter-option ${!categoryCode ? "active" : ""}`}
              >
                모든 카테고리
              </div>
              {(Object.keys(PRODUCT_CATEGORY_LABELS) as ProductCategoryType[]).map((cat) => (
                <div
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  className={`filter-option ${categoryCode === cat ? "active" : ""}`}
                >
                  <span>{PRODUCT_CATEGORY_LABELS[cat]}</span>
                  {categoryCode === cat && <span className="text-xs">✓</span>}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Content */}
        <div className="flex-1">

          <div className="flex justify-between items-center mb-4 sticky top-14 bg-white z-10 py-2">
            <span className="text-sm text-[#555]">
              상품 <span className="font-bold text-[#111]">{products.length}</span>개
            </span>

            {/* Minimal Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                onBlur={() => setTimeout(() => setIsSortOpen(false), 200)} // delay to allow click
                className="sort-btn"
              >
                <ArrowUpDown size={14} />
                <span>
                  {sortOption === "latest" ? "최신순" :
                    sortOption === "priceAsc" ? "가격 낮은순" :
                      sortOption === "priceDesc" ? "가격 높은순" :
                        sortOption === "popularity" ? "인기순" : "정렬"}
                </span>
              </button>

              {/* Dropdown Menu */}
              {isSortOpen && (
                <div className="sort-dropdown">
                  {[
                    { value: "latest", label: "최신순" },
                    { value: "priceAsc", label: "가격 낮은순" },
                    { value: "priceDesc", label: "가격 높은순" },
                    { value: "popularity", label: "인기순" },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      className={`sort-item ${sortOption === opt.value ? "active" : ""}`}
                      onClick={() => {
                        setSortOption(opt.value as SortOption);
                        setIsSortOpen(false);
                      }}
                      onMouseDown={(e) => e.preventDefault()} // Prevent blur so click works
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Grid */}
          <div className="w-full">
            {loading ? (
              <div className="text-[#aaa] text-sm text-center py-20">검색중...</div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
                {products.map((p) => (
                  <ProductCard key={p.productId} product={p} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-[#aaa] border-t border-[#eee] w-full">
                <p className="text-lg mb-2 text-[#333] font-medium">검색 결과가 없습니다.</p>
                <p className="text-sm text-[#888] mb-6">다른 키워드나 필터를 변경해보세요.</p>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 border border-[#ddd] rounded-full text-sm hover:bg-[#f9f9f9] transition-colors"
                >
                  필터 초기화
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}