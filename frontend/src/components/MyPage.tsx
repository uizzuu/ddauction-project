import { useState, useEffect } from "react";
import type { User, Page, Product } from "../types";

type Props = {
  setPage: (page: Page) => void;
  user: User | null;
  setUser: (user: User | null) => void;
};

export default function MyPage({ setPage, user, setUser }: Props) {
  const [editing, setEditing] = useState(false);
  const [showSelling, setShowSelling] = useState(false);
  const [form, setForm] = useState({
    nickName: user?.nickName || "",
    password: "",
    phone: "",
  });
  const [sellingProducts, setSellingProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ categoryId: number; name: string }[]>([]);

  if (!user) {
    return (
      <div style={{ color: "white", padding: "40px", textAlign: "center" }}>
        <h2>로그인이 필요합니다.</h2>
        <button onClick={() => setPage("login")}>로그인 페이지로</button>
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

  // 카테고리 목록 가져오기
  useEffect(() => {
    fetch("http://15.165.25.115/api/categories")
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error("카테고리 불러오기 실패", err));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    try {
      const res = await fetch(`/api/users/${user.userId}/mypage`, {
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
      const res = await fetch(`/api/users/${user.userId}`, { method: "DELETE" });
      if (res.ok) {
        setUser(null);
        setPage("main");
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
        const res = await fetch(`/api/products/seller/${user.userId}`);
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

  // 카테고리 ID -> 이름 매핑 함수
  const getCategoryName = (categoryId?: number) => {
    return categories.find(c => c.categoryId === categoryId)?.name || "없음";
  };

  return (
    <div style={{ color: "white", padding: "40px" }}>
      <button onClick={() => setPage("main")} style={buttonStyle}>
        메인으로
      </button>

      <h2>마이페이지</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "20px" }}>
        <div style={{ display: "flex", gap: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <button style={buttonStyle} onClick={() => setEditing(!editing)}>
              내 정보 수정
            </button>
            <button style={buttonStyle} onClick={handleFetchSellingProducts}>
              판매 상품
            </button>
          </div>

          <div style={{ flex: 1 }}>
            {/* 내 정보 수정 폼 */}
            {editing && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
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
                <div style={{ display: "flex", gap: "10px" }}>
                  <button style={buttonStyle} onClick={handleUpdate}>
                    저장
                  </button>
                  <button style={buttonStyle} onClick={() => setEditing(false)}>
                    취소
                  </button>
                </div>
              </div>
            )}

            {/* 판매 상품 리스트 */}
            {showSelling && sellingProducts.length > 0 && (
              <div>
                <h3>판매 중인 상품</h3>
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {sellingProducts.map(product => (
                    <li
                      key={product.productId}
                      style={{
                        marginBottom: "20px",
                        padding: "10px",
                        border: "1px solid #fff",
                        borderRadius: "6px",
                      }}
                    >
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
                      <div>1분 경매: {product.oneMinuteAuction ? "예" : "아니오"}</div>
                      <div>카테고리: {getCategoryName(product.categoryId)}</div>
                      <div>상품 상태: {product.productStatus}</div>
                      <div>결제 상태: {product.paymentStatus}</div>
                      {product.auctionEndTime && (
                        <div>경매 종료: {new Date(product.auctionEndTime).toLocaleString()}</div>
                      )}
                      {product.bidder && <div>현재 입찰자: {product.bidder.username}</div>}
                      {product.amount && <div>수량: {product.amount}</div>}
                      {product.createdAt && <div>등록일: {new Date(product.createdAt).toLocaleString()}</div>}
                      {product.updatedAt && <div>최근 수정: {new Date(product.updatedAt).toLocaleString()}</div>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* 나머지 기능 버튼 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "20px" }}>
          <button style={buttonStyle} onClick={() => alert("결제 수단 관리")}>결제 수단 관리</button>
          <button style={buttonStyle} onClick={() => alert("내가 구매한 상품 목록")}>구매 상품</button>
          <button style={buttonStyle} onClick={() => alert("입찰중인 목록 보기")}>입찰 목록</button>
          <button style={buttonStyle} onClick={() => alert("찜한 물건 보기")}>찜한 목록</button>
          <button style={buttonStyle} onClick={() => alert("판매자,구매자간 Q&A")}>Q&A목록</button>
          <button style={buttonStyle} onClick={() => alert("신고한 부정물품 목록")}>신고 내역</button>
          <button style={buttonStyle} onClick={() => alert("구매한물건의 판매자에 대한 리뷰목록")}>리뷰 목록</button>
          <button style={buttonStyle} onClick={handleDelete}>회원탈퇴</button>
        </div>
      </div>
    </div>
  );
}
