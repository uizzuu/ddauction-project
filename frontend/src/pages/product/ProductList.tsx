import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchFilteredProducts } from "../../common/api";
import type { Product } from "../../common/types";
import SelectStyle from "../../components/ui/form/SelectStyle";
import {
  formatPrice,
  formatDate,
  parseWithTZ
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

  const handleActiveOnlyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setActiveOnly(e.target.checked);
  };

  return (
    <div className="container mx-auto py-8 min-h-[calc(100vh-120px)]">
      {/* Top Bar: Total Count + Filters */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm font-bold text-[#333]">
          <span className="text-[#333]">{products.length.toLocaleString()}</span> 개
        </p>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-[#555] hover:text-[#b17576]">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={handleActiveOnlyChange}
              className="accent-[#b17576]"
            />
            <span>거래가능만 보기</span>
          </label>

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
            className="w-[120px]"
          />
        </div>
      </div>

      <div className="w-full">
        {loading ? (
          <p className="text-[#aaa] text-lg text-center py-10">불러오는 중...</p>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-4 gap-x-6 gap-y-10">
            {products.map((p) => (
              <div
                key={p.productId}
                className="flex flex-col gap-3 group cursor-pointer"
                onClick={() => navigate(`/products/${p.productId}`)}
              >
                <div className="w-full bg-[#f4f4f4] overflow-hidden relative aspect-square rounded-lg border border-[#eee]">
                  {p.images && p.images.length > 0 ? (
                    <img
                      src={p.images[0].imagePath}
                      alt={p.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        const parent = e.currentTarget.parentElement;
                        if (parent) parent.innerHTML = '<div class="flex justify-center items-center w-full h-full text-[#aaa] text-xs">이미지 없음</div>';
                      }}
                    />
                  ) : (
                    <div className="flex justify-center items-center w-full h-full text-[#aaa] text-xs">이미지 없음</div>
                  )}
                  {/* Status Badge */}
                  {p.productStatus !== "ACTIVE" && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-lg">
                      {p.productStatus === "SOLD_OUT" ? "판매완료" : "거래종료"}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  {/* Brand/Seller Info (Mockup based on header) */}
                  <span className="text-[11px] text-[#999] font-medium truncate">
                    {p.sellerNickName || "판매자"}
                  </span>

                  <h3 className="text-sm font-normal text-[#333] truncate leading-tight">
                    {p.title}
                  </h3>

                  <div className="mt-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-base font-bold text-[#333]">{formatPrice(p.startingPrice)}</span>
                      {/* If we had original price logic, we'd add strikethrough here */}
                    </div>

                    {p.auctionEndTime && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-[#b17576] font-medium bg-[#fff0f0] px-1.5 py-0.5 rounded">
                          {formatDate(p.auctionEndTime)} 남음
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-[#aaa]">
            <p className="text-lg mb-2">검색 결과가 없습니다.</p>
            <p className="text-sm">다른 키워드로 검색해보세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}