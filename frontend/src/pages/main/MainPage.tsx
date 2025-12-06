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
import { PRODUCT_CATEGORY_LABELS, type ProductCategoryType } from "../../common/enums";
import "../../css/modules.css";

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
function CategoryNextArrow(props: any) {
  const { className, onClick } = props;
  const isDisabled = className?.includes("slick-disabled");
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`absolute top-1/2 -translate-y-1/2 -right-10 z-10 p-2 transition-all ${isDisabled ? "text-[#eee] cursor-default" : "text-gray-400 hover:text-black cursor-pointer"
        }`}
    >
      <ChevronRight size={28} />
    </button>
  );
}

function CategoryPrevArrow(props: any) {
  const { className, onClick } = props;
  const isDisabled = className?.includes("slick-disabled");
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`absolute top-1/2 -translate-y-1/2 -left-10 z-10 p-2 transition-all ${isDisabled ? "text-[#eee] cursor-default" : "text-gray-400 hover:text-black cursor-pointer"
        }`}
    >
      <ChevronLeft size={28} />
    </button>
  );
}

// 배너용 화살표 (Hover Zone 방식 - 독립적인 hover)
function BannerNextArrow(props: any) {
  const { onClick } = props;
  return (
    <div
      onClick={onClick}
      className="absolute top-0 bottom-0 right-0 w-[80px] z-10 flex items-center justify-center transition-opacity opacity-0 hover:opacity-100 cursor-pointer"
    >
      <ChevronRight size={48} className="text-white drop-shadow-lg" />
    </div>
  );
}

function BannerPrevArrow(props: any) {
  const { onClick } = props;
  return (
    <div
      onClick={onClick}
      className="absolute top-0 bottom-0 left-0 w-[80px] z-10 flex items-center justify-center transition-opacity opacity-0 hover:opacity-100 cursor-pointer"
    >
      <ChevronLeft size={48} className="text-white drop-shadow-lg" />
    </div>
  );
}

export default function Main() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<
    { id: number; image?: string; text: string; product?: Product }[]
  >([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const latestProducts = await fetchLatestProducts();
        setProducts(latestProducts.slice(0, 4));
        const bannerData = await fetchBannerProducts();
        setBanners(bannerData);
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

  const bannerSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    nextArrow: <BannerNextArrow />,
    prevArrow: <BannerPrevArrow />,
    beforeChange: (_: number, next: number) => setCurrentSlide(next),
  };

  const categorySettings = {
    dots: false,
    infinite: false, // 👈 순환 끔
    speed: 500,
    variableWidth: true,
    slidesToScroll: 5,
    nextArrow: <CategoryNextArrow />,
    prevArrow: <CategoryPrevArrow />,
  };

  return (
    <div className="w-full bg-white pb-20">
      {/* 1. Banner Section (Fixed Size, Rounded) */}
      <div className="w-full mb-12 mt-6">
        <div className="w-full max-w-[1280px] mx-auto h-[400px] relative group rounded-[12px] overflow-hidden bg-[#f4f4f4]">
          {banners.length > 0 ? (
            <>
              <Slider {...bannerSettings} className="h-full">
                {banners.map((b, i) => (
                  <div key={i} className="h-[400px] outline-none">
                    <div
                      className="w-full h-full cursor-pointer relative"
                      onClick={() => b.product && navigate(`/products/${b.product.productId}`)}
                    >
                      {b.image ? (
                        <img
                          src={b.image}
                          alt={b.text}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#333] flex items-center justify-center text-white">
                          <span className="text-2xl font-bold">{b.text || "배너"}</span>
                        </div>
                      )}
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
      <div className="container mx-auto px-4 md:px-0">

        {/* 2. Category Shortcuts (Slider) */}
        <section className="mb-16">
          <div className="relative w-fit mx-auto max-w-full">
            <Slider {...categorySettings}>
              {(Object.keys(PRODUCT_CATEGORY_LABELS) as ProductCategoryType[]).map((cat) => (
                <div key={cat} className="outline-none pr-4">
                  <div
                    className="category flex flex-col items-center gap-2 cursor-pointer w-[80px]"
                    onClick={() => navigate(`/search?category=${cat}`)}
                  >
                    <div className="w-[80px] h-[80px] rounded-[12px] bg-[#f4f4f4] flex items-center justify-center text-[#333] transition-colors group-hover:bg-[#f0f0f0]">
                      {CATEGORY_ICONS[cat]}
                    </div>
                    <span className="text-[14px] text-[#333] font-medium text-center whitespace-nowrap group-hover:font-semibold">
                      {PRODUCT_CATEGORY_LABELS[cat]}
                    </span>
                  </div>
                </div>
              ))}
            </Slider>
          </div>
        </section>

        {/* 3. Just Dropped */}
        <section className="mb-20">
          <div className="kream-section-header">
            <div>
              <h2 className="kream-section-title">Just Dropped</h2>
              <p className="text-sm text-[#888]">발매된 지 얼마 안 된 따끈따끈한 신상</p>
            </div>
            <button
              onClick={() => navigate("/search")}
              className="text-sm text-[#888] hover:text-[#333] font-medium transition-colors"
            >
              더보기
            </button>
          </div>

          {loading ? (
            <div className="h-60 flex items-center justify-center text-[#999]">로딩중...</div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8">
              {products.map(p => (
                <ProductCard key={p.productId} product={p} />
              ))}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-[#999]">등록된 상품이 없습니다.</div>
          )}
        </section>

        {/* 4. Most Popular */}
        <section className="mb-20">
          <div className="kream-section-header">
            <div>
              <h2 className="kream-section-title">Most Popular</h2>
              <p className="text-sm text-[#888]">지금 가장 인기 있는 상품</p>
            </div>
            <button
              onClick={() => navigate("/search?sort=popularity")}
              className="text-sm text-[#888] hover:text-[#333] font-medium transition-colors"
            >
              더보기
            </button>
          </div>
          {loading ? (
            <div className="h-60 flex items-center justify-center text-[#999]">로딩중...</div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8">
              {[...products].reverse().slice(0, 4).map(p => (
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
