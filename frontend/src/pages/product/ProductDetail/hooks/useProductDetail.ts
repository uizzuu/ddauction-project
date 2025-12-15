import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    API_BASE_URL,
    toggleBookmark,
    fetchProductDetail,
    fetchBookmarkCount,
    fetchBookmarkCheck,
    fetchAllBids,
    checkWinner,
    getQnaList,
    reportProduct,
    deleteProduct,
    fetchUserReviews,
} from "../../../../common/api";
import type {
    Product,
    User,
    ProductQna,
    Bid,
    EditProductForm,
    Review,
} from "../../../../common/types";

interface UseAuctionProps {
    productId: number;
}

const useAuction = ({ productId }: UseAuctionProps) => {
    const wsRef = useRef<WebSocket | null>(null);
    const [bids, setBids] = useState<Bid[]>([]);
    const [currentHighestBid, setCurrentHighestBid] = useState(0);

    useEffect(() => {
        if (!productId) return;
        const wsUrl =
            API_BASE_URL.replace("http", "ws").replace("/api", "") +
            `/ws/auction?productId=${productId}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log("WebSocket connected:", productId);
        };

        ws.onmessage = (event) => {
            const bidList: Bid[] = JSON.parse(event.data);
            setBids(bidList);

            const highest =
                bidList.length > 0 ? Math.max(...bidList.map((b) => b.bidPrice)) : 0;
            setCurrentHighestBid(highest);
        };

        ws.onerror = (err) => {
            console.error("WebSocket error:", err);
        };

        ws.onclose = () => {
            console.log("WebSocket closed");
        };

        return () => {
            ws.close();
        };
    }, [productId]);

    const placeBid = (bidPrice: number) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ bidPrice }));
        }
    };

    return { bids, currentHighestBid, placeBid };
};

export const useProductDetail = (user: User | null) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const productId = Number(id);

    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true); // Added isLoading
    const [remainingTime, setRemainingTime] = useState("");
    const [sellerNickName, setSellerNickName] = useState("로딩중...");
    const [allBids, setAllBids] = useState<Bid[]>([]);
    const {
        bids: liveBids,
        currentHighestBid,
        placeBid: livePlaceBid,
    } = useAuction({ productId });

    const [isBookMarked, setIsBookMarked] = useState(false);
    const [bookmarkCount, setBookmarkCount] = useState(0);
    const [qnaList, setQnaList] = useState<ProductQna[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isWinner, setIsWinner] = useState(false);

    // Edit State
    const [editingProductId, setEditingProductId] = useState<number | null>(null);
    const [productForm, setProductForm] = useState<EditProductForm>({
        title: "",
        content: "",
        productCategoryType: null,
        startingPrice: "",
        productStatus: "ACTIVE",
        auctionEndTime: "",
        productType: "AUCTION", // Default
        images: [],
    });

    // Calculate merged bids
    const mergedBids = useMemo(() => {
        const combinedBids = [...allBids, ...liveBids];
        const uniqueBidsMap = new Map<number, Bid>();
        combinedBids.forEach((bid) => {
            uniqueBidsMap.set(bid.bidId, bid);
        });
        return Array.from(uniqueBidsMap.values()).sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
    }, [allBids, liveBids]);

    // ✅ 남은 시간 계산 - 초 단위 포함
    const calculateRemainingTime = (endTime: string) => {
        const now = new Date();
        const end = new Date(endTime);
        const diffMs = end.getTime() - now.getTime();

        if (diffMs <= 0) return "경매 종료";

        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
        const seconds = Math.floor((diffMs / 1000) % 60);

        // ✅ 초 단위 추가하여 실시간 업데이트 체감 향상
        if (days > 0) {
            return `${days}일 ${hours}시간 ${minutes}분`;
        } else if (hours > 0) {
            return `${hours}시간 ${minutes}분 ${seconds}초`;
        } else if (minutes > 0) {
            return `${minutes}분 ${seconds}초`;
        } else {
            return `${seconds}초`;
        }
    };

    useEffect(() => {
        if (!product) return;

        // ✅ 즉시 한 번 실행
        const remaining = calculateRemainingTime(product.auctionEndTime || "");
        setRemainingTime(remaining);

        if (remaining === "경매 종료") return;

        const interval = setInterval(() => {
            const remaining = calculateRemainingTime(product.auctionEndTime || "");
            setRemainingTime(remaining);
            if (remaining === "경매 종료") clearInterval(interval);
        }, 1000);

        return () => clearInterval(interval);
    }, [product]);

    const lastVisitedIdRef = useRef<number | null>(null);

    useEffect(() => {
        // 조회수 증가 한 번만 체크 (ID가 바뀌면 다시 실행)
        if (lastVisitedIdRef.current === Number(id)) return;
        
        // ID가 바뀌었으므로 로딩 상태 초기화
        setIsLoading(true);

        const fetchProduct = async () => {
            try {
                const data = await fetchProductDetail(Number(id));
                setProduct(data);
                setSellerNickName(data.sellerNickName ?? "알 수 없음");
                setRemainingTime(calculateRemainingTime(data.auctionEndTime || ""));
                lastVisitedIdRef.current = Number(id);

                // ✅ 기존 이미지를 productForm에 설정
                setProductForm({
                    title: data.title,
                    content: data.content || "",
                    productCategoryType: data.productCategoryType || null,
                    startingPrice: data.startingPrice?.toString() || "",
                    productStatus: data.productStatus,
                    auctionEndTime: data.auctionEndTime || "",
                    productType: data.productType || "AUCTION",
                    images: data.images || [], // ✅ 기존 이미지 포함
                });

                // Bookmark Check
                try {
                    const count = await fetchBookmarkCount(Number(id));
                    setBookmarkCount(count);

                    if (user) {
                        const token = localStorage.getItem("token");
                        const isMarked = await fetchBookmarkCheck(Number(id), token || undefined);
                        setIsBookMarked(isMarked);
                    }

                } catch (e) { console.error("Bookmark fetch error", e); }

                // Fetch Bids
                if (data.productType === "AUCTION") {
                    const bids = await fetchAllBids(Number(id));
                    setAllBids(bids);

                    // Check Winner
                    if (user) {
                        const winData = await checkWinner(Number(id));
                        setIsWinner(winData.isWinner);
                    }
                }

                // Fetch QnA
                const qnas = await getQnaList(Number(id));
                setQnaList(qnas);

                // ⭐ 여기에 추가 - Fetch Reviews (판매자 리뷰)
                if (data.sellerId) {
                    try {
                        const reviewList = await fetchUserReviews(data.sellerId);
                        setReviews(reviewList);
                    } catch (e) {
                        console.error("리뷰 조회 실패:", e);
                    }
                }

            } catch (err) {
                console.error(err);
                setProduct(null); // 에러 시 product null 처리
            } finally {
                setIsLoading(false); // 로딩 끝
            }
        };
        fetchProduct();
    }, [id, user]);

    const handleToggleBookmark = async () => {
        if (!product) return;
        const token = localStorage.getItem("token");
        if (!token) return alert("로그인 후 찜 해주세요.");

        const prev = isBookMarked;
        setIsBookMarked(!prev); // Optimistic Update

        try {
            await toggleBookmark(product.productId, token);
            // Sync with other components
            window.dispatchEvent(new Event("wishlist-updated"));

            // Optionally update count from server
            const count = await fetchBookmarkCount(product.productId);
            setBookmarkCount(count);
        } catch (err) {
            console.error(err);
            setIsBookMarked(prev); // Revert on error
            alert("찜하기 처리에 실패했습니다.");
        }
    };

    const handlePlaceBid = (bidPrice: number) => {
        livePlaceBid(bidPrice);
    };

    const [showReportModal, setShowReportModal] = useState(false);

    const handleReport = () => {
        if (!user) {
            alert("로그인이 필요합니다.");
            return;
        }
        setShowReportModal(true);
    };

    const submitReport = async (reason: string) => {
        try {
            const token = localStorage.getItem("token");
            await reportProduct(product?.productId || 0, reason, token || undefined);
            alert("신고가 접수되었습니다.");
        } catch (e) {
            console.error(e);
            alert("오류가 발생했습니다.");
        }
    };

    const handleDeleteProduct = async () => {
        if (!window.confirm("정말 삭제하시겠습니까?")) return;
        try {
            const token = localStorage.getItem("token");
            const success = await deleteProduct(productId, token || undefined);
            if (success) {
                alert("삭제되었습니다.");
                navigate("/");
            } else {
                alert("삭제 실패");
            }
        } catch (e) { console.error(e); }
    };

    return {
        product,
        setProduct,
        isLoading, // Exposed isLoading
        remainingTime,
        sellerNickName,
        mergedBids,
        currentHighestBid,
        user,
        navigate,
        productId,
        isBookMarked,
        bookmarkCount,
        handleToggleBookmark,
        handleReport,
        handleDeleteProduct,
        handlePlaceBid,
        qnaList,
        setQnaList,
        reviews,
        setReviews,
        isWinner,
        editingProductId,
        setEditingProductId,
        productForm,
        setProductForm,
        showReportModal,
        setShowReportModal,
        submitReport,
    };
};