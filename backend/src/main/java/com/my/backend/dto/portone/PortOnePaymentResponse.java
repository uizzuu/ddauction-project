package com.my.backend.dto.portone;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PortOnePaymentResponse {
    private Integer code;
    private String message;
    private Response response;

    @Data
    public static class Response {
        @JsonProperty("imp_uid")
        private String impUid;              // 아임포트 거래 고유번호

        @JsonProperty("merchant_uid")
        private String merchantUid;         // 주문번호

        @JsonProperty("pay_method")
        private String payMethod;           // 결제수단

        @JsonProperty("paid_amount")
        private Integer paidAmount;         // 실제 결제금액

        private String status;              // 결제상태
        private String name;                // 상품명

        @JsonProperty("pg_provider")
        private String pgProvider;          // PG사

        @JsonProperty("pg_tid")
        private String pgTid;               // PG사 거래번호

        @JsonProperty("buyer_name")
        private String buyerName;

        @JsonProperty("buyer_email")
        private String buyerEmail;

        @JsonProperty("buyer_tel")
        private String buyerTel;

        @JsonProperty("paid_at")
        private Long paidAt;                // 결제 완료 시각 (Unix timestamp)

        @JsonProperty("receipt_url")
        private String receiptUrl;          // 결제 영수증 URL
    }
}