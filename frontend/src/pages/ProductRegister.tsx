import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { User, ProductForm, Category } from "../types/types";

type Props = {
  user: User | null;
};

export default function ProductRegister({ user }: Props) {
  const navigate = useNavigate();
  const [form, setForm] = useState<ProductForm>({
    title: "",
    content: "",
    price: 0,
    imageUrl: "",
    oneMinuteAuction: false,
    auctionEndTime: "",
    categoryId: null,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data: Category[] = await res.json();
          setCategories(data);
          if (data.length > 0) {
            setForm((prev) => ({ ...prev, categoryId: data[0].categoryId }));
          }
        }
      } catch (err) {
        console.error("카테고리 로드 실패", err);
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async () => {
    if (!user) {
      alert("로그인이 필요합니다");
      navigate("/login");
      return;
    }

    if (!form.title || !form.content || !form.categoryId || !form.price) {
      setError("필수 항목을 모두 입력해주세요");
      return;
    }

    let auctionEndTime = form.auctionEndTime;
    if (form.oneMinuteAuction) {
      const end = new Date();
      end.setMinutes(end.getMinutes() + 1);
      auctionEndTime = end.toISOString();
    } else if (!auctionEndTime) {
      setError("경매 종료 시간을 입력해주세요");
      return;
    } else {
      auctionEndTime = new Date(auctionEndTime).toISOString();
    }

    try {
      const productData = {
        title: form.title,
        content: form.content,
        startingPrice: form.price.toString(), // 🔥 숫자를 문자열로 변환
        imageUrl: form.imageUrl,
        oneMinuteAuction: form.oneMinuteAuction,
        auctionEndTime,
        sellerId: user.userId,
        categoryId: form.categoryId,
        productStatus: "ACTIVE",
        paymentStatus: "PENDING",
      };

      const response = await fetch("http://localhost:8080/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        alert("물품 등록 성공!");
        navigate("/auction");
      } else {
        const text = await response.text();
        setError(`물품 등록 실패: ${text}`);
      }
    } catch (err) {
      console.error(err);
      setError("서버 연결 실패");
    }
  };

  if (!user) {
    return (
      <div className="register-container">
        <div className="register-box">
          <p className="notice-text">로그인 후 물품을 등록할 수 있습니다</p>
          <button onClick={() => navigate("/login")} className="btn-submit">
            로그인하러 가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="register-container">
      <div className="register-box">
        <h2 className="register-title">물품 등록</h2>

        <div className="form-group">
          <label className="label">제목 *</label>
          <input
            type="text"
            placeholder="상품 제목"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="input"
          />

          <label className="label">상세 설명 *</label>
          <textarea
            placeholder="상품 상세 설명"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            className="textarea"
          />

          <label className="label">시작 가격 (원) *</label>
          <input
            type="number"
            placeholder="예: 10000"
            value={form.price || ""}
            onChange={(e) =>
              setForm({ ...form, price: Number(e.target.value) })
            }
            className="input"
          />

          <label className="label">이미지 URL</label>
          <input
            type="text"
            placeholder="https://..."
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            className="input"
          />

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.oneMinuteAuction}
                onChange={(e) =>
                  setForm({ ...form, oneMinuteAuction: e.target.checked })
                }
              />
              <span>1분 경매 여부</span>
            </label>
          </div>

          {!form.oneMinuteAuction && (
            <>
              <label className="label">경매 종료 시간 *</label>
              <input
                type="datetime-local"
                value={form.auctionEndTime}
                onChange={(e) =>
                  setForm({ ...form, auctionEndTime: e.target.value })
                }
                className="input"
              />
            </>
          )}

          <label className="label">카테고리 *</label>
          <select
            value={form.categoryId ?? ""}
            onChange={(e) =>
              setForm({ ...form, categoryId: Number(e.target.value) })
            }
            className="select"
          >
            <option value="" disabled>
              선택하세요
            </option>
            {categories.map((cat) => (
              <option key={cat.categoryId} value={cat.categoryId}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="error-message">{error}</p>}

        <button onClick={handleSubmit} className="btn-submit">
          등록하기
        </button>

        <div className="register-links">
          <button onClick={() => navigate("/")} className="link-button">
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
