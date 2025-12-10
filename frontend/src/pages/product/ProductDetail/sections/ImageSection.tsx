import React, { useState, useEffect } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "../../../../common/types";
import { API_BASE_URL } from "../../../../common/api";
import { FastAverageColor } from "fast-average-color";

function ImageNextArrow({ onClick, visible, isDark }: { onClick?: () => void; visible: boolean; isDark: boolean }) {
    return (
        <div
            onClick={onClick}
            className={`absolute top-0 bottom-0 right-0 w-[50%] z-10 flex items-center justify-end pr-4 transition-opacity duration-300 cursor-pointer ${visible ? "opacity-100" : "opacity-0"
                }`}
        >
            <ChevronRight size={32} color={isDark ? "white" : "#111"} />
        </div>
    );
}

function ImagePrevArrow({ onClick, visible, isDark }: { onClick?: () => void; visible: boolean; isDark: boolean }) {
    return (
        <div
            onClick={onClick}
            className={`absolute top-0 bottom-0 left-0 w-[50%] z-10 flex items-center justify-start pl-4 transition-opacity duration-300 cursor-pointer ${visible ? "opacity-100" : "opacity-0"
                }`}
        >
            <ChevronLeft size={32} color={isDark ? "white" : "#111"} />
        </div>
    );
}

interface ImageSectionProps {
    product: Product;
    setShowARModal: (show: boolean) => void;
}

export const ImageSection: React.FC<ImageSectionProps> = ({ product, setShowARModal }) => {
    const [hoverSide, setHoverSide] = useState<"left" | "right" | null>(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [brightnessMap, setBrightnessMap] = useState<Record<number, "dark" | "light">>({});

    useEffect(() => {
        if (product.images?.length) {
            analyzeImages(product.images);
        }
    }, [product.images]);

    const analyzeImages = async (images: any[]) => {
        const fac = new FastAverageColor();
        const map: Record<number, "dark" | "light"> = {};

        for (let i = 0; i < images.length; i++) {
            try {
                const rawPath = images[i].imagePath.startsWith('http')
                    ? images[i].imagePath
                    : `${API_BASE_URL}${images[i].imagePath}`;

                // 캐시 버스팅 추가
                const imgPath = `${rawPath}?v=${new Date().getTime()}`;

                const img = new Image();
                img.crossOrigin = "Anonymous";
                img.src = imgPath;
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                });
                const color = await fac.getColorAsync(img);
                map[i] = color.isDark ? "dark" : "light";
            } catch (e) {
                // Fallback to light (dark text) if analysis fails
                map[i] = "light";
            }
        }
        setBrightnessMap(map);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const { left, width } = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - left;
        if (x < width / 2) {
            setHoverSide("left");
        } else {
            setHoverSide("right");
        }
    };

    const handleMouseLeave = () => {
        setHoverSide(null);
    };

    const isCurrentDark = brightnessMap[currentSlide] === "dark";

    const settings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: true,
        nextArrow: <ImageNextArrow visible={hoverSide === "right"} isDark={isCurrentDark} />,
        prevArrow: <ImagePrevArrow visible={hoverSide === "left"} isDark={isCurrentDark} />,
        adaptiveHeight: false,
        beforeChange: (_: number, next: number) => setCurrentSlide(next),
    };

    return (
        <div className="w-full relative flex flex-col justify-center">
            <div className="sticky top-24">
                <div
                    className="relative rounded-xl overflow-hidden aspect-square border border-gray-200 bg-white shadow-sm group"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                >
                    {product.images?.length ? (
                        <Slider {...settings} className="product-slider h-full">
                            {product.images.map((img, idx) => (
                                <div key={idx} className="h-full flex items-center justify-center outline-none bg-gray-50">
                                    <img
                                        src={img.imagePath.startsWith('http')
                                            ? img.imagePath
                                            : `${API_BASE_URL}${img.imagePath}`}
                                        alt={`${product.title} - ${idx + 1}`}
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                </div>
                            ))}
                        </Slider>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 bg-gray-200">
                        </div>
                    )}

                    {/* AR Try-On Button */}
                    <button
                        onClick={() => setShowARModal(true)}
                        className="absolute bottom-4 right-4 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-all z-20 flex items-center gap-2 hover:opacity-90"
                        style={{ backgroundColor: "#111" }}
                    >
                        <span>📷</span> AR 트라이온
                    </button>
                </div>
            </div>
        </div>
    );
};
