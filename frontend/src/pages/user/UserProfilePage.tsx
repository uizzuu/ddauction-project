import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom"; // 💡 useSearchParams 추가
import {
    fetchUserProfile,
    fetchUserSellingProducts,
    fetchUserReviews,
    API_BASE_URL,
} from "../../common/api";
import type * as TYPE from "../../common/types";
import ProductCard from "../../components/ui/ProductCard";
import { User, Star, Package, MessageSquare } from "lucide-react";

export default function UserProfilePage() {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    // 💡 변경 1: URL 쿼리 매개변수 관리 훅 사용
    const [searchParams, setSearchParams] = useSearchParams(); 
    
    const numericUserId = Number(userId);

    const [user, setUser] = useState<TYPE.User | null>(null);
    const [products, setProducts] = useState<TYPE.Product[]>([]);
    const [reviews, setReviews] = useState<TYPE.Review[]>([]);
    const [avgRating, setAvgRating] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    
    // 💡 변경 2: activeTab 상태 제거 (URL에서 읽어옴)
    // const [activeTab, setActiveTab] = useState<"products" | "reviews">("products"); 

    // 💡 새로운 탭 상태 로직: URL에서 현재 탭 상태를 읽어옴
    const currentTab = searchParams.get("tab") === "reviews" ? "reviews" : "products";
    
    // 💡 탭 변경 함수: URL 쿼리 매개변수를 업데이트
    const setActiveTabInUrl = (tab: "products" | "reviews") => {
        if (tab === "products") {
            searchParams.delete("tab");
        } else {
            searchParams.set("tab", "reviews");
        }
        setSearchParams(searchParams, { replace: true }); // 브라우저 기록을 남기지 않고 URL 업데이트
    };

    // 컴포넌트 마운트 시 URL에 탭 정보가 없으면 기본값으로 설정 (선택 사항이지만 일관성 유지에 도움)
    useEffect(() => {
        if (!searchParams.get("tab")) {
             setActiveTabInUrl("products");
        }
    }, [userId]);


    useEffect(() => {
        if (!numericUserId) return;

        const loadData = async () => {
            setLoading(true);
            try {
                const [userData, productData, reviewData] = await Promise.all([
                    fetchUserProfile(numericUserId),
                    fetchUserSellingProducts(numericUserId),
                    fetchUserReviews(numericUserId),
                ]);

                setUser(userData);
                setProducts(productData);
                setReviews(reviewData);

                if (reviewData.length > 0) {
                    const sum = reviewData.reduce((acc, r) => acc + r.rating, 0);
                    // 평점을 소수점 첫째 자리까지 표시하기 위해 Math.round를 사용 (옵션)
                    setAvgRating(Math.round((sum / reviewData.length) * 10) / 10);
                } else {
                    setAvgRating(0);
                }

            } catch (err) {
                console.error("Failed to load user profile", err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [numericUserId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <p className="text-gray-500 text-lg">사용자를 찾을 수 없습니다.</p>
                <button
                    onClick={() => navigate(-1)}
                    className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                    뒤로 가기
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Profile Header */}
            <div className="bg-white border-b">
                <div className="max-w-4xl mx-auto px-6 pb-6 relative mt-8">
                    <div className="flex md:flex-row items-end md:items-center gap-6">
                        {/* Avatar */}
                        <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-lg flex-shrink-0 relative z-10">
                            <div className="w-full h-full rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-100">
                                {user.images && user.images.length > 0 ? (
                                    <img
                                        src={user.images[0].imagePath.startsWith("http") ? user.images[0].imagePath : `${API_BASE_URL}/${user.images[0].imagePath}`}
                                        alt={user.nickName}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User size={32} className="text-gray-400" />
                                )}
                            </div>
                        </div>
                        {/* User Info */}
                        <div className="flex-1 text-left">
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">{user.nickName}</h1>
                            <div className="flex flex-wrap items-center justify-start gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                    <Star size={16} className="text-yellow-400 fill-yellow-400" />
                                    <span className="font-medium text-black">
                                        {avgRating > 0 ? avgRating.toFixed(1) : "평가 없음"}
                                    </span>
                                    <span className="text-gray-400">({reviews.length}개 리뷰)</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Package size={16} />
                                    <span>판매상품 <strong>{products.length}</strong>개</span>
                                </div>
                                {user.createdAt && (
                                    <div className="text-gray-400 text-xs">
                                        가입일: {new Date(user.createdAt).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="max-w-4xl mx-auto px-6 mt-4">
                    <div className="flex border-b border-gray-100">
                        <button
                            // 💡 탭 변경 함수 사용 및 currentTab 확인
                            onClick={() => setActiveTabInUrl("products")}
                            className={`flex-1 py-4 text-sm font-medium transition-colors relative ${currentTab === "products"
                                ? "text-black font-semibold"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            판매 물품
                            {/* 💡 currentTab 확인 */}
                            {currentTab === "products" && (
                                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-black" />
                            )}
                        </button>
                        <button
                            // 💡 탭 변경 함수 사용 및 currentTab 확인
                            onClick={() => setActiveTabInUrl("reviews")}
                            className={`flex-1 py-4 text-sm font-medium transition-colors relative ${currentTab === "reviews"
                                ? "text-black font-semibold"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            받은 리뷰
                            {/* 💡 currentTab 확인 */}
                            {currentTab === "reviews" && (
                                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-black" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* 💡 currentTab 확인 */}
                {currentTab === "products" ? (
                    <div>
                        {products.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {products.map((p) => (
                                    <ProductCard key={p.productId} product={p} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 text-gray-400 bg-white rounded-lg border border-dashed border-gray-200">
                                <Package size={40} className="mx-auto mb-3 opacity-20" />
                                <p>등록된 판매 상품이 없습니다.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reviews.length > 0 ? (
                            reviews.map((review) => (
                                <div key={review.reviewId} className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                <User size={14} className="text-gray-400" />
                                            </div>
                                            <span className="font-semibold text-sm">{review.nickName}</span>
                                            <span className="text-xs text-gray-400">
                                                {new Date(review.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center text-yellow-400">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={14}
                                                    className={i < review.rating ? "fill-current" : "text-gray-200"}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{review.content}</p>

                                    {/* Review Images if any */}
                                    {review.images && review.images.length > 0 && (
                                        <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                                            {review.images.map((img, idx) => (
                                                <div key={idx} className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden border">
                                                    <img src={img.imagePath} alt="Review" className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-20 text-gray-400 bg-white rounded-lg border border-dashed border-gray-200">
                                <MessageSquare size={40} className="mx-auto mb-3 opacity-20" />
                                <p>받은 리뷰가 없습니다.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}