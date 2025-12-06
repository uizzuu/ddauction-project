import { useEffect, useState } from "react";
import { useNavigate, useLocation, NavLink } from "react-router-dom";
import { fetchFilteredProducts } from "../../common/api";
import type { Product } from "../../common/types";
import { CATEGORY_OPTIONS, PRODUCT_CATEGORY_LABELS } from "../../common/enums";
import SelectStyle from "../../components/ui/form/SelectStyle";
import {
  formatDateTime,
  formatPrice,
  formatDate,
  parseWithTZ,
  buildSearchQuery
} from "../../common/util";
import type { SortOption } from "../../common/util";

export default function ProductSearchPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [keyword, setKeyword] = useState("");
  const [categoryCode, setCategoryCode] = useState<string | "">("");
  const [activeOnly, setActiveOnly] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState<SortOption>("latest");

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
        productStatus: active ? "ACTIVE" : undefined, // "ACTIVE" 상태만 필터링
        sort: sort,
      });
      // 거래 가능만 보기 필터
      if (active) {
        const now = new Date();
        data = data.filter(
          (p) =>
            p.productStatus === "ACTIVE" &&
            parseWithTZ(p.auctionEndTime).getTime() > now.getTime()
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

    fetchProducts(kw, catCode, activeOnly, sortOption);
  }, [location.search, activeOnly, sortOption]);

  const handleCategoryChange = (code: string) => {
    const newCode = categoryCode === code ? "" : code;
    navigate(`/search?${buildSearchQuery({ keyword, category: newCode })}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/search?${buildSearchQuery({ keyword, category: categoryCode })}`);
  };

  const handleActiveOnlyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setActiveOnly(e.target.checked);
  };

  const categoryName = categoryCode
    ? PRODUCT_CATEGORY_LABELS[categoryCode as keyof typeof PRODUCT_CATEGORY_LABELS]
    : "";

  return (
    <div className="container mx-auto py-8 min-h-[calc(100vh-120px)]">
      <p className="text-[32px] font-bold mb-4">
        {keyword || categoryCode
          ? `${keyword ? `${keyword} ` : ""}${categoryCode ? `${categoryName || "카테고리"} ` : ""}검색`
          : "전체 검색"}
      </p>

      <div className="flex justify-between mb-8">
        <form onSubmit={handleSearch} className="w-[800px] flex gap-2 mb-0">
          <input
            type="text"
            placeholder="상품 이름 검색"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full p-3 bg-white border border-[#ddd] rounded-xl text-[#aaa] text-sm font-normal whitespace-nowrap cursor-pointer focus:outline-none focus:text-[#b17576] focus:border-[#b17576]"
          />
          <SelectStyle
            value={categoryCode}
            onChange={(val) => {
              const newCode = val === "" ? "" : val;
              navigate(`/search?${buildSearchQuery({ keyword, category: newCode })}`);
            }}
            options={CATEGORY_OPTIONS}
            placeholder="전체 카테고리"
            className="min-w-[135px]"
          />
          <SelectStyle
            value={sortOption}
            onChange={(val) => setSortOption(val as SortOption)}
            options={[
              { value: "latest", label: "최신순" },
              { value: "oldest", label: "오래된순" },
              { value: "priceAsc", label: "가격 낮은순" },
              { value: "priceDesc", label: "가격 높은순" },
              { value: "timeLeft", label: "남은 시간순" },
              { value: "popularity", label: "인기순" },
            ]}
            placeholder="정렬"
            className="min-w-[118px]"
          />
          <button type="submit" className="w-fit p-3 bg-white border border-[#ddd] rounded-xl text-[#aaa] text-sm font-normal whitespace-nowrap cursor-pointer hover:text-[#b17576] hover:border-[#b17576]">
            검색
          </button>
        </form>
        <NavLink to="/register" className="w-fit p-3 bg-white border border-[#ddd] rounded-xl text-[#aaa] text-sm font-normal whitespace-nowrap cursor-pointer hover:text-[#b17576] hover:border-[#b17576]">
          상품등록
        </NavLink>
      </div>

      <div className="flex gap-9">
        <div className="w-[200px] flex flex-col gap-2 shrink-0">
          <div className="flex flex-col gap-1 border-b border-[#eee] pb-4 mb-4">
            <p className="text-2xl font-bold mb-4">필터</p>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={activeOnly} onChange={handleActiveOnlyChange} />
              <p>거래가능만 보기</p>
            </label>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xl font-semibold mb-4">카테고리</p>
            {CATEGORY_OPTIONS.map((c) => (
              <label key={c.value} className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors">
                <input
                  type="checkbox"
                  checked={categoryCode === c.value}
                  onChange={() => handleCategoryChange(c.value)}
                />
                <p>{c.label}</p>
              </label>
            ))}
          </div>
        </div>

        <div className="w-full">
          {loading ? (
            <p className="text-[#aaa] text-lg text-center py-10">불러오는 중...</p>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5">
              {products.map((p) => (
                <div
                  key={p.productId}
                  className="bg-white rounded-xl border border-[#ddd] overflow-hidden transition-all duration-300 hover:shadow-md cursor-pointer"
                  onClick={() => navigate(`/products/${p.productId}`)}
                >
                  <div className="w-full bg-[#eee] overflow-hidden relative h-[220px]">
                    {p.images && p.images.length > 0 ? (
                      <img
                        src={p.images[0].imagePath}
                        alt={p.title}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        onError={(e) => {
                          const parent = e.currentTarget.parentElement;
                          if (parent) parent.innerHTML = '<div class="flex justify-center items-center w-full h-full text-[#666] text-sm">이미지 없음</div>';
                        }}
                      />
                    ) : (
                      <div className="flex justify-center items-center w-full h-full text-[#666] text-sm">이미지 없음</div>
                    )}
                  </div>
                  <div className="p-5 flex flex-col gap-1 leading-[1.3]">
                    <h3 className="text-xl font-semibold mb-1 whitespace-nowrap text-[#333] truncate">{p.title}</h3>
                    <div>
                      <div className="flex gap-2">
                        <p className="text-base text-[#777] whitespace-nowrap">경매 등록가</p>
                        <p className="text-lg font-semibold text-[#333] whitespace-nowrap">{formatPrice(p.startingPrice)}</p>
                      </div>
                      {p.auctionEndTime && (
                        <>
                          <div className="flex gap-2">
                            <p className="text-base text-[#777] whitespace-nowrap">남은시간</p>
                            <p className="text-base text-[#777] whitespace-nowrap">
                              <span className="text-lg font-semibold text-[#333] whitespace-nowrap">{formatDate(p.auctionEndTime)}</span>
                            </p>
                          </div>
                          <p className="text-base text-[#777] whitespace-nowrap">({formatDateTime(p.auctionEndTime)})</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#aaa] text-lg text-center py-10">검색 결과가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}