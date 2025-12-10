import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { User, ProductForm } from "../../../../common/types";
import * as TYPE from "../../../../common/types";
import { formatDateTime } from "../../../../common/util";
import { generateAiDescription, registerProductWithImages } from "../../../../common/api";

export default function useProductForm(user: User | null) {
    const navigate = useNavigate();
    const [form, setForm] = useState<ProductForm>({
        title: "",
        content: "",
        startingPrice: "",
        images: [],
        productType: "AUCTION",
        auctionEndTime: "",
        productCategoryType: null,
        // New State
        tag: "",
        address: "",
        deliveryAvailable: [], // Array of keys
        productBanners: [], // Array of Files
        originalPrice: "",
        discountRate: "",
        deliveryPrice: "",
        deliveryAddPrice: "",
        deliveryIncluded: false,
        latitude: undefined,
        longitude: undefined,
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
        // Default min time is slightly buffered or just 'now'
        // Setting clean minutes/seconds
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

            const formatted = formatDateTime(date.toISOString()).replace(" ", "T");

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
            const description = await generateAiDescription(form.title);
            setForm({ ...form, content: description });
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

        // Content Validation: Optional for STORE if banners exist
        if (form.productType === "STORE") {
            if (!form.content && (!form.productBanners || form.productBanners.length === 0)) {
                return "스토어 상품은 상세 설명 또는 상세 이미지를 입력해야 합니다";
            }
        } else {
            if (!form.content) return "상세 설명은 필수 입력 항목입니다";
        }

        // Check price based on type? Or always checking startingPrice?
        // Original code checks startingPrice for all types (as Used/Store also use it field-wise)
        if (!form.startingPrice || Number(form.startingPrice) <= 0)
            return "가격은 1원 이상이어야 합니다";

        // Auction specific validation
        if (form.productType === "AUCTION" && !form.auctionEndTime) {
            return "경매 종료 시간을 입력해주세요";
        }

        if (!form.productCategoryType) return "카테고리를 선택해주세요";
        if (!form.images || form.images.length === 0)
            return "최소 1개 이상의 이미지를 선택해주세요";

        if (form.productType !== "STORE" && (!form.deliveryAvailable || form.deliveryAvailable.length === 0)) {
            return "거래 가능 방식을 최소 1개 이상 선택해주세요";
        }

        // Address Validation: Required ONLY if "직거래" is selected
        const isDirectTransaction = form.deliveryAvailable?.some(method => method.includes("직거래"));
        if (isDirectTransaction && !form.address) {
            return "직거래를 선택하셨으므로 거래 희망 장소를 입력해주세요";
        }
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

        const priceNumber = Math.max(
            Number(form.startingPrice.replace(/[^0-9]/g, "")),
            1
        );

        try {
            setUploading(true);

            const productData = {
                title: form.title,
                content: form.content,
                startingPrice: priceNumber,
                auctionEndTime: form.auctionEndTime ? form.auctionEndTime.replace(" ", "T") : undefined,
                sellerId: user.userId,
                productCategoryType: form.productCategoryType,
                productStatus: "ACTIVE" as TYPE.ProductStatus,
                paymentStatus: "PENDING" as TYPE.PaymentStatus,
                productType: form.productType,
                // New Fields
                tag: form.tag,
                address: form.address,
                deliveryAvailable: form.deliveryAvailable?.join(","), // Convert array to comma-string
                originalPrice: Number(form.originalPrice) || undefined,
                discountRate: Number(form.discountRate) || undefined,
                deliveryPrice: Number(form.deliveryPrice) || undefined,
                deliveryAddPrice: Number(form.deliveryAddPrice) || undefined,

                deliveryIncluded: form.deliveryIncluded,
                latitude: form.latitude,
                longitude: form.longitude,
            };

            // Handle Product Banners (Detail Images)
            // 상세 이미지는 registerProductWithImages 내부에서 상품 생성 후 업로드됨 (파일명에 productId 포함 위해)

            await registerProductWithImages(
                productData,
                Array.from(form.images || []),
                form.productBanners || [] // Pass banner files directly
            );

            alert("물품 등록 성공!");
            navigate("/search");
        } catch (err) {
            setError(err instanceof Error ? err.message : "서버 연결 실패");
        } finally {
            setUploading(false);
        }
    };

    const updateForm = (key: keyof ProductForm, value: any) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        // Clear error for that field if exists (simplified logic)
        if (errors[key]) {
            setErrors((prev) => ({ ...prev, [key]: "" }));
        }
    };

    const handleImageChange = (files: FileList | null) => {
        if (!files) return;
        setForm((prev) => ({
            ...prev,
            images: [...(prev.images || []), ...Array.from(files)],
        }));
    };

    const removeImage = (index: number) => {
        setForm((prev) => ({
            ...prev,
            images: prev.images?.filter((_, i) => i !== index),
        }));
    };

    return {
        form,
        updateForm,
        handleDateChange,
        handleImageChange,
        removeImage,
        handleSubmit,
        generateAiDescriptionAuto,

        // States
        error,
        errors,
        uploading,
        aiGenerating,
        auctionEndDate,
        minDateTime,
        maxDateTime,

        // Setters if needed directly (though updateForm usually suffices)
        setForm,
        setError
    };
}
