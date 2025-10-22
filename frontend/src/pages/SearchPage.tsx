import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { API_BASE_URL } from "../services/api";
import type { Product, Category } from "../types/types";
import SelectBox from "../components/SelectBox";

export default function ProductSearchPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [keyword, setKeyword] = useState(""); // 검색어
  const [categoryId, setCategoryId] = useState<number | "">(""); // 선택 카테고리
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

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
  const fetchProducts = async (kw: string, cat: number | "") => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (kw) query.append("keyword", kw);
      if (cat) query.append("category", cat.toString());

      const res = await fetch(
        `${API_BASE_URL}/api/products/search?${query.toString()}`
      );
      if (!res.ok) throw new Error("상품 검색 실패");

      const data: Product[] = await res.json();
      setProducts(data);
    } catch (err) {
      console.error(err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // URL 쿼리 변화를 감지해서 검색
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const kw = params.get("keyword") || "";
    const catId = params.get("category") || "";

    setKeyword(kw);
    setCategoryId(catId ? Number(catId) : "");

    // keyword나 category가 있으면 검색 실행
    if (kw || catId) {
      fetchProducts(kw, catId ? Number(catId) : "");
    } else {
      setProducts([]);
    }
  }, [location.search]);

  const query = new URLSearchParams();

  // 검색 버튼 클릭
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // URL을 바꾸면 useEffect에서 자동 검색
    if (keyword) query.append("keyword", keyword.trim());
    if (categoryId) query.append("category", categoryId.toString());

    navigate(`/search?${query.toString()}`);
  };

  return (
    <div className="container">
      <p className="page-title">
        {keyword && `${keyword}`}{" "}
        {categoryId
          ? `(${categories.find((c) => c.categoryId === categoryId)?.name})`
          : ""}{" "}
        검색
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

      {/* 검색 결과 */}
      {loading ? (
        <p className="text-gray-500 text-center">검색 중...</p>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {products.map((p) => (
            <div
              key={p.productId}
              onClick={() => navigate(`/products/${p.productId}`)}
              className="border rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition"
            >
              {p.imageUrl && (
                <img
                  src={p.imageUrl}
                  alt={p.title}
                  className="w-full h-40 object-cover rounded-md mb-2"
                />
              )}
              <h3 className="text-sm font-medium">{p.title}</h3>
              {p.categoryName && (
                <p className="text-gray-500 text-xs">{p.categoryName}</p>
              )}
              {p.price && (
                <p className="text-gray-700 font-semibold text-sm mt-1">
                  {p.price.toLocaleString()}원
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="no-content-text">검색 결과가 없습니다.</p>
      )}
    </div>
  );
}
