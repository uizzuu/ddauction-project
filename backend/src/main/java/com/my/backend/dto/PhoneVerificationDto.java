package com.my.backend.dto;

import com.my.backend.entity.PhoneVerification;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PhoneVerificationDto {

    private Long phoneVerificationId;
    private String userPhone;
    private String phoneVerificationToken;
    private LocalDateTime createdAt;
    private LocalDateTime expiredAt;

    // Entity → DTO
    public static PhoneVerificationDto fromEntity(PhoneVerification phoneVerification) {
        if (phoneVerification == null) return null;

        return PhoneVerificationDto.builder()
                .phoneVerificationId(phoneVerification.getPhoneVerificationId())
                .userPhone(phoneVerification.getUserPhone())
                .phoneVerificationToken(phoneVerification.getPhoneVerificationToken())
                .createdAt(phoneVerification.getCreatedAt())
                .expiredAt(phoneVerification.getExpiredAt())
                .build();
    }

    // DTO → Entity
    public PhoneVerification toEntity() {
        return PhoneVerification.builder()
                .phoneVerificationId(this.phoneVerificationId)
                .userPhone(this.userPhone)
                .phoneVerificationToken(this.phoneVerificationToken)
                .createdAt(this.createdAt)
                .expiredAt(this.expiredAt)
                .build();
    }
}
