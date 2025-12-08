import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { searchByImageFile } from "../../common/api";

import type { Product, ProductCategoryType } from "../../common/types";

// 🔥 프론트 전용 카테고리 라벨 테이블
// 👉 enums.ts 의 PRODUCT_CATEGORIES와 동일 구조로 만들어야 함
const CATEGORY_LABELS: Record<ProductCategoryType, string> = {
  ELECTRONICS: "디지털기기",
  APPLIANCES: "생활가전",
  FURNITURE_INTERIOR: "가구/인테리어",
  KITCHENWARE: "생활/주방",
  FOODS: "식품",
  KIDS: "유아동",
  BOOKS: "도서",
  STATIONERY: "문구류",
  CLOTHING: "의류",
  ACCESSORIES: "잡화",
  BEAUTY: "뷰티/미용",
  SPORTS: "스포츠레저",
  ENTERTAINMENT: "취미/게임/음반",
  TICKETS: "티켓/교환권",
  PET: "반려동물용품",
  PLANTS: "식물",
  ETC: "기타 물품",
};

// 모든 key 가져오기
const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS) as ProductCategoryType[];

// 🔥 Product에 currentPrice 필드가 없기 때문에 계산 함수 필요
const getCurrentPrice = (p: Product) => {
  if (p.bidPrice != null) return p.bidPrice;
  if (p.bids && p.bids.length > 0) return p.bids[p.bids.length - 1].bidPrice;
  return p.startingPrice ? Number(p.startingPrice) : 0;
};

export default function ImageSearchPage() {
  const navigate = useNavigate();

  // 상태 선언
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<ProductCategoryType | "">("");
  const [minSimilarity, setMinSimilarity] = useState(0.3);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // 카테고리 옵션 (Select용)
  const categoryOptions = [
    { value: "" as const, label: "전체" },
    ...CATEGORY_KEYS.map((key) => ({
      value: key,
      label: CATEGORY_LABELS[key],
    })),
  ];

  // 이미지 선택
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 가능합니다.");
      return;
    }

    setSelectedImage(file);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  // 이미지 삭제
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setError(null);
    setRecommendations([]);

    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  // 검색 실행
  const handleSearch = async () => {
    if (!selectedImage) {
      setError("이미지를 먼저 선택해주세요.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await searchByImageFile({
        file: selectedImage,
        limit: 12,
        category_filter: categoryFilter || undefined,
        min_similarity: minSimilarity,
      });

      setRecommendations(result);

      if (result.length === 0) {
        setError("유사한 상품을 찾지 못했습니다.");
      }
    } catch (err) {
      setError("이미지 검색 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("ko-KR").format(value);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-8">

        <h1 className="text-4xl font-bold text-center mb-10">
          📸 이미지 검색
        </h1>

        {/* 이미지 업로드 박스 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">

          {!previewUrl ? (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-16 text-center cursor-pointer">
              <div className="text-6xl mb-4">📷</div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg"
              >
                이미지 업로드
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          ) : (
            <div className="relative">
              <img
                src={previewUrl}
                className="w-full max-h-[500px] object-contain rounded-xl border"
              />

              <button
                onClick={handleRemoveImage}
                className="absolute top-3 right-3 bg-red-500 text-white w-10 h-10 flex items-center justify-center rounded-full"
              >
                ✕
              </button>
            </div>
          )}

          {/* 검색 옵션 */}
          {previewUrl && (
            <div className="mt-6 bg-gray-50 p-6 rounded-xl space-y-6">

              {/* 카테고리 */}
              <div>
                <label className="font-semibold">카테고리</label>
                <select
                  value={categoryFilter}
                  onChange={(e) =>
                    setCategoryFilter(e.target.value as ProductCategoryType | "")
                  }
                  className="w-full px-3 py-2 border rounded-lg mt-1"
                >
                  {categoryOptions.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 유사도 */}
              <div>
                <label className="font-semibold">
                  최소 유사도: {(minSimilarity * 100).toFixed(0)}%
                </label>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={minSimilarity}
                  onChange={(e) => setMinSimilarity(parseFloat(e.target.value))}
                  className="w-full mt-2"
                />
              </div>

              <button
                onClick={handleSearch}
                disabled={isLoading}
                className={`w-full py-3 rounded-lg text-white font-bold ${
                  isLoading ? "bg-gray-400" : "bg-purple-600 hover:bg-purple-700"
                }`}
              >
                {isLoading ? "검색 중..." : "검색하기"}
              </button>
            </div>
          )}

          {error && <p className="text-red-500 mt-4">{error}</p>}
        </div>

        {/* 검색 결과 */}
        {recommendations.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">
              유사한 상품 ({recommendations.length}개)
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {recommendations.map((product) => (
                <div
                  key={product.productId}
                  className="border rounded-xl overflow-hidden cursor-pointer bg-white shadow-sm hover:shadow-lg transition"
                  onClick={() => navigate(`/product/${product.productId}`)}
                >
                  <img
                    src={product.images?.[0]?.imagePath}
                    className="w-full aspect-square object-cover bg-gray-200"
                  />

                  <div className="p-4">
                    <h3 className="font-bold mb-2 line-clamp-2">
                      {product.title}
                    </h3>

                    <div className="text-purple-600 font-bold text-lg">
                      {formatPrice(getCurrentPrice(product))}원
                    </div>

                    {/* 카테고리 라벨 */}
                    {product.productCategoryType && (
                      <div className="text-sm text-gray-500">
                        {CATEGORY_LABELS[product.productCategoryType] ??
                          product.productCategoryType}
                      </div>
                    )}

                    <div className="text-xs text-gray-400 mt-1">
                      조회수: {product.viewCount ?? 0}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
