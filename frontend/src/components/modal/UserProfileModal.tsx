import React from "react";
import type { User } from "../../common/types";

interface UserProfileModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, isOpen, onClose }) => {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white p-6 rounded-lg w-[400px] max-w-[90%] relative shadow-lg">
        {/* 닫기 버튼 */}
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-lg font-bold"
          onClick={onClose}
        >
          ✕
        </button>

        <div className="flex flex-col items-center">
          {/* 프로필 이미지 */}
          <img
            src={user.images?.[0]?.imagePath || "/default-profile.png"}
            alt={user.nickName}
            className="w-28 h-28 rounded-full mb-4 object-cover border border-gray-200"
          />

          {/* 닉네임 + 실제 이름 */}
          <h2 className="text-2xl font-semibold">{user.nickName} {user.userName && `(${user.userName})`}</h2>

          {/* 역할 */}
          {user.role && (
            <p className="text-sm text-gray-500 mt-1">{user.role}</p>
          )}

          {/* 유저 정보 */}
          <div className="mt-4 w-full space-y-2 text-left">
            {user.email && <p><strong>Email:</strong> {user.email}</p>}
            {user.phone && <p><strong>Phone:</strong> {user.phone}</p>}
            {user.businessNumber && <p><strong>Business:</strong> {user.businessNumber}</p>}
            {(user.address || user.detailAddress || user.zipCode) && (
              <p>
                <strong>Address:</strong>{" "}
                {[user.address, user.detailAddress, user.zipCode].filter(Boolean).join(", ")}
              </p>
            )}
          </div>

          {/* 닫기 버튼 아래 추가 설명/기능 */}
          <div className="mt-6 w-full flex justify-center">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
