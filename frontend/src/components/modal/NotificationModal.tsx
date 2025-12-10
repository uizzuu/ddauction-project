import { useEffect, useRef, useState, useCallback } from "react";
import { X, Bell } from "lucide-react";
import { API_BASE_URL } from "../../common/api";
import type { NotificationStatus } from "../../common/enums";

export type Notification = {
  notificationId: number;
  userId?: number;
  notificationStatus?: NotificationStatus;
  content: string;
  isRead: boolean;
  createdAt: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  userId?: number;
};

export default function NotificationModal({ isOpen, onClose, userId: propsUserId }: Props) {
  const modalRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // 사용자 ID 가져오기 (최초 1회만)
  const userIdRef = useRef<number | undefined>(propsUserId);

  useEffect(() => {
    if (!userIdRef.current) {
      const userInfo = localStorage.getItem("userInfo");
      if (userInfo) {
        userIdRef.current = JSON.parse(userInfo).userId;
      }
    }
  }, []);

  // WebSocket 연결 (최초 1회)
  useEffect(() => {
    const userId = userIdRef.current;
    if (!userId) return;

    const wsUrl =
      API_BASE_URL.replace("http", "ws").replace("/api", "") +
      `/ws/notifications?userId=${userId}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => console.log("🔗 WebSocket Connected:", userId);
    ws.onerror = (error) => console.error("❌ WebSocket error:", error);

    ws.onmessage = (event) => {
      try {
        const newNoti: Notification = JSON.parse(event.data);
        setNotifications((prev) => [newNoti, ...prev]);
      } catch (e) {
        console.error("JSON 파싱 실패:", e);
      }
    };

    return () => {
      ws.close();
      console.log("🔌 WebSocket Closed");
    };
  }, []);

  // ➤ 외부 클릭으로 모달 닫기 (버블링 방지)
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, onClose]);

  // 읽음 처리
  const handleNotificationClick = useCallback((id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.notificationId === id ? { ...n, isRead: true } : n))
    );
  }, []);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const formatTime = (createdAt: string) => {
    const date = new Date(createdAt);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = diff / 60000;

    if (mins < 1) return "방금 전";
    if (mins < 60) return `${Math.floor(mins)}분 전`;
    if (mins < 1440) return `${Math.floor(mins / 60)}시간 전`;
    return date.toLocaleDateString("ko-KR");
  };

  const getTitle = (status?: NotificationStatus) => {
    switch (status) {
      case "BID_WIN": return "🎉 낙찰 성공";
      case "BID_LOSE": return "📢 낙찰 실패";
      case "FOLLOW": return "👥 새 팔로워";
      case "MESSAGE": return "💬 새 메시지";
      case "NEW_COMMENT": return "💭 새 댓글";
      case "SYSTEM": return "🔔 시스템 알림";
      default: return "🔔 알림";
    }
  };

  const getBg = (status?: NotificationStatus) => {
    switch (status) {
      case "BID_WIN": return "bg-green-50 border-l-4 border-green-500";
      case "BID_LOSE": return "bg-red-50 border-l-4 border-red-500";
      case "FOLLOW": return "bg-blue-50 border-l-4 border-blue-500";
      case "MESSAGE": return "bg-purple-50 border-l-4 border-purple-500";
      case "NEW_COMMENT": return "bg-yellow-50 border-l-4 border-yellow-500";
      default: return "";
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      onClick={(e) => e.stopPropagation()}
      className="absolute top-12 right-0 w-80 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden animate-fadeIn"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center gap-2 relative">
          <Bell size={16} className="text-[#111]" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
          )}
          <span className="font-bold text-gray-800 ml-5">알림</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={18} />
        </button>
      </div>

      {/* 내용 */}
      <div className="max-h-[400px] overflow-y-auto">
        {notifications.length > 0 ? (
          notifications.map((noti) => (
            <div
              key={noti.notificationId}
              onClick={() => handleNotificationClick(noti.notificationId)}
              className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                noti.isRead ? "opacity-60" : ""
              } ${getBg(noti.notificationStatus)}`}
            >
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-bold text-sm">{getTitle(noti.notificationStatus)}</h4>
                <span className="text-[10px] text-gray-400">
                  {formatTime(noti.createdAt)}
                </span>
              </div>
              <p className="text-xs text-gray-600">{noti.content}</p>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-400 text-sm">
            새로운 알림이 없습니다.
          </div>
        )}
      </div>

      {/* 전체 읽음 처리 */}
      <div className="p-3 border-t bg-gray-50 text-center">
        <button
          onClick={markAllAsRead}
          className="text-xs text-gray-500 hover:text-[#111] font-medium"
        >
          전체 읽음 처리
        </button>
      </div>
    </div>
  );
}
