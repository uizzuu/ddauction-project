import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { User, ProductForm } from "../../../../common/types";
import { DELIVERY_TYPES, PAYMENT_STATUS, PRODUCT_TYPES, type ProductCategoryType, PRODUCT_STATUS } from "../../../../common/enums";
import { formatDateTime } from "../../../../common/util";
import { generateAiDescription, registerProductWithImages, fetchProductById, updateProductWithImages } from "../../../../common/api";

export default function useProductForm(user: User | null, productId?: number) {
    const navigate = useNavigate();
    const isEditMode = !!productId;

    const [form, setForm] = useState<ProductForm>({
        title: "",
        content: "",
        startingPrice: "",      // AUCTION: 시작 입찰가
        salePrice: "",          // STORE: 판매가 (NEW)
        originalPrice: "",      // USED: 판매가
        images: [],
        productType: "AUCTION",
        auctionEndTime: "",
        productCategoryType: null,
        tag: "",
        address: "",
        deliveryAvailable: [],
        productBanners: [],
        discountRate: "",       // STORE: 할인율
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
    const [isAgreed, setIsAgreed] = useState(false);
    const [hasBids, setHasBids] = useState(false);

    useEffect(() => {
        const now = new Date();
        now.setSeconds(0);
        now.setMilliseconds(0);
        setMinDateTime(now);

        const maxDate = new Date(now);
        maxDate.setMonth(now.getMonth() + 3);
        setMaxDateTime(maxDate);

        if (isEditMode && productId) {
            loadProductData(productId);
        }
    }, [productId]);

    const loadProductData = async (id: number) => {
        try {
            const product = await fetchProductById(id);
            const extProduct = product as any; // salePrice 접근용

            setForm({
                title: product.title,
                content: product.content || "",
                startingPrice: String(product.startingPrice || ""),      // AUCTION
                salePrice: String(extProduct.salePrice || ""),           // STORE
                originalPrice: String(product.originalPrice || ""),      // USED
                images: (product.images || []) as any[],
                productType: product.productType as "AUCTION" | "USED" | "STORE",
                auctionEndTime: product.auctionEndTime ? product.auctionEndTime.replace("T", " ") : "",
                productCategoryType: product.productCategoryType as ProductCategoryType | null,
                tag: product.tag || "",
                address: product.address || "",
                deliveryAvailable: product.deliveryAvailable ? product.deliveryAvailable.split(",") : [],
                productBanners: (product.productBanners || []) as any[],
                discountRate: String(product.discountRate || ""),
                deliveryPrice: String(product.deliveryPrice || ""),
                deliveryAddPrice: String(product.deliveryAddPrice || ""),
                deliveryIncluded: !!product.deliveryIncluded,
                latitude: (product as any).latitude,
                longitude: (product as any).longitude,
            });

            if (product.auctionEndTime) {
                setAuctionEndDate(new Date(product.auctionEndTime));
            }

            if (product.productType === PRODUCT_TYPES.AUCTION && product.bids && product.bids.length > 0) {
                setHasBids(true);
            }
            setIsAgreed(true);

        } catch (err) {
            console.error("Failed to load product", err);
            setError("상품 정보를 불러오는데 실패했습니다.");
        }
    };

    const handleDateChange = (date: Date | null) => {
        setAuctionEndDate(date);
        if (date) {
            const now = new Date();
            if (date < now && !isEditMode) {
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

    // 타입별 가격 가져오기 (수정됨)
    const getPriceByType = (): number => {
        const cleanNumber = (val?: string) =>
            Number(String(val ?? "").replace(/[^0-9]/g, "")) || 0;

        if (form.productType === PRODUCT_TYPES.AUCTION) {
            return cleanNumber(form.startingPrice);
        } else if (form.productType === PRODUCT_TYPES.STORE) {
            return cleanNumber(form.salePrice);
        } else {
            // USED
            return cleanNumber(form.originalPrice);
        }
    };


    const validateForm = () => {
        if (!form.title) return "제목은 필수 입력 항목입니다";

        if (form.productType === PRODUCT_TYPES.STORE) {
            if (!form.content && (!form.productBanners || form.productBanners.length === 0)) {
                return "스토어 상품은 상세 설명 또는 상세 이미지를 입력해야 합니다";
            }
        } else {
            if (!form.content) return "상세 설명은 필수 입력 항목입니다";
        }

        // 타입별 가격 검증
        const price = getPriceByType();
        if (price <= 0) {
            if (form.productType === PRODUCT_TYPES.AUCTION) {
                return "시작 입찰가는 1원 이상이어야 합니다";
            } else if (form.productType === PRODUCT_TYPES.STORE) {
                return "판매가는 1원 이상이어야 합니다";
            } else {
                return "가격은 1원 이상이어야 합니다";
            }
        }

        if (form.productType === PRODUCT_TYPES.AUCTION && !form.auctionEndTime) {
            return "경매 종료 시간을 입력해주세요";
        }
        if (!form.productCategoryType) return "카테고리를 선택해주세요";
        if (!form.images || form.images.length === 0)
            return "최소 1개 이상의 이미지를 선택해주세요";

        if (form.productType !== PRODUCT_TYPES.STORE && (!form.deliveryAvailable || form.deliveryAvailable.length === 0)) {
            return "거래 가능 방식을 최소 1개 이상 선택해주세요";
        }
        const isDirectTransaction = form.deliveryAvailable?.some(method => method.includes("직거래") || method === DELIVERY_TYPES.MEETUP);
        if (isDirectTransaction && !form.address) {
            return "직거래를 선택하셨으므로 거래 희망 장소를 입력해주세요";
        }
        if (!isAgreed) return "상품 등록 규정에 동의해주세요";
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

        // 타입별 가격으로 확인 메시지 표시
        const price = getPriceByType();
        const priceLabel = form.productType === PRODUCT_TYPES.AUCTION ? "시작가" : "판매가";

        const summary = isEditMode
            ? "상품 정보를 수정하시겠습니까?"
            : `[상품 등록 확인]\n제목: ${form.title}\n${priceLabel}: ${price.toLocaleString()}원\n위 내용으로 상품을 등록하시겠습니까?`;

        if (!window.confirm(summary)) return;

        try {
            setUploading(true);

            // 타입별 가격 필드 설정
            const productData: any = {
                title: form.title,
                content: form.content,
                auctionEndTime: form.productType === PRODUCT_TYPES.AUCTION ? (form.auctionEndTime ? form.auctionEndTime.replace(" ", "T") : undefined) : undefined,
                sellerId: user.userId,
                productCategoryType: form.productCategoryType as ProductCategoryType,
                productType: form.productType,
                productStatus: PRODUCT_STATUS.ACTIVE,
                tag: form.tag,
                address: form.address,
                deliveryAvailable: Array.isArray(form.deliveryAvailable) ? form.deliveryAvailable.join(",") : form.deliveryAvailable,
                discountRate: Number(form.discountRate) || undefined,
                deliveryPrice: Number(form.deliveryPrice) || undefined,
                deliveryAddPrice: Number(form.deliveryAddPrice) || undefined,
                deliveryIncluded: form.deliveryIncluded,
                latitude: form.latitude,
                longitude: form.longitude,
                paymentStatus: PAYMENT_STATUS.PENDING,
            };

            // 타입별 가격 필드 매핑
            if (form.productType === PRODUCT_TYPES.AUCTION) {
                productData.startingPrice = Math.max(Number(form.startingPrice.replace(/[^0-9]/g, "")), 1);
            } else if (form.productType === PRODUCT_TYPES.STORE) {
                productData.salePrice = Math.max(Number(String(form.salePrice).replace(/[^0-9]/g, "")), 1);
            } else {
                // USED
                productData.originalPrice = Math.max(Number(String(form.originalPrice).replace(/[^0-9]/g, "")), 1);
            }

            if (isEditMode && productId) {
                const images = form.images || [];
                const banners = form.productBanners || [];

                await updateProductWithImages(productId, productData, images, banners);
                alert("상품 정보가 수정되었습니다.");
                navigate(`/products/${productId}`);
            } else {
                const files = (form.images || []).filter((img): img is File => img instanceof File);
                const banners = (form.productBanners || []).filter((img): img is File => img instanceof File);

                await registerProductWithImages(productData, files, banners);
                alert("물품 등록 성공!");
                navigate("/search");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "서버 연결 실패");
        } finally {
            setUploading(false);
        }
    };

    const updateForm = (key: keyof ProductForm, value: any) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
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
        error,
        errors,
        uploading,
        aiGenerating,
        auctionEndDate,
        minDateTime,
        maxDateTime,
        setForm,
        setError,
        isAgreed,
        setIsAgreed,
        isEditMode,
        hasBids
    };
}