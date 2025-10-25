import { useEffect, useState } from "react";
import { useNavigate, useLocation, NavLink } from "react-router-dom";
import { API_BASE_URL } from "../services/api";
import type { Product, Category } from "../types/types";
import SelectBox from "../components/SelectBox";
import { formatDateTime } from "../utils/date";

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

  const formatPrice = (price?: number) =>
    !price ? "가격 미정" : `${price.toLocaleString()}원`;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}일 후`;
    if (hours > 0) return `${hours}시간 후`;
    return "곧 종료";
  };

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
      | "popularity" = "latest"
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
      const data: Product[] = await res.json();
      let sorted = [...data];

      // 🔹 인기순일 경우, 각 상품 찜 수 가져오기
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
              (a, b) =>
                (a.price ?? a.startingPrice ?? 0) -
                (b.price ?? b.startingPrice ?? 0)
            );
            break;
          case "priceDesc":
            sorted.sort(
              (a, b) =>
                (b.price ?? b.startingPrice ?? 0) -
                (a.price ?? a.startingPrice ?? 0)
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

      setProducts(sorted);
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
    const cat = params.get("category") ? Number(params.get("category")) : "";

    setKeyword(kw);
    setCategoryId(cat);

    // URL 기반으로 바로 fetch
    fetchProducts(kw, cat, activeOnly, sortOption);
  }, [location.search, activeOnly, sortOption]);

  const handleCategoryChange = (id: number) => {
    const newCat = categoryId === id ? "" : id;
    const query = new URLSearchParams();
    if (keyword) query.append("keyword", keyword.trim());
    if (newCat) query.append("category", newCat.toString());
    navigate(`/search?${query.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams();
    if (keyword) query.append("keyword", keyword.trim());
    if (categoryId) query.append("category", categoryId.toString());
    navigate(`/search?${query.toString()}`);
  };

  const handleActiveOnlyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setActiveOnly(e.target.checked);
  };

  return (
    <div className="container">
      <p className="page-title">
        {keyword || categoryId
          ? `${keyword ? `${keyword} ` : ""}${
              categoryId
                ? `${
                    categories.find((c) => c.categoryId === categoryId)?.name
                  } `
                : ""
            }검색`
          : "전체 검색"}
      </p>

      <div className="flex-box between" style={{ marginBottom: "2rem" }}>
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
            <p className="title-lg">필터</p>
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
            <p className="title-md">카테고리</p>
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
                  <div className="product-image">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.title} />
                    ) : (
                      <div className="no-image">이미지 없음</div>
                    )}
                  </div>
                  <div className="product-info flex-column gap-4">
                    <h3 className="product-title">{p.title}</h3>
                    <div>
                      <div className="flex-box gap-8">
                        <p className="product-text-sm">경매 등록가</p>
                        <p className="product-text-lg">
                          {formatPrice(p.startingPrice ?? p.price)}
                        </p>
                      </div>
                      {p.auctionEndTime && (
                        <>
                          <div className="flex-box gap-8">
                            <p className="product-text-sm">남은시간</p>
                            <p className="product-text-sm">
                              <span className="product-text-lg">
                                {formatDate(p.auctionEndTime)}
                              </span>
                            </p>
                          </div>
                          <p className="product-text-sm">
                            ({formatDateTime(p.auctionEndTime)})
                          </p>
                        </>
                      )}
                    </div>
                    <button
                      className="btn-bid"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/products/${p.productId}`);
                      }}
                    >
                      입찰하기
                    </button>
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
