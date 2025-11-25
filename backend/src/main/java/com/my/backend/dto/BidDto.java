package com.my.backend.dto;

import com.my.backend.entity.Bid;
import com.my.backend.entity.Product;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class BidDto {

    private Long bidId;          // 입찰 ID
    private Long productId;      // 상품 ID
    private Long userId;         // 입찰자 ID
    private Long bidPrice;       // 입찰 금액
    private boolean isWinning;   // 낙찰 여부
    private LocalDateTime createdAt;

    // 엔티티 → DTO 변환
    public static BidDto fromEntity(Bid bid) {
        if (bid == null) return null;

        return BidDto.builder()
                .bidId(bid.getBidId())
                .productId(bid.getProduct() != null ? bid.getProduct().getProductId() : null)
                .userId(bid.getUser() != null ? bid.getUser().getUserId() : null)
                .bidPrice(bid.getBidPrice())
                .isWinning(bid.isWinning())
                .createdAt(bid.getCreatedAt())
                .build();
    }

    // DTO → 엔티티 변환
    public Bid toEntity(Product product, User user) {
        return Bid.builder()
                .bidId(this.bidId)
                .product(product)
                .user(user)
                .bidPrice(this.bidPrice)
                .isWinning(this.isWinning)
                .build();
    }
}
