import { useState, useEffect } from "react";
import type { User, Page } from '../types';

type Category = {
  categoryId: number;
  name: string;
};

type Props = {
  setPage: React.Dispatch<React.SetStateAction<Page>>;
  user: User | null;
};

const containerStyle = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "#000",
};

const formBoxStyle = {
  background: "#111",
  padding: "30px",
  borderRadius: "10px",
  width: "100%",
  maxWidth: "600px",
  boxShadow: "0 0 15px rgba(255,255,255,0.1)",
};

const labelStyle = {
  display: "block",
  marginBottom: "5px",
  fontWeight: "bold",
  color: "#fff",
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginBottom: "15px",
  borderRadius: "5px",
  border: "1px solid #333",
  background: "#222",
  color: "#fff",
  fontSize: "16px",
};

const buttonStyle = {
  padding: "12px",
  background: "#1e90ff",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  fontSize: "16px",
};

export default function ProductRegister({ setPage, user }: Props) {
  const [form, setForm] = useState({
    title: "",
    content: "",
    price: 0,
    imageUrl: "",
    oneMinuteAuction: false,
    auctionEndTime: "",
    categoryId: null as number | null,
  });
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  if (!user) {
    return (
      <div style={containerStyle}>
        <div style={formBoxStyle}>
          <p style={{ color: "white", fontSize: "18px" }}>
            로그인 후에 물품을 등록할 수 있습니다.
          </p>
          <button
            onClick={() => setPage("login")}
            style={{ ...buttonStyle, marginTop: "20px" }}
          >
            로그인 페이지로 이동
          </button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/categories");
        if (res.ok) {
          const data: Category[] = await res.json();
          setCategories(data);
          if (data.length > 0) {
            setForm((prev) => ({ ...prev, categoryId: data[0].categoryId }));
          }
        } else {
          console.error("카테고리 불러오기 실패");
        }
      } catch (err) {
        console.error("서버 연결 실패", err);
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async () => {
    setError("");
    if (!form.categoryId) {
      setError("카테고리를 선택해주세요.");
      return;
    }
    if (!user || !user.userId) {
      setError("로그인 정보가 없습니다.");
      return;
    }

    let auctionEndTime = form.auctionEndTime;
    if (form.oneMinuteAuction) {
      const end = new Date();
      end.setMinutes(end.getMinutes() + 1);
      auctionEndTime = end.toISOString();
    } else if (!auctionEndTime) {
      setError("경매 종료 시간을 입력해주세요.");
      return;
    } else {
      auctionEndTime = new Date(auctionEndTime).toISOString();
    }

    try {
      const productData = {
        ...form,
        categoryId: Number(form.categoryId),
        sellerId: Number(user.userId),
        auctionEndTime,
        paymentStatus: "PENDING",
        productStatus: "ACTIVE",
      };

      const response = await fetch("http://localhost:8080/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        alert("물품 등록 성공!");
        setPage("list");
      } else {
        const errorMsg = await response.text();
        setError(`물품 등록 실패: ${errorMsg}`);
      }
    } catch (err) {
      setError("서버 연결 실패");
    }
  };

  return (
    <div style={containerStyle}>
      <div style={{ ...formBoxStyle, maxWidth: "600px" }}>
        <h2 style={{ fontSize: "32px", marginBottom: "30px", color: "#fff" }}>
          물품 등록
        </h2>

        <label style={labelStyle}>제목</label>
        <input
          type="text"
          placeholder="상품 제목"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          style={inputStyle}
        />

        <label style={labelStyle}>상세 설명</label>
        <textarea
          placeholder="상품 상세 설명"
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          style={{ ...inputStyle, minHeight: "120px", resize: "vertical" }}
        />

        <label style={labelStyle}>시작 가격</label>
        <input
          type="number"
          placeholder="예: 10000"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
          style={inputStyle}
        />

        <label style={labelStyle}>이미지 URL</label>
        <input
          type="text"
          placeholder="https://..."
          value={form.imageUrl}
          onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
          style={inputStyle}
        />

        <label style={labelStyle}>
          <input
            type="checkbox"
            checked={form.oneMinuteAuction}
            onChange={(e) =>
              setForm({ ...form, oneMinuteAuction: e.target.checked })
            }
          />{" "}
          1분 경매 여부
        </label>

        {!form.oneMinuteAuction && (
          <>
            <label style={labelStyle}>경매 종료 시간</label>
            <input
              type="datetime-local"
              value={form.auctionEndTime}
              onChange={(e) =>
                setForm({ ...form, auctionEndTime: e.target.value })
              }
              style={inputStyle}
            />
          </>
        )}

        <label style={labelStyle}>카테고리</label>
        <select
          value={form.categoryId ?? ""}
          onChange={(e) =>
            setForm({ ...form, categoryId: Number(e.target.value) })
          }
          style={inputStyle}
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

        {error && <p style={{ color: "#ff4444" }}>{error}</p>}

        <button
          onClick={handleSubmit}
          style={{ ...buttonStyle, width: "100%", marginTop: "20px" }}
        >
          등록하기
        </button>

        <button
          onClick={() => setPage("main")}
          style={{
            color: "#999",
            background: "none",
            border: "none",
            cursor: "pointer",
            marginTop: "10px",
          }}
        >
          취소
        </button>
      </div>
    </div>
  );
}
