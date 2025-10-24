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

    private String provider = "portone";
    private PortOne portone = new PortOne();

    @Getter
    @Setter
    public static class PortOne {
        private String impCode;
        private String apiKey;
        private String apiSecret;
        private String callbackUrl;
    }
}