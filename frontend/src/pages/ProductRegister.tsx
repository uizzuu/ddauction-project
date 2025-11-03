import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import type { User, ProductForm, Category } from "../types/types";
import { API_BASE_URL } from "../services/api";
import SelectBox from "../components/SelectBox";

type Props = {
  user: User | null;
};

export default function ProductRegister({ user }: Props) {
  const navigate = useNavigate();
  const [form, setForm] = useState<ProductForm>({
    title: "",
    content: "",
    startingPrice: "",
    images: [],
    oneMinuteAuction: false,
    auctionEndTime: "",
    categoryId: null,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [minDateTime, setMinDateTime] = useState<Date | undefined>(undefined);
  const [auctionEndDate, setAuctionEndDate] = useState<Date | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // 최소 선택 시간 설정
  useEffect(() => {
    const now = new Date();
    setMinDateTime(now);
  }, []);

  // DatePicker 변경 시 form도 업데이트
  const handleDateChange = (date: Date | null) => {
    setAuctionEndDate(date);
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");

      const formatted = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      setForm((prev) => ({
        ...prev,
        auctionEndTime: formatted,
      }));
      setError("");
    }
  };

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
      console.log("🔹 검증 실패:", validationError); // 🔹 검증 실패 로그
      return;
    }

    const token = localStorage.getItem("token");
    if (!token || !user) {
      alert("로그인이 필요합니다");
      navigate("/login");
      return;
    }

    let auctionEndTime: string;
    if (form.oneMinuteAuction) {
      const end = new Date();
      end.setMinutes(end.getMinutes() + 1);

      const year = end.getFullYear();
      const month = String(end.getMonth() + 1).padStart(2, "0");
      const day = String(end.getDate()).padStart(2, "0");
      const hours = String(end.getHours()).padStart(2, "0");
      const minutes = String(end.getMinutes()).padStart(2, "0");
      const seconds = String(end.getSeconds()).padStart(2, "0");

      auctionEndTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    } else {
      const end = new Date(form.auctionEndTime);
      if (isNaN(end.getTime())) {
        setError("경매 종료 시간이 유효하지 않습니다");
        return;
      }
      auctionEndTime = form.auctionEndTime;
    }

    const startingPriceNumber = Math.max(
      Number(form.startingPrice.replace(/[^0-9]/g, "")),
      1
    );

    try {
      const formData = new FormData();

      // product 데이터 JSON으로 Blob 처리
      const productBlob = new Blob(
        [
          JSON.stringify({
            title: form.title,
            content: form.content,
            startingPrice: startingPriceNumber.toString(),
            oneMinuteAuction: form.oneMinuteAuction,
            auctionEndTime,
            sellerId: user.userId,
            categoryId: form.categoryId,
            productStatus: "ACTIVE",
            paymentStatus: "PENDING",
          }),
        ],
        { type: "application/json" }
      );

      formData.append("product", productBlob); // Spring 쪽 @RequestPart("dto")로 받음

      // 이미지 파일 추가
      if (form.images) {
        Array.from(form.images).forEach((file) =>
          formData.append("files", file)
        );
      }

      // 🔹 디버그: FormData 확인
      console.log("=== FormData Debug Start ===");
      for (const pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }
      console.log("=== FormData Debug End ===");

      const response = await fetch(`${API_BASE_URL}/api/products`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const responseText = await response.text();
      console.log("🔹 서버 응답 내용:", responseText);

      if (response.ok) {
        alert("물품 등록 성공!");
        navigate("/search");
      } else {
        console.error("서버 응답:", responseText);
        setError("물품 등록 실패");
        console.error("🔹 등록 실패:", responseText);
      }
    } catch (err) {
      console.error("🔹 등록 중 예외 발생:", err);
      setError("서버 연결 실패");
    }
  };

  if (!user) {
    return (
      <div className="register-container">
        <div className="register-box">
          <p className="text-18 text-center mb-1rem color-main">
            로그인 후 물품을 등록할 수 있습니다
          </p>
          <button onClick={() => navigate("/login")} className="btn-submit">
            로그인하러가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="register-container">
      <div className="register-box">
        <h2 className="title-32 mb-30 text-center">물품 등록</h2>

        <div className="form-group register">
          <label className="label">제목 *</label>
          <input
            type="text"
            placeholder="상품 제목"
            value={form.title}
            onChange={(e) => {
              const val = e.target.value;
              setForm({ ...form, title: val });
              setErrors({
                ...errors,
                title: val ? "" : "제목은 필수 입력 항목입니다",
              });
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
              setErrors({
                ...errors,
                content: val ? "" : "상세 설명은 필수 입력 항목입니다",
              });
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
              setErrors({
                ...errors,
                startingPrice:
                  !clean || Number(clean) <= 0
                    ? "시작 가격은 1원 이상이어야 합니다"
                    : "",
              });
            }}
            className="input"
          />

          <label className="label">상품 이미지 *</label>
          <input
            type="file"
            multiple
            onChange={(e) => {
              const files = e.target.files;
              if (!files) return; // null이면 그냥 종료
              setForm((prev) => ({
                ...prev,
                images: [...(prev.images || []), ...Array.from(files)],
              }));
            }}
            className="input"
          />

          <div className="selected-files">
            {(form.images || []).map((file, idx) => (
              <div key={idx} className="file-item">
                {file.name}
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      images: prev.images?.filter((_, i) => i !== idx),
                    }))
                  }
                >
                  삭제
                </button>
              </div>
            ))}
          </div>

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
              <ReactDatePicker
                selected={auctionEndDate}
                onChange={handleDateChange}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={5}
                dateFormat="yyyy-MM-dd HH:mm"
                minDate={minDateTime}
                placeholderText="날짜와 시간을 선택하세요"
                className="input"
              />
            </>
          )}

          <label className="label">카테고리 *</label>
          <SelectBox
            value={form.categoryId === null ? "" : String(form.categoryId)}
            onChange={(val) =>
              setForm({ ...form, categoryId: val === "" ? null : Number(val) })
            }
            options={categories.map((c) => ({
              value: String(c.categoryId),
              label: c.name,
            }))}
            placeholder="카테고리를 선택하세요"
            className="register-category"
          />
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
