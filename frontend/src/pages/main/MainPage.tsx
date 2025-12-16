import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product, Bid } from "../../common/types";
import { fetchLatestProducts } from "../../common/api";
import ProductCard from "../../components/ui/ProductCard";
import {
  Monitor, Refrigerator, Armchair, Utensils, Sandwich, Baby, Book, Pencil,
  Shirt, Watch, Sparkles, Dumbbell, Gamepad2, Ticket, Dog, Leaf, MoreHorizontal
} from "lucide-react";
import { PRODUCT_CATEGORIES, type ProductCategoryType } from "../../common/enums";
import "../../css/modules.css";
import { FastAverageColor } from "fast-average-color";
import banner1 from "../../assets/banners/banner1.png";
import banner2 from "../../assets/banners/banner2.png";
import banner3 from "../../assets/banners/banner3.png";
import banner4 from "../../assets/banners/banner4.png";

const CATEGORY_ICONS: Record<ProductCategoryType, React.ReactNode> = {
  ELECTRONICS: <Monitor size={24} />,
  APPLIANCES: <Refrigerator size={24} />,
  FURNITURE_INTERIOR: <Armchair size={24} />,
  KITCHENWARE: <Utensils size={24} />,
  FOODS: <Sandwich size={24} />,
  KIDS: <Baby size={24} />,
  BOOKS: <Book size={24} />,
  STATIONERY: <Pencil size={24} />,
  CLOTHING: <Shirt size={24} />,
  ACCESSORIES: <Watch size={24} />,
  BEAUTY: <Sparkles size={24} />,
  SPORTS: <Dumbbell size={24} />,
  ENTERTAINMENT: <Gamepad2 size={24} />,
  TICKETS: <Ticket size={24} />,
  PET: <Dog size={24} />,
  PLANTS: <Leaf size={24} />,
  ETC: <MoreHorizontal size={24} />
};

// Category Arrows
function CategoryNextArrow({ onClick, visible }: { onClick?: () => void; visible: boolean }) {
  if (!visible) return null;
  return (
    <button
      onClick={onClick}
      className="absolute top-1/2 -translate-y-1/2 right-0 xl:-right-12 z-10 p-2 text-gray-400 hover:text-black cursor-pointer transition-all bg-transparent rounded-full"
    >
      <ChevronRight size={28} />
    </button>
  );
}

function CategoryPrevArrow({ onClick, visible }: { onClick?: () => void; visible: boolean }) {
  if (!visible) return null;
  return (
    <button
      onClick={onClick}
      className="absolute top-1/2 -translate-y-1/2 left-0 xl:-left-12 z-10 p-2 text-gray-400 hover:text-black cursor-pointer transition-all bg-transparent rounded-full"
    >
      <ChevronLeft size={28} />
    </button>
  );
}

// Banner Arrows
function BannerNextArrow({ onClick, visible, isDark }: { onClick?: () => void; visible: boolean; isDark: boolean }) {
  return (
    <div
      onClick={onClick}
      className={`absolute top-1/2 -translate-y-1/2 right-4 z-10 transition-opacity duration-300 cursor-pointer ${visible ? "opacity-100" : "opacity-0"} pointer-events-auto`}
    >
      <ChevronRight size={48} color={isDark ? "white" : "#111"} />
    </div>
  );
}

function BannerPrevArrow({ onClick, visible, isDark }: { onClick?: () => void; visible: boolean; isDark: boolean }) {
  return (
    <div
      onClick={onClick}
      className={`absolute top-1/2 -translate-y-1/2 left-4 z-10 transition-opacity duration-300 cursor-pointer ${visible ? "opacity-100" : "opacity-0"} pointer-events-auto`}
    >
      <ChevronLeft size={48} color={isDark ? "white" : "#111"} />
    </div>
  );
}

