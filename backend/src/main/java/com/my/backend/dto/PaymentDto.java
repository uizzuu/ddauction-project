package com.my.backend.dto;

import com.my.backend.common.enums.PaymentStatus;
import com.my.backend.entity.Payment;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PaymentDto {

    private Long paymentId;
    private Long productId;
    private Long bidId;
    private Long totalPrice;
    private Long paymentMethodId;
    private PaymentStatus paymentStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static PaymentDto fromEntity(Payment payment) {
        if (payment == null) return null;

        return PaymentDto.builder()
                .paymentId(payment.getPaymentId())
                .productId(payment.getProduct() != null ? payment.getProduct().getProductId() : null)
                .bidId(payment.getBid() != null ? payment.getBid().getBidId() : null)
                .totalPrice(payment.getTotalPrice())
                .paymentMethodId(payment.getPaymentMethod() != null ? payment.getPaymentMethod().getPaymentId(): null)
                .paymentStatus(payment.getPaymentStatus())
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .build();
    }

    public Payment toEntity() {
        // DTO → Entity 변환
        return Payment.builder()
                .paymentId(this.paymentId)
                .totalPrice(this.totalPrice)
                .paymentStatus(this.paymentStatus != null ? this.paymentStatus : PaymentStatus.PENDING)
                .build();
    }
}
