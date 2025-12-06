import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "../../common/types";
import { formatDateTime, formatPrice, formatDate } from "../../common/util";
import { fetchLatestProducts, fetchBannerProducts } from "../../common/api";
import {
  Monitor, Refrigerator, Armchair, Utensils, Sandwich, Baby, Book, Pencil,
  Shirt, Watch, Sparkles, Dumbbell, Gamepad2, Ticket, Dog, Leaf, MoreHorizontal
} from "lucide-react";
import { PRODUCT_CATEGORY_LABELS, type ProductCategoryType } from "../../common/enums";

const CATEGORY_ICONS: Record<ProductCategoryType, React.ReactNode> = {
  ELECTRONICS: <Monitor size={28} />,
  APPLIANCES: <Refrigerator size={28} />,
  FURNITURE_INTERIOR: <Armchair size={28} />,
  KITCHENWARE: <Utensils size={28} />,
  FOODS: <Sandwich size={28} />,
  KIDS: <Baby size={28} />,
  BOOKS: <Book size={28} />,
  STATIONERY: <Pencil size={28} />,
  CLOTHING: <Shirt size={28} />,
  ACCESSORIES: <Watch size={28} />,
  BEAUTY: <Sparkles size={28} />,
  SPORTS: <Dumbbell size={28} />,
  ENTERTAINMENT: <Gamepad2 size={28} />,
  TICKETS: <Ticket size={28} />,
  PET: <Dog size={28} />,
  PLANTS: <Leaf size={28} />,
  ETC: <MoreHorizontal size={28} />
};

export default function Main() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<
    { id: number; image?: string; text: string; product?: Product }[]
  >([]);
  const [current, setCurrent] = useState(0);
  const [imageFailed, setImageFailed] = useState<boolean[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const latestProducts = await fetchLatestProducts();
        setProducts(latestProducts);
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

  useEffect(() => {
    setImageFailed(new Array(banners.length).fill(false));
  }, [banners]);

  const handlePrev = () =>
    setCurrent((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  const handleNext = () =>
    setCurrent((prev) => (prev === banners.length - 1 ? 0 : prev + 1));

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  return (
    <div className="container mx-auto py-8 min-h-[calc(100vh-120px)]">
      {/* 메인 배너 */}
      <div className="relative w-full h-[500px] overflow-hidden rounded-[32px]">
        {banners.length === 0 ? (
          <>
            <div className="flex justify-center items-center w-full h-full bg-[#333] text-[#666] text-sm">이미지 없음</div>
            <p className="absolute bottom-8 left-8 text-white text-[36px] font-bold z-10">
              배너 텍스트
            </p>
          </>
        ) : (
          <>
            <div className="relative w-full h-full">
              {banners.map((b, i) => (
                <div
                  key={i}
                  className="absolute top-0 left-0 w-full h-[500px] z-0"
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
                        className="w-full h-full object-cover"
                        onError={() =>
                          setImageFailed((prev) => {
                            const copy = [...prev];
                            copy[i] = true;
                            return copy;
                          })
                        }
                      />
                      <div className="absolute inset-0 bg-black/40 z-10 pointer-events-none"></div>
                    </>
                  ) : (
                    <div className="flex justify-center items-center w-full h-full bg-[#333] text-[#666] text-sm">이미지 없음</div>
                  )}
                  <p className="absolute bottom-8 left-8 text-white text-[36px] font-bold z-10">
                    {b.text}
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-transparent transition-all duration-300 z-20 hover:text-[#b17576]"
            >
              <ChevronLeft size={32} />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-transparent transition-all duration-300 z-20 hover:text-[#b17576]"
            >
              <ChevronRight size={32} />
            </button>
          </>
        )}
      </div>

      {/* 하단 인디케이터 */}
      <div className="mt-2.5 mb-[60px] w-full flex justify-center items-center gap-1 z-20">
        {banners.length > 0 ? (
          banners.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${i === current ? "bg-[#aaa]" : "bg-[#ddd]"
                }`}
            />
          ))
        ) : (
          <div style={{ height: "8px" }}></div> // 최소 높이 확보
        )}
      </div>

      {/* 카테고리 네비게이션 (아이콘) */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[#333]">카테고리별 상품 찾기</h2>
        </div>
        <div className="flex overflow-x-auto gap-4 scrollbar-hide pb-4">
          {(Object.keys(PRODUCT_CATEGORY_LABELS) as ProductCategoryType[]).map((cat) => (
            <div
              key={cat}
              className="flex flex-col items-center gap-2 cursor-pointer group flex-shrink-0 w-[80px]"
              onClick={() => navigate(`/search?category=${cat}`)}
            >
              <div className="w-16 h-16 rounded-2xl bg-[#f8f9fa] flex items-center justify-center text-[#555] group-hover:bg-[#f0f0f0] group-hover:text-[#b17576] transition-all duration-300 shadow-sm border border-[#eee]">
                {CATEGORY_ICONS[cat]}
              </div>
              <span className="text-xs text-[#333] font-medium group-hover:text-[#b17576] transition-colors whitespace-nowrap">
                {PRODUCT_CATEGORY_LABELS[cat]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 신상 상품 영역 */}
      <div className="w-full">
        <div className="flex justify-between items-end mb-5">
          <div>
            <p className="text-2xl font-bold mb-1">지금 올라온 따끈따끈 신상</p>
            <p className="text-lg font-semibold">매일 업데이트되는 상품들을 만나보세요🔥</p>
          </div>
          <p
            className="text-lg font-semibold text-[#aaa] cursor-pointer hover:text-[#b17576] transition-colors"
            onClick={() => navigate("/search")}
          >
            더보기
          </p>
        </div>
        {loading ? (
          <p className="text-[#aaa] text-lg text-center py-10">불러오는 중...</p>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-4 gap-6">
            {products.map((p) => (
              <div
                key={p.productId}
                className="flex flex-col gap-4 group cursor-pointer"
                onClick={() => navigate(`/products/${p.productId}`)}
              >
                <div className="w-full bg-[#eee] overflow-hidden relative h-[220px] rounded-2xl">
                  {p.images && p.images.length > 0 && p.images[0]?.imagePath ? (
                    <img
                      src={p.images[0].imagePath}
                      alt={p.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      onError={(e) => {
                        // 이미지 깨지면 no-image div로 대체
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.innerHTML =
                            '<div class="flex justify-center items-center w-full h-full text-[#666] text-sm">이미지 없음</div>';
                        }
                      }}
                    />
                  ) : (
                    <div className="flex justify-center items-center w-full h-full text-[#666] text-sm">이미지 없음</div>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-xl font-semibold mb-1 whitespace-nowrap text-[#333] truncate">
                    {p.title}
                  </h3>
                  <div>
                    <div className="flex gap-2">
                      <p className="text-base text-[#777] whitespace-nowrap">
                        경매 등록가
                      </p>
                      <p className="text-lg font-semibold text-[#333] whitespace-nowrap">
                        {formatPrice(p.startingPrice)}
                      </p>
                    </div>
                    {p.auctionEndTime && (
                      <>
                        <div className="flex gap-2">
                          <p className="text-base text-[#777] whitespace-nowrap">
                            남은시간
                          </p>
                          <p className="text-base text-[#777] whitespace-nowrap">
                            <span className="text-lg font-semibold text-[#333] whitespace-nowrap">
                              {formatDate(p.auctionEndTime)}
                            </span>
                          </p>
                        </div>
                        <p className="text-base text-[#777] whitespace-nowrap">
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
          <p className="text-[#aaa] text-lg text-center py-10">검색 결과가 없습니다.</p>
        )}
      </div>
    </div>
  );
}
