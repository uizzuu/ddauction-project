import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getVisualSimilarProducts } from "../../../common/api";
import type { Product } from "../../../common/types";
import { PRODUCT_CATEGORIES } from "../../../common/enums";

interface Props {
  productId: number;
}

export default function VisualSimilarProducts({ productId }: Props) {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSimilarProducts();
  }, [productId]);

  const loadSimilarProducts = async () => {
    try {
      setIsLoading(true);
      const result = await getVisualSimilarProducts(productId, 6);
      setProducts(result);
    } catch (error) {
      console.error("시각적 유사 상품 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price);
  };

  const handleProductClick = (id: number) => {
    navigate(`/product/${id}`);
    window.scrollTo(0, 0);
  };

  if (isLoading) {
    return (
      <div className="py-12">
        <div className="flex items-center gap-3 mb-6">
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900">비슷한 상품</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-lg mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="py-12 border-t border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h2 className="text-2xl font-bold text-gray-900">비슷한 상품</h2>
        <span className="text-sm text-gray-500">AI가 이미지로 찾은 상품</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {products.map((product) => (
          <div
            key={product.productId}
            onClick={() => handleProductClick(product.productId)}
            className="group cursor-pointer"
          >
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
              {product.images && product.images[0]?.imagePath ? (
                <img
                  src={product.images[0].imagePath}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              
              {/* 유사도 배지 */}
              {(product as any).similarity_score && (
                <div className="absolute top-2 right-2 px-2 py-1 bg-purple-600 text-white text-xs font-bold rounded-full">
                  {((product as any).similarity_score * 100).toFixed(0)}%
                </div>
              )}
            </div>

            <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1 group-hover:text-purple-600 transition-colors">
              {product.title}
            </h3>
            <p className="text-base font-bold text-purple-600">
              {formatPrice(product.bidPrice || product.startingPrice || 0)}원
            </p>
            
            {product.productCategoryType && (
              <span className="inline-block text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded mt-1">
                {PRODUCT_CATEGORIES[product.productCategoryType]}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}