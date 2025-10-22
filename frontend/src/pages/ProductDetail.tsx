import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Product, Bid, User, Category } from "../types/types";
import { API_BASE_URL } from "../services/api";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [bidValue, setBidValue] = useState("");
  const [remainingTime, setRemainingTime] = useState("");
  const [sellerNickName, setSellerNickName] = useState("로딩중...");
  const [currentHighestBid, setCurrentHighestBid] = useState(0);

  // 찜 관련 state
  const [isBookMarked, setIsBookMarked] = useState(false);
  const [bookmarkCount, setBookmarkCount] = useState(0);

  // QnA 관련 state
  const [qnaList, setQnaList] = useState<any[]>([]);
  const [newQuestion, setNewQuestion] = useState({ title: "", question: "" });
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});

  // 남은 시간 계산
  const calculateRemainingTime = (endTime: string) => {
    const now = new Date();
    const end = new Date(endTime);
    const diffMs = end.getTime() - now.getTime();
    if (diffMs <= 0) return "경매 종료";
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
    const seconds = Math.floor((diffMs / 1000) % 60);
    return `${days}일 ${hours}시간 ${minutes}분 ${seconds}초`;
  };

  // 상품 정보 + 초기 데이터 가져오기
  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products/${id}`);
        if (!res.ok) throw new Error("상품 정보를 가져올 수 없습니다.");
        const data: Product = await res.json();
        setProduct(data);
        setRemainingTime(calculateRemainingTime(data.auctionEndTime));

        // 찜 수
        try {
          const bmCountRes = await fetch(`${API_BASE_URL}/api/bookmarks/count?productId=${id}`);
          if (bmCountRes.ok) {
            const count = await bmCountRes.json();
            setBookmarkCount(count);
          }
        } catch (e) {
          console.warn("찜 수 조회 실패", e);
        }

        // 판매자 정보
        if (data.sellerId) {
          try {
            const sellerRes = await fetch(`${API_BASE_URL}/api/users/${data.sellerId}`);
            if (sellerRes.ok) {
              const seller: User = await sellerRes.json();
              setSellerNickName(seller.nickName ?? "알 수 없음");
            } else {
              setSellerNickName("알 수 없음");
            }
          } catch {
            setSellerNickName("알 수 없음");
          }
        }

        // 카테고리명
        if (data.categoryId && !data.categoryName) {
          try {
            const categoryRes = await fetch(`${API_BASE_URL}/api/categories/${data.categoryId}`);
            if (categoryRes.ok) {
              const c: Category = await categoryRes.json();
              setProduct((prev) => (prev ? { ...prev, categoryName: c.name } : prev));
            }
          } catch {
            console.warn("카테고리명 불러오기 실패");
          }
        }

        // 최고 입찰가
        try {
          const bidRes = await fetch(`${API_BASE_URL}/api/products/${id}/highest-bid`);
          if (bidRes.ok) {
            const highest: number = await bidRes.json();
            setCurrentHighestBid(highest);
          }
        } catch {
          console.warn("최고 입찰가 조회 실패");
        }

        // 현재 사용자가 찜했는지 여부 (세션 포함)
        try {
          const bmRes = await fetch(`${API_BASE_URL}/api/bookmarks/check?productId=${id}`, {
            credentials: "include",
          });
          if (bmRes.ok) {
            const bookmarked: boolean = await bmRes.json();
            setIsBookMarked(bookmarked);
          }
        } catch {
          console.warn("찜 여부 조회 실패");
        }

        // QnA 목록
        if (data.productId) {
          await fetchQnaList(data.productId);
        }
      } catch (err) {
        console.error(err);
        setSellerNickName("알 수 없음");
      }
    };

    fetchProduct();
  }, [id]);

  // 남은 시간 실시간 업데이트
  useEffect(() => {
    if (!product) return;
    const interval = setInterval(() => {
      setRemainingTime(calculateRemainingTime(product.auctionEndTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [product]);

  // QnA 목록 불러오기
  const fetchQnaList = async (productId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/qna/product/${productId}`);
      if (res.ok) {
        const data = await res.json();
        setQnaList(data);
      } else {
        setQnaList([]);
      }
    } catch (err) {
      console.error("QnA 불러오기 실패:", err);
      setQnaList([]);
    }
  };

  // 질문 작성
  const handleCreateQuestion = async () => {
    if (!product) return alert("상품 정보가 없습니다.");
    if (!newQuestion.title.trim() || !newQuestion.question.trim()) {
      return alert("제목과 내용을 모두 입력해주세요.");
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/qna`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          productId: product.productId,
          title: newQuestion.title,
          question: newQuestion.question,
        }),
      });
      if (res.ok) {
        alert("질문이 등록되었습니다.");
        setNewQuestion({ title: "", question: "" });
        fetchQnaList(product.productId);
      } else {
        const msg = await res.text();
        alert("질문 등록 실패: " + msg);
      }
    } catch (err) {
      console.error(err);
      alert("질문 등록 중 오류 발생");
    }
  };

  // 답변 작성
  const handleAnswerSubmit = async (qnaId: number) => {
    const answer = answers[qnaId];
    if (!answer?.trim()) return alert("답변 내용을 입력해주세요.");
    try {
      const res = await fetch(`${API_BASE_URL}/api/qna/${qnaId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ answer }),
      });
      if (res.ok) {
        alert("답변이 등록되었습니다.");
        setAnswers((prev) => ({ ...prev, [qnaId]: "" }));
        if (product) fetchQnaList(product.productId);
      } else {
        const msg = await res.text();
        alert("답변 등록 실패: " + msg);
      }
    } catch (err) {
      console.error(err);
      alert("답변 등록 중 오류 발생");
    }
  };

  // 입찰 처리
  const handleBid = async () => {
    const bidNum = Number(bidValue);
    if (!bidValue || isNaN(bidNum) || bidNum <= 0) {
      return alert("올바른 금액을 입력해주세요 (0보다 큰 숫자)");
    }
    if (!product) return;

    if (bidNum <= currentHighestBid) {
      return alert(`입찰가가 현재 최고 입찰가(${currentHighestBid.toLocaleString()}원)보다 높아야 합니다.`);
    }

    const now = new Date();
    const end = new Date(product.auctionEndTime);
    if (now >= end) return alert("이미 경매가 종료된 상품입니다.");

    try {
      const res = await fetch(`${API_BASE_URL}/api/products/${id}/bid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ bidPrice: bidNum }),
      });

      if (res.ok) {
        const newBidServer: { bidderId: number; bidPrice: number } = await res.json();
        const newBid: Bid = {
          bidId: newBidServer.bidderId,
          userId: product.sellerId ?? 0,
          price: newBidServer.bidPrice,
          createdAt: new Date().toISOString(),
        };

        setProduct((prev) =>
          prev ? { ...prev, bids: [...(prev.bids ?? []), newBid] } : prev
        );
        setCurrentHighestBid(newBidServer.bidPrice);
        setBidValue("");
        alert("입찰 성공!");
      } else {
        const errText = await res.text();
        alert("입찰 실패: " + errText);
      }
    } catch (err) {
      console.error(err);
      alert("서버 오류");
    }
  };

  // 찜 토글
  const handleToggleBookmark = async () => {
    if (!product) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookmarks/toggle?productId=${product.productId}`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        const text = await res.text();
        const bookmarked = text === "찜 완료";
        setIsBookMarked(bookmarked);
        const countRes = await fetch(`${API_BASE_URL}/api/bookmarks/count?productId=${product.productId}`);
        if (countRes.ok) {
          const count = await countRes.json();
          setBookmarkCount(count);
        }
      } else {
        alert("찜 기능 실패");
      }
    } catch (err) {
      console.error(err);
      alert("찜 기능 실패");
    }
  };

  // 신고
  const handleReport = async () => {
    if (!product) return;
    const reason = prompt("신고 사유를 입력해주세요:");
    if (!reason?.trim()) return alert("신고 사유는 필수입니다.");
    try {
      const res = await fetch(`${API_BASE_URL}/api/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          targetId: product.sellerId,
          reason: reason.trim(),
        }),
      });
      if (res.ok) alert("신고가 접수되었습니다.");
      else {
        const msg = await res.text();
        alert("신고 실패: " + msg);
      }
    } catch (err) {
      console.error(err);
      alert("신고 처리 중 오류가 발생했습니다.");
    }
  };

  if (!product) return <div style={{ padding: "16px" }}>상품을 찾을 수 없습니다.</div>;

  const graphData = (product.bids ?? []).map((b, i) => ({ name: `${i + 1}`, price: b.price }));
  const auctionStartingPrice = product.startingPrice ?? 0;

  return (
    <div className="container">
      <div className="flex-box" style={{ gap: 24 }}>
        {/* 이미지 */}
        <div className="img-box" style={{ width: 480, height: 360 }}>
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.title}
              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }}
            />
          ) : (
            <div className="no-img-txt" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#888" }}>
              이미지 없음
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 320 }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{product.title}</h2>

          <div style={{ display: "flex", gap: "12px", marginBottom: 12 }}>
            <button
              onClick={handleToggleBookmark}
              style={{
                backgroundColor: isBookMarked ? "#ef4444" : "#fff",
                color: isBookMarked ? "#fff" : "#ef4444",
                border: "1px solid #ef4444",
                borderRadius: "6px",
                padding: "6px 10px",
                cursor: "pointer",
              }}
            >
              💖 {bookmarkCount}
            </button>
            <button
              onClick={handleReport}
              style={{
                backgroundColor: "#ef4444",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                padding: "6px 10px",
                cursor: "pointer",
              }}
            >
              신고
            </button>
          </div>

          <p style={{ margin: "6px 0" }}>판매자: {sellerNickName}</p>
          <p style={{ margin: "6px 0" }}>카테고리: {product.categoryName ?? "없음"}</p>
          <p style={{ margin: "6px 0", color: "#555" }}>
            등록시간: {product.createdAt ? new Date(product.createdAt).toLocaleString() : "알 수 없음"} <br />
            남은시간: {remainingTime}
          </p>

          <p style={{ margin: "6px 0" }}>경매등록가: {auctionStartingPrice.toLocaleString()}원</p>
          <p style={{ margin: "6px 0" }}>현재 최고 입찰가: {currentHighestBid.toLocaleString()}원</p>

          <div style={{ backgroundColor: "#f9f9f9", padding: "12px", borderRadius: 8, border: "1px solid #eee", marginTop: 12 }}>
            {product.description ?? product.content ?? "상세 설명이 없습니다."}
          </div>
        </div>

        {/* 입찰 박스 */}
        <div style={{ width: 260, flexShrink: 0 }}>
          <div style={{ backgroundColor: "#fff", borderRadius: 12, padding: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <div style={{ marginBottom: 8 }}>
              {(product.bids ?? []).slice(0, 5).map((b, i) => (
                <p key={b.bidId} style={{ margin: 0 }}>
                  {i + 1}번 입찰가: {b.price.toLocaleString()}원
                </p>
              ))}
              {(!product.bids || product.bids.length === 0) && <p style={{ margin: 0, color: "#888" }}>아직 입찰이 없습니다.</p>}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <input
                type="number"
                value={bidValue}
                onChange={(e) => setBidValue(e.target.value)}
                placeholder="희망 입찰가"
                style={{ flex: 1, padding: "8px", borderRadius: 6, border: "1px solid #ccc" }}
              />
              <button
                onClick={handleBid}
                style={{ padding: "8px 12px", backgroundColor: "#ef4444", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
              >
                입찰
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 그래프 */}
      <div style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: "600" }}>입찰 그래프</h3>
        <div style={{ backgroundColor: "#fff", borderRadius: 12, padding: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={graphData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="price" stroke="#000" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* QnA 섹션 */}
      <div style={{ marginTop: 40 }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: "600" }}>💬 상품 Q&A</h3>
        <div style={{ backgroundColor: "#fff", padding: 16, borderRadius: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
          {/* 질문 작성 */}
          <div style={{ marginBottom: 20 }}>
            <input
              type="text"
              placeholder="질문 제목"
              value={newQuestion.title}
              onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
              style={{ width: "100%", padding: 10, marginBottom: 8, border: "1px solid #ccc", borderRadius: 6 }}
            />
            <textarea
              placeholder="질문 내용"
              value={newQuestion.question}
              onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
              rows={3}
              style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 6 }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={handleCreateQuestion}
                style={{ marginTop: 8, backgroundColor: "#ef4444", color: "#fff", border: "none", padding: "8px 14px", borderRadius: 6, cursor: "pointer" }}
              >
                질문 등록
              </button>
            </div>
          </div>

          {/* 질문 목록 */}
          {qnaList.length === 0 ? (
            <p style={{ color: "#888" }}>아직 등록된 질문이 없습니다.</p>
          ) : (
            qnaList.map((q) => (
              <div key={q.qnaId} style={{ borderTop: "1px solid #eee", paddingTop: 12, marginTop: 12 }}>
                <p style={{ fontWeight: 600, marginBottom: 6 }}>{q.title}</p>
                <p style={{ margin: "6px 0", whiteSpace: "pre-wrap" }}>{q.question}</p>
                <p style={{ fontSize: "0.85rem", color: "#777", margin: "6px 0" }}>
                  작성자: {q.nickName} | {q.createdAt ? new Date(q.createdAt).toLocaleString() : ""}
                </p>

                {/* 답변 목록 */}
                {q.answers?.length > 0 && (
                  <div style={{ marginTop: 8, paddingLeft: 12, borderLeft: "3px solid #ef4444" }}>
                    {q.answers.map((a: any) => (
                      <div key={a.qnaReviewId} style={{ marginBottom: 8 }}>
                        <p style={{ margin: "4px 0" }}>💬 {a.answer}</p>
                        <p style={{ fontSize: "0.8rem", color: "#777", margin: 0 }}>
                          답변자: {a.nickName} | {a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* 답변 입력 (누구나 버튼 클릭 시 시도하나, 서버에서 권한 검증) */}
                <div style={{ marginTop: 8 }}>
                  <textarea
                    placeholder="답변 입력 (관리자/판매자만 가능할 수 있습니다)"
                    value={answers[q.qnaId] || ""}
                    onChange={(e) => setAnswers({ ...answers, [q.qnaId]: e.target.value })}
                    rows={2}
                    style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 6 }}
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      onClick={() => handleAnswerSubmit(q.qnaId)}
                      style={{ marginTop: 6, backgroundColor: "#555", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 6, cursor: "pointer" }}
                    >
                      답변 등록
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
