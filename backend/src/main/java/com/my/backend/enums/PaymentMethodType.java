package com.my.backend.enums;

public enum PaymentMethodType {
    CARD,        // 카드결제
    TRANSFER,    // 실시간계좌이체
    VBANK,       // 가상계좌
    MOBILE,      // 핸드폰 소액결제
    EASYPAY,     // 허브 간편결제
    PAYCO,       // 페이코
    TOSSPAY,     // 토스페이
    LPAY,        // 엘페이
    KAKAOPAY,    // 카카오페이
    NAVERPAY,    // 네이버페이
    GIFT;         // 상품권

    public static PaymentMethodType fromPortOne(String payMethod) {
        if (payMethod == null) {
            throw new IllegalArgumentException("결제 방식이 존재하지 않습니다.");
        }

        return switch (payMethod.toUpperCase()) {
            case "CARD" -> CARD;
            case "TRANSFER", "TRANS" -> TRANSFER;
            case "VBANK" -> VBANK;
            case "MOBILE", "PHONE" -> MOBILE;

            case "EASY_PAY", "EASYPAY" -> EASYPAY;
            case "PAYCO" -> PAYCO;
            case "TOSSPAY", "TOSS_PAY" -> TOSSPAY;
            case "LPAY", "L_PAY" -> LPAY;
            case "KAKAOPAY" -> KAKAOPAY;
            case "NAVERPAY" -> NAVERPAY;

            case "GIFT", "POINT" -> GIFT;

            // PortOne 테스트 결제 전용
            case "SAMSUNG" -> CARD;

            default -> throw new IllegalArgumentException("지원하지 않는 결제 방식입니다: " + payMethod);
        };
    }
}
