import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE_URL, toggleBookmark } from "../../../../common/api";
import type {
    Product,
    User,
    ProductQna,
    Bid,
    EditProductForm,
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

    const calculateRemainingTime = (endTime: string) => {
        const now = new Date();
        const end = new Date(endTime);
        const diffMs = end.getTime() - now.getTime();
        if (diffMs <= 0) return "경매 종료";
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
        // 초 제외 요건 반영
        return `${days}일 ${hours}시간 ${minutes}분`;
    };

    useEffect(() => {
        if (!product) return;
        const interval = setInterval(() => {
            const remaining = calculateRemainingTime(product.auctionEndTime || "");
            setRemainingTime(remaining);
            if (remaining === "경매 종료") clearInterval(interval);
        }, 1000);
        return () => clearInterval(interval);
    }, [product]);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/products/${id}`);
                if (!res.ok) throw new Error("상품 정보를 가져올 수 없습니다.");
                const data: Product = await res.json();
                setProduct(data);
                setSellerNickName(data.sellerNickName ?? "알 수 없음");
                setRemainingTime(calculateRemainingTime(data.auctionEndTime || ""));

                // Bookmark Check
                try {
                    const countRes = await fetch(`${API_BASE_URL}/api/bookmarks/count?productId=${id}`);
                    if (countRes.ok) setBookmarkCount(await countRes.json());

                    if (user) {
                        const token = localStorage.getItem("token");
                        const checkRes = await fetch(`${API_BASE_URL}/api/bookmarks/check?productId=${id}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        if (checkRes.ok) setIsBookMarked(await checkRes.json());
                    }

                } catch (e) { console.error("Bookmark fetch error", e); }

                // Fetch Bids
                if (data.productType === "AUCTION") {
                    const bidsRes = await fetch(`${API_BASE_URL}/api/bid/${id}/bids`);
                    if (bidsRes.ok) setAllBids(await bidsRes.json());

                    // Check Winner
                    if (user) {
                        const token = localStorage.getItem("token");
                        const winRes = await fetch(`${API_BASE_URL}/api/bid/${id}/winner`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        if (winRes.ok) {
                            const winData = await winRes.json();
                            setIsWinner(winData.isWinner);
                        }
                    }
                }

                // Fetch QnA
                const qnaRes = await fetch(`${API_BASE_URL}/api/product-qnas/product/${id}`);
                if (qnaRes.ok) setQnaList(await qnaRes.json());

            } catch (err) {
                console.error(err);
            }
        };
        fetchProduct();
    }, [id, user]);

    const handleToggleBookmark = async () => {
        if (!product) return;
        const token = localStorage.getItem("token");
        if (!token) return alert("로그인 후 찜 해주세요.");

        try {
            const resultMsg = await toggleBookmark(product.productId, token);
            setIsBookMarked(resultMsg === "찜 완료");

            const countRes = await fetch(
                `${API_BASE_URL}/api/bookmarks/count?productId=${product.productId}`
            );
            if (countRes.ok) {
                setBookmarkCount(await countRes.json());
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handlePlaceBid = (bidPrice: number) => {
        livePlaceBid(bidPrice);
    };

    const handleReport = async () => {
        if (!user) return alert("로그인이 필요합니다.");
        const reason = prompt("신고 사유를 입력해주세요:");
        if (!reason) return;
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/api/reports`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ targetId: product?.sellerId, reason, reportType: "PRODUCT" }), // Adjust based on API
            });
            if (res.ok) alert("신고가 접수되었습니다.");
            else alert("신고 접수 실패");
        } catch (e) { console.error(e); }
    };

    const handleDeleteProduct = async () => {
        if (!window.confirm("정말 삭제하시겠습니까?")) return;
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
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
        isWinner,
        editingProductId,
        setEditingProductId,
        productForm,
        setProductForm
    };
};
