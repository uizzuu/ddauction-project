package com.my.backend.dto;

import com.my.backend.entity.Bidder;
import com.my.backend.entity.Product;
import com.my.backend.entity.User;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class BidderDto {
    private Long bidderId;
    private Long productId;
    private Long userId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long bidderPrice;

    public static BidderDto fromEntity(Bidder bidder) {
        return BidderDto.builder()
                .bidderId(bidder.getBidderId())
                .productId(bidder.getProduct().getProductId())
                .userId(bidder.getUser().getUserId())
                .createdAt(bidder.getCreatedAt())
                .updatedAt(bidder.getUpdatedAt())
                .bidderPrice(bidder.getBidderPrice())
                .build();
    }

    public Bidder toEntity(Product product, User user) {
        return Bidder.builder()
                .bidderId(this.bidderId)
                .product(product)
                .user(user)
                .createdAt(this.createdAt)
                .updatedAt(this.updatedAt)
                .bidderPrice(this.bidderPrice)
                .build();
    }
}
