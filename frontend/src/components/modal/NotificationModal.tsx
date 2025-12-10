import { useEffect, useRef, useState } from "react";
import { X, Bell } from "lucide-react";
import { API_BASE_URL } from "../../common/api";

export type Notification = {
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

export default function NotificationModal({ isOpen, onClose }: Props) {
  const modalRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // 알림 상태
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // 웹소켓 연결
  useEffect(() => {
  const wsUrl =
    API_BASE_URL.replace("http", "ws").replace("/api", "") +
    "/ws/notifications"; // 알림용 웹소켓 엔드포인트
  const ws = new WebSocket(wsUrl);
  wsRef.current = ws;

  ws.onopen = () => console.log("알림 WebSocket 연결됨");

  ws.onmessage = (event) => {
    const newNoti: Notification = JSON.parse(event.data);
    setNotifications((prev) => [newNoti, ...prev]);
  };

  ws.onerror = (err) => console.error("알림 WebSocket 에러:", err);

  ws.onclose = () => console.log("알림 WebSocket 종료");

  return () => ws.close();
}, []);


  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // 알림 클릭 시 읽음 처리
  const handleNotificationClick = (id: number) => {
    setNotifications((prev) =>
      prev.map((noti) => (noti.id === id ? { ...noti, read: true } : noti))
    );
  };

  // 전체 읽음 처리
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((noti) => ({ ...noti, read: true })));
  };

  // 읽지 않은 알림 개수
  const unreadCount = notifications.filter((noti) => !noti.read).length;

  return (
    <div
      ref={modalRef}
      className="absolute top-12 right-0 w-80 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden animate-fadeIn"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2 relative">
          <Bell size={16} className="text-[#111]" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
          )}
          <span className="font-bold text-gray-800 ml-5">알림</span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* 알림 리스트 */}
      <div className="max-h-[400px] overflow-y-auto">
        {notifications.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {notifications.map((noti) => (
              <div
                key={noti.id}
                onClick={() => handleNotificationClick(noti.id)}
                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                  noti.read ? "opacity-60" : "bg-white"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-sm font-bold text-gray-800">{noti.title}</h4>
                  <span className="text-[10px] text-gray-400">{noti.time}</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{noti.message}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-400 text-sm">
            새로운 알림이 없습니다.
          </div>
        )}
      </div>

      {/* 전체 읽음 처리 버튼 */}
      <div className="p-3 border-t border-gray-100 bg-gray-50 text-center">
        <button
          onClick={markAllAsRead}
          className="text-xs text-gray-500 hover:text-[#111] font-medium"
        >
          알림 전체보기
        </button>
      </div>
    </div>
  );
}
