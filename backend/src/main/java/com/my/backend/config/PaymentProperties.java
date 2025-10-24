// config/PaymentProperties.java - 전체 교체
package com.my.backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "payment")
public class PaymentProperties {

    private String provider = "portone";  // "portone" or "mock"
    private PortOne portone = new PortOne();

    @Getter
    @Setter
    public static class PortOne {
        private String impCode;      // 가맹점 식별코드
        private String apiKey;       // REST API Key
        private String apiSecret;    // REST API Secret
        private String callbackUrl;  // 결제 완료 콜백 URL
    }
}