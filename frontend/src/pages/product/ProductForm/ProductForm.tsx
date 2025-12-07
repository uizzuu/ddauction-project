import { useNavigate } from "react-router-dom";
import useProductForm from "./hooks/useProductForm";
import AuctionSection from "./sections/AuctionSection";
import UsedSection from "./sections/UsedSection";
import StoreSection from "./sections/StoreSection";
import type { User } from "../../../common/types";
import { CATEGORY_OPTIONS, PRODUCT_TYPES, PRODUCT_TYPE_KEYS } from "../../../common/enums";
import type { ProductCategoryType } from "../../../common/enums";
import SelectStyle from "../../../components/ui/SelectStyle";

type Props = {
    user: User | null;
};

export default function ProductRegister({ user }: Props) {
    const navigate = useNavigate();
    const {
        form,
        updateForm,
        handleDateChange,
        handleImageChange,
        removeImage,
        handleSubmit,
        generateAiDescriptionAuto,
        error,
        errors,
        uploading,
        aiGenerating,
        auctionEndDate,
        minDateTime,
        maxDateTime,
    } = useProductForm(user);

    if (!user) {
        return (
            <div className="min-h-[calc(100vh-120px)] flex justify-center items-center py-10 px-5 bg-white">
                <div className="bg-white p-[50px] rounded-2xl w-full max-w-[450px] border border-[#111]">
                    <p className="text-18 text-center mb-1rem color-main">
                        로그인 후 물품을 등록할 수 있습니다
                    </p>
                    <button onClick={() => navigate("/login")} className="btn-submit">
                        로그인하러가기
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[800px] mx-auto py-10 px-5">
            <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold text-[#111] mb-2">물품 등록</h2>
                <p className="text-gray-500">새로운 물품을 등록하여 판매를 시작해보세요</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                <div className="space-y-8">
                    {/* 1. Product Type Selection (Segmented Control) */}
                    <div>
                        <label className="block text-sm font-bold text-[#333] mb-3">
                            판매 방식 <span className="text-red-500">*</span>
                        </label>
                        <div className="flex p-1 bg-gray-100 rounded-xl">
                            {PRODUCT_TYPE_KEYS.map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all duration-200 ${form.productType === type
                                        ? "bg-white text-black shadow-sm ring-1 ring-black/5"
                                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50/50"
                                        }`}
                                    onClick={() => updateForm("productType", type)}
                                    disabled={uploading}
                                >
                                    {PRODUCT_TYPES[type]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 2. Title */}
                    <div>
                        <label className="block text-sm font-bold text-[#333] mb-2">
                            제목 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="상품 제목을 입력해주세요"
                            value={form.title}
                            onChange={(e) => updateForm("title", e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all bg-gray-50/30 text-sm placeholder:text-gray-400"
                            disabled={uploading}
                        />
                        {errors.title && <p className="text-xs text-red-500 mt-1 pl-1">{errors.title}</p>}
                    </div>


                    {/* 3. Category */}
                    <div>
                        <label className="block text-sm font-bold text-[#333] mb-2">
                            카테고리 <span className="text-red-500">*</span>
                        </label>
                        <SelectStyle
                            value={form.productCategoryType ?? ""}
                            onChange={(val) =>
                                updateForm("productCategoryType", (val || null) as ProductCategoryType | null)
                            }
                            options={CATEGORY_OPTIONS}
                            placeholder="카테고리를 선택하세요"
                            className="w-full"
                        />
                    </div>

                    {/* 4. Description & AI Button */}
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <label className="block text-sm font-bold text-[#333]">
                                상세 설명 <span className="text-red-500">*</span>
                            </label>
                            <button
                                type="button"
                                onClick={generateAiDescriptionAuto}
                                disabled={
                                    uploading ||
                                    aiGenerating ||
                                    !form.title ||
                                    form.title.trim().length < 2
                                }
                                className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors ${!form.title || form.title.trim().length < 2
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-medium"
                                    }`}
                            >
                                {aiGenerating ? (
                                    <>
                                        <span className="animate-spin text-[10px]">⏳</span>
                                        <span>생성 중...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>✨</span>
                                        <span>AI 자동 생성</span>
                                    </>
                                )}
                            </button>
                        </div>
                        <textarea
                            placeholder="상품에 대한 자세한 설명을 입력해주세요.&#13;&#10;(브랜드, 모델명, 구매 시기, 하자 유무 등)"
                            value={form.content}
                            onChange={(e) => updateForm("content", e.target.value)}
                            rows={8}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all bg-gray-50/30 text-sm resize-none placeholder:text-gray-400"
                            disabled={uploading}
                        />
                        {errors.content && <p className="text-xs text-red-500 mt-1 pl-1">{errors.content}</p>}
                    </div>

                    {/* 5. Dynamic Section based on Product Type */}
                    <div className="p-6 bg-gray-50 rounded-xl border border-gray-100">
                        {form.productType === "AUCTION" && (
                            <AuctionSection
                                startingPrice={form.startingPrice}
                                auctionEndDate={auctionEndDate}
                                minDateTime={minDateTime}
                                maxDateTime={maxDateTime}
                                onChangePrice={(val) => updateForm("startingPrice", val)}
                                onDateChange={handleDateChange}
                                uploading={uploading}
                            />
                        )}

                        {form.productType === "USED" && (
                            <UsedSection
                                price={form.startingPrice}
                                onChangePrice={(val) => updateForm("startingPrice", val)}
                                uploading={uploading}
                            />
                        )}

                        {form.productType === "STORE" && (
                            <StoreSection
                                price={form.startingPrice}
                                onChangePrice={(val) => updateForm("startingPrice", val)}
                                uploading={uploading}
                            />
                        )}
                        {errors.startingPrice && <p className="text-xs text-red-500 mt-2 text-center">{errors.startingPrice}</p>}
                    </div>


                    {/* 6. Image Upload */}
                    <div>
                        <label className="block text-sm font-bold text-[#333] mb-3">
                            상품 이미지 <span className="text-red-500">*</span>
                            <span className="text-xs font-normal text-gray-400 ml-2">최소 1장 이상 등록해주세요</span>
                        </label>

                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                            <label className={`
                                aspect-square flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 cursor-pointer hover:border-black hover:bg-gray-50 transition-all
                                ${uploading ? "opacity-50 cursor-not-allowed" : ""}
                            `}>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={(e) => handleImageChange(e.target.files)}
                                    className="hidden"
                                    disabled={uploading}
                                />
                                <span className="text-2xl mb-1 text-gray-400">+</span>
                                <span className="text-xs text-gray-500">이미지 추가</span>
                            </label>

                            {(form.images || []).map((file, idx) => (
                                <div key={idx} className="relative aspect-square rounded-xl bg-gray-100 border border-gray-200 overflow-hidden group">
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                                        <img 
                                            src={URL.createObjectURL(file)} 
                                            alt="preview" 
                                            className="w-full h-full object-cover"
                                            onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeImage(idx)}
                                        className="absolute top-1 right-1 w-5 h-5 bg-black/50 hover:bg-black text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                        disabled={uploading}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>


                    {/* Error Message */}
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                            🚨 {error}
                        </div>
                    )}

                    {/* Submit Buttons */}
                    <div className="flex gap-3 pt-6 border-t border-gray-100">
                        <button
                            onClick={() => navigate("/")}
                            className="flex-1 py-3.5 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition-all"
                            disabled={uploading}
                        >
                            취소
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="flex-[2] py-3.5 bg-[#111] text-white rounded-xl font-bold hover:bg-black shadow-lg shadow-black/20 transition-all disabled:bg-gray-300 disabled:shadow-none"
                            disabled={uploading}
                        >
                            {uploading ? "등록 중..." : "물품 등록하기"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
