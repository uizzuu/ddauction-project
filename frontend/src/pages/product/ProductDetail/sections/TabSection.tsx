import { useRef, useState, useEffect } from "react";
import ProductQnA from "../../../../components/product/ProductQnA";
import { AuctionBidGraph } from "../../../../components/product/AuctionBidGraph";
import type { Product, User, ProductQna, EditProductForm, Bid, Review } from "../../../../common/types";

interface TabSectionProps {
    product: Product;
    user: User | null;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    qnaList: ProductQna[];
    setQnaList: React.Dispatch<React.SetStateAction<ProductQna[]>>;
    productForm: EditProductForm;
    handleChangeProductForm: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    editingProductId: number | null;
    mergedBids: Bid[];
    reviews: Review[];
}

export const TabSection: React.FC<TabSectionProps> = ({
    product,
    user,
    activeTab,
    setActiveTab,
    qnaList,
    setQnaList,
    productForm,
    handleChangeProductForm,
    editingProductId,
    mergedBids,
    reviews,
}) => {
    const tabs = [
        ...(product.productType === 'AUCTION' ? [{ id: 'bid_history', label: '입찰 그래프' }] : []),
        { id: 'detail', label: '상세정보' },
        { id: 'qna', label: `상품문의(${qnaList.length})` },
        { id: 'review', label: `상품후기(${reviews.length})` },
        { id: 'return', label: '반품/교환정보' },
    ];

    const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

    useEffect(() => {
        const activeIndex = tabs.findIndex(tab => tab.id === activeTab);
        const currentTab = tabRefs.current[activeIndex];

        if (currentTab) {
            setIndicatorStyle({
                left: currentTab.offsetLeft,
                width: currentTab.offsetWidth
            });
        }
    }, [activeTab, tabs.length, product.productType]);

    return (
        <>
            {/* Sticky Tab Bar */}
            <div className="sticky top-[55px] z-40 mb-4 w-full bg-white shadow-sm">
                <div className="flex mx-auto relative max-w-[1280px]">
                    {tabs.map((tab, index) => (
                        <button
                            key={tab.id}
                            ref={el => { tabRefs.current[index] = el; }}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-4 text-center font-bold text-sm transition-colors ${activeTab === tab.id ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                    {/* Sliding Underline */}
                    <div
                        className="absolute bottom-0 h-[3px] bg-black transition-all duration-300 ease-out"
                        style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
                    />
                </div>
            </div>

            {/* Tab Content */}
            <div className="flex flex-col lg:flex-row gap-8 items-start">
                <div className="flex-1 w-full min-h-[500px]">
                    {/* Detail Info */}
                    {activeTab === 'detail' && (
                        <div className="bg-white rounded-xl p-8 min-h-[300px]">
                            {editingProductId ? (
                                <textarea
                                    name="content"
                                    value={productForm.content}
                                    onChange={handleChangeProductForm}
                                    className="w-full h-40 p-4 border rounded-lg resize-none"
                                />
                            ) : (
                                <div className="space-y-8">
                                    {/* Product Content */}
                                    <div className="whitespace-pre-wrap leading-relaxed text-gray-800 text-lg">
                                        {product.content || "작성된 상세 내용이 없습니다."}
                                    </div>

                                    {/* Store Detail Banners (Detail Images) */}
                                    {product.productBanners && product.productBanners.length > 0 && (
                                        <div className="flex flex-col gap-0 border-t border-gray-100 pt-8 mt-8">
                                            <h4 className="font-bold text-gray-900 mb-4">상품 상세 이미지</h4>
                                            {product.productBanners.map((url, idx) => (
                                                <img
                                                    key={idx}
                                                    src={url}
                                                    alt={`Detailed Banner ${idx + 1}`}
                                                    className="w-full h-auto object-cover"
                                                />
                                            ))}
                                        </div>
                                    )}


                                </div>
                            )}
                        </div>
                    )}

                    {/* 3. QnA */}
                    {activeTab === 'qna' && (
                        <div>
                            <ProductQnA
                                user={user}
                                product={product}
                                productId={product.productId}
                                qnaList={qnaList}
                                setQnaList={setQnaList}
                            />
                        </div>
                    )}

                    {/* 4. Review */}
                    {activeTab === 'review' && (
                        <div className="bg-white rounded-xl p-8">
                            {reviews.length === 0 ? (
                                <div className="text-center text-gray-500 py-8">
                                    아직 등록된 후기가 없습니다.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {reviews.map((review) => (
                                        <div key={review.reviewId} className="border-b border-gray-100 pb-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="font-bold">{review.nickName || "익명"}</span>
                                                <span className="text-yellow-500">
                                                    {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                                                </span>
                                            </div>
                                            <p className="text-gray-700">{review.content}</p>
                                            <span className="text-xs text-gray-400">{review.createdAt}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Bid History (Auction Only) */}
                    {activeTab === 'bid_history' && (
                        <div className="p-4 sm:p-6 bg-white rounded-xl shadow-sm border border-gray-100 animate-fade-in-up">
                            <div className="flex items-center gap-2 mb-6">
                                <h3 className="text-lg font-bold text-gray-900">입찰 추이</h3>
                                <span className="px-2 py-0.5 bg-red-50 text-red-600 text-xs font-medium rounded-full">Live</span>
                            </div>
                            <AuctionBidGraph bids={mergedBids} />
                        </div>
                    )}

                    {/* 5. Return Info */}
                    {activeTab === 'return' && (
                        <div className="bg-gray-50 rounded-xl p-8 border border-gray-100 text-sm text-gray-600 leading-7">
                            <h3 className="text-xl font-bold mb-6 text-black">반품/교환 정보</h3>
                            <p><strong>반품/교환 사유에 따른 요청 가능 기간</strong></p>
                            <ul className="list-disc pl-5 mb-4">
                                <li>구매자 단순 변심은 상품 수령 후 7일 이내 (구매자 반품배송비 부담)</li>
                                <li>표시/광고와 상이, 상품하자의 경우 상품 수령 후 3개월 이내 혹은 표시/광고와 다른 사실을 안 날로부터 30일 이내 (판매자 반품배송비 부담)</li>
                            </ul>
                            <p><strong>반품/교환 불가능 사유</strong></p>
                            <ul className="list-disc pl-5">
                                <li>반품요청기간이 지난 경우</li>
                                <li>구매자의 책임 있는 사유로 상품 등이 멸실 또는 훼손된 경우</li>
                                <li>구매자의 사용 또는 일부 소비에 의하여 상품의 가치가 현저히 감소한 경우</li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
