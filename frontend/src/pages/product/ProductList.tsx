import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchFilteredProducts } from "../../common/api";
import { type Product } from "../../common/types";
import { parseWithTZ } from "../../common/util";
import type { SortOption } from "../../common/util";
import ProductCard from "../../components/ui/ProductCard";
import { type DeliveryType } from "../../common/enums";
import { ArrowUpDown } from "lucide-react";
import FilterBar from "../../components/modal/FilterBar";
import SideFilterModal from "../../components/modal/SideFilterModal";

export default function ProductSearchPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // State
  const [categoryCode, setCategoryCode] = useState<string | "">("");
  const [activeOnly, setActiveOnly] = useState(false);

  // Price Filter State
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [minStartPrice, setMinStartPrice] = useState<number | undefined>();
  const [maxStartPrice, setMaxStartPrice] = useState<number | undefined>();
  const [selectedDeliveryTypes, setSelectedDeliveryTypes] = useState<DeliveryType[]>([]);
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>([]);
  const [productType, setProductType] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState<SortOption>("latest");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isSideModalOpen, setIsSideModalOpen] = useState(false);

  // Fetch logic
  const fetchProducts = async (
    kw: string = "",
    catCode: string | "" = "",
    active: boolean = false,
    sort: SortOption = "latest",
    priceRange?: { min?: number, max?: number, minStart?: number, maxStart?: number },
    pType?: string | null
  ) => {
    setLoading(true);
    try {
      const currentMinPrice = priceRange?.min !== undefined ? priceRange.min : minPrice;
      const currentMaxPrice = priceRange?.max !== undefined ? priceRange.max : maxPrice;
      const currentMinStart = priceRange?.minStart !== undefined ? priceRange.minStart : minStartPrice;
      const currentMaxStart = priceRange?.maxStart !== undefined ? priceRange.maxStart : maxStartPrice;
      const currentProductType = pType !== undefined ? pType : productType;

      let data: Product[] = await fetchFilteredProducts({
        keyword: kw,
        category: catCode,
        productStatus: active ? "ACTIVE" : undefined,
        productType: currentProductType || undefined,
        sort: sort,
        minPrice: currentMinPrice,
        maxPrice: currentMaxPrice,
        minStartPrice: currentMinStart,
        maxStartPrice: currentMaxStart
      });

      // 거래 가능만 보기 필터 (클라이언트 사이드 추가 필터링)
      if (active) {
        const now = new Date();
        data = data.filter(
          (p) =>
            p.productStatus === "ACTIVE" &&
            (p.productType !== "AUCTION" || parseWithTZ(p.auctionEndTime || "").getTime() > now.getTime())
        );
      }

      // 🔹 상품 타입 클라이언트 사이드 필터링 (백엔드 미지원 대비)
      if (currentProductType) {
        data = data.filter(p => p.productType === currentProductType);
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
    const sortParam = params.get("sort") as SortOption;

    // setKeyword(kw); // State removed
    setCategoryCode(catCode);

    if (sortParam && sortParam !== sortOption) {
      setSortOption(sortParam);
      return;
    }

    fetchProducts(kw, catCode, activeOnly, sortOption, {
      min: minPrice, max: maxPrice, minStart: minStartPrice, maxStart: maxStartPrice
    }, productType);
  }, [location.search, activeOnly, sortOption, minPrice, maxPrice, minStartPrice, maxStartPrice, productType]);

  const handleCategoryClick = (cat: string) => {
    const params = new URLSearchParams(location.search);
    if (categoryCode === cat) {
      params.delete("category");
      setCategoryCode("");
    } else {
      params.set("category", cat);
      setCategoryCode(cat);
    }
    navigate(`/search?${params.toString()}`);
  };

  const handlePriceChange = (type: "current" | "start", min?: number, max?: number) => {
    if (type === "current") {
      setMinPrice(min);
      setMaxPrice(max);
    } else {
      setMinStartPrice(min);
      setMaxStartPrice(max);
    }
  };

  const handleDeliveryChange = (types: DeliveryType[]) => setSelectedDeliveryTypes(types);
  const handleBenefitChange = (benefits: string[]) => setSelectedBenefits(benefits);

  const clearFilters = () => {
    setActiveOnly(false);
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setMinStartPrice(undefined);
    setMaxStartPrice(undefined);
    setSelectedDeliveryTypes([]);
    setSelectedBenefits([]);
    navigate("/search");
  };

  return (
    <div className="container">

      {/* Filter Bar & Modal */}
      <div className="mb-6">
        <FilterBar
          selectedCategory={categoryCode}
          onCategoryChange={handleCategoryClick}
          onOpenSideModal={() => setIsSideModalOpen(true)}

          selectedProductType={productType}
          onProductTypeChange={setProductType}

          minPrice={minPrice}
          maxPrice={maxPrice}
          minStartPrice={minStartPrice}
          maxStartPrice={maxStartPrice}
          onPriceChange={handlePriceChange}
          excludeEnded={activeOnly}
          onExcludeEndedChange={setActiveOnly}
          selectedDeliveryTypes={selectedDeliveryTypes}
          onDeliveryChange={handleDeliveryChange}
          selectedBenefits={selectedBenefits}
          onBenefitChange={handleBenefitChange}
        />
      </div>

      <SideFilterModal
        isOpen={isSideModalOpen}
        onClose={() => setIsSideModalOpen(false)}
        selectedCategory={categoryCode}
        onCategoryChange={handleCategoryClick}

        selectedProductType={productType}
        onProductTypeChange={setProductType}

        minPrice={minPrice}
        maxPrice={maxPrice}
        minStartPrice={minStartPrice}
        maxStartPrice={maxStartPrice}
        onPriceChange={handlePriceChange}
        excludeEnded={activeOnly}
        onExcludeEndedChange={setActiveOnly}
        selectedDeliveryTypes={selectedDeliveryTypes}
        onDeliveryChange={handleDeliveryChange}
        selectedBenefits={selectedBenefits}
        onBenefitChange={handleBenefitChange}
      />

      {/* Main Content Area */}
      <div className="flex-1">

        <div className="flex justify-between items-center mb-4 bg-white z-10 py-2">
          <span className="text-[#555]">
            상품 <span className="font-bold text-[#111]">{products.length}</span>개
          </span>

          {/* Minimal Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsSortOpen(!isSortOpen)}
              onBlur={() => setTimeout(() => setIsSortOpen(false), 200)}
              className="flex items-center gap-1 text-[14px] font-medium text-[#666] hover:text-black"
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
              <div className="absolute top-full right-0 mt-2 w-[120px] bg-white border border-[#eee] rounded shadow-lg z-20 text-[14px]">
                {[
                  { value: "latest", label: "최신순" },
                  { value: "priceAsc", label: "가격 낮은순" },
                  { value: "priceDesc", label: "가격 높은순" },
                  { value: "popularity", label: "인기순" },
                ].map(opt => (
                  <button
                    key={opt.value}
                    className={`block w-full text-left px-3 py-2 hover:bg-gray-50 ${sortOption === opt.value ? "font-bold text-black" : "text-[#666]"}`}
                    onClick={() => {
                      setSortOption(opt.value as SortOption);
                      setIsSortOpen(false);
                    }}
                    onMouseDown={(e) => e.preventDefault()}
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-8">
              {products.map((p) => (
                <ProductCard key={p.productId} product={p} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-[#aaa] border-t border-[#eee] w-[1280px] mx-auto">
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
  );
}