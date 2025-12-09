package com.my.backend.enums;

public enum PaymentStatus {
    PENDING,    // 결제 대기
    PAID,       // 결제 완료
    CANCELLED,  // 결제 취소됨
    FAILED,     // 결제 실패
    REFUNDED,   // 환불됨
    CONFIRMED   // 구매 확정
}
