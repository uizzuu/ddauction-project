import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { API_BASE_URL } from "../services/api";
import type { Product } from "../types/types";
import { formatDateTime, formatPrice, formatDate } from "../utils/util";

export default function Main() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [current, setCurrent] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/products`);
      if (!res.ok) throw new Error("상품 불러오기 실패");
      const data: Product[] = await res.json();
      const sorted = data
        .sort(
          (a, b) =>
            new Date(b.createdAt || "").getTime() -
            new Date(a.createdAt || "").getTime()
        )
        .slice(0, 10);
      setProducts(sorted);
    } catch (err) {
      console.error("❌ 상품 검색 중 오류 발생:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // 배너 슬라이드 데이터
  const banners = [
    {
      id: 1,
      image: "/banner1.jpg",
      text: "지금 가장 인기 있는 경매 상품 🔥",
      productId: 1,
    },
    {
      id: 2,
      image: "/banner2.jpg",
      text: "오늘의 추천! 신규 등록 상품 🎉",
      productId: 2,
    },
    {
      id: 3,
      image: "/banner3.jpg",
      text: "마감 임박! 마지막 기회를 잡으세요 ⚡",
      productId: 3,
    },
  ];

  useEffect(() => {
    setImageFailed(false);
  }, [current]);

  const handlePrev = () =>
    setCurrent((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  const handleNext = () =>
    setCurrent((prev) => (prev === banners.length - 1 ? 0 : prev + 1));

  // ✅ 자동 슬라이드 기능만 추가
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    }, 5000); // 5초마다 이동

    return () => clearInterval(interval); // 컴포넌트 언마운트 시 정리
  }, [banners.length]);

  return (
    <div className="container">
      {/* ✅ 메인 배너 섹션 */}
      <div className="position-rl width-full height-500 overflow-hidden radius-32">
        <div
          className="flex-box width-full height-full trans duration-500"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {banners.map((b, i) => (
            <div
              key={i}
              className="banner-slide position-rl width-full height-500"
              onClick={() =>
                b.productId && navigate(`/products/${b.productId}`)
              }
              style={{ cursor: b.productId ? "pointer" : "default" }}
            >
              {b.image && !imageFailed ? (
                <>
                  <img
                    src={b.image}
                    alt={`배너 ${i + 1}`}
                    className="width-full height-500 object-cover"
                    onError={() => setImageFailed(true)}
                    onLoad={() => setImageFailed(false)}
                  />
                  <div className="filter-dark"></div>
                </>
              ) : (
                <div className="no-image-txt bg-333">이미지 없음</div>
              )}

              {/* 텍스트 */}
              <p className="color-fff title-36 position-ab bottom-2rem left-2rem z-10">
                {b.text}
              </p>
            </div>
          ))}
        </div>

        {/* 좌우 버튼 */}
        <button
          onClick={handlePrev}
          className="position-ab left-16 top-half color-fff trans bg-transparent z-20"
        >
          <ChevronLeft size={32} />
        </button>
        <button
          onClick={handleNext}
          className="position-ab right-16 top-half color-fff trans bg-transparent z-20"
        >
          <ChevronRight size={32} />
        </button>
      </div>

      {/* 하단 인디케이터 */}
      <div className="mt-10 mb-60 width-full flex-box flex-center gap-4 z-20">
        {banners.map((_, i) => (
          <div
            key={i}
            className={`width-8 height-8 radius-full transition-all ${
              i === current ? "bg-aaa" : "bg-ddd"
            }`}
          />
        ))}
      </div>

      <div className="product-area">
        <div className="flex-box flex-between flex-end mb-20">
          <div>
            <p className="title-24 mb-4">지금 올라온 따끈따끈 신상</p>
            <p className="title-18">매일 업데이트되는 상품들을 만나보세요🔥</p>
          </div>
          <p
            className="title-18 color-aaa hover"
            onClick={() => navigate("/search")}
          >
            더보기
          </p>
        </div>
        {loading ? (
          <p className="no-content-text">불러오는 중...</p>
        ) : products.length > 0 ? (
          <div className="main-grid">
            {products.map((p) => (
              <div
                key={p.productId}
                className="product-card"
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/products/${p.productId}`)}
              >
                <div className="product-image height-220">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.title} />
                  ) : (
                    <div className="no-image-txt">이미지 없음</div>
                  )}
                </div>
                <div className="product-info flex-column gap-4">
                  <h3 className="title-20 mb-4 text-nowrap color-333 text-ellipsis">
                    {p.title}
                  </h3>
                  <div>
                    <div className="flex-box gap-8">
                      <p className="text-16 color-777 text-nowrap">
                        경매 등록가
                      </p>
                      <p className="title-18 color-333 text-nowrap">
                        {formatPrice(p.startingPrice)}
                      </p>
                    </div>
                    {p.auctionEndTime && (
                      <>
                        <div className="flex-box gap-8">
                          <p className="text-16 color-777 text-nowrap">
                            남은시간
                          </p>
                          <p className="text-16 color-777 text-nowrap">
                            <span className="title-18 color-333 text-nowrap">
                              {formatDate(p.auctionEndTime)}
                            </span>
                          </p>
                        </div>
                        <p className="text-16 color-777 text-nowrap">
                          ({formatDateTime(p.auctionEndTime)})
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-content-text">검색 결과가 없습니다.</p>
        )}
      </div>
    </div>
  );
}
