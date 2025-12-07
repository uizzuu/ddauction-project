type Props = {
    price: string;
    onChangePrice: (val: string) => void;
    uploading: boolean;
};

export default function UsedSection({ price, onChangePrice, uploading }: Props) {
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
        </div>
    );
}
