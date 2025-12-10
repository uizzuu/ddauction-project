import React from "react";
import { Link } from "react-router-dom";
import { formatDateTime } from "../../../../common/util";
import { PRODUCT_CATEGORIES } from "../../../../common/enums";
import type { Product, User, EditProductForm, Bid } from "../../../../common/types";
import Avatar from "../../../../components/ui/Avatar";

interface InfoSectionProps {
    product: Product;
    user: User | null;
    sellerNickName: string;
    remainingTime: string;
    highestBid: number;
    mergedBids: Bid[];
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
    mergedBids,
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
        <div className="w-full md:w-full flex flex-col h-full justify-between">
            {/* Header: Title & Meta */}
            <div className="border-b border-gray-100 pb-3 mb-3">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <span className="inline-block px-3 py-[6px] bg-gray-100 text-gray-600 text-[11px] font-semibold rounded-full mb-1">
                            {product.productCategoryType
                                ? PRODUCT_CATEGORIES[product.productCategoryType]
                                : "기타"}
                        </span>
                        {editingProductId ? (
                            <input
                                name="title"
                                value={productForm.title}
                                onChange={handleChangeProductForm}
                                className="block w-full text-xl font-bold border-b border-gray-300 focus:border-black outline-none py-1"
                                placeholder="상품명 입력"
                            />
                        ) : (
                            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                                {product.title}
                            </h1>
                        )}
                    </div>

