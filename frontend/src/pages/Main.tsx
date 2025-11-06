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
  const [banners, setBanners] = useState<
    { id: number; image?: string; text: string; product?: Product }[]
  >([]);
  const [current, setCurrent] = useState(0);
  const [imageFailed, setImageFailed] = useState<boolean[]>([]);

  // 신상 상품 불러오기
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

  // 배너 상품 불러오기
  const fetchBannerProducts = async () => {
    try {
      const [topRes, latestRes, endingRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/products/top-bookmarked`),
        fetch(`${API_BASE_URL}/api/products/latest`),
        fetch(`${API_BASE_URL}/api/products/ending-soon`),
      ]);

      if (!topRes.ok || !latestRes.ok || !endingRes.ok) {
        throw new Error(
          `배너 API 중 하나가 실패했습니다. topRes: ${topRes.status}, latestRes: ${latestRes.status}, endingRes: ${endingRes.status}`
        );
      }

      const topData: Product[] = await topRes.json();
      const latestData: Product = await latestRes.json();
      const endingData: Product = await endingRes.json();

      setBanners([
        {
          id: 1,
          image: topData[0]?.images?.[0]?.imagePath || "/banner1.jpg",
          text: "지금 가장 인기 있는 경매 상품 🔥",
          product: topData[0],
        },
        {
          id: 2,
          image: latestData?.images?.[0]?.imagePath || "/banner2.jpg",
          text: "오늘의 추천! 신규 등록 상품 🎉",
          product: latestData,
        },
        {
          id: 3,
          image: endingData?.images?.[0]?.imagePath || "/banner3.jpg",
          text: "마감 임박! 마지막 기회를 잡으세요 ⚡",
          product: endingData,
        },
      ]);
    } catch (err) {
      console.error("배너 상품 불러오기 실패:", err);
    }
  };

  // 배너 데이터가 바뀔 때 imageFailed 초기화
  useEffect(() => {
    setImageFailed(new Array(banners.length).fill(false));
  }, [banners]);

  useEffect(() => {
    fetchProducts();
    fetchBannerProducts();
  }, []);

  const handlePrev = () =>
    setCurrent((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  const handleNext = () =>
    setCurrent((prev) => (prev === banners.length - 1 ? 0 : prev + 1));

  // 자동 슬라이드
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  return (
    <div className="container">
      {/* 메인 배너 */}
      <div className="position-rl width-full height-500 overflow-hidden radius-32">
        {banners.length === 0 ? (
          <>
            <div className="no-image-txt bg-333">이미지 없음</div>
            <p className="color-fff title-36 position-ab bottom-2rem left-2rem z-10">
              배너 텍스트
            </p>
          </>
        ) : (
          <>
            <div className="width-full height-full position-rl">
              {banners.map((b, i) => (
                <div
                  key={i}
                  className="banner-slide position-ab width-full height-500"
                  onClick={() =>
                    b.product && navigate(`/products/${b.product.productId}`)
                  }
                  style={{
                    cursor: b.product ? "pointer" : "default",
                    transform: `translateX(${(i - current) * 100}%)`,
                    transition: "transform 0.5s ease",
                  }}
                >
                  {b.image && !imageFailed[i] ? (
                    <>
                      <img
                        src={b.image}
                        alt={`배너 ${i + 1}`}
                        className="width-full height-full object-cover"
                        onError={() =>
                          setImageFailed((prev) => {
                            const copy = [...prev];
                            copy[i] = true;
                            return copy;
                          })
                        }
                      />
                      <div className="filter-dark"></div>
                    </>
                  ) : (
                    <div className="no-image-txt bg-333">이미지 없음</div>
                  )}
                  <p className="color-fff title-36 position-ab bottom-2rem left-2rem z-10">
                    {b.text}
                  </p>
                </div>
              ))}
            </div>

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
          </>
        )}
      </div>

      {/* 하단 인디케이터 */}
      <div className="mt-10 mb-60 width-full flex-box flex-center gap-4 z-20">
        {banners.length > 0 ? (
          banners.map((_, i) => (
            <div
              key={i}
              className={`width-8 height-8 radius-full transition-all ${
                i === current ? "bg-aaa" : "bg-ddd"
              }`}
            />
          ))
        ) : (
          <div style={{ height: "8px" }}></div> // 최소 높이 확보
        )}
      </div>

      {/* 신상 상품 영역 */}
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
                  {p.images && p.images.length > 0 && p.images[0]?.imagePath ? (
                    <img
                      src={p.images[0].imagePath}
                      alt={p.title}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/no-image.png";
                      }}
                    />
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
