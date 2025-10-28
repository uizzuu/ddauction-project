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
  const [imageLoaded, setImageLoaded] = useState<boolean[]>([false, false, false]);
  const [banners, setBanners] = useState([
    {
      id: 1,
      image: "/banner1.jpg",
      text: "지금 가장 인기 있는 경매 상품 🔥",
      productId: null as number | null,
    },
    { id: 2, image: "/banner2.jpg", text: "오늘의 추천! 신규 등록 상품 🎉", productId: null as number | null },
    { id: 3, image: "/banner3.jpg", text: "마감 임박! 마지막 기회를 잡으세요 ⚡", productId: null as number | null },
  ]);

  // 인기 상품 배너
  const fetchPopularProduct = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/top-bookmarked`);
      if (!res.ok) throw new Error("인기 상품 불러오기 실패");

      const popular: Product[] = await res.json();
      if (popular && popular.length > 0) {
        const top = popular[0];
        setBanners((prev) => [
          {
            ...prev[0],
            image: top.imageUrl || "/banner1.jpg",
            text: top.title,
            productId: top.productId,
          },
          prev[1],
          prev[2],
        ]);
      }
    } catch (err) {
      console.error("❌ 인기 상품 fetch 실패:", err);
    }
  };

  // 최신 등록 상품 배너
  const fetchLatestProduct = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/latest`);
      if (!res.ok) throw new Error("최신 상품 불러오기 실패");

      const latest: Product = await res.json();
      setBanners((prev) => [
        prev[0],
        {
          ...prev[1],
          image: latest.imageUrl || "/banner2.jpg",
          text: latest.title,
          productId: latest.productId,
        },
        prev[2],
      ]);
    } catch (err) {
      console.error("❌ 최신 상품 fetch 실패:", err);
    }
  };

  // 마감 임박 상품 배너
  const fetchEndingSoonProduct = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/ending-soon`);
      if (!res.ok) throw new Error("마감 임박 상품 불러오기 실패");

      const endingSoon: Product = await res.json();
      setBanners(prev => [
        prev[0],
        prev[1],
        { ...prev[2], image: endingSoon.imageUrl || "/banner3.jpg", text: endingSoon.title, productId: endingSoon.productId }
      ]);
    } catch (err) {
      console.error("❌ 마감 임박 상품 fetch 실패:", err);
    }
  };


  // 전체 상품 리스트
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/products`);
      if (!res.ok) throw new Error("상품 불러오기 실패");
      const data: Product[] = await res.json();
      const activeProducts = data.filter(p => p.productStatus === 'ACTIVE'); // 판매중만
      const sorted = activeProducts
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
    fetchPopularProduct();
    fetchLatestProduct();
    fetchEndingSoonProduct();
    fetchProducts();
  }, []);

  const handlePrev = () =>
    setCurrent((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  const handleNext = () =>
    setCurrent((prev) => (prev === banners.length - 1 ? 0 : prev + 1));

  // ✅ 자동 슬라이드 추가
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent(prev => (prev === banners.length - 1 ? 0 : prev + 1));
    }, 5000); // 5초마다 자동 이동

    return () => clearInterval(interval); // 컴포넌트 언마운트 시 정리
  }, [banners.length]);

  return (
    <div className="container">
      {/* 메인 배너 섹션 */}
      <div className="position-rl width-full height-500 overflow-hidden radius-32">
        <div
          className="flex-box width-full height-full trans duration-500"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {banners.map((b, i) => (
            <div
              key={i}
              className="banner-slide position-rl width-full height-500"
              onClick={() => b.productId && navigate(`/products/${b.productId}`)}
              style={{ cursor: b.productId ? "pointer" : "default" }}
            >
              {b.image ? (
                <>
                  <img
                    src={b.image}
                    alt={`배너 ${i + 1}`}
                    className="width-full height-500 object-cover"
                    style={{ display: imageLoaded[i] ? "block" : "none" }}
                    onLoad={() =>
                      setImageLoaded(prev => {
                        const copy = [...prev];
                        copy[i] = true;
                        return copy;
                      })
                    }
                    onError={() =>
                      setImageLoaded(prev => {
                        const copy = [...prev];
                        copy[i] = false;
                        return copy;
                      })
                    }
                  />
                  {!imageLoaded[i] && (
                    <div className="no-image-txt bg-333">이미지 로딩중...</div>
                  )}
                  <div className="filter-dark"></div>

                  {/* 텍스트 */}
                  <p className="color-fff title-24 z-10" style={{
                    position: "absolute",
                    bottom: "4rem",
                    left: "50%",
                    transform: "translateX(-50%)",
                    textAlign: "center",
                    textShadow: "0 2px 6px rgba(0,0,0,0.6)"
                  }}>
                    {i === 0
                      ? "지금 가장 인기 있는 경매 상품 🔥"
                      : i === 1
                        ? "오늘의 추천! 신규 등록 상품 🎉"
                        : "마감 임박! 마지막 기회를 잡으세요 ⚡"}
                  </p>
                  <p className="color-fff title-36 z-10" style={{
                    position: "absolute",
                    bottom: "2rem",
                    left: "50%",
                    transform: "translateX(-50%)",
                    textAlign: "center",
                    textShadow: "0 2px 6px rgba(0,0,0,0.6)"
                  }}>
                    {b.text}
                  </p>
                </>
              ) : (
                <div className="no-image-txt bg-333">이미지 없음</div>
              )}

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
            className={`width-8 height-8 radius-full transition-all ${i === current ? "bg-aaa" : "bg-ddd"
              }`}
          />
        ))}
      </div>

      {/* 상품 리스트 */}
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
                      <p className="text-16 color-777 text-nowrap">경매 등록가</p>
                      <p className="title-18 color-333 text-nowrap">
                        {formatPrice(p.startingPrice)}
                      </p>
                    </div>
                    {p.auctionEndTime && (
                      <>
                        <div className="flex-box gap-8">
                          <p className="text-16 color-777 text-nowrap">남은시간</p>
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