                    {/* Edit/Delete Actions */}
                    <div className="flex items-center gap-2">
                        {user?.userId === product.sellerId && !editingProductId && (
                            <div className="dropdown relative group">
                                <button className="text-gray-400 hover:text-gray-600 p-1">
                                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
                                    </svg>
                                </button>
                                <div className="absolute right-0 mt-1 w-28 bg-white rounded-lg shadow-xl border border-gray-100 hidden group-hover:block z-50 overflow-hidden">
                                    <button onClick={handleEditProduct} className="block w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 border-b border-gray-50">수정하기</button>
                                    <button onClick={handleDeleteProduct} className="block w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50">삭제하기</button>
                                </div>
                            </div>
                        )}
                        {user?.userId === product.sellerId && editingProductId && (
                            <div className="flex gap-1">
                                <button onClick={handleSaveProduct} className="text-xs bg-[#333] text-white px-2 py-1 rounded hover:bg-blue-700">저장</button>
                                <button onClick={handleCancelProductEdit} className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded hover:bg-gray-300">취소</button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <Link to={`/users/${product.sellerId}`} className="flex items-center gap-1.5 hover:underline decoration-gray-400 underline-offset-2">
                        <span className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                            <Avatar
                                src={product.sellerProfileImage || null}
                                alt={sellerNickName}
                                className="w-full h-full text-[10px]"
                                fallbackText={sellerNickName}
                            />
                        </span>
                        <span className="font-medium text-gray-900">{sellerNickName}</span>
                    </Link>
                    <span className="w-px h-2.5 bg-gray-300"></span>
                    <span>{product.createdAt ? formatDateTimeNoSec(product.createdAt) : ""}</span>
                    <span className="w-px h-2.5 bg-gray-300"></span>
                    <span className="flex items-center gap-0.5">
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {product.viewCount ?? 0}
                    </span>
                </div>
            </div>

            {/* Tags */}
            {product.tag && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                    {product.tag.split(",").map((tag, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 bg-gray-50 text-gray-500 text-[10px] rounded-full border border-gray-100">
                            #{tag.trim()}
                        </span>
                    ))}
                </div>
            )}

            {/* Pricing area */}
            <div className="mb-4">
                {editingProductId ? (
                    <div className="bg-gray-50 p-3 rounded-lg">
                        <label className="block text-xs font-bold text-gray-500 mb-1">시작가 / 가격</label>
                        <input
                            name="startingPrice"
                            type="number"
                            value={productForm.startingPrice}
                            onChange={handleChangeProductForm}
                            className="w-full text-base border rounded px-2 py-1"
                        />
                    </div>
                ) : (
                    <div>
                        {product.productType === 'AUCTION' ? (
                            <div className="space-y-2 mb-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">시작 입찰가</span>
                                    <span className="font-bold text-gray-700">{Number(product.startingPrice).toLocaleString()}원</span>
                                </div>
                                {mergedBids.length > 0 && (
                                    <div className="flex justify-between items-baseline pt-2 border-t border-gray-100">
                                        <span className="text-red-500 font-bold text-sm">현재 최고가</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-extrabold text-red-500">{highestBid.toLocaleString()}</span>
                                            <span className="text-lg text-red-400 font-bold">원</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : product.productType === 'STORE' ? (
                            // STORE Pricing
                            <div>
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-gray-500 text-sm">판매가</span>
                                    <div className="text-right">
                                        {product.discountRate && Number(product.discountRate) > 0 && (
                                            <div className="flex items-center justify-end gap-1 mb-0.5">
                                                <span className="text-gray-400 text-xs line-through">
                                                    {Number(product.originalPrice).toLocaleString()}원
                                                </span>
                                                <span className="text-red-500 text-base font-bold">
                                                    {product.discountRate}%
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-baseline justify-end gap-1">
                                            <span className="text-3xl font-extrabold text-gray-900">
                                                {Number(product.startingPrice).toLocaleString()}
                                            </span>
                                            <span className="text-lg text-gray-600 font-bold">원</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // USED / General Pricing
                            <div className="flex justify-between items-baseline mb-2">
                                <span className="text-gray-500 text-sm">판매가</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-extrabold text-gray-900">{Number(product.startingPrice).toLocaleString()}</span>
                                    <span className="text-lg text-gray-600 font-bold">원</span>
                                </div>
                            </div>
                        )}

                        {/* Shipping Info */}
                        <div className="flex justify-end items-center gap-2 mt-1">
                            {product.deliveryIncluded ? (
                                <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">배송비 무료</span>
                            ) : (
                                <span className="text-xs text-gray-500">
                                    배송비 {Number(product.deliveryPrice || 0).toLocaleString()}원
                                    {Number(product.deliveryAddPrice) > 0 && ` (+${Number(product.deliveryAddPrice).toLocaleString()}원)`}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Meta Info: Location & Delivery Methods (Compact) */}
            <div className="border-t border-gray-100 pt-3 space-y-2 mb-3">
                {/* Location */}
                {product.address && (
                    <div className="flex items-start gap-4">
                        <span className="w-16 text-gray-500 text-xs font-medium shrink-0">거래 지역</span>
                        <div className="text-xs text-gray-900 break-keep">
                            {product.address}
                        </div>
                    </div>
                )}

                {/* Delivery Methods */}
                {product.deliveryAvailable && (
                    <div className="flex items-start gap-4">
                        <span className="w-16 text-gray-500 text-xs font-medium shrink-0">배송 방법</span>
                        <div className="text-xs text-gray-900 flex flex-wrap gap-1">
                            {product.deliveryAvailable.split(",").map((method, idx) => (
                                <span key={idx} className="inline-block border border-gray-200 px-1.5 py-0.5 rounded text-[10px] text-gray-600 bg-white">
                                    {method.trim()}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Auction Info: Time Only (Compact) */}
            {!editingProductId && product.productType === 'AUCTION' && (
                <div className="mt-auto pt-2">
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex items-center justify-between">
                        <span className="text-gray-500 font-bold text-xs">남은 시간</span>
                        <div className="text-right">
                            <span className="block text-lg font-bold text-gray-900 font-mono leading-none mb-0.5">{remainingTime}</span>
                            <span className="text-[10px] text-gray-400">{formatDateTimeNoSec(product.auctionEndTime || "")} 마감</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
