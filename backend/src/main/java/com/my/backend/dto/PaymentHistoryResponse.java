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
    private String productImage; // 상품 이미지 URL
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

    /**
     * Payment 엔티티와 조회된 이미지 URL을 기반으로 DTO를 생성합니다.
     */
    public static PaymentHistoryResponse fromEntityWithImage(
            com.my.backend.entity.Payment payment,
            String mainImageUrl // 서비스 레이어에서 조회하여 전달받은 이미지 URL
    ) {
        // 기존 payment.getProduct().getProductBanners().get(0) 대신
        // 서비스 레이어에서 Image 엔티티를 조회하여 가져온 mainImageUrl을 사용합니다.
        return PaymentHistoryResponse.builder()
                .paymentId(payment.getPaymentId())
                .productId(payment.getProduct().getProductId())
                .productTitle(payment.getProduct().getTitle())
                .productImage(mainImageUrl)
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