package com.my.backend.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import com.my.backend.enums.Role;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
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

    @NotBlank
    @Pattern(regexp = "^[가-힣a-zA-Z0-9]+$")
    @Column(nullable = false)
    private String userName;

    @NotBlank
    @Pattern(regexp = "^[가-힣a-zA-Z0-9]{3,12}+$", message = "닉네임은 3~12자여야 합니다.")
    @Column(nullable = false, unique = true)
    private String nickName;

    @NotBlank
    @Column(nullable = false)
    private String password;

    @NotBlank
    @Pattern(regexp = "^\\d{10,11}$", message = "전화번호는 숫자만 10~11자리여야 합니다.")
    @Column(nullable = false, unique = true)
    private String phone;

    @NotBlank
    @Email(
            regexp = "^[a-zA-Z0-9]+@[a-zA-Z0-9]+\\.[a-zA-Z]{2,}$",
            message = "올바른 이메일 형식이 아닙니다.")
    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = true)
    private LocalDate birthday;

    @Pattern(regexp = "^\\d{10}$", message = "사업자번호는 숫자 10자리여야 합니다.")
    @Column(name = "business_number", unique = true, nullable = true)
    private String businessNumber;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "address_id")
    private Address address;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "email_verification_id")
    private EmailVerification emailVerification;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "phone_verification_id")
    private PhoneVerification phoneVerification;

    public boolean isVerified() {
        // 이메일 또는 핸드폰 인증 중 하나라도 완료면 true
        return (emailVerification != null && emailVerification.isVerified())
                || (phoneVerification != null && phoneVerification.isVerified());
    }
}
