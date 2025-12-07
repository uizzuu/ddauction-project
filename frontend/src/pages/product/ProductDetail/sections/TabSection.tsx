import { useRef, useState, useEffect } from "react";
import ProductQnA from "../../../../components/product/ProductQnA";
import AuctionBidGraph from "../../../../components/product/AuctionBidGraph";
import type { Product, User, ProductQna, EditProductForm, Bid } from "../../../../common/types";

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
}) => {
    const tabs = [
        ...(product.productType === 'AUCTION' ? [{ id: 'bid_history', label: '입찰 그래프' }] : []),
        { id: 'detail', label: '상세정보' },
        { id: 'qna', label: `상품문의(${qnaList.length})` },
        { id: 'review', label: '상품후기(0)' },
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

                                    {/* Product Images as Banner */}
                                    {product.images && product.images.length > 0 && (
                                        <div className="flex flex-col gap-4">
                                            {product.images.map((img, idx) => (
                                                <img
                                                    key={idx}
                                                    src={img.imagePath}
                                                    alt={`${product.title} detailed view ${idx + 1}`}
                                                    className="w-full h-auto object-cover rounded-lg"
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

                    {/* Bid History (Auction Only) */}
                    {activeTab === 'bid_history' && product.productType === 'AUCTION' && (
                        <div className="min-h-[300px]">
                            <div className="h-[300px]">
                                <AuctionBidGraph
                                    bids={mergedBids}
                                    startingPrice={product.startingPrice || 0}
                                />
                            </div>
                        </div>
                    )}

                    {/* 4. Review */}
                    {activeTab === 'review' && (
                        <div className="text-center">
                            아직 등록된 후기가 없습니다.
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
