import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import useProductForm from "../ProductForm/hooks/useProductForm";
import AuctionSection from "../ProductForm/sections/AuctionSection";
import UsedSection from "../ProductForm/sections/UsedSection";
import StoreSection from "../ProductForm/sections/StoreSection";
import type { User } from "../../../common/types";
import { CATEGORY_OPTIONS } from "../../../common/enums";
import type { ProductCategoryType } from "../../../common/enums";
import SelectStyle from "../../../components/ui/SelectStyle";
import CheckboxStyle from "../../../components/ui/CheckboxStyle";

type Props = {
    user: User | null;
};

export default function ProductEdit({ user }: Props) {
    const navigate = useNavigate();
    const { productId } = useParams<{ productId: string }>();
    const parsedProductId = productId ? Number(productId) : undefined;

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
        isAgreed,
        setIsAgreed,
        hasBids
    } = useProductForm(user, parsedProductId);

    // Tag Logic
    const [currentTag, setCurrentTag] = useState("");
    const tags = form.tag ? form.tag.split(",").filter(Boolean) : [];

    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            const val = currentTag.trim();
            if (val && !tags.includes(val)) {
                const newTags = [...tags, val];
                updateForm("tag", newTags.join(","));
                setCurrentTag("");
            }
        }
    };

    const removeTag = (tagToRemove: string) => {
        const newTags = tags.filter(t => t !== tagToRemove);
        updateForm("tag", newTags.join(","));
    };

    const setThumbnail = (index: number) => {
        if (!form.images) return;
        const newImages = [...form.images];
        const [selected] = newImages.splice(index, 1);
        newImages.unshift(selected);
        updateForm("images", newImages);
    };

    // ✅ 타입별 가격 가져오기
    // AUCTION: startingPrice (시작 입찰가)
    // STORE: salePrice (판매가)
    // USED: originalPrice (판매가)
    const getPriceForSettlement = (): number => {
        if (form.productType === "AUCTION") {
            return Number(form.startingPrice) || 0;
        } else if (form.productType === "STORE") {
            return Number(form.salePrice) || 0;
        } else {
            // USED
            return Number(form.originalPrice) || 0;
        }
    };

    const settlementPrice = getPriceForSettlement();

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
        <div className="containerr mx-auto px-4 xl:px-0">
            <div className="mb-8 text-left">
                <h2 className="text-3xl font-bold text-[#111] mb-2">물품 수정</h2>
                <p className="text-gray-500">
                    등록된 상품 정보를 수정합니다.
                </p>
            </div>

            <div className="bg-white">
                <div className="space-y-8">
                    {/* 이미지 등록 */}
                    <div>
                        <label className="block text-sm font-bold text-[#333] mb-3">
                            상품 이미지 <span className="text-red-500">*</span>
                            <span className="text-xs font-normal text-gray-400 ml-2">첫 번째 이미지가 썸네일로 지정됩니다.</span>
                        </label>

                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
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
                                <span className="text-xs text-gray-500 text-nowrap">이미지 추가</span>
                            </label>

                            {(form.images || []).map((fileOrObj, idx) => {
                                let src = "";
                                if (fileOrObj instanceof File) {
                                    src = URL.createObjectURL(fileOrObj);
                                } else {
                                    const path = (fileOrObj as any).imagePath || "";
                                    src = path.startsWith("http") ? path : `http://localhost:8080${path}`;
                                }

                                return (
                                    <div
                                        key={idx}
                                        draggable
                                        onDragStart={(e) => {
                                            e.dataTransfer.setData("text/plain", idx.toString());
                                            e.dataTransfer.effectAllowed = "move";
                                        }}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            e.dataTransfer.dropEffect = "move";
                                        }}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            const dragIdx = Number(e.dataTransfer.getData("text/plain"));
                                            if (dragIdx === idx) return;

                                            const newImages = [...(form.images || [])];
                                            const [draggedItem] = newImages.splice(dragIdx, 1);
                                            newImages.splice(idx, 0, draggedItem);
                                            updateForm("images", newImages);
                                        }}
                                        className={`relative aspect-square rounded-xl bg-gray-100 border overflow-hidden group cursor-move ${idx === 0 ? "border-2 border-indigo-500 ring-2 ring-indigo-100" : "border-gray-200"}`}
                                    >
                                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 pointer-events-none">
                                            <img
                                                src={src}
                                                alt="preview"
                                                className="w-full h-full object-cover"
                                                onLoad={(e) => {
                                                    if (fileOrObj instanceof File) URL.revokeObjectURL(e.currentTarget.src)
                                                }}
                                                onError={(e) => { e.currentTarget.style.display = 'none' }}
                                            />
                                        </div>
                                        {idx === 0 && (
                                            <span className="absolute top-1 left-1 bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold shadow-sm z-10 pointer-events-none">
                                                대표
                                            </span>
                                        )}
                                        {idx !== 0 && (
                                            <button
                                                type="button"
                                                onClick={() => setThumbnail(idx)}
                                                className="absolute bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black/70 text-white text-[10px] rounded hover:bg-black w-max opacity-0 group-hover:opacity-100 transition-opacity z-20"
                                            >
                                                대표 설정
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeImage(idx);
                                            }}
                                            className="absolute top-1 right-1 w-5 h-5 bg-black/50 hover:bg-black text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-pointer"
                                            disabled={uploading}
                                        >
                                            ×
                                        </button>
                                    </div>
                                )
                            })}
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

                    {/* 3.5 Tags (Chip UI) */}
                    <div>
                        <label className="block text-sm font-bold text-[#333] mb-2">
                            태그
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {tags.map((tag, idx) => (
                                <span key={idx} className="inline-flex items-center px-3 py-2 bg-indigo-50 text-indigo-700 text-sm rounded-full">
                                    <div className="mr-[3px]">#</div>
                                    {tag}
                                    <button
                                        type="button"
                                        onClick={() => removeTag(tag)}
                                        className="ml-1.5 w-4 h-4 flex items-center justify-center bg-indigo-200 text-indigo-800 rounded-full text-xs hover:bg-indigo-300"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                        <input
                            type="text"
                            placeholder="태그 입력 후 스페이스바 또는 엔터 (예: #명품 #신상)"
                            value={currentTag}
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣]/g, "");
                                setCurrentTag(val);
                            }}
                            onKeyDown={handleTagKeyDown}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all bg-gray-50/30 text-sm placeholder:text-gray-400"
                            disabled={uploading}
                        />
                        <p className="text-xs text-gray-400 mt-1 pl-1">입력 후 스페이스바를 누르면 태그가 등록됩니다.</p>
                    </div>

                    {/* 4. Content */}
                    {form.productType === "STORE" ? (
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-[#333] mb-1">
                                    상품 상세 정보 <span className="text-red-500">*</span>
                                </label>
                                <p className="text-xs text-gray-500 mb-4">상세 설명 또는 상세 이미지 중 하나만 입력해도 됩니다.</p>

                                <div className="mb-6">
                                    <div className="flex justify-between items-end mb-2">
                                        <label className="block text-xs font-bold text-gray-500">
                                            상세 설명
                                        </label>
                                        <button
                                            type="button"
                                            onClick={generateAiDescriptionAuto}
                                            disabled={uploading || aiGenerating || !form.title || form.title.trim().length < 2}
                                            className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors ${!form.title || form.title.trim().length < 2
                                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-medium"
                                                }`}
                                        >
                                            {aiGenerating ? <span>⏳ 생성 중...</span> : <span>✨ AI 자동 생성</span>}
                                        </button>
                                    </div>
                                    <textarea
                                        placeholder="상품 정보를 입력해주세요."
                                        value={form.content}
                                        onChange={(e) => updateForm("content", e.target.value)}
                                        rows={8}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all bg-white text-sm resize-none"
                                        disabled={uploading}
                                        maxLength={300}

                                    />
                                    {errors.content && <p className="text-xs text-red-500 mt-1 pl-1">{errors.content}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2">
                                        상세 이미지
                                    </label>
                                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                                        <label className="aspect-[3/2] flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-all bg-white">
                                            <span className="text-gray-400 text-sm">+ 추가</span>
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                onChange={(e) => {
                                                    if (!e.target.files) return;
                                                    const newFiles = Array.from(e.target.files);
                                                    updateForm("productBanners", [...(form.productBanners || []), ...newFiles]);
                                                }}
                                                className="hidden"
                                                disabled={uploading}
                                            />
                                        </label>

                                        {(form.productBanners || []).map((fileOrUrl: any, idx: number) => {
                                            const isFile = fileOrUrl instanceof File;
                                            const src = isFile ? URL.createObjectURL(fileOrUrl) : fileOrUrl;
                                            return (
                                                <div key={idx} className="relative aspect-[3/2] rounded-xl overflow-hidden border border-gray-200 group bg-gray-100">
                                                    <img src={src} className="w-full h-full object-cover" onLoad={(e) => { if (isFile) URL.revokeObjectURL(e.currentTarget.src) }} />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newBanners = (form.productBanners || []).filter((_: any, i: number) => i !== idx);
                                                            updateForm("productBanners", newBanners);
                                                        }}
                                                        className="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center text-xs"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <label className="block text-sm font-bold text-[#333]">
                                    상세 설명 <span className="text-red-500">*</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={generateAiDescriptionAuto}
                                    disabled={uploading || aiGenerating || !form.title || form.title.trim().length < 2}
                                    className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors ${!form.title || form.title.trim().length < 2
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-medium"
                                        }`}
                                >
                                    {aiGenerating ? <span>⏳ 생성 중...</span> : <span>✨ AI 자동 생성</span>}
                                </button>
                            </div>
                            <textarea
                                placeholder="상품 정보를 입력해주세요."
                                value={form.content}
                                onChange={(e) => updateForm("content", e.target.value)}
                                rows={8}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all bg-gray-50/30 text-sm resize-none"
                                disabled={uploading}
                                maxLength={300}
                            />
                            {errors.content && <p className="text-xs text-red-500 mt-1 pl-1">{errors.content}</p>}
                        </div>
                    )}

                    {/* 5. Dynamic Section */}
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
                                form={form}
                                updateForm={updateForm}
                                hasBids={hasBids}
                            />
                        )}
                        {hasBids && form.productType === "AUCTION" && (
                            <p className="text-xs text-red-500 text-center mt-2">입찰이 시작된 경매 상품은 가격을 수정할 수 없습니다.</p>
                        )}
                        {form.productType === "USED" && (
                            <UsedSection
                                price={form.originalPrice || ""}
                                onChangePrice={(val) => updateForm("originalPrice", val)}
                                uploading={uploading}
                                form={form}
                                updateForm={updateForm}
                            />
                        )}
                        {form.productType === "STORE" && (
                            <StoreSection
                                price={form.salePrice || ""}
                                onChangePrice={(val) => updateForm("salePrice", val)}
                                uploading={uploading}
                                form={form}
                                updateForm={updateForm}
                            />
                        )}
                        {errors.startingPrice && <p className="text-xs text-red-500 mt-2 text-center">{errors.startingPrice}</p>}
                    </div>

                    {/* Agreement (New Checkbox Style) */}
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        {/* ✅ 타입별 가격으로 정산 예상 금액 계산 */}
                        <div className="flex justify-end mt-2 text-sm text-gray-500">
                            {settlementPrice > 0 ? (
                                <span className="font-medium text-[#c0392b]">
                                    정산 예상 금액: {Math.round(settlementPrice * 0.95).toLocaleString()}원 (수수료 5% 제외)
                                </span>
                            ) : null}
                        </div>
                        <div className="border border-gray-300 rounded-md p-3 h-32 overflow-y-auto mb-3 bg-gray-50 text-xs text-gray-500 leading-relaxed scrollbar-hide">
                            <strong className="block mb-1 text-gray-700">상품 수정 및 등록 규정</strong>
                            1. 판매자는 실제 보유한 상품만을 등록해야 하며, 허위 매물 등록 시 제재를 받을 수 있습니다.<br />
                            2. 위조품(짝퉁), 장물, 불법복제품 등 법령에 위반되거나 타인의 권리를 침해하는 물품은 등록할 수 없습니다.<br />
                            3. 상품의 상태, 하자 등 상세 정보를 정확하게 기재해야 합니다. 정보 부족으로 인한 분쟁 책임은 판매자에게 있습니다.<br />
                            4. 직거래 시 안전한 장소에서 거래하시기 바라며, 택배 거래 시 운송장 번호를 반드시 입력해야 합니다.<br />
                            5. 경매 상품의 경우 낙찰 후 정당한 사유 없이 판매를 거부할 경우 페널티가 부여될 수 있습니다.<br />
                            6. 서비스 수수료는 낙찰가/판매가의 5%이며, 정산 시 차감된 금액이 입금됩니다.<br />
                            7. 기타 자세한 사항은 고객센터 도움말을 참고해 주세요.
                        </div>

                        <CheckboxStyle
                            id="agreement"
                            checked={isAgreed}
                            onChange={setIsAgreed}
                            label="상품 수정 및 등록 규정에 동의합니다"
                        />
                        <p className="text-xs text-gray-500 mt-2 pl-7">
                            가품, 도난 물품, 거래 금지 품목 등록 시 서비스 이용이 제한될 수 있습니다.
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                            🚨 {error}
                        </div>
                    )}

                    {/* Submit */}
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
                            {uploading ? "처리 중..." : "수정 완료"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}