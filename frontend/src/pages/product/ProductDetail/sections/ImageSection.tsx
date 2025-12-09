import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import type { Product } from "../../../../common/types";

interface ImageSectionProps {
    product: Product;
    setShowARModal: (show: boolean) => void;
}

export const ImageSection: React.FC<ImageSectionProps> = ({ product, setShowARModal }) => {
    return (
        <div className="w-full relative flex flex-col justify-center">
            <div className="sticky top-24">
                <div className="relative rounded-xl overflow-hidden aspect-square border border-gray-200 bg-white shadow-sm">
                    {product.images?.length ? (
                        <Slider
                            dots={true}
                            infinite={true}
                            speed={500}
                            slidesToShow={1}
                            slidesToScroll={1}
                            arrows={true}
                            adaptiveHeight={false}
                            className="product-slider h-full"
                        >
                            {product.images.map((img, idx) => (
                                <div key={idx} className="h-full flex items-center justify-center outline-none">
                                    <img
                                        src={img.imagePath.startsWith('http')
                                            ? img.imagePath
                                            : `http://localhost:8080${img.imagePath}`}
                                        alt={`${product.title} - ${idx + 1}`}
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                            const parent = e.currentTarget.parentElement;
                                            if (parent) {
                                                parent.innerHTML =
                                                    '<div class="flex items-center justify-center h-full text-gray-400">이미지 없음</div>';
                                            }
                                        }}
                                    />
                                </div>
                            ))}
                        </Slider>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 bg-gray-100">
                            이미지 없음
                        </div>
                    )}

                    {/* AR Try-On Button */}
                    <button
                        onClick={() => setShowARModal(true)}
                        className="absolute bottom-4 right-4 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-all z-10 flex items-center gap-2 hover:opacity-90"
                        style={{ backgroundColor: "#111" }}
                    >
                        <span>📷</span> AR 트라이온
                    </button>
                </div>
            </div>
        </div>
    );
};
