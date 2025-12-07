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
};

export default function AuctionSection({
    startingPrice,
    auctionEndDate,
    minDateTime,
    maxDateTime,
    onChangePrice,
    onDateChange,
    uploading,
}: Props) {
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
        </div>
    );
}
