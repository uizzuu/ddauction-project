import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { User, ProductForm, Category } from "../types/types";
import { API_BASE_URL } from "../services/api";

type Props = {
  user: User | null;
};

export default function ProductRegister({ user }: Props) {
  const navigate = useNavigate();
  const [form, setForm] = useState<ProductForm>({
    title: "",
    content: "",
    startingPrice: "0",
    imageUrl: "",
    oneMinuteAuction: false,
    auctionEndTime: "",
    categoryId: null,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [minDateTime, setMinDateTime] = useState("");

  // 최소 선택 시간 설정
  useEffect(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localNow = new Date(now.getTime() - offset)
      .toISOString()
      .slice(0, 16);
    setMinDateTime(localNow);
  }, []);

  // 카테고리 로드
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/categories`);
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

  // 폼 validation
  const validateForm = () => {
    if (!form.title) return "제목은 필수 입력 항목입니다";
    if (!form.content) return "상세 설명은 필수 입력 항목입니다";
    if (!form.startingPrice || Number(form.startingPrice) <= 0)
      return "시작 가격은 1원 이상이어야 합니다";
    if (!form.oneMinuteAuction && !form.auctionEndTime)
      return "경매 종료 시간을 입력해주세요";
    if (!form.categoryId) return "카테고리를 선택해주세요";
    return "";
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!user) {
      alert("로그인이 필요합니다");
      navigate("/login");
      return;
    }

    // auctionEndTime 안전 처리
    let auctionEndTime: string;
    if (form.oneMinuteAuction) {
      const end = new Date();
      end.setMinutes(end.getMinutes() + 1);
      auctionEndTime = end.toISOString().slice(0, 19);
    } else {
      const end = new Date(form.auctionEndTime);
      if (isNaN(end.getTime())) {
        setError("경매 종료 시간이 유효하지 않습니다");
        return;
      }
      auctionEndTime = end.toISOString().slice(0, 19);
    }

    // startingPrice 문자열 숫자로 변환, 콤마 제거
    const cleanPrice = form.startingPrice.replace(/[^0-9]/g, "");
    const startingPriceNumber = Math.max(Number(cleanPrice), 1);
    if (!startingPriceNumber || startingPriceNumber <= 0) {
      setError("시작 가격은 1원 이상이어야 합니다");
      return;
    }

    try {
      // 서버 전송용 데이터
      const productData = {
        title: form.title,
        content: form.content,
        startingPrice: startingPriceNumber.toString(), // 문자열
        imageUrl: form.imageUrl,
        oneMinuteAuction: form.oneMinuteAuction,
        auctionEndTime,
        sellerId: user.userId,
        categoryId: form.categoryId,
        productStatus: "ACTIVE", // enum 값
      };

      const response = await fetch(`${API_BASE_URL}/api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        alert("물품 등록 성공!");
        navigate("/search");
      } else {
        const text = await response.text();
        console.error("서버 응답:", text);
        setError("물품 등록 실패");
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

        <div className="form-group register">
          <label className="label">제목 *</label>
          <input
            type="text"
            placeholder="상품 제목"
            value={form.title}
            onChange={(e) => {
              const val = e.target.value;
              setForm({ ...form, title: val });
              setError(val ? "" : "제목은 필수 입력 항목입니다");
            }}
            className="input"
          />

          <label className="label">상세 설명 *</label>
          <textarea
            placeholder="상품 상세 설명"
            value={form.content}
            onChange={(e) => {
              const val = e.target.value;
              setForm({ ...form, content: val });
              setError(val ? "" : "상세 설명은 필수 입력 항목입니다");
            }}
            className="textarea"
          />

          <label className="label">시작 가격 (원) *</label>
          <input
            type="text"
            placeholder="예: 10000"
            value={Number(form.startingPrice).toLocaleString()}
            onChange={(e) => {
              const clean = e.target.value.replace(/[^0-9]/g, "");
              setForm({ ...form, startingPrice: clean });
              const num = Number(clean);
              setError(
                !num || num <= 0 ? "시작 가격은 1원 이상이어야 합니다" : ""
              );
            }}
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
                min={minDateTime}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm({ ...form, auctionEndTime: val });
                  setError(val ? "" : "경매 종료 시간을 입력해주세요");
                }}
                className="input"
              />
            </>
          )}

          <label className="label">카테고리 *</label>
          <select
            value={form.categoryId ?? ""}
            onChange={(e) => {
              const val = Number(e.target.value);
              setForm({ ...form, categoryId: val });
              setError(val ? "" : "카테고리를 선택해주세요");
            }}
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