export default function Main() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<
    { id: number; image?: string; text: string; product?: Product; link?: string }[]
  >([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [bannerBrightness, setBannerBrightness] = useState<Record<number, "dark" | "light">>({});
  const [isBannerHovered, setIsBannerHovered] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
  };

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 300;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth"
    });
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const latestProducts = await fetchLatestProducts();
        setProducts(latestProducts.slice(0, 6));

        // 정적 배너 설정
        const staticBanners = [
          { id: 1, image: banner1, text: "AI 챗봇으로 간편하게 문의", link: "/chat" },
          { id: 2, image: banner2, text: "경매 입찰내역을 실시간 그래프로!", link: "/products?type=AUCTION" },
          { id: 3, image: banner3, text: "쾌적한 쇼핑을 위한 리뷰 서비스 제공", link: "/products?type=STORE" },
          { id: 4, image: banner4, text: "땅땅옥션 12월 이벤트 - 100% 당첨 매일 랜덤 포인트", link: "/event" }
        ];

        setBanners(staticBanners);
        analyzeBannerColors(staticBanners);
      } catch (err) {
        console.error(err);
        setProducts([]);
        setBanners([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const analyzeBannerColors = async (items: typeof banners) => {
    const fac = new FastAverageColor();
    const brightnessMap: Record<number, "dark" | "light"> = {};

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.image) {
        brightnessMap[i] = "light";
        continue;
      }
      try {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = item.image;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        const color = await fac.getColorAsync(img);
        brightnessMap[i] = color.isDark ? "dark" : "light";
      } catch (e) {
        console.warn("Failed to analyze banner color", e);
        brightnessMap[i] = "dark";
      }
    }
    setBannerBrightness(brightnessMap);
    fac.destroy();
  };

  const isCurrentDark = bannerBrightness[currentSlide] === "dark";

  const bannerSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    nextArrow: <BannerNextArrow visible={isBannerHovered} isDark={isCurrentDark} />,
    prevArrow: <BannerPrevArrow visible={isBannerHovered} isDark={isCurrentDark} />,
    beforeChange: (_: number, next: number) => setCurrentSlide(next),
  };

  return (
    <div className="w-full containerr">
      {/* Banner Section */}
      <div className="w-full mb-6 px-4 xl:px-0">
        <div
          className="w-full max-w-[1280px] mx-auto relative group rounded-[12px] overflow-hidden px-0"
          onMouseEnter={() => setIsBannerHovered(true)}
          onMouseLeave={() => setIsBannerHovered(false)}
        >
          {banners.length > 0 ? (
            <>
              <Slider {...bannerSettings} className="h-full">
                {banners.map((b, i) => (
                  <div key={i} className="h-[120px] md:h-[240px] xl:h-[380px] outline-none">
                    <div
                      className="w-full h-full cursor-pointer relative rounded-[12px] overflow-hidden"
                    // onClick={() => {
                    //   if (b.product) {
                    //     navigate(`/products/${b.product.productId}`);
                    //   } else if (b.link) {
                    //     navigate(b.link);
                    //   }
                    // }}
                    >
                      {b.image && <img src={b.image} alt={`Banner ${b.id}`} className="w-full h-full object-cover" />}
                    </div>
                  </div>
                ))}
              </Slider>
              <div className="absolute bottom-3 right-2 xl:bottom-6 xl:right-6 bg-black/40 backdrop-blur-md px-2 py-0.5 xl:px-4 xl:py-1.5 rounded-full text-white text-[10px] xl:text-xs font-medium z-20 tracking-widest">
                {currentSlide + 1} / {banners.length}
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#999]">배너 준비중</div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-[1280px] mx-auto px-4 xl:px-0 mt-0">
        {/* Category Shortcuts */}
        <section className="mb-20 relative w-fit mx-auto max-w-full">
          <CategoryPrevArrow onClick={() => scroll("left")} visible={showLeftArrow} />
          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex gap-4 overflow-x-auto scroll-smooth category-scroll-container scrollbar-hide py-2"
          >
            {(Object.keys(PRODUCT_CATEGORIES) as ProductCategoryType[]).map((cat) => (
              <div
                key={cat}
                className="category flex flex-col items-center gap-2 cursor-pointer w-[60px] md:w-[80px] flex-shrink-0 group/cat"
                onClick={() => navigate(`/search?category=${cat}`)}
              >
                <div className="w-[60px] h-[60px] md:w-[80px] md:h-[80px] rounded-[12px] bg-[#f8f9fa] flex items-center justify-center text-[#333] transition-all duration-300 ease-out group-hover/cat:bg-white group-hover/cat:shadow-[0_8px_20px_rgba(0,0,0,0.08)] group-hover/cat:-translate-y-[2px] group-hover/cat:text-black border border-transparent group-hover/cat:border-[#eee]">
                  {CATEGORY_ICONS[cat]}
                </div>
                <span className="text-[12px] md:text-[14px] text-[#333] font-medium text-center whitespace-nowrap group-hover/cat:font-semibold">
                  {PRODUCT_CATEGORIES[cat]}
                </span>
              </div>
            ))}
          </div>
          <CategoryNextArrow onClick={() => scroll("right")} visible={showRightArrow} />
        </section>

        {/* Just Dropped */}
        <section className="mb-20">
          <div className="main-section-header">
            <div>
              <h2 className="main-section-title">Just Dropped</h2>
              <p className="text-[#666] -mt-[6px]">발매된 지 얼마 안 된 따끈따끈한 신상</p>
            </div>
            <button onClick={() => navigate("/search?sort=latest")} className="text-[#666] hover:text-[#333] transition-colors">
              더보기
            </button>
          </div>

          {loading ? (
            <div className="h-60 flex items-center justify-center text-[#999]">로딩중...</div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-8">
              {products.map(p => {
                let mergedBids: Bid[] = [];
                let highestBid = 0;
                if (p.productType === "AUCTION") {
                  mergedBids = p.bids ?? [];
                  // ⭐ 입찰이 없으면 시작가를 현재가로 사용
                  highestBid = mergedBids.length > 0
                    ? Math.max(...mergedBids.map(b => b.bidPrice))
                    : (Number(p.startingPrice) || 0);
                }

                return (
                  <ProductCard
                    key={p.productId}
                    product={p}
                    mergedBids={mergedBids}
                    highestBid={highestBid}
                  />
                );
              })}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-[#999]">등록된 상품이 없습니다.</div>
          )}
        </section>

        {/* Most Popular */}
        <section className="mb-20">
          <div className="main-section-header">
            <div>
              <h2 className="main-section-title">Most Popular</h2>
              <p className="text-[#666] -mt-[6px]">지금 가장 인기 있는 상품</p>
            </div>
            <button onClick={() => navigate("/rank")} className="text-[#666] hover:text-[#333] transition-colors">
              더보기
            </button>
          </div>
          {loading ? (
            <div className="h-60 flex items-center justify-center text-[#999]">로딩중...</div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-8">
              {[...products].reverse().slice(0, 6).map(p => {
                let mergedBids: Bid[] = [];
                let highestBid = 0;
                if (p.productType === "AUCTION") {
                  mergedBids = p.bids ?? [];
                  highestBid = mergedBids.length > 0 ? Math.max(...mergedBids.map(b => b.bidPrice)) : 0;
                }

                return (
                  <ProductCard
                    key={p.productId}
                    product={p}
                    mergedBids={mergedBids}
                    highestBid={highestBid}
                  />
                );
              })}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-[#999]">등록된 상품이 없습니다.</div>
          )}
        </section>
      </div>
    </div>
  );
}
