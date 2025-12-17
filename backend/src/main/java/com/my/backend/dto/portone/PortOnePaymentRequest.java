package com.my.backend.dto.portone;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class PortOnePaymentRequest {
    private String merchantUid;      // 주문번호
    private String name;             // 상품명
    private Integer amount;          // 결제금액
    private String buyerEmail;       // 구매자 이메일
    private String buyerName;        // 구매자 이름
    private String buyerTel;         // 구매자 전화번호
    private String buyerAddress;        // 구매자 주소
    private String buyerPostcode;    // 구매자 우편번호
    private String noticeUrl;        // 웹훅 URL (선택)
}