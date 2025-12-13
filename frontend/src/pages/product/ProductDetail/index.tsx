import React, { useState } from "react";
import AROverlayModal from "../../../components/modal/AROverlayModal";
import { ReportModal } from "../../../components/ui/ReportModal"; // Added import
import { useProductDetail } from "./hooks/useProductDetail";
import { ImageSection } from "./sections/ImageSection";
import { InfoSection } from "./sections/InfoSection";
import { ActionBox } from "./sections/ActionBox";
import { TabSection } from "./sections/TabSection";
import type { User } from "../../../common/types";

// 임시 Edit Handler (UI상 연결을 위해) - 실제 로직은 Hook이나 API 호출 필요
// 여기서는 Hook에서 반환하지 않았으므로 Props 전달용으로 간단히 구성하거나 Hook 업데이트 필요
// 빠른 구현을 위해 Hook을 조금 수정하지 않고 Local State로 처리하거나
// useProductDetail을 보강해야 합니다.
// * useProductDetail에서 handler들을 모두 내보냈다고 가정하고 작성합니다.

type Props = {
    user: User | null;
    setUser: (user: User | null) => void;
};

export default function ProductDetail({ user }: Props) {
    const {
        product,
        remainingTime,
        sellerNickName,
        mergedBids,
        currentHighestBid,
        isBookMarked,
        isWinner,
        qnaList,
        setQnaList,
        reviews,
        
        navigate,
        handleToggleBookmark,
        handleReport,
        handleDeleteProduct,

        editingProductId,
        setEditingProductId,
        productForm,
        setProductForm,
        showReportModal,
        setShowReportModal,
        submitReport,
    } = useProductDetail(user);

    const [showARModal, setShowARModal] = useState(false);
    const [activeTab, setActiveTab] = useState("detail");

    if (!product) return <div className="w-[1280px] mx-auto pt-4">상품을 찾을 수 없습니다.</div>;

    // Edit Handlers Wrapper
    const handleEditProduct = () => {
        navigate(`/products/${product.productId}/edit`);
    };
    const handleCancelProductEdit = () => setEditingProductId(null);
    const handleSaveProduct = () => {
        // Implement save logic or API call here
        alert("수정 기능은 API 연동이 필요합니다.");
        setEditingProductId(null);
    };
    const handleChangeProductForm = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setProductForm(prev => ({ ...prev, [name]: value }));
    };


    return (
        <div className="max-w-[1280px] mx-auto px-4 py-8 md:px-0">

            {/* Back Button */}
            {/* <button
                onClick={() => navigate(-1)}
                className="mb-6 flex items-center text-gray-500 hover:text-black transition-colors font-medium"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
                </svg>
                목록으로 돌아가기
            </button> */}

            {/* Top Section: 3-Column Layout */}
            {/* Height fix: calc(100vh - header - padding) approx. To force fit, we might use max-h and allow internal scroll if needed, or just layout sizing. User asked for data to "fit in". */}
            <div className="flex flex-col xl:flex-row gap-6 mb-12 h-fit">

                {/* Left: Image Section (Fixed width) */}
                <div className="w-full xl:w-[400px] top-24 h-fit">
                    <ImageSection product={product} setShowARModal={setShowARModal} />
                </div>

                {/* Middle: Info Section (Dynamic width) */}
                <div className="flex-1 w-full">
                    <InfoSection
                        product={product}
                        user={user}
                        sellerNickName={sellerNickName}
                        remainingTime={remainingTime}
                        highestBid={mergedBids.length ? Math.max(...mergedBids.map(b => b.bidPrice)) : (product.startingPrice || 0)}
                        mergedBids={mergedBids}
                        editingProductId={editingProductId}
                        productForm={productForm}
                        handleEditProduct={handleEditProduct}
                        handleDeleteProduct={handleDeleteProduct}
                        handleSaveProduct={handleSaveProduct}
                        handleCancelProductEdit={handleCancelProductEdit}
                        handleChangeProductForm={handleChangeProductForm}
                        setProductForm={setProductForm}
                    />
                </div>

                {/* Right: Action Box (Fixed width) */}
                <div className="w-full xl:w-[300px] sticky top-24 h-fit z-10">
                    <ActionBox
                        product={product}
                        mergedBids={mergedBids}
                        currentHighestBid={currentHighestBid}
                        isBookMarked={isBookMarked}
                        isWinner={isWinner}
                        editingProductId={editingProductId}
                        handleToggleBookmark={handleToggleBookmark}
                        handleReport={handleReport}
                        navigate={navigate}
                    />
                </div>
            </div>

            {/* Tabs Section */}
            <TabSection
                product={product}
                user={user}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                qnaList={qnaList}
                setQnaList={setQnaList}
                productForm={productForm}
                handleChangeProductForm={handleChangeProductForm}
                editingProductId={editingProductId}
                mergedBids={mergedBids} // Added mergedBids
                reviews={reviews}
            />

            {/* AR Modal */}
            {
                showARModal && (
                    <div
                        className="fixed inset-0 bg-black/80 z-[1000] flex items-center justify-center p-4 transition-all"
                        onClick={() => setShowARModal(false)}
                    >
                        <div
                            className="relative w-full max-w-4xl h-[80vh] bg-black rounded-2xl overflow-hidden shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setShowARModal(false)}
                                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl backdrop-blur-sm transition-all z-50"
                            >
                                ×
                            </button>
                            <AROverlayModal productId={product.productId} />
                        </div>
                    </div>
                )
            }

            {/* Report Modal */}
            <ReportModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                onSubmit={submitReport}
            />

        </div>
    );
}
