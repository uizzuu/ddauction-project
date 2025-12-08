type Props = {
    price: string;
    onChangePrice: (val: string) => void;
    uploading: boolean;
    form: any; // Using any to avoid circular dependency matching if strictly typed, or import ProductForm
    updateForm: (key: any, value: any) => void;
};



export default function UsedSection({ price, onChangePrice, uploading, form, updateForm }: Props) {
    const handleDeliveryChange = (method: string) => {
        const current = form.deliveryAvailable || [];
        if (current.includes(method)) {
            updateForm("deliveryAvailable", current.filter((m: string) => m !== method));
        } else {
            updateForm("deliveryAvailable", [...current, method]);
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

            {/* Delivery Methods */}
            {/* Address & GPS */}
            <div className="mt-6">
                <label className="block text-sm font-bold text-[#333] mb-2">
                    거래 희망 장소 (주소) <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="예: 서울시 강남구 역삼동"
                        value={form.address || ""}
                        onChange={(e) => updateForm("address", e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all bg-white text-sm placeholder:text-gray-400"
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
                                            alert(`현재 위치가 입력되었습니다: ${addr}`);
                                        } else {
                                            updateForm("address", addr || "주소 변환 실패");
                                            alert(`주소 변환에 실패했습니다: ${addr}`);
                                        }
                                    } catch (e: any) {
                                        console.error(e);
                                        updateForm("address", "위치 정보 저장됨 (주소 변환 실패)");
                                        alert(`위치 정보는 저장되었으나 주소를 가져오지 못했습니다.\n오류: ${e.message || e}`);
                                    }
                                },
                                (err) => {
                                    console.error(err);
                                    alert("위치 정보를 가져올 수 없습니다.");
                                }
                            );
                        }}
                        className="px-4 py-3 bg-gray-100 rounded-xl font-bold text-sm text-gray-600 hover:bg-gray-200 transition-colors whitespace-nowrap"
                        disabled={uploading}
                    >
                        📍 현위치
                    </button>
                </div>
                {form.latitude && form.longitude && (
                    <p className="text-xs text-green-600 mt-1 pl-1">✓ 위치 정보가 등록되었습니다.</p>
                )}
            </div>

            {/* Delivery Methods */}
            <div className="mt-6">
                <label className="block text-sm font-bold text-[#333] mb-2">
                    가능한 배송방법 <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-3">
                    {["직거래", "반택", "준등기", "택배"].map((label) => (
                        <label key={label} className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50">
                            <input
                                type="checkbox"
                                checked={(form.deliveryAvailable || []).includes(label)}
                                onChange={() => handleDeliveryChange(label)}
                                disabled={uploading}
                                className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                            />
                            <span className="text-sm text-gray-700">{label}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}
