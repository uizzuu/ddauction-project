package com.my.backend.dto;

import com.my.backend.entity.Payment;
import com.my.backend.entity.Product;
import com.my.backend.enums.CourierType;
import com.my.backend.enums.PaymentMethodType;
import com.my.backend.enums.PaymentStatus;
import com.my.backend.enums.ProductType;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PaymentDto {

    private Long paymentId;
    private Long productId;
    private Long totalPrice;
    private PaymentMethodType paymentMethodType;
    private PaymentStatus paymentStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private ProductType productType;
    private String trackingNumber;
    private CourierType courierName;

    // Entity → DTO
    public static PaymentDto fromEntity(Payment payment) {
        if (payment == null) return null;

        return PaymentDto.builder()
                .paymentId(payment.getPaymentId())
                .productId(payment.getProduct() != null ? payment.getProduct().getProductId() : null)
                .totalPrice(payment.getTotalPrice())
                .paymentMethodType(payment.getPaymentMethodType())
                .paymentStatus(payment.getPaymentStatus())
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .productType(payment.getProductType())
                .trackingNumber(payment.getTrackingNumber())
                .courierName(payment.getCourierName())
                .build();
    }

    // DTO → Entity
    public Payment toEntity(Product product) {
        return Payment.builder()
                .paymentId(this.paymentId)
                .product(product)
                .totalPrice(this.totalPrice)
                .paymentMethodType(this.paymentMethodType)
                .paymentStatus(this.paymentStatus != null ? this.paymentStatus : PaymentStatus.PENDING)
                .productType(this.productType)
                .trackingNumber(this.trackingNumber)
                .courierName(this.courierName)
                .build();
    }
}
