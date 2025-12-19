import CheckboxStyle from "../../../../components/ui/CheckboxStyle";
import DatePickerStyle from "../../../../components/ui/DatePickerStyle";
import { DELIVERY_TYPES } from "../../../../common/enums";

type Props = {
    startingPrice: string;
    auctionEndDate: Date | null;
    minDateTime?: Date;
    maxDateTime?: Date;
    onChangePrice: (val: string) => void;
    onDateChange: (date: Date | null) => void;
    uploading: boolean;
    form: any;
    updateForm: any;
    hasBids?: boolean;
};

export default function AuctionSection({
    startingPrice,
    auctionEndDate,
    minDateTime,
    maxDateTime,
    onChangePrice,
    onDateChange,
    uploading,
    form,
    updateForm,
    hasBids = false
}: Props) {
    const deliveryAvailable: string[] = form.deliveryAvailable || [];

    const handleDeliveryChange = (method: string) => {
        if (deliveryAvailable.includes(method)) {
            updateForm("deliveryAvailable", deliveryAvailable.filter((m: string) => m !== method));
        } else {
            updateForm("deliveryAvailable", [...deliveryAvailable, method]);
        }
    };

    // 편의점 택배 체크 여부 (GS 또는 CU 포함)
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-bold text-[#333] mb-2">
                    시작 가격 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="0"
                        value={startingPrice}
                        onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, "");
                            onChangePrice?.(Number(val).toLocaleString());
                        }}
                        className="w-full pl-4 pr-8 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all bg-white text-right font-medium disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                        disabled={uploading || hasBids}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">원</span>
                </div>
                <div className="flex gap-2 mt-2">
                    <button
                        type="button"
                        onClick={() => {
                            const current = startingPrice ? parseInt(startingPrice.replace(/,/g, ''), 10) : 0;
                            onChangePrice?.((current + 1000).toLocaleString());
                        }}
                        className="px-3 py-1 text-xs border border-gray-200 rounded-full hover:bg-gray-50 text-gray-600 transition-colors"
                    >
                        + 1,000원
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            const current = startingPrice ? parseInt(startingPrice.replace(/,/g, ''), 10) : 0;
                            onChangePrice?.((current + 10000).toLocaleString());
                        }}
                        className="px-3 py-1 text-xs border border-gray-200 rounded-full hover:bg-gray-50 text-gray-600 transition-colors"
                    >
                        + 10,000원
                    </button>
                </div>
                {hasBids && (
                    <p className="text-xs text-red-500 mt-1">
                        * 입찰이 시작된 경매는 시작 가격을 수정할 수 없습니다.
                    </p>
                )}
            </div>

            <div>
                <label className="block text-sm font-bold text-[#333] mb-2">
                    경매 종료 시간 <span className="text-red-500">*</span>
                    <span className="text-xs font-normal text-gray-400 ml-2">최소 24시간 이후</span>
                </label>
                <DatePickerStyle
                    selected={auctionEndDate}
                    onChange={onDateChange}
                    showTimeSelect
                    dateFormat="yyyy-MM-dd HH:mm"
                    minDate={minDateTime}
                    maxDate={maxDateTime}
                    placeholder="날짜와 시간을 선택하세요"
                    className="w-full"
                />
            </div>
            <p className="col-span-1 md:col-span-2 text-xs text-gray-500 mt-1">
                * 경매 종료 시 가장 높은 가격을 제시한 입찰자에게 낙찰됩니다.
            </p>

            {/* ✅ Delivery Methods - enum 키 사용 */}
            <div className="col-span-1 md:col-span-2 mt-6">
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