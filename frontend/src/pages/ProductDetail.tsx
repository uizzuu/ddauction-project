/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import type {
  Product,
  User,
  Category,
  Qna,
  Bid,
  EditProductForm,
} from "../types/types";
import { API_BASE_URL } from "../services/api";
import { formatDateTime } from "../utils/util";
import ProductQnA from "../components/ProductQnA";
import ProductBidGraph from "../components/ProductBidGraph";
import { AuctionBox } from "../components/AuctionBox";
import { useAuction } from "../hooks/useAuction";

type Props = {
  user: User | null;
  setUser: (user: User | null) => void;
};

export default function ProductDetail({ user }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const productId = Number(id);
  const [product, setProduct] = useState<Product | null>(null);
  const [remainingTime, setRemainingTime] = useState("");
  const [sellerNickName, setSellerNickName] = useState("로딩중...");
  const [_initialHighestBid, setInitialHighestBid] = useState(0);
  const [allBids, setAllBids] = useState<Bid[]>([]);
  const {
    bids: liveBids,
    currentHighestBid,
    placeBid: livePlaceBid,
  } = useAuction({ productId });

  const [isBookMarked, setIsBookMarked] = useState(false);
  const [bookmarkCount, setBookmarkCount] = useState(0);

  const [qnaList, setQnaList] = useState<Qna[]>([]);

  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [productForm, setProductForm] = useState<EditProductForm>({
    title: "",
    content: "",
    categoryId: undefined,
    startingPrice: "",
    productStatus: "ACTIVE",
    auctionEndTime: "",
    images: [],
  });

  const mergedBids = useMemo(() => {
    const combinedBids = [...allBids, ...liveBids];
    const uniqueBidsMap = new Map<number, Bid>();
    combinedBids.forEach((bid) => {
      uniqueBidsMap.set(bid.bidId, bid);
    });
    const uniqueBids = Array.from(uniqueBidsMap.values()).sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    return uniqueBids;
  }, [allBids, liveBids]);

  const originalEndDate = product?.auctionEndTime
    ? new Date(product.auctionEndTime)
    : new Date();

  // 경매 진행중일 때 수정 막기
  const isEditingDisabled = product
    ? product.productStatus === "ACTIVE" &&
      new Date(product.auctionEndTime).getTime() > new Date().getTime()
    : false;

  const calculateRemainingTime = (endTime: string) => {
    const now = new Date();
    const end = new Date(endTime);
    const diffMs = end.getTime() - now.getTime();
    if (diffMs <= 0) return "경매 종료";
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
    const seconds = Math.floor((diffMs / 1000) % 60);
    return `${days}일 ${hours}시간 ${minutes}분 ${seconds}초`;
  };

  // 남은 시간 실시간 업데이트
  useEffect(() => {
    if (!product) return;
    const interval = setInterval(() => {
      const remaining = calculateRemainingTime(product.auctionEndTime);
      setRemainingTime(remaining);
      if (remaining === "경매 종료") clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [product]);

  // 상품 정보 + 초기 데이터 가져오기
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products/${id}`);
        if (!res.ok) throw new Error("상품 정보를 가져올 수 없습니다.");
        const data: Product = await res.json();
        setProduct(data);
        setSellerNickName(data.sellerNickName ?? "알 수 없음");
        setRemainingTime(calculateRemainingTime(data.auctionEndTime));

        // 찜 수
        try {
          const bmCountRes = await fetch(
            `${API_BASE_URL}/api/bookmarks/count?productId=${id}`
          );
          if (bmCountRes.ok) {
            const count = await bmCountRes.json();
            setBookmarkCount(count);
          }
        } catch (e) {
          console.warn("찜 수 조회 실패", e);
        }

        // 카테고리명
        if (data.categoryId && !data.categoryName) {
          try {
            const categoryRes = await fetch(
              `${API_BASE_URL}/api/categories/${data.categoryId}`
            );
            if (categoryRes.ok) {
              const c: Category = await categoryRes.json();
              setProduct((prev) =>
                prev ? { ...prev, categoryName: c.name } : prev
              );
            }
          } catch {
            console.warn("카테고리명 불러오기 실패");
          }
        }

        // 최고 입찰가
        try {
          const highestRes = await fetch(
            `${API_BASE_URL}/api/products/${id}/highest-bid`
          );
          if (highestRes.ok) {
            const highest: number = await highestRes.json();
            setInitialHighestBid(highest);
          }
        } catch {
          console.warn("최고 입찰가 조회 실패");
        }

        // 현재 사용자가 찜했는지 여부
        try {
          const token = user?.token || localStorage.getItem("token");
          if (token) {
            const bmRes = await fetch(
              `${API_BASE_URL}/api/bookmarks/check?productId=${id}`,
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            if (bmRes.ok) {
              const bookmarked: boolean = await bmRes.json();
              setIsBookMarked(bookmarked);
            }
          }
        } catch (err) {
          console.warn("찜 여부 조회 실패", err);
        }
      } catch (err) {
        console.error(err);
        setSellerNickName("알 수 없음");
      }
    };

    fetchProduct();
  }, [id, user?.token]);

  // 입찰 내역을 가져오는 함수를 컴포넌트 내부에 정의
  const fetchAllBids = useCallback(async () => {
    try {
      const token = user?.token || localStorage.getItem("token"); // user를 의존성에 추가하기 위해 user?.token을 사용
      const res = await fetch(`${API_BASE_URL}/api/bid/${id}/bids`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data: Bid[] = await res.json();
        setAllBids(data);
      } else {
        const text = await res.text();
        console.error("입찰 내역 불러오기 실패, 서버 응답:", text);
      }
    } catch (err) {
      console.error(err);
    }
  }, [id, user?.token]); // id와 user?.token을 의존성에 추가

  // 초기 로딩 시 입찰 내역 fetch
  useEffect(() => {
    fetchAllBids();
  }, [fetchAllBids]); // useCallback으로 만든 fetchAllBids를 의존성 배열에 넣습니다.

  // AuctionBox에 전달할 새로운 placeBid 함수 정의
  const handlePlaceBid = useCallback(
    async (bidPrice: number) => {
      // useAuction 훅의 livePlaceBid를 호출 (웹소켓 업데이트 역할)
      livePlaceBid(bidPrice);
      // ⭐ 서버에서 전체 입찰 내역을 다시 가져와 allBids를 갱신
      await fetchAllBids();
    },
    [livePlaceBid, fetchAllBids]
  );

  const auctionStartingPrice = product?.startingPrice ?? "알 수 없음";

  const highestBid = useMemo(() => {
    if (mergedBids.length === 0) return auctionStartingPrice;
    return Math.max(...mergedBids.map((b) => b.bidPrice));
  }, [mergedBids, auctionStartingPrice]);

  if (!id) return <div>잘못된 접근입니다.</div>;
  if (isNaN(productId)) return <div>잘못된 접근입니다.</div>;

  const handleToggleBookmark = async () => {
    if (!product) return;
    const token = user?.token || localStorage.getItem("token");
    if (!token) return alert("로그인 후 찜 해주세요.");

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/bookmarks/toggle?productId=${product.productId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const msg = await res.text();
        alert("찜 기능 실패: " + msg);
        return;
      }

      const text = await res.text();
      setIsBookMarked(text === "찜 완료");

      const countRes = await fetch(
        `${API_BASE_URL}/api/bookmarks/count?productId=${product.productId}`
      );
      if (countRes.ok) {
        const count = await countRes.json();
        setBookmarkCount(count);
      }
    } catch (err) {
      console.error(err);
      alert("찜 기능 실패 (네트워크 오류)");
    }
  };

  const handleReport = async () => {
    if (!product) return;
    const token = user?.token || localStorage.getItem("token");
    if (!token) return alert("로그인 후 신고할 수 있습니다.");

    const reason = prompt("신고 사유를 입력해주세요:");
    if (!reason?.trim()) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetId: product.sellerId,
          reason: reason.trim(),
        }),
      });

      if (res.ok) alert("신고가 접수되었습니다.");
      else {
        const msg = await res.text();
        alert("신고 실패: " + msg);
      }
    } catch (err) {
      console.error(err);
      alert("신고 처리 중 오류가 발생했습니다.");
    }
  };

  const handleEditProduct = () => {
    if (!product) return;
    setEditingProductId(product.productId);
    setProductForm({
      title: product.title,
      content: product.content ?? "",
      startingPrice:
        product.startingPrice !== undefined
          ? String(product.startingPrice) // number → string 변환
          : "",
      categoryId: product.categoryId,
      productStatus: product.productStatus ?? "ACTIVE",
      auctionEndTime: product.auctionEndTime,
      images: [],
    });
  };

  const handleSaveProduct = async () => {
    if (!product) return;
    try {
      const token = user?.token || localStorage.getItem("token");
      if (!token) return alert("로그인 후 수정 가능합니다.");

      const payload = {
        ...productForm,
        categoryId: productForm.categoryId ?? null, // undefined -> null로 변환
        startingPrice: Number(productForm.startingPrice || 0),
        auctionEndTime: productForm.auctionEndTime
          ? new Date(productForm.auctionEndTime).toISOString()
          : null,
      };

      const res = await fetch(
        `${API_BASE_URL}/api/products/${product.productId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json().catch(async () => await res.text());

      if (!res.ok) {
        alert(
          "상품 수정 실패: " + (data?.message || data || "알 수 없는 오류")
        );
        return;
      }

      setProduct(data as Product);
      setEditingProductId(null);
      alert("상품이 수정되었습니다.");
    } catch (err) {
      console.error(err);
      alert("상품 수정 실패 (네트워크 오류)");
    }
  };

  const handleCancelProductEdit = () => {
    setEditingProductId(null);
  };

  const handleDeleteProduct = async () => {
    if (!product) return;
    if (!confirm("상품을 삭제하시겠습니까?")) return;

    try {
      const token = user?.token || localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE_URL}/api/products/${product.productId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.ok) {
        alert("상품이 삭제되었습니다.");
        navigate("/my-products");
      } else alert("삭제 실패");
    } catch (err) {
      console.error(err);
      alert("삭제 실패");
    }
  };

  const handleChangeProductForm = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type, files } = e.target as HTMLInputElement & {
      files?: FileList;
    };

    if (type === "file" && files) {
      setProductForm((prev) => ({ ...prev, images: Array.from(files) }));
      return;
    }

    setProductForm((prev) => ({
      ...prev,
      [name]: name === "startingPrice" ? value : value,
    }));
  };

  const getCategoryName = (categoryId?: number) => {
    if (!categoryId) return "없음";
    return product?.categoryName ?? "알 수 없음";
  };

  if (!product)
    return <div style={{ padding: "16px" }}>상품을 찾을 수 없습니다.</div>;

  return (
    <div className="container">
      <div className="flex-box gap-40">
        <div className="product-image product-detail-image">
          {product.images && product.images.length > 0 ? (
            <img src={product.images[0].imagePath} alt={product.title} />
          ) : (
            <div className="no-image-txt">이미지 없음</div>
          )}
        </div>

        <div
          style={{
            flex: 1,
            minWidth: "300px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            position: "relative",
          }}
        >
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
            {product.title}
          </h2>

          <div className="flex-box flex-between flex-top-a">
            <div className="flex-box gap-4">
              <button
                onClick={handleToggleBookmark}
                style={{
                  backgroundColor: "#fff",
                  color: "#aaa",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  padding: "2px 8px",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                }}
              >
                <div className="flex-box gap-4 flex-center">
                  <svg
                    width="12"
                    height="11"
                    viewBox="-0.5 -0.5 13 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6 11L5.13 10.2087C2.04 7.40926 0 5.55695 0 3.297C0 1.44469 1.452 0 3.3 0C4.344 0 5.346 0.485559 6 1.24687C6.654 0.485559 7.656 0 8.7 0C10.548 0 12 1.44469 12 3.297C12 5.55695 9.96 7.40926 6.87 10.2087L6 11Z"
                      fill={isBookMarked ? "#b17576" : "#fff"}
                      stroke="#b17576"
                    />
                  </svg>
                  <p>{bookmarkCount}</p>
                </div>
              </button>
              <button
                style={{
                  backgroundColor: "#fff",
                  color: "#aaa",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  padding: "2px 8px",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                }}
                onClick={handleReport}
              >
                신고
              </button>
            </div>
            {user?.userId === product.sellerId && (
              <div className="flex-box gap-4">
                {!editingProductId ? (
                  <>
                    <button onClick={handleEditProduct} className="edit-btn">
                      수정
                    </button>
                    <button onClick={handleDeleteProduct} className="edit-btn">
                      삭제
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleCancelProductEdit}
                      className="edit-btn"
                    >
                      취소
                    </button>
                    <button onClick={handleSaveProduct} className="edit-btn">
                      저장
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {editingProductId && (
            <div
              style={{
                height: "320px",
                marginTop: "15px",
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "8px",
                background: "#f9f9f9",
                position: "absolute",
                width: "100%",
                zIndex: 10,
                top: "64px",
                overflowY: "auto",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <label className="label title-16">상품명</label>
                <input
                  name="title"
                  value={productForm.title}
                  onChange={handleChangeProductForm}
                  placeholder="상품명"
                  className="input"
                  disabled={isEditingDisabled}
                />
                <label className="label title-16">카테고리</label>
                <select
                  name="categoryId"
                  value={productForm.categoryId ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProductForm((prev) => ({
                      ...prev,
                      categoryId: val === "" ? undefined : Number(val),
                    }));
                  }}
                  disabled={isEditingDisabled}
                >
                  <option value="">카테고리 선택</option>
                  {product?.categoryId && (
                    <option value={product.categoryId}>
                      {getCategoryName(product.categoryId)}
                    </option>
                  )}
                </select>
                <label className="label title-16">경매 종료 시간</label>
                <ReactDatePicker
                  selected={
                    productForm.auctionEndTime
                      ? new Date(productForm.auctionEndTime)
                      : null
                  }
                  onChange={(date: Date | null) =>
                    setProductForm((prev) => ({
                      ...prev,
                      auctionEndTime: date
                        ? date.toISOString()
                        : prev.auctionEndTime,
                    }))
                  }
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={5}
                  dateFormat="yyyy-MM-dd HH:mm"
                  minDate={originalEndDate} // 날짜 제한
                  minTime={
                    productForm.auctionEndTime &&
                    new Date(productForm.auctionEndTime).toDateString() ===
                      originalEndDate.toDateString()
                      ? originalEndDate // 같은 날이면 기존 종료시간 이전 선택 불가
                      : new Date(0, 0, 0, 0, 0) // 다른 날이면 제한 없음 (0시 기준)
                  }
                  maxTime={
                    productForm.auctionEndTime &&
                    new Date(productForm.auctionEndTime).toDateString() ===
                      originalEndDate.toDateString()
                      ? new Date(23, 11, 31, 23, 59) // 같은 날이면 하루 끝까지 허용
                      : new Date(23, 11, 31, 23, 59) // 다른 날도 하루 끝까지
                  }
                  className="input"
                />
                <label className="label title-16">경매등록가</label>
                <input
                  name="startingPrice"
                  type="number"
                  value={productForm.startingPrice}
                  onChange={handleChangeProductForm}
                  placeholder="가격"
                  className="input"
                  disabled={isEditingDisabled}
                />
                <label className="label title-16">상세설명</label>
                <textarea
                  name="content"
                  value={productForm.content}
                  onChange={handleChangeProductForm}
                  placeholder="설명"
                  rows={3}
                  className="textarea"
                  disabled={isEditingDisabled}
                />
                <label className="label title-16">판매상태</label>
                <select
                  name="productStatus"
                  value={productForm.productStatus}
                  onChange={handleChangeProductForm}
                  disabled={isEditingDisabled}
                >
                  <option value="ACTIVE">판매중</option>
                  <option value="SOLD">판매완료</option>
                  <option value="PAUSED">일시중지</option>
                </select>
              </div>
            </div>
          )}

          {/* 상품 정보: 수정 모드일 때 안보임 */}
          {!editingProductId && (
            <>
              <p>판매자: {sellerNickName}</p>
              <p>카테고리: {product.categoryName ?? "없음"}</p>
              <p style={{ color: "#555", fontSize: "0.9rem" }}>
                등록시간:{" "}
                {product.createdAt
                  ? formatDateTime(product.createdAt)
                  : "알 수 없음"}{" "}
                <br />
                남은시간: {remainingTime}
                <br />({formatDateTime(product.auctionEndTime)})
              </p>

              <p>경매등록가: {auctionStartingPrice.toLocaleString()}원</p>
              <p>현재 최고 입찰가: {highestBid.toLocaleString()}원</p>
            </>
          )}

          <div
            style={{
              backgroundColor: "#f9f9f9",
              padding: "8px",
              borderRadius: "8px",
              border: "1px solid #eee",
              whiteSpace: "pre-wrap",
            }}
          >
            {product.content ?? "상세 설명이 없습니다."}
          </div>
        </div>

        {/* 경매 종료 & 내가 낙찰자일 때만 결제 버튼 보이게 */}
        {remainingTime === "경매 종료" && (
          <div style={{ textAlign: "center", marginTop: "30px" }}>
            <button
              onClick={() => navigate("/payment")} // ✅ 결제 페이지로 이동
              style={{
                backgroundColor: "#ff6600",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "14px 28px",
                fontSize: "1rem",
                cursor: "pointer",
              }}
            >
              결제하기
            </button>
          </div>
        )}

        <AuctionBox
          productId={product.productId}
          mergedBids={mergedBids}
          currentHighestBid={currentHighestBid}
          placeBid={handlePlaceBid}
        />
      </div>
      <ProductBidGraph
        bids={mergedBids}
        startingPrice={product?.startingPrice ?? 0}
      />
      <ProductQnA
        user={user}
        product={product}
        productId={product.productId}
        qnaList={qnaList}
        setQnaList={setQnaList}
      />
    </div>
  );
}
