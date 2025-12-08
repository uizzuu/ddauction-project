import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type Props = {
    startingPrice: string;
    auctionEndDate: Date | null;
    minDateTime?: Date;
    maxDateTime?: Date;
    onChangePrice: (val: string) => void;
    onDateChange: (date: Date | null) => void;
    uploading: boolean;
    form: any;
    updateForm: (key: any, value: any) => void;
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
    updateForm
}: Props) {
    const handleDeliveryChange = (method: string) => {
        const current = form.deliveryAvailable || [];
        if (current.includes(method)) {
            updateForm("deliveryAvailable", current.filter((m: string) => m !== method));
        } else {
            updateForm("deliveryAvailable", [...current, method]);
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
                        value={startingPrice ? Number(startingPrice).toLocaleString() : ""}
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
                            const current = startingPrice ? parseInt(startingPrice, 10) : 0;
                            onChangePrice((current + 1000).toString());
                        }}
                        className="px-3 py-1 text-xs border border-gray-200 rounded-full hover:bg-gray-50 text-gray-600 transition-colors"
                    >
                        + 1,000원
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            const current = startingPrice ? parseInt(startingPrice, 10) : 0;
                            onChangePrice((current + 10000).toString());
                        }}
                        className="px-3 py-1 text-xs border border-gray-200 rounded-full hover:bg-gray-50 text-gray-600 transition-colors"
                    >
                        + 10,000원
                    </button>
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-[#333] mb-2">
                    경매 종료 시간 <span className="text-red-500">*</span>
                    <span className="text-xs font-normal text-gray-400 ml-2">최소 24시간 이후</span>
                </label>
                <ReactDatePicker
                    selected={auctionEndDate}
                    onChange={onDateChange}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={5}
                    dateFormat="yyyy-MM-dd HH:mm"
                    minDate={minDateTime}
                    maxDate={maxDateTime}
                    placeholderText="날짜와 시간을 선택하세요"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all bg-white text-sm placeholder:text-gray-400 font-sans"
                    disabled={uploading}
                    popperClassName="z-[500]"
                />
            </div>
            <p className="col-span-1 md:col-span-2 text-xs text-gray-500 mt-1">
                * 경매 종료 시 가장 높은 가격을 제시한 입찰자에게 낙찰됩니다.
            </p>

            {/* Delivery Methods & Logic */}
            <div className="col-span-1 md:col-span-2 mt-6 space-y-6">
                <label className="block text-sm font-bold text-[#333] mb-2">
                    거래 방식 선택 <span className="text-red-500">*</span>
                </label>

                {/* 1. 직거래 (Direct) */}
                <div className="border border-gray-200 rounded-xl p-4">
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                        <input
                            type="checkbox"
                            checked={(form.deliveryAvailable || []).includes("직거래")}
                            onChange={() => handleDeliveryChange("직거래")}
                            disabled={uploading}
                            className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                        />
                        <span className="font-bold text-gray-800">직거래</span>
                    </label>

                    {(form.deliveryAvailable || []).includes("직거래") && (
                        <div className="mt-3 pl-6">
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                거래 희망 장소 <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="예: 서울시 강남구 역삼동"
                                    value={form.address || ""}
                                    onChange={(e) => updateForm("address", e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
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
                                                    if (addr && !addr.startsWith("주소")) {
                                                        updateForm("address", addr);
                                                    } else {
                                                        alert(`주소 변환 실패: ${addr}`);
                                                    }
                                                } catch (e: any) {
                                                    console.error(e);
                                                    alert("위치 정보 가져오기 실패");
                                                }
                                            },
                                            () => alert("위치 정보를 가져올 수 없습니다.")
                                        );
                                    }}
                                    className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-200"
                                    disabled={uploading}
                                >
                                    📍 현위치
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. 반값택배 (Half Delivery) */}
                <div className="border border-gray-200 rounded-xl p-4">
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                        <input
                            type="checkbox"
                            checked={(form.deliveryAvailable || []).some((m: string) => m.includes("반택"))}
                            onChange={() => {
                                // Toggle logic for parent category
                                const hasHalf = (form.deliveryAvailable || []).some((m: string) => m.includes("반택"));
                                if (hasHalf) {
                                    // Remove all half types
                                    updateForm("deliveryAvailable", (form.deliveryAvailable || []).filter((m: string) => !m.includes("반택")));
                                } else {
                                    // Add default GS
                                    updateForm("deliveryAvailable", [...(form.deliveryAvailable || []), "반택(GS)"]);
                                }
                            }}
                            disabled={uploading}
                            className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                        />
                        <span className="font-bold text-gray-800">반값택배</span>
                    </label>

                    {(form.deliveryAvailable || []).some((m: string) => m.includes("반택")) && (
                        <div className="mt-3 pl-6 flex gap-4">
                            {["반택(GS)", "반택(CU)"].map((type) => (
                                <label key={type} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={(form.deliveryAvailable || []).includes(type)}
                                        onChange={() => {
                                            const current = form.deliveryAvailable || [];
                                            if (current.includes(type)) {
                                                updateForm("deliveryAvailable", current.filter((m: string) => m !== type));
                                            } else {
                                                updateForm("deliveryAvailable", [...current, type]);
                                            }
                                        }}
                                        className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                                    />
                                    <span className="text-sm text-gray-700">{type.replace("반택", "")}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* 3. 일반택배 (Parcel) */}
                <div className="border border-gray-200 rounded-xl p-4">
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                        <input
                            type="checkbox"
                            checked={(form.deliveryAvailable || []).includes("택배")}
                            onChange={() => handleDeliveryChange("택배")}
                            disabled={uploading}
                            className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                        />
                        <span className="font-bold text-gray-800">일반택배</span>
                    </label>

                    {(form.deliveryAvailable || []).includes("택배") && (
                        <div className="mt-3 pl-6">
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                배송비 (원)
                            </label>
                            <input
                                type="text"
                                placeholder="3500"
                                value={form.deliveryPrice || ""}
                                onChange={(e) => updateForm("deliveryPrice", e.target.value.replace(/[^0-9]/g, ''))}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                disabled={uploading}
                            />
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
