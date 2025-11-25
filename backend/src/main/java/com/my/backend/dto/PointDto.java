package com.my.backend.dto;

import com.my.backend.entity.Point;
import com.my.backend.entity.Users;
import com.my.backend.entity.Payment;
import com.my.backend.enums.PointStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PointDto {

    private Long pointId;
    private Long userId;
    private Long paymentId;       // Payment와 연관
    private Long amount;
    private Long totalAmount;
    private PointStatus pointStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Entity → DTO
    public static PointDto fromEntity(Point point) {
        if (point == null) return null;

        return PointDto.builder()
                .pointId(point.getPointId())
                .userId(point.getUser() != null ? point.getUser().getUserId() : null)
                .paymentId(point.getPayment() != null ? point.getPayment().getPaymentId() : null)
                .amount(point.getAmount())
                .totalAmount(point.getTotalAmount())
                .pointStatus(point.getPointStatus())
                .createdAt(point.getCreatedAt())
                .updatedAt(point.getUpdatedAt())
                .build();
    }

    // DTO → Entity
    public Point toEntity(Users user, Payment payment) {
        return Point.builder()
                .pointId(this.pointId)
                .user(user)
                .payment(payment)
                .amount(this.amount)
                .totalAmount(this.totalAmount)
                .pointStatus(this.pointStatus)
                .build();
    }
}
