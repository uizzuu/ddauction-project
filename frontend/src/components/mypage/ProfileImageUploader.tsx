import { useState, useEffect } from "react";
import { Camera, Trash2 } from "lucide-react";

type User = {
  userId: number;
  nickName?: string;
  profileImage?: string;
  userName?: string;
  email?: string;
};

type Props = {
  user: User;
  isEditing: boolean;
  onUpload: (imageUrl: string) => void;
  onDelete: () => void;
};

export default function ProfileImageUploader({ user, isEditing, onUpload, onDelete }: Props) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // 디버깅용 로그
  useEffect(() => {
    console.log("User prop:", user);
    console.log("Current previewUrl:", previewUrl);
  }, [user, previewUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("Selected file:", file);

    // 파일 크기 체크 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      alert("파일 크기는 5MB 이하여야 합니다.");
      return;
    }

    // 파일 타입 체크
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드 가능합니다.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("token");
      const response = await fetch(`/api/users/${user.userId}/profile-image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "이미지 업로드에 실패했습니다.");
      }

      const data = await response.json();
      console.log("Upload response data:", data);

      const imageUrl = data.imageUrl || data.profileImage;
      console.log("Resolved imageUrl:", imageUrl);

      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      onUpload(imageUrl);

      alert("프로필 이미지가 업로드되었습니다.");
    } catch (error: any) {
      console.error("Upload error:", error);
      alert(error.message || "이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("프로필 이미지를 삭제하시겠습니까?")) return;

    setUploading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/users/${user.userId}/profile-image`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "이미지 삭제에 실패했습니다.");
      }

      setPreviewUrl(null);
      onDelete();

      console.log("Profile image deleted successfully");
      alert("프로필 이미지가 삭제되었습니다.");
    } catch (error: any) {
      console.error("Delete error:", error);
      alert(error.message || "이미지 삭제에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return <div className="text-gray-500">사용자 정보를 불러오는 중...</div>;
  }

  const displayImage = previewUrl || user.profileImage || null;
  console.log("Display image URL:", displayImage);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">프로필 이미지</label>

      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {displayImage ? (
              <img
                src={displayImage}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error("이미지 로딩 실패:", displayImage);
                  (e.target as HTMLImageElement).src = ""; // 실패 시 기본 처리
                }}
              />
            ) : (
              <div className="text-3xl font-bold text-gray-400">
                {user.nickName?.charAt(0).toUpperCase() || user.userName?.charAt(0).toUpperCase() || "U"}
              </div>
            )}
          </div>

          {isEditing && (
            <label
              htmlFor="profile-image-input"
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full cursor-pointer opacity-0 hover:opacity-100 transition-opacity"
            >
              <Camera size={24} className="text-white" />
            </label>
          )}
        </div>

        {isEditing && (
          <div className="flex flex-col gap-2">
            <label
              htmlFor="profile-image-input"
              className={`px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors cursor-pointer text-center font-medium ${uploading ? "opacity-50 cursor-not-allowed" : ""
                }`}
            >
              {uploading ? "업로드 중..." : displayImage ? "이미지 변경" : "이미지 업로드"}
            </label>

            {displayImage && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={uploading}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 size={16} />
                삭제
              </button>
            )}

            <input
              id="profile-image-input"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 mt-2">
        JPG, PNG, GIF 형식 / 최대 5MB
      </p>
    </div>
  );
}
