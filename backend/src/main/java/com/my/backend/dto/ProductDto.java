package com.my.backend.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.my.backend.entity.Bid;
import com.my.backend.entity.Payment;
import com.my.backend.entity.Product;
import com.my.backend.entity.Users;
import com.my.backend.enums.DeliveryType;
import com.my.backend.enums.PaymentStatus;
import com.my.backend.enums.ProductCategoryType;
import com.my.backend.enums.ProductStatus;
import com.my.backend.enums.ProductType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProductDto {

    private Long productId;
    private Long sellerId;
    private String sellerNickName;
    private String sellerProfileImage;
    private String title;
    private String content;

    // ✅ 가격 필드 (타입별)
    // AUCTION: startingPrice (시작 입찰가)
    // STORE: salePrice (판매가), originalPrice (정가), discountRate (할인율)
    // USED: originalPrice (판매가)
    private Long startingPrice;
    private Long originalPrice;
    private Long salePrice;
    private Long discountRate;

    // 경매 정보
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime auctionEndTime;

    // 조회수
    private Long viewCount;

    // 태그
    private String tag;

    // 배송 정보
    private Boolean deliveryIncluded;
    private Long deliveryPrice;
    private Long deliveryAddPrice;
    private Double latitude;
    private Double longitude;
    private String address;
    private String deliveryAvailable;
    private List<String> productBanners;

    // Enum 타입들
    private ProductType productType;
    private ProductStatus productStatus;
    private PaymentStatus paymentStatus;
    private DeliveryType deliveryType;
    private ProductCategoryType productCategoryType;

    // 타임스탬프
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // 관계 엔티티 ID들
    private Long bidId;
    private Long paymentId;

    // 이미지 목록
    @Builder.Default
    private List<ImageDto> images = new ArrayList<>();

    // ✅ 입찰 목록 (경매 상품용)
    @Builder.Default
    private List<BidDto> bids = new ArrayList<>();

    // 북마크 여부
    private boolean isBookmarked;

    // ✅ 입찰 집계 정보 (프론트엔드에서 바로 사용)
    private Integer bidCount;
    private Long highestBidPrice;

    // ========================================
    // Entity → DTO
    // ========================================
    public static ProductDto fromEntity(Product product) {
        if (product == null) {
            return null;
        }

        return ProductDto.builder()
                .productId(product.getProductId())
                .sellerId(product.getSeller() != null ? product.getSeller().getUserId() : null)
                .sellerNickName(product.getSeller() != null ? product.getSeller().getNickName() : null)
                .title(product.getTitle())
                .content(product.getContent())
                .tag(product.getTag())
                // 가격 필드
                .startingPrice(product.getStartingPrice())
                .originalPrice(product.getOriginalPrice())
                .salePrice(product.getSalePrice())
                .discountRate(product.getDiscountRate())
                // 경매 정보
                .auctionEndTime(product.getAuctionEndTime())
                .viewCount(product.getViewCount())
                // 배송 정보
                .deliveryIncluded(product.isDeliveryIncluded())
                .deliveryPrice(product.getDeliveryPrice())
                .deliveryAddPrice(product.getDeliveryAddPrice())
                .latitude(product.getLatitude())
                .longitude(product.getLongitude())
                .address(product.getAddress())
                .deliveryAvailable(product.getDeliveryAvailable())
                .productBanners(product.getProductBanners())
                // Enum 타입들
                .productType(product.getProductType())
                .productStatus(product.getProductStatus())
                .paymentStatus(product.getPaymentStatus())
                .deliveryType(product.getDeliveryType())
                .productCategoryType(product.getProductCategoryType())
                // 타임스탬프
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                // 관계 엔티티 ID
                .bidId(product.getBid() != null ? product.getBid().getBidId() : null)
                .paymentId(product.getPayment() != null ? product.getPayment().getPaymentId() : null)
                .build();
    }

    // ========================================
    // DTO → Entity
    // ========================================
    public Product toEntity(Users seller, Bid bid, Payment payment) {
        return Product.builder()
                .seller(seller)
                .title(this.title)
                .content(this.content)
                .tag(this.tag)
                // 가격 필드
                .startingPrice(this.startingPrice)
                .originalPrice(this.originalPrice)
                .salePrice(this.salePrice)
                .discountRate(this.discountRate)
                // 경매 정보
                .auctionEndTime(this.auctionEndTime)
                .viewCount(this.viewCount != null ? this.viewCount : 0L)
                // 배송 정보
                .deliveryIncluded(this.deliveryIncluded)
                .deliveryPrice(this.deliveryPrice)
                .deliveryAddPrice(this.deliveryAddPrice)
                .latitude(this.latitude)
                .longitude(this.longitude)
                .address(this.address)
                .deliveryAvailable(this.deliveryAvailable)
                .productBanners(this.productBanners)
                // Enum 타입들
                .productType(this.productType)
                .productStatus(this.productStatus)
                .paymentStatus(this.paymentStatus)
                .deliveryType(this.deliveryType)
                .productCategoryType(this.productCategoryType)
                // 관계 엔티티
                .bid(bid)
                .payment(payment)
                .build();
    }
}