import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchProductById, createProductReview, API_BASE_URL } from "../../common/api";
import type * as TYPE from "../../common/types";
import { Star, ChevronLeft } from "lucide-react";

export default function ReviewWritePage() {
    const { productId } = useParams<{ productId: string }>();
    const navigate = useNavigate();
    const numericProductId = Number(productId);

    const [product, setProduct] = useState<TYPE.Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [rating, setRating] = useState(5);
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!numericProductId) return;

        const loadProduct = async () => {
            try {
                const data = await fetchProductById(numericProductId);
                setProduct(data);
            } catch (err) {
                console.error("Failed to load product", err);
            } finally {
                setLoading(false);
            }
        };

        loadProduct();
    }, [numericProductId]);

    const handleSubmit = async () => {
        if (!product) return;
        if (!content.trim()) {
            alert("리뷰 내용을 입력해주세요.");
            return;
        }

        setIsSubmitting(true);
        try {
            await createProductReview({
                refId: product.productId,
                content: content,
                rating: rating,
                productType: product.productType || "AUCTION" // Fallback if missing, though it should be there
            });
            alert("리뷰가 등록되었습니다!");
            navigate(-1); // Go back to previous page (e.g. MyPage or ProductPage)
        } catch (err) {
            console.error(err);
            alert("리뷰 등록에 실패했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <div className="w-full max-w-[1280px] px-4 mx-auto min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!product) {
        return <div className="w-full max-w-[1280px] px-4 mx-auto min-h-screen flex items-center justify-center">상품을 찾을 수 없습니다.</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
                <div className="max-w-2xl mx-auto px-4 h-16 flex items-center">
                    <button onClick={() => navigate(-1)} className="mr-4 p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900">리뷰 작성</h1>
                </div>
            </div>

            <div className="max-w-xl mx-auto px-4 py-8">
                {/* Product Summary */}
                <div className="flex gap-5 mb-10 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm items-center">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                        {product.images && product.images.length > 0 ? (
                            <img
                                src={product.images[0].imagePath.startsWith('http')
                                    ? product.images[0].imagePath
                                    : `${API_BASE_URL}${product.images[0].imagePath}`}
                                alt={product.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        ) : (
                            <div className="flex justify-center items-center w-full h-full text-[#aaa] text-xs"></div>
                        )}
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-gray-900 line-clamp-2 mb-1">{product.title}</h3>
                        <p className="text-sm text-gray-500">
                            구매한 상품은 만족하셨나요?
                        </p>
                    </div>
                </div>

                {/* Rating Section */}
                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm mb-6 text-center">
                    <h2 className="text-xl font-bold mb-6 text-gray-900">별점을 선택해주세요</h2>
                    <div className="flex justify-center gap-3 mb-4">
                        {[1, 2, 3, 4, 5].map((score) => (
                            <button
                                key={score}
                                onClick={() => setRating(score)}
                                className="group relative transition-transform active:scale-95 focus:outline-none"
                            >
                                <Star
                                    size={44}
                                    className={`transition-colors duration-200 ${score <= rating
                                        ? "fill-yellow-400 text-yellow-400 drop-shadow-sm"
                                        : "text-gray-200 hover:text-gray-300"
                                        }`}
                                />
                            </button>
                        ))}
                    </div>
                    <div className="inline-block px-4 py-1 bg-gray-100 rounded-full text-sm font-semibold text-gray-600">
                        {rating}점
                    </div>
                </div>

                {/* Content Section */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-8">
                    <h3 className="text-base font-bold mb-4 text-gray-900">상세 후기 작성</h3>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="이 상품을 사용해보니 어떠셨나요? 다른 구매자들에게 도움이 되도록 솔직한 후기를 남겨주세요. (최소 10자 이상)"
                        className="w-full h-48 p-4 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-black focus:ring-0 transition-all resize-none text-base placeholder:text-gray-400 leading-relaxed"
                    />
                    <div className="text-right mt-2 text-xs text-gray-400">
                        {content.length}자 입력됨
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-black transition-all shadow-lg shadow-gray-200 active:transform active:scale-[0.99]"
                >
                    {isSubmitting ? "등록 중..." : "리뷰 등록하기"}
                </button>
            </div>
        </div>
    );
}
