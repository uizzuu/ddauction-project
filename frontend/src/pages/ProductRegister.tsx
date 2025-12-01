import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import type { 
  User, 
  ProductForm,
  AiDescriptionRequest,
  AiDescriptionResponse 
} from "../common/types";
import { CATEGORY_OPTIONS } from "../common/enums";
import type {ProductCategoryType} from "../common/enums";
import { API_BASE_URL } from "../common/api";
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
    productType:"AUCTION",
    auctionEndTime: "",
    productCategoryType: null,
  });
  const [error, setError] = useState("");
  const [minDateTime, setMinDateTime] = useState<Date | undefined>(undefined);
  const [maxDateTime, setMaxDateTime] = useState<Date | undefined>(undefined);
  const [auctionEndDate, setAuctionEndDate] = useState<Date | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [uploading, setUploading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  useEffect(() => {
    const now = new Date();
    now.setSeconds(0);
    now.setMilliseconds(0);

    setMinDateTime(now);

    const maxDate = new Date(now);
    maxDate.setMonth(now.getMonth() + 3);
    setMaxDateTime(maxDate);
  }, []);

  const handleDateChange = (date: Date | null) => {
    setAuctionEndDate(date);
    if (date) {
      const now = new Date();
      if (date < now) {
        setError("경매 종료 시간은 현재 시간 이후로만 선택 가능합니다.");
        return;
      }

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

  const generateAiDescriptionAuto = async () => {
    if (!form.title || form.title.trim().length < 2) {
      alert("상품명을 2글자 이상 입력해주세요!");
      return;
    }

    setAiGenerating(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      
      const requestBody: AiDescriptionRequest = {
        product_name: form.title,
        keywords: [],
        target_audience: "일반 고객",
        tone: "전문적인, 신뢰감 있는",
      };

      const response = await fetch(`${API_BASE_URL}/ai/generate-description`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error("AI 생성 실패");
      }

      const data: AiDescriptionResponse = await response.json();
      setForm({ ...form, content: data.description });
      alert("AI가 상품 설명을 생성했습니다!");
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI 생성 중 오류 발생");
      alert("AI 생성에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setAiGenerating(false);
    }
  };

  const validateForm = () => {
    if (!form.title) return "제목은 필수 입력 항목입니다";
    if (!form.content) return "상세 설명은 필수 입력 항목입니다";
    if (!form.startingPrice || Number(form.startingPrice) <= 0)
      return "시작 가격은 1원 이상이어야 합니다";
    if (!form.auctionEndTime)
      return "경매 종료 시간을 입력해주세요";
    if (!form.productCategoryType) return "카테고리를 선택해주세요";
    if (!form.images || form.images.length === 0)
      return "최소 1개 이상의 이미지를 선택해주세요";
    return "";
  };

  const uploadImageToS3 = async (
    file: File,
    token: string
  ): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/api/files/s3-upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    return data.url;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token || !user) {
      alert("로그인이 필요합니다");
      navigate("/login");
      return;
    }

    const startingPriceNumber = Math.max(
      Number(form.startingPrice.replace(/[^0-9]/g, "")),
      1
    );

    try {
      setUploading(true);

      // 1️⃣ 상품 등록
      const productResponse = await fetch(`${API_BASE_URL}/api/products`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          startingPrice: startingPriceNumber,
          auctionEndTime: form.auctionEndTime,
          sellerId: user.userId,
          productCategoryType: form.productCategoryType, // ✅ 수정
          productStatus: "ACTIVE",
          paymentStatus: "PENDING",
          productType: form.productType,
        }),
      });

      if (!productResponse.ok) {
        const errorText = await productResponse.text();
        setError(`상품 등록 실패: ${productResponse.status} - ${errorText}`);
        return;
      }

      const productData = await productResponse.json();
      const productId = productData.productId;
      if (!productId) {
        setError("서버에서 productId를 받지 못했습니다.");
        return;
      }

      // 2️⃣ S3 이미지 업로드
      const uploadedImageUrls: string[] = [];
      if (form.images && form.images.length > 0) {
        for (const file of Array.from(form.images)) {
          try {
            const s3Url = await uploadImageToS3(file, token);
            uploadedImageUrls.push(s3Url);
          } catch (err) {
            console.error("S3 업로드 실패:", err);
          }
        }
      }

      // 3️⃣ 이미지 DB 등록
      for (const url of uploadedImageUrls) {
        try {
          await fetch(`${API_BASE_URL}/api/images`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              productId,
              imagePath: url,
            }),
          });
        } catch (err) {
          console.error("이미지 DB 등록 실패:", err);
        }
      }

      alert("물품 등록 성공!");
      navigate("/search");
    } catch (err) {
      setError(err instanceof Error ? err.message : "서버 연결 실패");
    } finally {
      setUploading(false);
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
            disabled={uploading}
          />

          <label className="label">상세 설명 *</label>
          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <button
              type="button"
              onClick={generateAiDescriptionAuto}
              className="btn-ai"
              disabled={uploading || aiGenerating || !form.title || form.title.trim().length < 2}
              style={{
                padding: "8px 16px",
                backgroundColor: !form.title || form.title.trim().length < 2 ? "#d1d5db" : "#6366f1",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: !form.title || form.title.trim().length < 2 ? "not-allowed" : "pointer",
                opacity: aiGenerating ? 0.7 : 1,
              }}
            >
              {aiGenerating ? "⏳ AI 생성 중..." : "🤖 AI로 설명 자동 생성"}
            </button>
            {form.title && form.title.trim().length < 2 && (
              <span style={{ fontSize: "12px", color: "#ef4444", alignSelf: "center" }}>
                제목을 2글자 이상 입력하세요
              </span>
            )}
          </div>
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
            disabled={uploading}
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
            disabled={uploading}
          />

          <label className="label">상품 이미지 * (최소 1개)</label>
          <input
            type="file"
            multiple
            onChange={(e) => {
              const files = e.target.files;
              if (!files) return;
              setForm((prev) => ({
                ...prev,
                images: [...(prev.images || []), ...Array.from(files)],
              }));
            }}
            className="input"
            disabled={uploading}
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
                  disabled={uploading}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>

          {(
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
                maxDate={maxDateTime}
                placeholderText="날짜와 시간을 선택하세요"
                className="input"
                disabled={uploading}
              />
            </>
          )}

          <label className="label">카테고리 *</label>
          <SelectBox
  value={form.productCategoryType ?? ""}
  onChange={(val) =>
    setForm({ 
      ...form, 
      productCategoryType: (val || null) as ProductCategoryType | null 
    })
  }
  options={CATEGORY_OPTIONS}
  placeholder="카테고리를 선택하세요"
  className="register-category"
/>
        </div>

        {error && <p className="error-message">{error}</p>}

        <button
          onClick={handleSubmit}
          className="btn-submit"
          disabled={uploading}
        >
          {uploading ? "업로드 중..." : "등록하기"}
        </button>

        <div className="register-links">
          <button
            onClick={() => navigate("/")}
            className="link-button"
            disabled={uploading}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}