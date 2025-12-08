package com.my.backend.phoneVerification;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SmsVerificationResponse {
    private boolean success;
    private String message;
    private Integer expiryMinutes;
    private Integer remainingAttempts;

    public static SmsVerificationResponse success(String message, Integer expiryMinutes) {
        return SmsVerificationResponse.builder()
                .success(true)
                .message(message)
                .expiryMinutes(expiryMinutes)
                .build();
    }

    public static SmsVerificationResponse failure(String message) {
        return SmsVerificationResponse.builder()
                .success(false)
                .message(message)
                .build();
    }

    public static SmsVerificationResponse failure(String message, Integer remainingAttempts) {
        return SmsVerificationResponse.builder()
                .success(false)
                .message(message)
                .remainingAttempts(remainingAttempts)
                .build();
    }
}