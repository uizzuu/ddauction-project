import CheckboxStyle from "../../../../components/ui/CheckboxStyle";

type Props = {
    price: string; // This is 'startingPrice' (Sale Price)
    onChangePrice: (val: string) => void;
    uploading: boolean;
    form: any;
    updateForm: (key: any, value: any) => void;
};

export default function StoreSection({ price, onChangePrice, uploading, form, updateForm }: Props) {

    // 1. Forward Calc: Original + Discount -> Sale
    const calculateSalePrice = (originalStr: string, discountStr: string) => {
        const original = Number(originalStr.replace(/[^0-9]/g, ''));
        const discount = Number(discountStr.replace(/[^0-9]/g, ''));

        if (original > 0 && discount >= 0 && discount <= 100) {
            // 반올림하여 1원 단위 정밀도 향상
            const sale = Math.round(original * (1 - discount / 100));
            updateForm("startingPrice", sale.toString());
        }
    };

    // 2. Reverse Calc: Original + Sale -> Discount
    const calculateDiscountRate = (originalStr: string, saleStr: string) => {
        const original = Number(originalStr.replace(/[^0-9]/g, ''));
        const sale = Number(saleStr.replace(/[^0-9]/g, ''));

        if (original > 0 && sale >= 0 && sale <= original) {
            // Formula: Discount = (1 - Sale/Original) * 100
            // 소수점 첫째자리까지는 고려할 수도 있지만, 보통 정수 %를 사용하므로 Math.round
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
                        정가 (원가) <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        placeholder="0"
                        value={form.originalPrice ? Number(form.originalPrice).toLocaleString() : ""}
                        onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            updateForm("originalPrice", val);
                            // If user changes Original, we re-calc Sale Price based on existing Discount?
                            // Or re-calc Discount based on existing Sale?
                            // User request: "Original + Discount -> Sale".
                            // So if Original changes, we use existing Discount to update Sale.
                            calculateSalePrice(val, form.discountRate || "0");
                        }}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all bg-white text-sm"
                        disabled={uploading}
                    />
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
                            // Forward Calc
                            calculateSalePrice(form.originalPrice || "0", val);
                        }}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all bg-white text-sm"
                        disabled={uploading}
                    />
                </div>
            </div>

            {/* Final Sale Price (startingPrice) */}
            <div>
                <label className="block text-sm font-bold text-[#333] mb-2">
                    판매 가격 (최종 할인가) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="판매 가격을 입력해주세요"
                        value={price ? Number(price).toLocaleString() : ""}
                        onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            onChangePrice(val); // this updates 'startingPrice' in form via parent

                            // Reverse Calc: If Original exists, calc Discount
                            if (form.originalPrice) {
                                calculateDiscountRate(form.originalPrice, val);
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
                    label="배송비 포함"
                />
            </div>
        </div>
    );
}
