
import { useEffect, useRef } from "react";
import { X, Bell } from "lucide-react";

type Notification = {
    id: number;
    title: string;
    message: string;
    time: string;
    read: boolean;
};

type Props = {
    isOpen: boolean;
    onClose: () => void;
};

const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: 1,
        title: "입찰 성공",
        message: "참여하신 '아이폰 15 프로' 경매가 낙찰되었습니다! 결제를 진행해주세요.",
        time: "방금 전",
        read: false,
    },
    {
        id: 2,
        title: "관심 상품 마감 임박",
        message: "찜하신 '맥북 에어 M2' 경매가 1시간 뒤 종료됩니다.",
        time: "1시간 전",
        read: false,
    },
    {
        id: 3,
        title: "새로운 입찰",
        message: "판매 중인 '에어팟 맥스'에 새로운 입찰이 있습니다.",
        time: "3시간 전",
        read: true,
    },
];

export default function NotificationModal({ isOpen, onClose }: Props) {
    const modalRef = useRef<HTMLDivElement>(null);

    // 외부 클릭 시 닫기
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div ref={modalRef} className="absolute top-12 right-0 w-80 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                    <Bell size={16} className="text-[#111]" />
                    <span className="font-bold text-gray-800">알림</span>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X size={18} />
                </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
                {MOCK_NOTIFICATIONS.length > 0 ? (
                    <div className="divide-y divide-gray-50">
                        {MOCK_NOTIFICATIONS.map((noti) => (
                            <div
                                key={noti.id}
                                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${noti.read ? 'opacity-60' : 'bg-white'}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="text-sm font-bold text-gray-800">{noti.title}</h4>
                                    <span className="text-[10px] text-gray-400">{noti.time}</span>
                                </div>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    {noti.message}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-400 text-sm">
                        새로운 알림이 없습니다.
                    </div>
                )}
            </div>

            <div className="p-3 border-t border-gray-100 bg-gray-50 text-center">
                <button className="text-xs text-gray-500 hover:text-[#111] font-medium">
                    알림 전체보기
                </button>
            </div>
        </div>
    );
}
