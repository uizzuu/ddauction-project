import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchProductById, createProductReview } from "../../common/api";
import type * as TYPE from "../../common/types";
import { Star, ChevronLeft, Image as ImageIcon } from "lucide-react";

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
        return <div className="w-[1280px] mx-auto min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!product) {
        return <div className="w-[1280px] mx-auto min-h-screen flex items-center justify-center">상품을 찾을 수 없습니다.</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b ">
                <div className="w-[1280px] mx-auto py-3 flex items-center sticky top-0 z-10">
                    <button onClick={() => navigate(-1)} className="mr-4 text-gray-600">
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="text-lg font-bold">리뷰 작성</h1>
                </div>
            </div>

            <div className="max-w-xl mx-auto px-4 py-6">
                {/* Product Summary */}
                <div className="flex gap-4 mb-8 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {product.images && product.images.length > 0 ? (
                            <img src={product.images[0].imagePath} alt={product.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <ImageIcon size={24} />
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">{product.title}</h3>
                        <p className="text-xs text-gray-500">{product.sellerNickName} 판매자</p>
                    </div>
                </div>

                {/* Rating Section */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-6 text-center">
                    <h2 className="text-lg font-bold mb-4">상품은 만족하셨나요?</h2>
                    <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((score) => (
                            <button
                                key={score}
                                onClick={() => setRating(score)}
                                className="transition-transform active:scale-90 focus:outline-none"
                            >
                                <Star
                                    size={40}
                                    className={`${score <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"
                                        }`}
                                />
                            </button>
                        ))}
                    </div>
                    <p className="mt-2 text-sm text-gray-500 font-medium">
                        {rating}점
                    </p>
                </div>

                {/* Content Section */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-8">
                    <h3 className="text-sm font-bold mb-3">어떤 점이 좋았나요?</h3>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="다른 구매자들에게 도움이 되도록 솔직한 후기를 남겨주세요. (최소 10자 이상)"
                        className="w-full h-40 p-4 bg-gray-50 rounded-lg border-none resize-none focus:ring-2 focus:ring-black/5 text-sm"
                    />
                </div>

                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                    {isSubmitting ? "등록 중..." : "리뷰 등록하기"}
                </button>
            </div>
        </div>
    );
}
