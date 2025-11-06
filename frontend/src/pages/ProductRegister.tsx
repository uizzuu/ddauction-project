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
  const [uploading, setUploading] = useState(false);

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
      console.log("auctionEndTime 확인:", formatted);
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
    if (!form.images || form.images.length === 0)
      return "최소 1개 이상의 이미지를 선택해주세요";
    return "";
  };

  // S3 업로드 함수
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

    const endDate = form.oneMinuteAuction
      ? new Date(new Date().getTime() + 60000)
      : new Date(form.auctionEndTime);

    if (!form.oneMinuteAuction && isNaN(endDate.getTime())) {
      setError("경매 종료 시간이 유효하지 않습니다");
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
          oneMinuteAuction: form.oneMinuteAuction,
          auctionEndTime: endDate.toISOString().split(".")[0],
          sellerId: user.userId,
          categoryId: form.categoryId,
          productStatus: "ACTIVE",
          paymentStatus: "PENDING",
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
            // 실패해도 계속 진행 (이미지 없는 상품 가능)
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

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.oneMinuteAuction}
                onChange={(e) =>
                  setForm({ ...form, oneMinuteAuction: e.target.checked })
                }
                disabled={uploading}
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
                disabled={uploading}
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
