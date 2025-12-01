import { useEffect, useState } from "react";
import { useNavigate, useLocation, NavLink } from "react-router-dom";
import { fetchFilteredProducts } from "../common/api";
import type { Product } from "../common/types";
import { CATEGORY_OPTIONS, PRODUCT_CATEGORY_LABELS } from "../common/enums";
import SelectBox from "../components/SelectBox";
import {
  formatDateTime,
  formatPrice,
  formatDate,
  parseWithTZ,
  buildSearchQuery
} from "../common/util";
import type { SortOption } from "../common/util";

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
    <div className="container">
      <p className="title-32 mb-1rem">
        {keyword || categoryCode
          ? `${keyword ? `${keyword} ` : ""}${categoryCode ? `${categoryName || "카테고리"} ` : ""}검색`
          : "전체 검색"}
      </p>

      <div className="flex-box flex-between" style={{ marginBottom: "2rem" }}>
        <form onSubmit={handleSearch} className="search-form" style={{ marginBottom: 0 }}>
          <input
            type="text"
            placeholder="상품 이름 검색"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="search-input"
          />
          <SelectBox
            value={categoryCode}
            onChange={(val) => {
              const newCode = val === "" ? "" : val;
              navigate(`/search?${buildSearchQuery({ keyword, category: newCode })}`);
            }}
            options={CATEGORY_OPTIONS}
            placeholder="전체 카테고리"
            className="min135"
          />
          <SelectBox
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
            className="min118"
          />
          <button type="submit" className="search-btn">
            검색
          </button>
        </form>
        <NavLink to="/register" className="search-btn">
          상품등록
        </NavLink>
      </div>

      <div className="flex-box gap-36">
        <div className="category-sidebar flex-column gap-8">
          <div className="category-checkbox-group flex-column gap-4">
            <p className="title-24 mb-1rem">필터</p>
            <label className="category-label flex-box gap-4">
              <input type="checkbox" checked={activeOnly} onChange={handleActiveOnlyChange} />
              <p>거래가능만 보기</p>
            </label>
          </div>
          <div className="category-checkbox-group flex-column gap-4">
            <p className="title-20 mb-1rem">카테고리</p>
            {CATEGORY_OPTIONS.map((c) => (
              <label key={c.value} className="category-label flex-box gap-4">
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

        <div className="product-area">
          {loading ? (
            <p className="no-content-text">불러오는 중...</p>
          ) : products.length > 0 ? (
            <div className="search-results-grid">
              {products.map((p) => (
                <div
                  key={p.productId}
                  className="product-card"
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/products/${p.productId}`)}
                >
                  <div className="product-image height-220">
                    {p.images && p.images.length > 0 ? (
                      <img
                        src={p.images[0].imagePath}
                        alt={p.title}
                        onError={(e) => {
                          const parent = e.currentTarget.parentElement;
                          if (parent) parent.innerHTML = '<div class="no-image-txt">이미지 없음</div>';
                        }}
                      />
                    ) : (
                      <div className="no-image-txt">이미지 없음</div>
                    )}
                  </div>
                  <div className="product-info flex-column gap-4">
                    <h3 className="title-20 mb-4 text-nowrap color-333 text-ellipsis">{p.title}</h3>
                    <div>
                      <div className="flex-box gap-8">
                        <p className="text-16 color-777 text-nowrap">경매 등록가</p>
                        <p className="title-18 color-333 text-nowrap">{formatPrice(p.startingPrice)}</p>
                      </div>
                      {p.auctionEndTime && (
                        <>
                          <div className="flex-box gap-8">
                            <p className="text-16 color-777 text-nowrap">남은시간</p>
                            <p className="text-16 color-777 text-nowrap">
                              <span className="title-18 color-333 text-nowrap">{formatDate(p.auctionEndTime)}</span>
                            </p>
                          </div>
                          <p className="text-16 color-777 text-nowrap">({formatDateTime(p.auctionEndTime)})</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-content-text">검색 결과가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}