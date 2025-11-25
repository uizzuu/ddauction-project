package com.my.backend.dto;

import com.my.backend.entity.EmailVerification;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EmailVerificationDto {

    private Long emailVerificationId;
    private String userEmail;
    private String emailVerificationToken;
    private LocalDateTime createdAt;
    private LocalDateTime expiredAt;

    // Entity → DTO
    public static EmailVerificationDto fromEntity(EmailVerification emailVerification) {
        if (emailVerification == null) return null;

        return EmailVerificationDto.builder()
                .emailVerificationId(emailVerification.getEmailVerificationId())
                .userEmail(emailVerification.getUserEmail())
                .emailVerificationToken(emailVerification.getEmailVerificationToken())
                .createdAt(emailVerification.getCreatedAt())
                .expiredAt(emailVerification.getExpiredAt())
                .build();
    }

    // DTO → Entity
    public EmailVerification toEntity() {
        return EmailVerification.builder()
                .emailVerificationId(this.emailVerificationId)
                .userEmail(this.userEmail)
                .emailVerificationToken(this.emailVerificationToken)
                .createdAt(this.createdAt)
                .expiredAt(this.expiredAt)
                .build();
    }
}
