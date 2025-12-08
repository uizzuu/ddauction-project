import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { COURIER_OPTIONS } from "../../common/enums";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (courier: string, trackingNumber: string) => void;
    defaultCourier?: string;
    defaultTrackingNumber?: string;
};

export default function ShippingModal({
    isOpen,
    onClose,
    onSubmit,
    defaultCourier = COURIER_OPTIONS[0].value,
    defaultTrackingNumber = ""
}: Props) {
    const [courier, setCourier] = useState(defaultCourier);
    const [trackingNumber, setTrackingNumber] = useState(defaultTrackingNumber);

    useEffect(() => {
        if (isOpen) {
            setCourier(defaultCourier);
            setTrackingNumber(defaultTrackingNumber);
        }
    }, [isOpen, defaultCourier, defaultTrackingNumber]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!trackingNumber.trim()) {
            alert("운송장 번호를 입력해주세요.");
            return;
        }
        onSubmit(courier, trackingNumber);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white w-full max-w-md rounded-xl shadow-lg overflow-hidden animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">배송 정보 입력</h3>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            택배사 선택
                        </label>
                        <select
                            value={courier}
                            onChange={(e) => setCourier(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                        >
                            {COURIER_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            운송장 번호
                        </label>
                        <input
                            type="text"
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value.replace(/[^0-9]/g, ""))}
                            placeholder="숫자만 입력해주세요"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 text-white bg-black rounded-lg hover:bg-gray-800 font-medium transition-colors"
                        >
                            등록하기
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
