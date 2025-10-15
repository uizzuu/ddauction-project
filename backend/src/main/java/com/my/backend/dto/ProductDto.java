package com.my.backend.dto;

import com.my.backend.entity.Product;
import com.my.backend.entity.User;
import com.my.backend.entity.Bidder;
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
    private Long price;
    private String imageUrl;
    private boolean oneMinuteAuction;
    private LocalDateTime auctionEndTime;
    private Product.ProductStatus productStatus;
    private Product.PaymentStatus paymentStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long bidderId;
    private Long amount;

    public static ProductDto fromEntity(Product product) {
        if (product == null) {
            return null;
        }
        return ProductDto.builder()
                .productId(product.getProductId())
                .sellerId(product.getUser().getUserId())
                .title(product.getTitle())
                .content(product.getContent())
                .price(product.getPrice())
                .imageUrl(product.getImageUrl())
                .oneMinuteAuction(product.isOneMinuteAuction())
                .auctionEndTime(product.getAuctionEndTime())
                .productStatus(product.getProductStatus())
                .paymentStatus(product.getPaymentStatus())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .bidderId(product.getBidder().getBidderId())
                .amount(product.getAmount())
                .build();
    }

    public Product toEntity(User seller, Bidder bidder) {
        return Product.builder()
                .productId(this.productId)
                .user(seller)
                .title(this.title)
                .content(this.content)
                .price(this.price)
                .imageUrl(this.imageUrl)
                .oneMinuteAuction(this.oneMinuteAuction)
                .auctionEndTime(this.auctionEndTime)
                .productStatus(this.productStatus)
                .paymentStatus(this.paymentStatus)
                .createdAt(this.createdAt)
                .updatedAt(this.updatedAt)
                .bidder(bidder)
                .amount(this.amount)
                .build();
    }
}
