import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import type * as TYPE from "../common/types";
import * as API from "../common/api";
import * as UTIL from "../common/util";
import { useAuction } from "../common/hooks";
import { CATEGORY_OPTIONS, PRODUCT_CATEGORY_LABELS, type ProductCategoryType } from "../common/enums";

import { AROverlayWithButton, ProductQnA, ProductBidGraph, AuctionBox } from "../common/import"

type Props = {
  user: TYPE.User | null;
  setUser: (user: TYPE.User | null) => void;
};

export default function ProductDetail({ user }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const productId = Number(id);

  const [product, setProduct] = useState<TYPE.Product | null>(null);
  const [remainingTime, setRemainingTime] = useState("");
  const [sellerNickName, setSellerNickName] = useState("로딩중...");
  const [_initialHighestBid, setInitialHighestBid] = useState(0);
  const [allBids, setAllBids] = useState<TYPE.Bid[]>([]);
  const { bids: liveBids, currentHighestBid, placeBid: livePlaceBid } = useAuction({ productId });

  const [isBookMarked, setIsBookMarked] = useState(false);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [qnaList, setQnaList] = useState<TYPE.Qna[]>([]);

  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [productForm, setProductForm] = useState<TYPE.EditProductForm>({
    title: "",
    content: "",
    productCategoryType: null,
    startingPrice: "",
    productStatus: "ACTIVE",
    auctionEndTime: "",
    productType: "AUCTION",
    images: [],
  });

  const [isWinner, setIsWinner] = useState(false);
  const [_winningBidPrice, setWinningBidPrice] = useState<number | null>(null);
  const [showARModal, setShowARModal] = useState(false);

  const mergedBids = useMemo(() => {
    const combined = [...allBids, ...liveBids];
    const map = new Map<number, TYPE.Bid>();
    combined.forEach((bid) => map.set(bid.bidId, bid));
    return Array.from(map.values()).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [allBids, liveBids]);

  const originalEndDate = product?.auctionEndTime ? new Date(product.auctionEndTime) : new Date();
  const isEditingDisabled = product
<<<<<<< HEAD
    ? product.productStatus === "ACTIVE" && new Date(product.auctionEndTime).getTime() > new Date().getTime()
=======
    ? product.productStatus === "ACTIVE" &&
    new Date(product.auctionEndTime).getTime() > new Date().getTime()
>>>>>>> 2038a8d (개인채팅활성화)
    : false;
  const remaining = product ? UTIL.calculateRemainingTime(product.auctionEndTime) : "";

  // 남은 시간 실시간 업데이트
  useEffect(() => {
    if (!product) return;
    const interval = setInterval(() => {
      setRemainingTime(remaining);
      if (remaining === "경매 종료") clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [product, UTIL.calculateRemainingTime]);

  // 상품 정보 로드
  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      const token = user?.token || localStorage.getItem("token") || undefined;
      try {
        const data = await API.fetchProductById(Number(id));
        setProduct(data);
        setSellerNickName(data.sellerNickName ?? "알 수 없음");
        setRemainingTime(UTIL.calculateRemainingTime(data.auctionEndTime));

        setBookmarkCount(await API.fetchBookmarkCount(data.productId));
        if (token) setIsBookMarked(await API.fetchBookmarkCheck(data.productId, token));

        setInitialHighestBid(await API.fetchHighestBid(data.productId));
      } catch (err) {
        console.error("상품 로드 실패:", err);
      }
    };
    loadData();
  }, [id, user?.token, UTIL.calculateRemainingTime]);

  // 입찰 내역 로드
  const fetchAllBidsData = useCallback(async () => {
    const token = user?.token || localStorage.getItem("token") || undefined;
    try {
      const bids = await API.fetchAllBids(productId, token);
      setAllBids(bids);
    } catch (err) {
      console.error("입찰 내역 불러오기 실패:", err);
    }
  }, [productId, user?.token]);

  useEffect(() => {
    fetchAllBidsData();
  }, [fetchAllBidsData]);

  // 경매 입찰
  const handlePlaceBid = useCallback(async (bidPrice: number) => {
    const token = user?.token || localStorage.getItem("token") || undefined;
    if (!token) return alert("로그인 후 입찰 가능합니다.");
    try {
      await API.placeBid(productId, bidPrice, token);
      livePlaceBid(bidPrice);
      await fetchAllBidsData();
    } catch (err) {
      console.error(err);
      alert("입찰 실패");
    }
  }, [productId, livePlaceBid, fetchAllBidsData, user?.token]);

  // 낙찰자 여부 확인
  useEffect(() => {
    if (!product?.auctionEndTime) return;
    const interval = setInterval(async () => {
      const now = new Date();
      const end = new Date(product.auctionEndTime);
      const ended = now >= end || product.productStatus === "CLOSED";
      if (ended) {
        clearInterval(interval);
        const token = user?.token || localStorage.getItem("token") || undefined;
        try {
          const data = await API.fetchWinner(productId, token);
          setIsWinner(data.isWinner);
          if (data.bidPrice) setWinningBidPrice(data.bidPrice);
        } catch (err) {
          console.error("낙찰자 확인 실패:", err);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [product?.auctionEndTime, product?.productStatus, productId, user?.token]);

  // 찜
  const handleToggleBookmark = async () => {
    if (!product) return;
    const token = user?.token || localStorage.getItem("token") || undefined;
    if (!token) return alert("로그인 후 찜 해주세요.");
    try {
      const text = await API.toggleBookmark(product.productId, token);
      setIsBookMarked(text === "찜 완료");
      setBookmarkCount(await API.fetchBookmarkCount(product.productId));
    } catch (err) {
      console.error(err);
      alert("찜 기능 실패");
    }
  };

  // 신고
  const handleReport = async () => {
    if (!product) return;
    const token = user?.token || localStorage.getItem("token") || undefined;
    if (!token) return alert("로그인 후 신고할 수 있습니다.");
    const reason = prompt("신고 사유를 입력해주세요:");
    if (!reason?.trim()) return;
    try {
      await API.reportSeller(product.sellerId, reason.trim(), token);
      alert("신고가 접수되었습니다.");
    } catch (err) {
      console.error(err);
      alert("신고 실패");
    }
  };

  // 상품 수정
  const handleEditProduct = () => {
    if (!product) return;
    setEditingProductId(product.productId);
    setProductForm({
      title: product.title,
      content: product.content ?? "",
      startingPrice: product.startingPrice ? String(product.startingPrice) : "",
      productCategoryType: product.productCategoryType ?? null,
      productType: "AUCTION",
      productStatus: product.productStatus ?? "ACTIVE",
      auctionEndTime: product.auctionEndTime,
      images: [],
    });
  };

  const handleSaveProduct = async () => {
    if (!product) return;
    const token = user?.token || localStorage.getItem("token") || undefined;
    if (!token) return alert("로그인 후 수정 가능합니다.");
    try {
      const payload = {
        ...productForm,
        productCategoryType: productForm.productCategoryType ?? null,
        startingPrice: Number(productForm.startingPrice || 0),
<<<<<<< HEAD
=======
        auctionEndTime: productForm.auctionEndTime
          ? (() => {
            const end = new Date(productForm.auctionEndTime);
            const year = end.getFullYear();
            const month = String(end.getMonth() + 1).padStart(2, "0");
            const day = String(end.getDate()).padStart(2, "0");
            const hours = String(end.getHours()).padStart(2, "0");
            const minutes = String(end.getMinutes()).padStart(2, "0");
            const seconds = String(end.getSeconds()).padStart(2, "0");
            return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
          })()
          : null,
>>>>>>> 2038a8d (개인채팅활성화)
      };
      const updated = await API.editProduct(product.productId, payload, token);
      setProduct(updated);
      setEditingProductId(null);
      alert("상품이 수정되었습니다.");
    } catch (err) {
      console.error(err);
      alert("상품 수정 실패");
    }
  };

  const handleCancelProductEdit = () => setEditingProductId(null);

  // 상품 삭제
  const handleDeleteProduct = async () => {
    if (!product) return;
    if (!confirm("상품을 삭제하시겠습니까?")) return;
    const token = user?.token || localStorage.getItem("token") || undefined;
    if (!token) return alert("로그인 후 삭제 가능합니다.");
    try {
      await API.deleteProduct(product.productId, token);
      alert("상품이 삭제되었습니다.");
      navigate("/my-products");
    } catch (err) {
      console.error(err);
      alert("삭제 실패");
    }
  };

  const handleChangeProductForm = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type, files } = e.target as HTMLInputElement & { files?: FileList };
    if (type === "file" && files) {
      setProductForm(prev => ({ ...prev, images: Array.from(files) }));
      return;
    }
    setProductForm(prev => ({ ...prev, [name]: value }));
  };

  const auctionStartingPrice = product?.startingPrice ?? 0;
  const highestBid = useMemo(() => {
    if (mergedBids.length === 0) return auctionStartingPrice;
    return Math.max(...mergedBids.map(b => b.bidPrice));
  }, [mergedBids, auctionStartingPrice]);

  if (!id || isNaN(productId)) return <div>잘못된 접근입니다.</div>;
  if (!product) return <div style={{ padding: "16px" }}>상품을 찾을 수 없습니다.</div>;

  return (
    <div className="container">
      <div className="flex-box gap-40">
        <div className="product-image product-detail-image">
          {product.images?.length ? (
            <Slider
              dots={true}
              infinite={true}
              speed={500}
              slidesToShow={1}
              slidesToScroll={1}
              arrows={true}
              adaptiveHeight={false}
            >
              {product.images.map((img, idx) => (
                <div key={idx}>
                  <img
                    src={img.imagePath}
                    alt={`${product.title} - ${idx + 1}`}
                    onError={(e) => {
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        parent.innerHTML =
                          '<div class="no-image-txt">이미지 없음</div>';
                      }
                    }}
                  />
                </div>
              ))}
            </Slider>
          ) : (
            <div className="no-image-txt">이미지 없음</div>
          )}
          {/* AR 트라이온 버튼 */}
          <button
            onClick={() => setShowARModal(true)}
            style={{
              position: "absolute",
              bottom: "20px",
              right: "20px",
              backgroundColor: "#ff6600",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "10px 20px",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: "bold",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              zIndex: 5,
            }}
          >
            📷 AR 트라이온
          </button>
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

            {(() => {
              if (!product) return null;

              const auctionEnded =
                remainingTime === "경매 종료" ||
                product.productStatus === "CLOSED";

              if (!auctionEnded || !isWinner) return null;

              if (
                product.paymentStatus === "PAID" ||
                product.productStatus === "SOLD"
              ) {
                return (
                  <div
                    style={{
                      textAlign: "center",
                      marginTop: "30px",
                      color: "#777",
                    }}
                  >
                    이미 판매된 물건입니다.
                  </div>
                );
              }

              return (
                <div className="position-ab z-20 right-0">
                  <button
                    onClick={() => navigate(`/payment?productId=${productId}`)}
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
              );
            })()}
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
                  name="productCategoryType"
                  value={productForm.productCategoryType ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProductForm((prev) => ({
                      ...prev,
                      productCategoryType: (val || null) as ProductCategoryType | null,
                    }));
                  }}
                  disabled={isEditingDisabled}
                  className="input"
                >
                  <option value="">카테고리 선택</option>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
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
                        ? (() => {
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(
                            2,
                            "0"
                          );
                          const day = String(date.getDate()).padStart(2, "0");
                          const hours = String(date.getHours()).padStart(
                            2,
                            "0"
                          );
                          const minutes = String(date.getMinutes()).padStart(
                            2,
                            "0"
                          );
                          const seconds = String(date.getSeconds()).padStart(
                            2,
                            "0"
                          );
                          return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
                        })()
                        : prev.auctionEndTime,
                    }))
                  }
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={5}
                  dateFormat="yyyy-MM-dd HH:mm"
                  minDate={originalEndDate}
                  minTime={
                    productForm.auctionEndTime &&
                      new Date(productForm.auctionEndTime).toDateString() ===
                      originalEndDate.toDateString()
                      ? originalEndDate
                      : new Date(0, 0, 0, 0, 0)
                  }
                  maxTime={new Date(23, 11, 31, 23, 59)}
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
              <p>
                카테고리:{" "}
                {product.productCategoryType
                  ? PRODUCT_CATEGORY_LABELS[product.productCategoryType]
                  : "없음"}
              </p>
              <p style={{ color: "#555", fontSize: "0.9rem" }}>
                등록시간:{" "}
                {product.createdAt
                  ? UTIL.formatDateTime(product.createdAt)
                  : "알 수 없음"}{" "}
                <br />
                남은시간: {remainingTime}
                <br />({UTIL.formatDateTime(product.auctionEndTime)})
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

        <button
          onClick={() => {
            console.log("productId:", product.productId);
            navigate("/chat", {
              state: { sellerId: product.sellerId, productId: product.productId },
            });
          }}
        >
          1:1 채팅하기
        </button>


        <AuctionBox
          productId={product.productId}
          mergedBids={mergedBids}
          currentHighestBid={currentHighestBid}
          placeBid={handlePlaceBid}
        />
        {/* AR 모달 */}
        {showARModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={() => setShowARModal(false)}
          >
            <div
              style={{
                position: "relative",
                width: "90%",
                maxWidth: "800px",
                height: "80vh",
                backgroundColor: "#000",
                borderRadius: "12px",
                overflow: "hidden",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowARModal(false)}
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  border: "none",
                  borderRadius: "50%",
                  width: "40px",
                  height: "40px",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  zIndex: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ×
              </button>
              <AROverlayWithButton productId={product.productId} />
            </div>
          </div>
        )}
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
