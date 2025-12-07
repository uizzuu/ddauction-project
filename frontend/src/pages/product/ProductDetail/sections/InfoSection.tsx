import React from "react";
import { formatDateTime } from "../../../../common/util";
import { PRODUCT_CATEGORIES } from "../../../../common/enums";
import type { Product, User, EditProductForm } from "../../../../common/types";

interface InfoSectionProps {
    product: Product;
    user: User | null;
    sellerNickName: string;
    remainingTime: string;
    highestBid: number;
    editingProductId: number | null;
    productForm: EditProductForm;
    handleEditProduct: () => void;
    handleDeleteProduct: () => void;
    handleSaveProduct: () => void;
    handleCancelProductEdit: () => void;
    handleChangeProductForm: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    setProductForm: React.Dispatch<React.SetStateAction<EditProductForm>>;
}

export const InfoSection: React.FC<InfoSectionProps> = ({
    product,
    user,
    sellerNickName,
    remainingTime,
    highestBid,
    editingProductId,
    productForm,
    handleEditProduct,
    handleDeleteProduct,
    handleSaveProduct,
    handleCancelProductEdit,
    handleChangeProductForm,
}) => {


    // 날짜 포맷 (초 제외)
    const formatDateTimeNoSec = (dateStr: string) => {
        return formatDateTime(dateStr).slice(0, 16);
    };

    return (
        <div className="w-full md:w-full py-2 px-4 flex flex-col">
            {/* Header: Title & Meta */}
            <div className="border-b border-gray-100 pb-6 mb-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-md mb-2">
                            {product.productCategoryType
                                ? PRODUCT_CATEGORIES[product.productCategoryType]
                                : "기타"}
                        </span>
                        {editingProductId ? (
                            <input
                                name="title"
                                value={productForm.title}
                                onChange={handleChangeProductForm}
                                className="block w-full text-2xl font-bold border-b border-gray-300 focus:border-black outline-none py-1"
                                placeholder="상품명 입력"
                            />
                        ) : (
                            <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                                {product.title}
                            </h1>
                        )}
                    </div>

                    {/* Edit/Delete Actions */}
                    <div className="flex items-center gap-2">
                        {user?.userId === product.sellerId && !editingProductId && (
                            <div className="dropdown relative group">
                                <button className="text-gray-400 hover:text-gray-600 p-2">
                                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
                                    </svg>
                                </button>
                                <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-xl border border-gray-100 hidden group-hover:block z-50 overflow-hidden">
                                    <button onClick={handleEditProduct} className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-50">수정하기</button>
                                    <button onClick={handleDeleteProduct} className="block w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50">삭제하기</button>
                                </div>
                            </div>
                        )}
                        {user?.userId === product.sellerId && editingProductId && (
                            <div className="flex gap-2">
                                <button onClick={handleSaveProduct} className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700">저장</button>
                                <button onClick={handleCancelProductEdit} className="text-sm bg-gray-200 text-gray-600 px-3 py-1 rounded-md hover:bg-gray-300">취소</button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                            {sellerNickName.slice(0, 1)}
                        </span>
                        <span className="font-medium text-gray-900">{sellerNickName}</span>
                    </div>
                    <span className="w-px h-3 bg-gray-300"></span>
                    <span>{product.createdAt ? formatDateTimeNoSec(product.createdAt) : ""}</span>
                    <span className="w-px h-3 bg-gray-300"></span>
                    <span className="flex items-center gap-1">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {product.viewCount ?? 0}
                    </span>
                </div>
            </div>

            {/* Pricing area */}
            <div className="mb-6">
                {editingProductId ? (
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <label className="block text-xs font-bold text-gray-500 mb-1">시작가 / 가격</label>
                        <input
                            name="startingPrice"
                            type="number"
                            value={productForm.startingPrice}
                            onChange={handleChangeProductForm}
                            className="w-full text-lg border rounded px-3 py-2"
                        />
                    </div>
                ) : (
                    <div>
                        {product.productType === 'AUCTION' ? (
                            <div className="flex justify-between items-baseline mb-2">
                                <span className="text-gray-500">현재 최고가</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-extrabold text-gray-900">{highestBid.toLocaleString()}</span>
                                    <span className="text-xl text-gray-600 font-bold">원</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-between items-baseline mb-2">
                                <span className="text-gray-500">판매가</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-extrabold text-gray-900">{Number(product.startingPrice).toLocaleString()}</span>
                                    <span className="text-xl text-gray-600 font-bold">원</span>
                                </div>
                            </div>
                        )}
                        <p className="text-gray-400 text-sm mt-1">배송비 포함</p>
                    </div>
                )}
            </div>

            {/* Auction Info: Time & Graph */}
            {!editingProductId && product.productType === 'AUCTION' && (
                <div className="mt-4">
                    {/* Remaining Time */}
                    <div className="bg-gray-100 rounded-xl p-4 border border-gray-200 mb-6 flex items-center justify-between">
                        <span className="text-gray-500 font-bold text-sm">남은 시간</span>
                        <div className="text-right">
                            <span className="block text-xl font-bold text-gray-900 font-mono leading-none mb-1">{remainingTime}</span>
                            <span className="text-xs text-gray-500">{formatDateTimeNoSec(product.auctionEndTime || "")} 마감</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
