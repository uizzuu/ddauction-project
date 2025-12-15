import { useEffect, useRef, useCallback } from "react";
import { markNotificationAsRead } from "../../common/api";
import type { Notification } from "../../common/types";

// Props 정의 수정: 데이터와 상태 변경 함수를 부모(Header)로부터 받음
type Props = {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[]; // 목록 전달 받음
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>; // 상태 업데이트 함수 전달 받음
};

export default function NotificationModal({ isOpen, onClose, notifications, setNotifications }: Props) {
  const modalRef = useRef<HTMLDivElement>(null);

  // 외부 클릭으로 모달 닫기
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

  // 읽음 처리 핸들러
  const handleNotificationClick = useCallback(async (id: number) => {
    try {
      await markNotificationAsRead(id);
      // 부모의 상태를 업데이트
      setNotifications((prev) =>
        prev.map((n) => (n.notificationId === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("읽음 처리 실패:", err);
    }
  }, [setNotifications]);

  // 전체 읽음 처리
  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.notificationId);
    if (unreadIds.length === 0) return;

    try {
      await Promise.all(unreadIds.map(id => markNotificationAsRead(id)));
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("전체 읽음 처리 실패:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      className="absolute top-10 right-0 w-80 bg-white shadow-lg rounded-lg border border-gray-200 z-50 overflow-hidden"
    >
      <div className="p-3 border-b flex justify-between items-center bg-gray-50">
        <h3 className="font-bold text-sm text-gray-700">알림</h3>
        <button onClick={markAllAsRead} className="text-xs text-blue-500 hover:underline">
          모두 읽음
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">새로운 알림이 없습니다.</div>
        ) : (
          <ul>
            {notifications.map((noti) => (
              <li
                key={noti.notificationId}
                onClick={() => handleNotificationClick(noti.notificationId)}
                className={`p-3 border-b cursor-pointer hover:bg-gray-100 transition ${
                  noti.isRead ? "bg-white opacity-50" : "bg-blue-50"
                }`}
              >
                <div className="text-sm text-gray-800">{noti.content}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(noti.createdAt).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}