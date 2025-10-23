import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { API_BASE_URL } from "../services/api";
import type { Product, Category } from "../types/types";
import SelectBox from "../components/SelectBox";
import { formatDateTime } from "../utils/date";

export default function ProductSearchPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [keyword, setKeyword] = useState(""); // 검색어
  const [categoryId, setCategoryId] = useState<number | "">(""); // 선택 카테고리
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  // 가격 표시 포맷
  const formatPrice = (price?: number) => {
    if (!price) return "가격 미정";
    return `${price.toLocaleString()}원`;
  };

  // 종료 시간 포맷
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

  // 카테고리 목록 불러오기
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

  // 상품 검색
  const fetchProducts = async (kw: string = "", cat: number | "" = "") => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/api/products`;

      if (kw || cat) {
        const query = new URLSearchParams();
        if (kw) query.append("keyword", kw);
        if (cat) query.append("category", cat.toString());
        query.append("sort", "latest"); // 최신순 정렬
        url = `${API_BASE_URL}/api/products/search?${query.toString()}`;
      } else {
        // 검색어와 카테고리가 없을 때도 최신순
        url += "?sort=latest";
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error("상품 불러오기 실패");
      const data: Product[] = await res.json();
      setProducts(data);
    } catch (err) {
      console.error(err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ URL → 상태 반영 & 검색 실행 (한 방향만)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const kw = params.get("keyword") || "";
    const cat = params.get("category") || "";

    setKeyword(kw);
    setCategoryId(cat ? Number(cat) : "");

    fetchProducts(kw, cat ? Number(cat) : "");
  }, [location.search]);

  // 카테고리 체크박스 클릭 시 URL 갱신
  const handleCategoryChange = (id: number) => {
    const newCat = categoryId === id ? "" : id;
    const query = new URLSearchParams();
    if (keyword) query.append("keyword", keyword.trim());
    if (newCat) query.append("category", newCat.toString());
    navigate(`/search?${query.toString()}`);
  };

  // 검색 버튼 클릭 시 URL 갱신
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams();
    if (keyword) query.append("keyword", keyword.trim());
    if (categoryId) query.append("category", categoryId.toString());
    navigate(`/search?${query.toString()}`);
  };

  return (
    <div className="container">
      {/* 검색어 표시 */}
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

      {/* 검색 폼 */}
      <form onSubmit={handleSearch} className="search-form">
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
        />
        <button type="submit" className="search-btn">
          검색
        </button>
      </form>
      <div className="search-page flex-box gap-36">
        <div className="category-sidebar">
          <div className="category-checkbox-group flex-column gap-4">
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
          {/* 검색 결과 */}
          {loading ? (
            <p className="text-gray-500 text-center">불러오는 중...</p>
          ) : products.length > 0 ? (
            <div className="product-grid">
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
                          {formatPrice(p.startingPrice || p.price)}
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
