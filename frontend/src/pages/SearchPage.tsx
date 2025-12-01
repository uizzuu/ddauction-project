import { useEffect, useState } from "react";
import { useNavigate, useLocation, NavLink } from "react-router-dom";
import { API_BASE_URL } from "../common/api";
import type { Product } from "../common/types"; // Option 타입 사용
import { CATEGORY_OPTIONS, PRODUCT_CATEGORY_LABELS } from "../common/enums"; // 정적 카테고리 데이터 import
import SelectBox from "../components/SelectBox";
import { formatDateTime, formatPrice, formatDate } from "../common/util";

// SortOption 타입 재정의 (로컬에서 정의)
type SortOption = "latest" | "oldest" | "priceAsc" | "priceDesc" | "timeLeft" | "popularity";

export default function ProductSearchPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [keyword, setKeyword] = useState("");
  // 1. number ID 대신 string code 사용
  const [categoryCode, setCategoryCode] = useState<string | "">(""); 
  const [activeOnly, setActiveOnly] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // 최신순, 오래된순, 가격 낮은순, 가격 높은순, 남은시간순, 인기순
  const [sortOption, setSortOption] = useState<SortOption>("latest");

  // 🚨 제거: 카테고리 목록 상태 (categories) 및 fetch 로직 제거

  // 한국 시간대(+09:00) 기준으로 문자열을 Date로 파싱하는 함수
  const parseWithTZ = (s: string) => {
    if (!s) return new Date(0);
    // 이미 타임존(+09:00, Z 등)이 포함돼 있으면 그대로 처리
    if (/[Zz]|[+-]\d{2}:\d{2}$/.test(s)) return new Date(s);
    // 없으면 한국 시간대 기준으로 보정
    return new Date(`${s}+09:00`);
  };

  const fetchProducts = async (
    kw: string = "",
    catCode: string | "" = "", // string code로 변경
    active: boolean = false,
    sort: SortOption = "latest"
  ) => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/api/products`;
      const query = new URLSearchParams();
      if (kw) query.append("keyword", kw);
      if (catCode) query.append("category", catCode); // .toString() 제거, string code 사용
      if (active) query.append("productStatus", "ACTIVE");

      if (kw || catCode || active) {
        url = `${API_BASE_URL}/api/products/search?${query.toString()}`;
      }
      console.log("🔹 상품 fetch URL:", url); // 🔹 URL 확인
      const res = await fetch(url);
      console.log("🔹 fetch 응답 상태:", res.status); // 🔹 응답 상태
      if (!res.ok) throw new Error("상품 불러오기 실패");
      let data: Product[] = await res.json();
      console.log("🔹 서버에서 받은 데이터:", data); // 🔹 데이터 확인

      // 거래 가능만 보기 필터
      if (active) {
        const now = new Date();
        data = data.filter(
          (p) =>
            p.productStatus === "ACTIVE" &&
            new Date(p.auctionEndTime).getTime() > now.getTime()
        );
        console.log("🔹 거래 가능 필터 적용 후 데이터:", data);
      }

      let sorted = [...data];

      // 인기순 정렬 (기존 로직 유지)
      if (sort === "popularity") {
        const productsWithBookmarkCount = await Promise.all(
          sorted.map(async (p) => {
            const res = await fetch(
              `${API_BASE_URL}/api/bookmarks/count?productId=${p.productId}`
            );
            const count = await res.json();
            return { ...p, bookmarkCount: count };
          })
        );
        sorted = productsWithBookmarkCount.sort(
          (a, b) => (b.bookmarkCount ?? 0) - (a.bookmarkCount ?? 0)
        );
      } else {
        switch (sort) {
          case "latest":
            sorted.sort(
              (a, b) =>
                (new Date(b.createdAt || "").getTime() || 0) -
                (new Date(a.createdAt || "").getTime() || 0)
            );
            break;
          case "oldest":
            sorted.sort(
              (a, b) =>
                (new Date(a.createdAt || "").getTime() || 0) -
                (new Date(b.createdAt || "").getTime() || 0)
            );
            break;
          case "priceAsc":
            sorted.sort(
              (a, b) => (a.startingPrice ?? 0) - (b.startingPrice ?? 0)
            );
            break;
          case "priceDesc":
            sorted.sort(
              (a, b) => (b.startingPrice ?? 0) - (a.startingPrice ?? 0)
            );
            break;

          case "timeLeft":
            sorted.sort(
              (a, b) =>
                parseWithTZ(a.auctionEndTime).getTime() -
                parseWithTZ(b.auctionEndTime).getTime()
            );
            break;
        }
      }
      setProducts(sorted);
      console.log("🔹 최종 화면에 표시할 products:", sorted); // 🔹 최종
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
    // Number() 변환 제거, string code를 그대로 사용
    const catCode = params.get("category") || ""; 

    setKeyword(kw);
    setCategoryCode(catCode);

    // string code를 fetchProducts에 전달
    fetchProducts(kw, catCode, activeOnly, sortOption);
  }, [location.search, activeOnly, sortOption]);

  // 카테고리 변경 핸들러 (string code 사용)
  const handleCategoryChange = (code: string) => {
    const newCode = categoryCode === code ? "" : code;
    const query = new URLSearchParams();
    if (keyword) query.append("keyword", keyword.trim());
    if (newCode) query.append("category", newCode); // string code 사용
    query.append("page", "0");
    navigate(`/search?${query.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams();
    if (keyword) query.append("keyword", keyword.trim());
    if (categoryCode) query.append("category", categoryCode); // string code 사용
    query.append("page", "0");
    navigate(`/search?${query.toString()}`);
  };

  const handleActiveOnlyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setActiveOnly(e.target.checked);
  };
  
  // 카테고리 이름 찾기: string code를 PRODUCT_CATEGORY_LABELS에서 직접 찾음
  const categoryName = categoryCode ? PRODUCT_CATEGORY_LABELS[categoryCode as keyof typeof PRODUCT_CATEGORY_LABELS] : "";


  return (
    <div className="container">
      <p className="title-32 mb-1rem">
        {keyword || categoryCode
          ? `${keyword ? `${keyword} ` : ""}${
              categoryCode
                ? `${categoryName || "카테고리"} ` 
                : ""
            }검색`
          : "전체 검색"}
      </p>

      <div className="flex-box flex-between" style={{ marginBottom: "2rem" }}>
        <form
          onSubmit={handleSearch}
          className="search-form"
          style={{ marginBottom: 0 }}
        >
          <input
            type="text"
            placeholder="상품 이름 검색"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="search-input"
          />
          <SelectBox
            // string code 사용
            value={categoryCode}
            onChange={(val) => {
                const newCode = val === "" ? "" : val;
                const query = new URLSearchParams();
                if (keyword) query.append("keyword", keyword.trim());
                if (newCode) query.append("category", newCode); // string code 사용
                query.append("page", "0");
                navigate(`/search?${query.toString()}`);
            }}
            // CATEGORY_OPTIONS (정적 데이터) 사용
            options={CATEGORY_OPTIONS} 
            placeholder="전체 카테고리"
            className="min135"
          />
          <SelectBox
            value={sortOption}
            onChange={(val) =>
              setSortOption(val as SortOption)
            }
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
              <input
                type="checkbox"
                checked={activeOnly}
                onChange={handleActiveOnlyChange}
              />
              <p>거래가능만 보기</p>
            </label>
          </div>
          <div className="category-checkbox-group flex-column gap-4">
            <p className="title-20 mb-1rem">카테고리</p>
            {/* CATEGORY_OPTIONS (정적 데이터) 사용 */}
            {CATEGORY_OPTIONS.map((c) => ( 
              <label
                key={c.value} // value(code)를 key로 사용
                className="category-label flex-box gap-4"
              >
                <input
                  type="checkbox"
                  checked={categoryCode === c.value} // code로 비교
                  onChange={() => handleCategoryChange(c.value)} // code를 전달
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
                          if (parent) {
                            parent.innerHTML =
                              '<div class="no-image-txt">이미지 없음</div>';
                          }
                        }}
                      />
                    ) : (
                      <div className="no-image-txt">이미지 없음</div>
                    )}
                  </div>
                  <div className="product-info flex-column gap-4">
                    <h3 className="title-20 mb-4 text-nowrap color-333 text-ellipsis">
                      {p.title}
                    </h3>
                    <div>
                      <div className="flex-box gap-8">
                        <p className="text-16 color-777 text-nowrap">
                          경매 등록가
                        </p>
                        <p className="title-18 color-333 text-nowrap">
                          {formatPrice(p.startingPrice)}
                        </p>
                      </div>
                      {p.auctionEndTime && (
                        <>
                          <div className="flex-box gap-8">
                            <p className="text-16 color-777 text-nowrap">
                              남은시간
                            </p>
                            <p className="text-16 color-777 text-nowrap">
                              <span className="title-18 color-333 text-nowrap">
                                {formatDate(p.auctionEndTime)}
                              </span>
                            </p>
                          </div>
                          <p className="text-16 color-777 text-nowrap">
                            ({formatDateTime(p.auctionEndTime)})
                          </p>
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