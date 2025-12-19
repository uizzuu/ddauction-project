import CheckboxStyle from "../../../../components/ui/CheckboxStyle";
import { DELIVERY_TYPES } from "../../../../common/enums";

type Props = {
    price: string;  // ✅ originalPrice (판매가)
    onChangePrice: (val: string) => void;
    uploading: boolean;
    form: any;
    updateForm: (key: any, value: any) => void;
};

export default function UsedSection({ price, onChangePrice, uploading, form, updateForm }: Props) {
    const deliveryAvailable: string[] = form.deliveryAvailable || [];

    const handleDeliveryChange = (method: string) => {
        if (deliveryAvailable.includes(method)) {
            updateForm("deliveryAvailable", deliveryAvailable.filter((m: string) => m !== method));
        } else {
            updateForm("deliveryAvailable", [...deliveryAvailable, method]);
        }
    };

    // 편의점 택배 체크 여부 (GS 또는 CU)
    const hasConvenience = deliveryAvailable.some(m => m === DELIVERY_TYPES.GS || m === DELIVERY_TYPES.CU);

    // 편의점 택배 토글
    const handleConvenienceToggle = () => {
        if (hasConvenience) {
            updateForm("deliveryAvailable", deliveryAvailable.filter(m => m !== DELIVERY_TYPES.GS && m !== DELIVERY_TYPES.CU));
        } else {
            updateForm("deliveryAvailable", [...deliveryAvailable, DELIVERY_TYPES.GS]);
        }
    };

    return (
        <div>
            <label className="block text-sm font-bold text-[#333] mb-2">
                판매 가격 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
                <input
                    type="text"
                    placeholder="판매 희망 가격을 입력해주세요"
                    value={price ? Number(price).toLocaleString() : ""}
                    onChange={(e) => onChangePrice(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full pl-4 pr-8 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all bg-white text-sm placeholder:text-gray-400"
                    disabled={uploading}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">원</span>
            </div>
            <div className="flex gap-2 mt-2">
                <button
                    type="button"
                    onClick={() => {
                        const current = price ? parseInt(price, 10) : 0;
                        onChangePrice((current + 1000).toString());
                    }}
                    className="px-3 py-1 text-xs border border-gray-200 rounded-full hover:bg-gray-50 text-gray-600 transition-colors"
                >
                    + 1,000원
                </button>
                <button
                    type="button"
                    onClick={() => {
                        const current = price ? parseInt(price, 10) : 0;
                        onChangePrice((current + 10000).toString());
                    }}
                    className="px-3 py-1 text-xs border border-gray-200 rounded-full hover:bg-gray-50 text-gray-600 transition-colors"
                >
                    + 10,000원
                </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 pl-1">
                * 중고 거래 특성상 적절한 가격을 설정해주세요.
            </p>

            {/* ✅ Delivery Methods - enum 키 사용 */}
            <div className="mt-6">
                <label className="block text-sm font-bold text-[#333] mb-2">
                    희망 배송 방법 <span className="text-red-500">*</span> <span className="text-[14px] text-[#ccc]">(중복선택 가능)</span>
                </label>

                <div className="flex flex-wrap gap-4 mb-3">
                    {/* 직거래 (MEETUP) */}
                    <CheckboxStyle
                        checked={deliveryAvailable.includes("MEETUP")}
                        onChange={() => handleDeliveryChange("MEETUP")}
                        label={DELIVERY_TYPES.MEETUP}
                    />

                    {/* 편의점택배 (GS, CU 그룹) */}
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={hasConvenience}
                            onChange={handleConvenienceToggle}
                            disabled={uploading}
                            className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                        />
                        <span className="text-sm text-gray-700">편의점택배</span>
                    </label>

                    {/* 준등기 (SEMIREGISTERED) */}
                    <CheckboxStyle
                        checked={deliveryAvailable.includes("SEMIREGISTERED")}
                        onChange={() => handleDeliveryChange("SEMIREGISTERED")}
                        label={DELIVERY_TYPES.SEMIREGISTERED}
                    />

                    {/* 등기 (REGISTERED) */}
                    <CheckboxStyle
                        checked={deliveryAvailable.includes("REGISTERED")}
                        onChange={() => handleDeliveryChange("REGISTERED")}
                        label={DELIVERY_TYPES.REGISTERED}
                    />

                    {/* 택배 (PARCEL) */}
                    <CheckboxStyle
                        checked={deliveryAvailable.includes("PARCEL")}
                        onChange={() => handleDeliveryChange("PARCEL")}
                        label={DELIVERY_TYPES.PARCEL}
                    />
                </div>

                <div className="flex flex-wrap gap-4 mb-3">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <CheckboxStyle
                            checked={true}
                            disabled={true}
                            onChange={() => { }}
                            label="안전결제 (필수)"
                        />
                        <p className="text-xs text-gray-500 mt-1 ml-7">구매자가 물품 수령 후 구매확정을 해야 정산됩니다.</p>
                    </div>
                </div>

                {/* 배송 상세 입력 */}
                {(deliveryAvailable.includes("MEETUP") ||
                    hasConvenience ||
                    deliveryAvailable.includes("SEMIREGISTERED") ||
                    deliveryAvailable.includes("REGISTERED") ||
                    deliveryAvailable.includes("PARCEL")) && (
                        <div className="bg-gray-50/50 rounded-lg p-4 border border-gray-200 space-y-3">
                            {/* 직거래 장소 */}
                            {deliveryAvailable.includes("MEETUP") && (
                                <div className="grid grid-cols-[100px_1fr] gap-3 items-start">
                                    <label className="text-sm font-medium text-gray-600 pt-2">📍 직거래 장소</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="예: 서울시 강남구 역삼동"
                                            value={form.address || ""}
                                            onChange={(e) => updateForm("address", e.target.value)}
                                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                                            disabled={uploading}
                                        />
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                if (!navigator.geolocation) {
                                                    alert("GPS를 지원하지 않는 브라우저입니다.");
                                                    return;
                                                }
                                                const { reverseGeocode } = await import("../../../../common/api");
                                                navigator.geolocation.getCurrentPosition(
                                                    async (pos) => {
                                                        const { latitude, longitude } = pos.coords;
                                                        updateForm("latitude", latitude);
                                                        updateForm("longitude", longitude);
                                                        try {
                                                            const addr = await reverseGeocode(latitude, longitude);
                                                            updateForm("address", addr);
                                                        } catch (e: any) {
                                                            console.error(e);
                                                            alert("주소 변환 실패");
                                                        }
                                                    },
                                                    () => alert("위치 정보를 가져올 수 없습니다.")
                                                );
                                            }}
                                            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 whitespace-nowrap"
                                            disabled={uploading}
                                        >
                                            📍
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* 편의점 택배 (GS, CU) */}
                            {hasConvenience && (
                                <div className="grid grid-cols-[100px_1fr] gap-3 items-start">
                                    <label className="text-sm font-medium text-gray-600 pt-2">편의점택배</label>
                                    <div className="space-y-2">
                                        {[
                                            { label: DELIVERY_TYPES.GS, value: "GS", priceKey: "gsPrice", defaultPrice: "1900" },
                                            { label: DELIVERY_TYPES.CU, value: "CU", priceKey: "cuPrice", defaultPrice: "1900" }
                                        ].map((option) => (
                                            <div key={option.value} className="flex items-center gap-3">
                                                <label className="flex items-center gap-2 cursor-pointer min-w-[120px]">
                                                    <input
                                                        type="checkbox"
                                                        checked={deliveryAvailable.includes(option.value)}
                                                        onChange={() => handleDeliveryChange(option.value)}
                                                        className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                                                    />
                                                    <span className="text-sm text-gray-700">{option.label}</span>
                                                </label>
                                                {deliveryAvailable.includes(option.value) && (
                                                    <input
                                                        type="text"
                                                        placeholder={option.defaultPrice}
                                                        value={form[option.priceKey] || ""}
                                                        onChange={(e) => updateForm(option.priceKey, e.target.value.replace(/[^0-9]/g, ''))}
                                                        className="w-28 px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white"
                                                        disabled={uploading}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 준등기 비용 */}
                            {deliveryAvailable.includes("SEMIREGISTERED") && (
                                <div className="grid grid-cols-[100px_1fr] gap-3 items-center">
                                    <label className="text-sm font-medium text-gray-600">💰 준등기 비용</label>
                                    <input
                                        type="text"
                                        placeholder="2000"
                                        value={form.semiRegisteredPrice || ""}
                                        onChange={(e) => updateForm("semiRegisteredPrice", e.target.value.replace(/[^0-9]/g, ''))}
                                        className="w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                                        disabled={uploading}
                                    />
                                </div>
                            )}

                            {/* 등기 비용 */}
                            {deliveryAvailable.includes("REGISTERED") && (
                                <div className="grid grid-cols-[100px_1fr] gap-3 items-center">
                                    <label className="text-sm font-medium text-gray-600">💰 등기 비용</label>
                                    <input
                                        type="text"
                                        placeholder="3000"
                                        value={form.registeredPrice || ""}
                                        onChange={(e) => updateForm("registeredPrice", e.target.value.replace(/[^0-9]/g, ''))}
                                        className="w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                                        disabled={uploading}
                                    />
                                </div>
                            )}

                            {/* 택배 비용 */}
                            {deliveryAvailable.includes("PARCEL") && (
                                <div className="grid grid-cols-[100px_1fr] gap-3 items-center">
                                    <label className="text-sm font-medium text-gray-600">💰 택배 비용</label>
                                    <input
                                        type="text"
                                        placeholder="3500"
                                        value={form.parcelPrice || form.deliveryPrice || ""}
                                        onChange={(e) => updateForm("parcelPrice", e.target.value.replace(/[^0-9]/g, ''))}
                                        className="w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                                        disabled={uploading}
                                    />
                                </div>
                            )}
                        </div>
                    )}
            </div>
        </div>
    );
}