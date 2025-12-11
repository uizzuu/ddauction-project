import CheckboxStyle from "../../../../components/ui/CheckboxStyle";

type Props = {
    price: string; // ✅ salePrice (판매가)
    onChangePrice: (val: string) => void;
    uploading: boolean;
    form: any;
    updateForm: (key: any, value: any) => void;
};

export default function StoreSection({ price, onChangePrice, uploading, form, updateForm }: Props) {

    // ✅ 정가 입력 시 -> 할인율 기반으로 판매가 자동 계산
    const calculateSalePriceFromOriginal = (originalStr: string, discountStr: string) => {
        const original = Number(originalStr.replace(/[^0-9]/g, ''));
        const discount = Number(discountStr.replace(/[^0-9]/g, ''));

        if (original > 0 && discount >= 0 && discount <= 100) {
            const sale = Math.round(original * (1 - discount / 100));
            onChangePrice(sale.toString()); // ✅ salePrice 업데이트
        }
    };

    // ✅ 판매가 입력 시 -> 정가 기반으로 할인율 자동 계산
    const calculateDiscountFromSalePrice = (originalStr: string, saleStr: string) => {
        const original = Number(originalStr.replace(/[^0-9]/g, ''));
        const sale = Number(saleStr.replace(/[^0-9]/g, ''));

        if (original > 0 && sale >= 0 && sale <= original) {
            const discount = Math.round((1 - sale / original) * 100);
            updateForm("discountRate", discount.toString());
        }
    };

    return (
        <div className="space-y-6">
            {/* Pricing Group */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-[#333] mb-2">
                        정가 (원가)
                    </label>
                    <input
                        type="text"
                        placeholder="0"
                        value={form.originalPrice ? Number(form.originalPrice).toLocaleString() : ""}
                        onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            updateForm("originalPrice", val);
                            // 정가 변경 시 할인율 기반으로 판매가 재계산
                            calculateSalePriceFromOriginal(val, form.discountRate || "0");
                        }}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all bg-white text-sm"
                        disabled={uploading}
                    />
                    <p className="text-xs text-gray-400 mt-1">할인 표시용 (선택)</p>
                </div>
                <div>
                    <label className="block text-sm font-bold text-[#333] mb-2">
                        할인율 (%)
                    </label>
                    <input
                        type="text"
                        placeholder="0"
                        value={form.discountRate || ""}
                        onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            if (Number(val) > 100) return;
                            updateForm("discountRate", val);
                            // 할인율 변경 시 정가 기반으로 판매가 재계산
                            calculateSalePriceFromOriginal(form.originalPrice || "0", val);
                        }}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all bg-white text-sm"
                        disabled={uploading}
                    />
                </div>
            </div>

            {/* ✅ Final Sale Price (salePrice) */}
            <div>
                <label className="block text-sm font-bold text-[#333] mb-2">
                    판매 가격 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="판매 가격을 입력해주세요"
                        value={price ? Number(price).toLocaleString() : ""}
                        onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            onChangePrice(val); // ✅ salePrice 업데이트

                            // 정가가 있으면 할인율 역산
                            if (form.originalPrice) {
                                calculateDiscountFromSalePrice(form.originalPrice, val);
                            }
                        }}
                        className="w-full pl-4 pr-8 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all bg-white text-sm font-bold text-black"
                        disabled={uploading}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">원</span>
                </div>
                <p className="text-xs text-gray-500 mt-2 pl-1">
                    * 스토어 상품은 고정 가격으로 판매됩니다.
                </p>
            </div>

            {/* Delivery Costs */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-[#333] mb-2">
                        기본 배송비
                    </label>
                    <input
                        type="text"
                        placeholder="0"
                        value={form.deliveryPrice ? Number(form.deliveryPrice).toLocaleString() : ""}
                        onChange={(e) => updateForm("deliveryPrice", e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all bg-white text-sm"
                        disabled={uploading}
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-[#333] mb-2">
                        도서산간 추가비용 <span className="text-xs font-normal text-gray-500">(기본 배송비에 더해짐)</span>
                    </label>
                    <input
                        type="text"
                        placeholder="예: 3000"
                        value={form.deliveryAddPrice ? Number(form.deliveryAddPrice).toLocaleString() : ""}
                        onChange={(e) => updateForm("deliveryAddPrice", e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all bg-white text-sm"
                        disabled={uploading}
                    />
                </div>
            </div>

            <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg">
                <CheckboxStyle
                    checked={form.deliveryIncluded || false}
                    onChange={(checked) => updateForm("deliveryIncluded", checked)}
                    label="무료배송"
                />
            </div>
        </div>
    );
}