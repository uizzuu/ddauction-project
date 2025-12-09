import { useState } from "react";
import { X, Star } from "lucide-react";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (rating: number, comments: string) => void;
};

export default function ReviewModal({ isOpen, onClose, onSubmit }: Props) {
    const [rating, setRating] = useState(5);
    const [comments, setComments] = useState("");
    const [hoverRating, setHoverRating] = useState(0);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (comments.trim().length < 5) {
            alert("리뷰 내용을 5자 이상 입력해주세요.");
            return;
        }
        onSubmit(rating, comments);
        // Reset or keep? let parent handle close
    };

    // Debug log
    if (isOpen) console.log("ReviewModal Rendered");

    return (
        // Removed onClick={onClose} from backdrop to prevent accidental closing
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white w-full max-w-md rounded-xl shadow-lg overflow-hidden mx-4">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">리뷰 작성</h3>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Star Rating */}
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">거래는 만족스러우셨나요?</span>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    className="transition-transform hover:scale-110 focus:outline-none"
                                >
                                    <Star
                                        size={32}
                                        className={`${star <= (hoverRating || rating)
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "text-gray-300"
                                            } transition-colors`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Comments */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            리뷰 내용
                        </label>
                        <textarea
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            placeholder="친절함, 상품 상태 등 솔직한 후기를 남겨주세요."
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none resize-none h-32 transition-all"
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
