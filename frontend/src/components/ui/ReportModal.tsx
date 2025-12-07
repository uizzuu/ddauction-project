import React, { useState } from "react";

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [reason, setReason] = useState("");

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!reason.trim()) {
            alert("신고 사유를 입력해주세요.");
            return;
        }
        onSubmit(reason);
        setReason("");
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"> {/* Added blur-sm for extra depth */}
            <div className="bg-white rounded-2xl shadow-xl w-[90%] max-w-md overflow-hidden animate-fade-in-up">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <span className="text-xl">🚨</span> 신고하기
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-gray-600 text-sm mb-4">
                        신고 사유를 작성해주세요. 허위 신고 시 불이익을 받을 수 있습니다.
                    </p>
                    <textarea
                        className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none h-32 text-sm"
                        placeholder="예: 불법 상품 판매, 욕설/비하 발언 등"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-gray-600 font-medium hover:bg-gray-200 transition-colors"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 shadow-md transition-colors"
                    >
                        신고하기
                    </button>
                </div>
            </div>
        </div>
    );
};
