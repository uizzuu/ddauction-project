import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../services/api";
import type { Product, Category } from "../types/types";
import SelectBox from "../components/SelectBox";

export default function ProductSearchPage() {
  const navigate = useNavigate();

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
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (keyword) query.append("keyword", keyword);
      if (categoryId) query.append("category", categoryId.toString());

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

  // 검색 버튼 클릭
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  return (
    <div className="container">
      <h1 className="page-title">상품 검색</h1>

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
