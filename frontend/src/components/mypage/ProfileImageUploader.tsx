import { useState, useEffect } from "react";
import { Camera, Trash2 } from "lucide-react";
import Avatar from "../ui/Avatar";
import type { User } from "../../common/types";
import { API_BASE_URL, uploadProfileImage, deleteProfileImage } from "../../common/api";

type Props = {
  user: User;
  isEditing: boolean;
  onUpload: (imageUrl: string) => void;
  onDelete: () => void;
};

export default function ProfileImageUploader({ user, isEditing, onUpload, onDelete }: Props) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Helper for image URL
  const getImageUrl = (path: string | null) => {
    if (!path) return null;
    return path.startsWith("http") ? path : `${API_BASE_URL}/${path}`;
  };

  // 디버깅용 로그
  useEffect(() => {
    console.log("User prop:", user);
    console.log("Current previewUrl:", previewUrl);
  }, [user, previewUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ... (checks)

    setUploading(true);

    try {
      const imageUrl = await uploadProfileImage(user.userId, file);

      console.log("Resolved imageUrl:", imageUrl);
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
      await deleteProfileImage(user.userId);

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

  const displayImage = previewUrl || (user.images && user.images.length > 0 ? getImageUrl(user.images[0].imagePath) : null);
  console.log("Display image URL:", displayImage);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">프로필 이미지</label>

      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            <Avatar
              src={previewUrl || (user.images && user.images.length > 0 ? user.images[0].imagePath : null)}
              alt="Profile"
              className="w-full h-full"
              fallbackText={user.nickName}
            />
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
