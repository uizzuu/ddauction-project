package com.my.backend.dto;

import com.my.backend.entity.Bid;
import com.my.backend.entity.Users;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BidDto {
    private Long bidId;
    private Long userId;
    private Long bidPrice;
    private boolean isWinning;
    private LocalDateTime createdAt;

    public static BidDto fromEntity(Bid bid) {
        if (bid == null) return null;

        return BidDto.builder()
                .bidId(bid.getBidId())
                .userId(bid.getUser() != null ? bid.getUser().getUserId() : null)
                .bidPrice(bid.getBidPrice())
                .isWinning(bid.isWinning())
                .createdAt(bid.getCreatedAt())
                .build();
    }

    public Bid toEntity(Users user) {
        return Bid.builder()
                .bidId(this.bidId)
                .user(user)
                .bidPrice(this.bidPrice)
                .isWinning(this.isWinning)
                .build();
    }
}

