import type { Review } from "../../common/types";

type Props = {
  averageRating: number;
  myReviews: Review[];
  rating: number;
  setRating: (rating: number) => void;
  targetUserId: number;
  setTargetUserId: (userId: number) => void;
  comments: string;
  setComments: (comments: string) => void;
  handleSubmitReview: () => Promise<void>;
};

export default function ReviewManagement({
  averageRating,
  myReviews,
  rating,
  setRating,
  targetUserId,
  setTargetUserId,
  comments,
  setComments,
  handleSubmitReview,
}: Props) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <h3>리뷰 관리</h3>

      <h4>⭐ 내 평균 평점: {averageRating.toFixed(1)}점</h4>

      <div style={{ marginBottom: "20px" }}>
        <h4>📋 내가 받은 리뷰</h4>
        {myReviews.length === 0 ? (
          <p>받은 리뷰가 없습니다.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {myReviews.map((r, idx) => (
              <li
                key={idx}
                style={{
                  marginBottom: "10px",
                  border: "1px solid #eee",
                  padding: "10px",
                  borderRadius: "6px",
                }}
              >
                <strong>평점:</strong> {r.rating}점 <br />
                <strong>내용:</strong> {r.comments} <br />
                <small>
                  작성일:{" "}
                  {r.createdAt
                    ? new Date(r.createdAt).toLocaleString()
                    : "날짜 없음"}
                </small>
              </li>
            ))}
          </ul>
        )}
      </div>

      <hr />

      <div style={{ marginTop: "20px" }}>
        <h4>✏️ 리뷰 작성</h4>
        <input
          type="number"
          min="1"
          max="5"
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          style={{ marginRight: "10px", padding: "8px", width: "60px" }}
        />
        <input
          type="number"
          placeholder="대상 유저 ID"
          value={targetUserId || ""}
          onChange={(e) => setTargetUserId(Number(e.target.value))}
          style={{ marginRight: "10px", padding: "8px", width: "120px" }}
        />
        <input
          type="text"
          placeholder="리뷰 내용 입력"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          style={{
            width: "300px",
            marginRight: "10px",
            padding: "8px",
          }}
        />
        <button onClick={handleSubmitReview}>리뷰 등록</button>
      </div>
    </div>
  );
}
