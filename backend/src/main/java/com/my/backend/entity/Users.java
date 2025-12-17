package com.my.backend.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import com.my.backend.enums.Role;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "users")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
@EntityListeners(AuditingEntityListener.class)
public class Users {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    @Column(nullable = true)
    private String userName;

    @Pattern(regexp = "^[가-힣a-zA-Z0-9]{3,12}$", message = "닉네임은 3~12자여야 합니다.")
    @Column(nullable = true, unique = true)
    private String nickName;

    @NotBlank
    @Column(nullable = false)
    private String password;

    @Pattern(regexp = "^\\d{10,11}$", message = "전화번호는 숫자만 10~11자리여야 합니다.")
    @Column(nullable = true, unique = true)
    private String phone;

    @Email(
            regexp = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
            message = "올바른 이메일 형식을 입력해주세요.")
    @Column(nullable = true, unique = true)
    private String email;

    @Column(nullable = true)
    private LocalDate birthday;

    @Pattern(regexp = "^\\d{10}$", message = "사업자번호는 숫자 10자리여야 합니다.")
    @Column(name = "business_number", unique = true, nullable = true)
    private String businessNumber;

    @Column(nullable = true)
    private String provider; // google, kakao, naver, null(general)

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = true)
    private LocalDateTime deletedAt; // Soft Delete

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "address_id")
    private Address address;

    @ManyToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JoinColumn(name = "email_verification_id")
    private EmailVerification emailVerification;

    @ManyToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JoinColumn(name = "phone_verification_id")
    private PhoneVerification phoneVerification;

    @Column(nullable = false)
    private boolean verified = false;

    // 인증 완료 처리 메서드 추가
    public void completeVerification() {
        if ((emailVerification != null && emailVerification.isVerified())
                || (phoneVerification != null && phoneVerification.isVerified())) {
            this.verified = true;
        }
    }
}