package com.my.backend.repository;

import com.my.backend.entity.EmailVerification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmailVerificationRepository extends JpaRepository<EmailVerification, Long> {
    // 이메일로 인증 정보 조회
    Optional<EmailVerification> findByUserEmail(String email);

    // 이메일 + 코드로 인증 정보 조회
    Optional<EmailVerification> findByUserEmailAndEmailVerificationToken(String email, String token);

    Optional<EmailVerification> findByUserEmailAndVerifiedTrue(String email);
}
