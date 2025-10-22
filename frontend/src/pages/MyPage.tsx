import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { User, Product, Report, Qna } from "../types/types";
import { API_BASE_URL } from "../services/api";

type Props = {
  user: User | null;
  setUser: (user: User | null) => void;
};

export default function MyPage({ user, setUser }: Props) {
  const [editing, setEditing] = useState(false);
  const [showSelling, setShowSelling] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [showQnas, setShowQnas] = useState(false);

  const [form, setForm] = useState({
    nickName: user?.nickName || "",
    password: "",
    phone: "",
  });

  const [sellingProducts, setSellingProducts] = useState<Product[]>([]);
  const [bookmarkedProducts, setBookmarkedProducts] = useState<Product[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [myQnas, setMyQnas] = useState<Qna[]>([]);
  const [categories, setCategories] = useState<{ categoryId: number; name: string }[]>([]);

  const navigate = useNavigate();

  // 카테고리 목록 가져오기
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/categories`)
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error("카테고리 불러오기 실패", err));
  }, []);

  // 로그인 안 된 경우
  if (!user) {
    return (
      <div>
        <h2>로그인이 필요합니다.</h2>
        <button onClick={() => navigate("/login")}>로그인 페이지로</button>
      </div>
    );
  }

  const buttonStyle = {
    padding: "12px 24px",
    background: "#000",
    color: "white",
    border: "1px solid #fff",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
    width: "220px",
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${user.userId}/mypage`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
        setEditing(false);
        alert("정보가 수정되었습니다.");
      } else {
        const errorText = await res.text();
        alert("정보 수정 실패: " + errorText);
      }
    } catch (err) {
      console.error(err);
      alert("서버 오류");
    }
  };

  const handleDelete = async () => {
    if (!confirm("정말 회원 탈퇴하시겠습니까?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${user.userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setUser(null);
        navigate("/");
        alert("회원탈퇴 완료");
      } else {
        const errorText = await res.text();
        alert("회원 탈퇴 실패: " + errorText);
      }
    } catch (err) {
      console.error(err);
      alert("서버 오류");
    }
  };

  const handleFetchSellingProducts = async () => {
    if (!showSelling) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products/seller/${user.userId}`);
        if (res.ok) {
          const data: Product[] = await res.json();
          setSellingProducts(data);
        } else {
          alert("판매 상품 조회 실패");
        }
      } catch (err) {
        console.error(err);
        alert("서버 오류");
      }
    }
    setShowSelling(!showSelling);
  };

  const handleFetchBookmarkedProducts = async () => {
    if (!showBookmarks) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/bookmarks/mypage`, {
          credentials: "include",
        });
        if (res.ok) {
          const data: Product[] = await res.json();
          setBookmarkedProducts(data);
        } else {
          alert("찜 상품 조회 실패");
        }
      } catch (err) {
        console.error(err);
        alert("서버 오류");
      }
    }
    setShowBookmarks(!showBookmarks);
  };

  const handleFetchReports = async () => {
    if (!showReports) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/reports/mypage`, {
          credentials: "include",
        });
        if (res.ok) {
          const data: Report[] = await res.json();
          setReports(data);
        } else {
          alert("신고 내역 조회 실패");
        }
      } catch (err) {
        console.error(err);
        alert("서버 오류");
      }
    }
    setShowReports(!showReports);
  };

  const handleFetchMyQnas = async () => {
    if (!showQnas) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/qna/user/${user.userId}`);
        if (res.ok) {
          const data = await res.json();
          setMyQnas(data);
        } else {
          alert("Q&A 조회 실패");
        }
      } catch (err) {
        console.error(err);
        alert("서버 오류");
      }
    }
    setShowQnas(!showQnas);
  };

  const getCategoryName = (categoryId?: number) => {
    return categories.find((c) => c.categoryId === categoryId)?.name || "없음";
  };

  return (
    <div className="container">
      <button onClick={() => navigate("/")} style={buttonStyle}>
        메인으로
      </button>

      <h2>마이페이지</h2>

      <div>
        <div>
          <div>
            <button style={buttonStyle} onClick={() => setEditing(!editing)}>
              내 정보 수정
            </button>
            <button style={buttonStyle} onClick={handleFetchSellingProducts}>
              판매 상품
            </button>
            <button style={buttonStyle} onClick={handleFetchBookmarkedProducts}>
              찜 목록
            </button>
            <button style={buttonStyle} onClick={handleFetchReports}>
              신고 내역
            </button>
            <button style={buttonStyle} onClick={handleFetchMyQnas}>
              내 Q&A
            </button>
          </div>

          <div>
            {/* 내 정보 수정 */}
            {editing && (
              <div>
                <input
                  name="nickName"
                  placeholder="닉네임"
                  value={form.nickName}
                  onChange={handleChange}
                />
                <input
                  name="password"
                  placeholder="비밀번호"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                />
                <input
                  name="phone"
                  placeholder="전화번호"
                  value={form.phone}
                  onChange={handleChange}
                />
                <div>
                  <button style={buttonStyle} onClick={handleUpdate}>
                    저장
                  </button>
                  <button style={buttonStyle} onClick={() => setEditing(false)}>
                    취소
                  </button>
                </div>
              </div>
            )}

            {/* 판매 상품 */}
            {showSelling && sellingProducts.length > 0 && (
              <div>
                <h3>판매 중인 상품</h3>
                <ul>
                  {sellingProducts.map((product) => (
                    <li key={product.productId}>
                      {product.imageUrl && (
                        <img
                          src={product.imageUrl}
                          alt={product.title}
                          style={{ width: "150px", marginBottom: "10px" }}
                        />
                      )}
                      <div style={{ fontWeight: "bold", fontSize: "18px" }}>
                        {product.title} - {product.price?.toLocaleString()}원
                      </div>
                      <div>{product.description || product.content}</div>
                      <div>
                        1분 경매: {product.oneMinuteAuction ? "예" : "아니오"}
                      </div>
                      <div>카테고리: {getCategoryName(product.categoryId)}</div>
                      <div>상품 상태: {product.productStatus}</div>
                      <div>결제 상태: {product.paymentStatus}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 찜 목록 */}
            {showBookmarks && (
              <div>
                <h3>찜한 상품</h3>
                {bookmarkedProducts.length === 0 ? (
                  <p>찜한 상품이 없습니다.</p>
                ) : (
                  <ul>
                    {bookmarkedProducts.map((product) => (
                      <li key={product.productId}>
                        {product.imageUrl && (
                          <img
                            src={product.imageUrl}
                            alt={product.title}
                            style={{ width: "150px", marginBottom: "10px" }}
                          />
                        )}
                        <div style={{ fontWeight: "bold", fontSize: "18px" }}>
                          {product.title} - {product.startingPrice?.toLocaleString()}원
                        </div>
                        <div>{product.description || product.content}</div>
                        <div>카테고리: {getCategoryName(product.categoryId)}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* 신고 내역 */}
            {showReports && (
              <div>
                <h3>신고 내역</h3>
                {reports.length === 0 ? (
                  <p>신고한 내역이 없습니다.</p>
                ) : (
                  <ul>
                    {reports.map((report) => (
                      <li key={report.reportId} style={{ marginBottom: "10px" }}>
                        <div>신고 대상 ID: {report.targetId}</div>
                        <div>신고 사유: {report.reason}</div>
                        <div>처리 상태: {report.status ? "완료" : "대기"}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* 내 Q&A */}
            {showQnas && (
              <div>
                <h3>내 Q&A</h3>
                {myQnas.length === 0 ? (
                  <p>작성한 질문이 없습니다.</p>
                ) : (
                  <ul>
                    {myQnas.map((qna) => (
                      <li key={qna.qnaId} style={{ marginBottom: "15px" }}>
                        <div style={{ fontWeight: "bold" }}>{qna.title}</div>
                        <div>질문: {qna.question}</div>
                        <div>작성일: {new Date(qna.createdAt).toLocaleString()}</div>
                        <div>
                          <strong>답변:</strong>
                          {qna.answers.length === 0 ? (
                            <span> 대기중</span>
                          ) : (
                            <ul>
                              {qna.answers.map((a) => (
                                <li key={a.qnaReviewId}>
                                  {a.nickName}: {a.answer} (
                                  {new Date(a.createdAt).toLocaleString()})
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        <div>
          <button style={buttonStyle} onClick={() => alert("결제 수단 관리")}>
            결제 수단 관리
          </button>
          <button style={buttonStyle} onClick={() => alert("구매 상품 목록")}>
            구매 상품
          </button>
          <button style={buttonStyle} onClick={() => alert("입찰 목록")}>
            입찰 목록
          </button>
          <button style={buttonStyle} onClick={() => alert("리뷰 목록")}>
            리뷰 목록
          </button>
          <button style={buttonStyle} onClick={handleDelete}>
            회원탈퇴
          </button>
        </div>
      </div>
    </div>
  );
}
