import { useEffect, useState } from "react";
import { useNavigate, useLocation, NavLink } from "react-router-dom";
import { API_BASE_URL } from "../services/api";
import type { Product, Category } from "../types/types";
import SelectBox from "../components/SelectBox";
import { formatDateTime, formatPrice, formatDate } from "../utils/util";

export default function ProductSearchPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [keyword, setKeyword] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [activeOnly, setActiveOnly] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // 최신순, 오래된순, 가격 낮은순, 가격 높은순, 남은시간순, 인기순
  const [sortOption, setSortOption] = useState<
    "latest" | "oldest" | "priceAsc" | "priceDesc" | "timeLeft" | "popularity"
  >("latest");

  // ▼ 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 2; // 한 페이지에 보여줄 상품 수

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/categories`);
        if (!res.ok) throw new Error("카테고리 로드 실패");
        const data: Category[] = await res.json();
        setCategories(data.sort((a, b) => a.categoryId - b.categoryId));
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategories();
  }, []);

  const fetchProducts = async (
    kw: string = "",
    cat: number | "" = "",
    active: boolean = false,
    sort:
      | "latest"
      | "oldest"
      | "priceAsc"
      | "priceDesc"
      | "timeLeft"
      | "popularity" = "latest",
    page: number = 0 // ▼ 페이지네이션 적용
  ) => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/api/products`;
      const query = new URLSearchParams();
      if (kw) query.append("keyword", kw);
      if (cat) query.append("category", cat.toString());
      if (active) query.append("productStatus", "ACTIVE");

      if (kw || cat || active) {
        url = `${API_BASE_URL}/api/products/search?${query.toString()}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("상품 불러오기 실패");
      let data: Product[] = await res.json();

      // 거래 가능만 보기 필터
      if (active) {
        const now = new Date();
        data = data.filter(
          (p) =>
            p.productStatus === "ACTIVE" &&
            new Date(p.auctionEndTime).getTime() > now.getTime()
        );
      }

      let sorted = [...data];

      // 인기순 정렬
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
                (new Date(a.auctionEndTime).getTime() || 0) -
                (new Date(b.auctionEndTime).getTime() || 0)
            );
            break;
        }
      }

      // ▼ 페이지네이션: 총 페이지 계산 후 현재 페이지 상품 slice
      setTotalPages(Math.ceil(sorted.length / PAGE_SIZE));
      const pagedProducts = sorted.slice(
        page * PAGE_SIZE,
        (page + 1) * PAGE_SIZE
      );
      setProducts(pagedProducts);
    } catch (err) {
      console.error("❌ 상품 검색 중 오류 발생:", err);
      setProducts([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const kw = params.get("keyword") || "";
    const cat = params.get("category") ? Number(params.get("category")) : "";
    const page = params.get("page") ? Number(params.get("page")) : 0;

    setKeyword(kw);
    setCategoryId(cat);
    setCurrentPage(page);

    fetchProducts(kw, cat, activeOnly, sortOption, page);
  }, [location.search, activeOnly, sortOption]);

  const handleCategoryChange = (id: number) => {
    const newCat = categoryId === id ? "" : id;
    const query = new URLSearchParams();
    if (keyword) query.append("keyword", keyword.trim());
    if (newCat) query.append("category", newCat.toString());
    query.append("page", "0");
    navigate(`/search?${query.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams();
    if (keyword) query.append("keyword", keyword.trim());
    if (categoryId) query.append("category", categoryId.toString());
    query.append("page", "0");
    navigate(`/search?${query.toString()}`);
  };

  const handleActiveOnlyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setActiveOnly(e.target.checked);
  };

  // ▼ 페이지네이션 버튼
  const goPrevPage = () => {
    if (currentPage > 0) updatePage(currentPage - 1);
  };
  const goNextPage = () => {
    if (currentPage + 1 < totalPages) updatePage(currentPage + 1);
  };
  const updatePage = (page: number) => {
    const query = new URLSearchParams(location.search);
    query.set("page", page.toString());
    navigate(`/search?${query.toString()}`);
  };

  return (
    <div className="container">
      <p className="title-32 mb-1rem">
        {keyword || categoryId
          ? `${keyword ? `${keyword} ` : ""}${
              categoryId
                ? `${categories.find((c) => c.categoryId === categoryId)?.name} `
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
            value={categoryId === "" ? "" : String(categoryId)}
            onChange={(val) => setCategoryId(val === "" ? "" : Number(val))}
            options={categories.map((c) => ({
              value: String(c.categoryId),
              label: c.name,
            }))}
            placeholder="전체 카테고리"
            className="min135"
          />
          <SelectBox
            value={sortOption}
            onChange={(val) =>
              setSortOption(
                val as
                  | "latest"
                  | "oldest"
                  | "priceAsc"
                  | "priceDesc"
                  | "timeLeft"
                  | "popularity"
              )
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
            {categories.map((c) => (
              <label
                key={c.categoryId}
                className="category-label flex-box gap-4"
              >
                <input
                  type="checkbox"
                  checked={categoryId === c.categoryId}
                  onChange={() => handleCategoryChange(c.categoryId)}
                />
                <p>{c.name}</p>
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
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.title} />
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

          {/* ▼ 페이지네이션 */}
          {totalPages > 1 && (
            <div className="pagination flex-box gap-8" style={{ marginTop: "2rem" }}>
              <button onClick={goPrevPage} disabled={currentPage === 0}>
                이전
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => updatePage(i)}
                  className={i === currentPage ? "active-page" : ""}
                >
                  {i + 1}
                </button>
              ))}
              <button onClick={goNextPage} disabled={currentPage + 1 === totalPages}>
                다음
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
