package com.my.backend.dto;

import com.my.backend.entity.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.jackson.Jacksonized;

import java.time.LocalDateTime;

@AllArgsConstructor
@Data
@Builder
@Jacksonized
public class ProductDto {

    private Long productId;

    private Long sellerId;

    private String sellerNickName; //  추가

    private String title;

    private String content;

    @NotNull
    @Positive
    private Long startingPrice;

    private String imageUrl;

    private boolean oneMinuteAuction;

    private LocalDateTime auctionEndTime;

    private Product.ProductStatus productStatus;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private Long bidId;

    private Long paymentId;

    private Long categoryId;

    public static ProductDto fromEntity(Product product) {
        if (product == null) {
            return null;
        }

        return ProductDto.builder()
                .productId(product.getProductId())
                .sellerId(product.getUser() != null ? product.getUser().getUserId() : null)
                .sellerNickName(product.getUser() != null ? product.getUser().getNickName() : null) // ⭐ 추가
                .title(product.getTitle())
                .content(product.getContent())
                .startingPrice(product.getStartingPrice() != null ? product.getStartingPrice() : null)
                .imageUrl(product.getImageUrl())
                .oneMinuteAuction(product.isOneMinuteAuction())
                .auctionEndTime(product.getAuctionEndTime())
                .productStatus(product.getProductStatus())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .bidId(product.getBid() != null ? product.getBid().getBidId() : null)
                .paymentId(product.getPayment() != null ? product.getPayment().getPaymentId() : null)
                .categoryId(product.getCategory() != null ? product.getCategory().getCategoryId() : null)
                .build();
    }

    public Product toEntity(User seller, Bid bid, Payment payment, Category category) {
        return Product.builder()
                .productId(this.productId)
                .user(seller)
                .title(this.title)
                .content(this.content)
                .startingPrice(this.startingPrice)
                .imageUrl(this.imageUrl)
                .oneMinuteAuction(this.oneMinuteAuction)
                .auctionEndTime(this.auctionEndTime)
                .productStatus(this.productStatus)
                .bid(bid)
                .payment(payment)
                .category(category)
                .build();
    }


}
