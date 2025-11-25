package com.my.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.my.backend.enums.PaymentStatus;
import com.my.backend.enums.ProductCategoryType;
import com.my.backend.enums.ProductStatus;
import com.my.backend.enums.ProductType;
import com.my.backend.enums.DeliveryType;
import com.my.backend.enums.TagType;
import com.my.backend.entity.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProductDto {

    private Long productId;

    // Seller 정보
    private Long sellerId;
    private String sellerNickName;

    // 기본 정보
    @NotNull(message = "제목은 필수 입력 항목입니다.")
    private String title;

    @NotNull(message = "내용은 필수 입력 항목입니다.")
    private String content;

    // 가격 정보
    @Min(value = 1, message = "시작 가격은 1원 이상이어야 합니다.")
    private Long startingPrice;

    private Long price;

    // 경매 정보
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime auctionEndTime;

    // 조회수
    private Long viewCount;

    // 배송 정보
    private Boolean deliveryIncluded;
    private Long deliveryPrice;
    private Long deliveryAddPrice;

    // Enum 타입들
    @NotNull(message = "상품 타입은 필수 입력 항목입니다.")
    private ProductType productType;

    @NotNull(message = "상품 상태는 필수 입력 항목입니다.")
    private ProductStatus productStatus;

    private PaymentStatus paymentStatus;
    private DeliveryType deliveryType;

    @NotNull(message = "태그 타입은 필수 입력 항목입니다.")
    private TagType tagType;

    @NotNull(message = "카테고리 타입은 필수 입력 항목입니다.")
    private ProductCategoryType productCategoryType;

    // 타임스탬프
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // 관계 엔티티 ID들
    private Long bidId;
    private Long paymentId;
    private Long imageId;

    /**
     * Entity -> DTO 변환
     */
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
                .startingPrice(product.getStartingPrice())
                .price(product.getPrice())
                .auctionEndTime(product.getAuctionEndTime())
                .viewCount(product.getViewCount())
                .deliveryIncluded(product.getDeliveryIncluded())
                .deliveryPrice(product.getDeliveryPrice())
                .deliveryAddPrice(product.getDeliveryAddPrice())
                .productType(product.getProductType())
                .productStatus(product.getProductStatus())
                .paymentStatus(product.getPaymentStatus())
                .deliveryType(product.getDeliveryType())
                .tagType(product.getTagType())
                .productCategoryType(product.getProductCategoryType())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .bidId(product.getBid() != null ? product.getBid().getBidId() : null)
                .paymentId(product.getPayment() != null ? product.getPayment().getPaymentId() : null)
                .imageId(product.getImage() != null ? product.getImage().getImageId() : null)
                .build();
    }

    /**
     * DTO -> Entity 변환
     */
    public Product toEntity(Users seller, Bid bid, Payment payment, Image image) {
        return Product.builder()
                .productId(this.productId)
                .seller(seller)
                .title(this.title)
                .content(this.content)
                .startingPrice(this.startingPrice)
                .price(this.price)
                .auctionEndTime(this.auctionEndTime)
                .viewCount(this.viewCount != null ? this.viewCount : 0L)
                .deliveryIncluded(this.deliveryIncluded)
                .deliveryPrice(this.deliveryPrice)
                .deliveryAddPrice(this.deliveryAddPrice)
                .productType(this.productType)
                .productStatus(this.productStatus)
                .paymentStatus(this.paymentStatus)
                .deliveryType(this.deliveryType)
                .tagType(this.tagType)
                .productCategoryType(this.productCategoryType)
                .bid(bid)
                .payment(payment)
                .image(image)
                .build();
    }
}