import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "../../common/types";
import { fetchLatestProducts, fetchBannerProducts } from "../../common/api";
import ProductCard from "../../components/ui/ProductCard";
import {
  Monitor, Refrigerator, Armchair, Utensils, Sandwich, Baby, Book, Pencil,
  Shirt, Watch, Sparkles, Dumbbell, Gamepad2, Ticket, Dog, Leaf, MoreHorizontal
} from "lucide-react";
import { PRODUCT_CATEGORIES, type ProductCategoryType } from "../../common/enums";
import "../../css/modules.css";
import { FastAverageColor } from "fast-average-color";

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

// 카테고리용 깔끔한 화살표 (배너 스타일과 유사한 심플함, 하지만 배경에 맞게 컬러 조정)
function CategoryNextArrow({ onClick, visible }: { onClick?: () => void; visible: boolean }) {
  if (!visible) return null;
  return (
    <button
      onClick={onClick}
      className="absolute top-1/2 -translate-y-1/2 -right-12 z-10 p-2 text-gray-400 hover:text-black cursor-pointer transition-all"
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
      className="absolute top-1/2 -translate-y-1/2 -left-12 z-10 p-2 text-gray-400 hover:text-black cursor-pointer transition-all"
    >
      <ChevronLeft size={28} />
    </button>
  );
}

// 배너용 화살표 (Hover Zone 방식 - 독립적인 hover - 50% Split)
function BannerNextArrow({ onClick, visible, isDark }: { onClick?: () => void; visible: boolean; isDark: boolean }) {
  return (
    <div
      onClick={onClick}
      className={`absolute top-0 bottom-0 right-0 w-[50%] z-10 flex items-center justify-end pr-4 transition-opacity duration-300 cursor-pointer ${visible ? "opacity-100" : "opacity-0"
        }`}
    >
      <ChevronRight size={48} color={isDark ? "white" : "#111"} />
    </div>
  );
}

