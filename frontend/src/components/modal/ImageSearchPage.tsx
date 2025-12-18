import React, { useState, useRef } from "react";
import { searchByImageFile } from "../../common/api";
import ProductCard from "../ui/ProductCard";
import type { Product } from "../../common/types";
import { CATEGORY_OPTIONS, type ProductCategoryType } from "../../common/enums";
import SelectStyle from "../ui/SelectStyle";
import { ImagePlus, X, Search, Loader2 } from "lucide-react";

export default function ImageSearchPage() {
  // 상태 선언
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<ProductCategoryType | "">("");
  const [minSimilarity, setMinSimilarity] = useState(0.5); // 기본값 0.5로 상향 조정
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="container mx-auto px-4 py-8 xl:px-0 min-h-screen max-w-7xl">
      <div className="mb-8 text-left">
        <h1 className="text-3xl font-bold text-[#111] mb-2">이미지 검색</h1>
        <p className="text-gray-500">
          찾고 싶은 상품의 이미지를 업로드하여 유사한 상품을 찾아보세요.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
        {/* 왼쪽: 업로드 및 설정 패널 */}
        <div className="lg:col-span-1 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-[#111] mb-4 flex items-center gap-2">
              <ImagePlus size={20} />
              이미지 업로드
            </h2>

            {!previewUrl ? (
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-[#111] hover:bg-gray-50 transition-colors group"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-white border border-transparent group-hover:border-gray-200">
                  <ImagePlus className="text-gray-400 group-hover:text-[#111]" size={32} />
                </div>
                <p className="text-sm text-gray-500 font-medium">클릭하여 이미지 업로드</p>
                <p className="text-xs text-gray-400 mt-1">또는 이미지를 드래그 앤 드롭</p>
              </div>
            ) : (
              <div className="relative group">
                <div className="aspect-square w-full bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black text-white p-1.5 rounded-full transition-colors backdrop-blur-sm"
                >
                  <X size={16} />
                </button>
              </div>
            )}

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

            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                <X size={14} /> {error}
              </div>
            )}
          </div>

          {previewUrl && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-[#111] mb-4 flex items-center gap-2">
                <Search size={20} />
                검색 옵션
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">카테고리 필터</label>
                  <SelectStyle
                    value={categoryFilter}
                    onChange={(val) => setCategoryFilter(val as ProductCategoryType | "")}
                    options={CATEGORY_OPTIONS}
                    placeholder="전체 카테고리"
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">최소 유사도</label>
                    <span className="text-xs font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-600">{(minSimilarity * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={minSimilarity}
                    onChange={(e) => setMinSimilarity(parseFloat(e.target.value))}
                    className="w-full accent-[#111] h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>넓게 검색</span>
                    <span>정확하게</span>
                  </div>
                </div>

                <button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="w-full py-3 bg-[#111] text-white rounded-xl font-bold hover:bg-[#333] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} /> 검색 중...
                    </>
                  ) : (
                    "유사 상품 검색하기"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 오른쪽: 검색 결과 */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-bold text-[#111] mb-4 flex items-center justify-between">
            <span>검색 결과</span>
            {recommendations.length > 0 && (
              <span className="text-sm font-normal text-gray-500">{recommendations.length}개의 상품을 찾았습니다</span>
            )}
          </h2>

          {recommendations.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8">
              {recommendations.map((product) => (
                <ProductCard key={product.productId} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-12 text-center h-[400px] flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                <Search size={32} />
              </div>
              <p className="text-gray-500 font-medium mb-1">
                {isLoading ? "유사한 상품을 찾고 있습니다..." : "검색 결과가 없습니다"}
              </p>
              {!isLoading && (
                <p className="text-sm text-gray-400">
                  이미지를 업로드하고 검색해보세요
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
