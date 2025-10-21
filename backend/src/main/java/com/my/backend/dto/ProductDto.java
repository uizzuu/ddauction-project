package com.my.backend.dto;

import com.my.backend.entity.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ProductDto {

    private Long productId;

    private Long sellerId;

    private String title;

    private String content;

    @NotBlank
    @Pattern(regexp = "^[1-9][0-9]*$")
    private String startingPrice;

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
                .title(product.getTitle())
                .content(product.getContent())
                .startingPrice(product.getStartingPrice() != null ? product.getStartingPrice().toString() : null)
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
                .startingPrice(Long.parseLong(this.startingPrice))
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