function BannerPrevArrow({ onClick, visible, isDark }: { onClick?: () => void; visible: boolean; isDark: boolean }) {
  return (
    <div
      onClick={onClick}
      className={`absolute top-0 bottom-0 left-0 w-[50%] z-10 flex items-center justify-start pl-4 transition-opacity duration-300 cursor-pointer ${visible ? "opacity-100" : "opacity-0"
        }`}
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

  // Native Scroll Refs & State
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 0);
    // 1px tolerance
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
  };

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 300; // 300px 씩 스크롤
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
        const bannerData = await fetchBannerProducts();
        setBanners(bannerData);
        analyzeBannerColors(bannerData);
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
        brightnessMap[i] = "light"; // Default
        continue;
      }
      try {
        // 이미지 로드 후 분석
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = item.image;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        const color = await fac.getColorAsync(img);
        // isDark: true if background is dark -> text should be white
        // isLight: true if background is light -> text should be black
        brightnessMap[i] = color.isDark ? "dark" : "light";
      } catch (e) {
        console.warn("Failed to analyze banner color", e);
        brightnessMap[i] = "dark"; // Fallback to white text
      }
    }
    setBannerBrightness(brightnessMap);
  };

  // Mouse Move Handler for Split Hover
  const [hoverSide, setHoverSide] = useState<"left" | "right" | null>(null);

  const handleBannerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - left;
    if (x < width / 2) {
      setHoverSide("left");
    } else {
      setHoverSide("right");
    }
  };

  const handleBannerMouseLeave = () => {
    setHoverSide(null);
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
    nextArrow: <BannerNextArrow visible={hoverSide === "right"} isDark={isCurrentDark} />,
    prevArrow: <BannerPrevArrow visible={hoverSide === "left"} isDark={isCurrentDark} />,
    beforeChange: (_: number, next: number) => setCurrentSlide(next),
  };

  return (
    <div className="w-full bg-white pb-20">
      {/* 1. Banner Section (Fixed Size, Rounded) */}
      <div className="w-full mb-10 mt-10">
        <div
          className="w-full max-w-[1280px] mx-auto h-[400px] relative group rounded-[12px] overflow-hidden bg-[#f4f4f4]"
          onMouseMove={handleBannerMouseMove}
          onMouseLeave={handleBannerMouseLeave}
        >
          {banners.length > 0 ? (
            <>
              <Slider {...bannerSettings} className="h-full">
                {banners.map((b, i) => (
                  <div key={i} className="h-[400px] outline-none">
                    <div
                      className="w-full h-full cursor-pointer relative bg-[#333]"
                      onClick={() => {
                        if (b.product) {
                          navigate(`/products/${b.product.productId}`);
                        } else if (b.link) {
                          navigate(b.link);
                        } else {
                          console.warn("Banner has no linked product or URL:", b);
                        }
                      }}
                    >
                      {b.image && (
                        <img
                          src={b.image}
                          alt={b.text}
                          className="w-full h-full object-cover"
                        />
                      )}
                      {/* Banner Text Overlay (Always visible) */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                      <div className="absolute bottom-12 left-10 text-white z-10 text-left">
                        <h3 className="text-3xl font-bold drop-shadow-md mb-2">{b.text}</h3>
                        <p className="text-sm font-light opacity-90 tracking-wider">
                          {b.product ? "지금 바로 구경하기 →" : "자세히 보기 →"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </Slider>
              {/* Pagination Indicator */}
              <div className="absolute bottom-6 right-6 bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full text-white text-xs font-medium z-20 tracking-widest">
                {currentSlide + 1} / {banners.length}
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#999]">
              배너 준비중
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="containerr mx-auto md:px-0 mt-0">

        {/* 2. Category Shortcuts (Slider) */}
        <section className="mb-20 relative w-fit mx-auto max-w-full">
          <CategoryPrevArrow onClick={() => scroll("left")} visible={showLeftArrow} />

          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex gap-4 overflow-x-auto scroll-smooth category-scroll-container"
          >
            {(Object.keys(PRODUCT_CATEGORIES) as ProductCategoryType[]).map((cat) => (
              <div
                key={cat}
                className="category flex flex-col items-center gap-2 cursor-pointer w-[80px] flex-shrink-0 group/cat"
                onClick={() => navigate(`/search?category=${cat}`)}
              >
                <div className="w-[80px] h-[80px] rounded-[12px] bg-[#f8f9fa] flex items-center justify-center text-[#333] transition-all duration-300 ease-out group-hover/cat:bg-white group-hover/cat:shadow-[0_8px_20px_rgba(0,0,0,0.08)] group-hover/cat:-translate-y-[2px] group-hover/cat:text-black border border-transparent group-hover/cat:border-[#eee]">
                  {CATEGORY_ICONS[cat]}
                </div>
                <span className="text-[14px] text-[#333] font-medium text-center whitespace-nowrap group-hover/cat:font-semibold">
                  {PRODUCT_CATEGORIES[cat]}
                </span>
              </div>
            ))}
          </div>

          <CategoryNextArrow onClick={() => scroll("right")} visible={showRightArrow} />
        </section>

        {/* 3. Just Dropped */}
        <section className="mb-20">
          <div className="main-section-header">
            <div>
              <h2 className="main-section-title">Just Dropped</h2>
              <p className="text-[#666] -mt-[6px]">발매된 지 얼마 안 된 따끈따끈한 신상</p>
            </div>
            <button
              onClick={() => navigate("/search?sort=latest")}
              className="text-[#666] hover:text-[#333] transition-colors"
            >
              더보기
            </button>
          </div>

          {loading ? (
            <div className="h-60 flex items-center justify-center text-[#999]">로딩중...</div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-8">
              {products.map(p => (
                <ProductCard key={p.productId} product={p} />
              ))}
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
            <button
              onClick={() => navigate("/rank")}
              className="text-[#666] hover:text-[#333] transition-colors"
            >
              더보기
            </button>
          </div>
          {loading ? (
            <div className="h-60 flex items-center justify-center text-[#999]">로딩중...</div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-8">
              {[...products].reverse().slice(0, 6).map(p => (
                <ProductCard key={p.productId} product={p} />
              ))}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-[#999]">등록된 상품이 없습니다.</div>
          )}
        </section>
      </div>
    </div>
  );
}
