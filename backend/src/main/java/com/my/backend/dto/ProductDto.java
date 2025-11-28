package com.my.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.my.backend.enums.PaymentStatus;
import com.my.backend.enums.ProductCategoryType;
import com.my.backend.enums.ProductStatus;
import com.my.backend.enums.ProductType;
import com.my.backend.enums.DeliveryType;
import com.my.backend.entity.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProductDto {

    private Long productId;
    private Long sellerId;
    private String sellerNickName;
    private String title;
    private String content;
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
    private boolean deliveryIncluded;
    private Long deliveryPrice;
    private Long deliveryAddPrice;
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

    @Builder.Default
    private List<ImageDto> images = new ArrayList<>();

    // Entity → DTO
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
                .startingPrice(product.getStartingPrice())
                .originalPrice(product.getOriginalPrice())
                .salePrice(product.getSalePrice())
                .discountRate(product.getDiscountRate())
                .auctionEndTime(product.getAuctionEndTime())
                .viewCount(product.getViewCount())
                .deliveryIncluded(product.isDeliveryIncluded())
                .deliveryPrice(product.getDeliveryPrice())
                .deliveryAddPrice(product.getDeliveryAddPrice())
                .productType(product.getProductType())
                .productStatus(product.getProductStatus())
                .paymentStatus(product.getPaymentStatus())
                .deliveryType(product.getDeliveryType())
                .productCategoryType(product.getProductCategoryType())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .bidId(product.getBid() != null ? product.getBid().getBidId() : null)
                .paymentId(product.getPayment() != null ? product.getPayment().getPaymentId() : null)
                .build();
    }


    // DTO → Entity
    public Product toEntity(Users seller, Bid bid, Payment payment) {
        return Product.builder()
                .productId(this.productId)
                .seller(seller)
                .title(this.title)
                .content(this.content)
                .tag(this.tag)
                .startingPrice(this.startingPrice)
                .originalPrice(this.originalPrice)
                .salePrice(this.salePrice)
                .discountRate(this.discountRate)
                .auctionEndTime(this.auctionEndTime)
                .viewCount(this.viewCount != null ? this.viewCount : 0L)
                .deliveryIncluded(this.deliveryIncluded)
                .deliveryPrice(this.deliveryPrice)
                .deliveryAddPrice(this.deliveryAddPrice)
                .productType(this.productType)
                .productStatus(this.productStatus)
                .paymentStatus(this.paymentStatus)
                .deliveryType(this.deliveryType)
                .productCategoryType(this.productCategoryType)
                .bid(bid)
                .payment(payment)
                .build();
    }
}