package com.my.backend.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentHistoryResponse {
    private Long paymentId;
    private Long productId;
    private String productTitle;
    private String productImage;
    private Long price;
    private String status;
    private LocalDateTime paidAt;
    private String courier;
    private String trackingNumber;
    private String buyerName;
    private String buyerNickName;
    private String buyerPhone;
    private String buyerAddress;
    private String sellerNickName;
    private Long sellerId;
    private String productType;

    public static PaymentHistoryResponse fromEntity(com.my.backend.entity.Payment payment) {
        return PaymentHistoryResponse.builder()
                .paymentId(payment.getPaymentId())
                .productId(payment.getProduct().getProductId())
                .productTitle(payment.getProduct().getTitle())
                .productImage(payment.getProduct().getProductBanners().isEmpty() ? null : payment.getProduct().getProductBanners().get(0))
                .price(payment.getTotalPrice())
                .status(payment.getPaymentStatus().name())
                .paidAt(payment.getCreatedAt())
                .courier(payment.getCourierName() != null ? payment.getCourierName().name() : null)
                .trackingNumber(payment.getTrackingNumber())
                .buyerName(payment.getUser().getUserName())
                .buyerNickName(payment.getUser().getNickName())
                .buyerPhone(payment.getUser().getPhone())
                .buyerAddress(payment.getUser().getAddress() != null 
                    ? payment.getUser().getAddress().getAddress() + " " + payment.getUser().getAddress().getDetailAddress() 
                    : "")
                .sellerNickName(payment.getProduct().getSeller().getNickName())
                .sellerId(payment.getProduct().getSeller().getUserId())
                .productType(payment.getProduct().getProductType().name())
                .build();
    }
}
