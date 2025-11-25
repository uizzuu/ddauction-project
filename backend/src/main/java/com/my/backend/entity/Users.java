package com.my.backend.entity;

import com.my.backend.enums.Role;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import java.time.LocalDateTime;
import java.util.List;

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
    @Pattern(regexp = "^[가-힣a-zA-Z]+$")
    private String userName;

    @NotBlank
    @Pattern(regexp = "^[가-힣a-zA-Z0-9]{3,12}+$", message = "닉네임은 3~12자여야 합니다.")
    @Column(unique = true)
    private String nickName;

    @NotBlank
    private String password;

    @Column(unique = true)
    @NotBlank
    @Pattern(regexp = "^\\d{10,11}$", message = "전화번호는 숫자만 10~11자리여야 합니다.")
    private String phone;

    //example@ (도메인 없음)
    //example.com (골뱅이 없음)
    //@domain.com (아이디 없음) 이런거 허용안함
    @NotBlank
    @Email(
            regexp = "^[a-zA-Z0-9]+@[a-zA-Z0-9]+\\.[a-zA-Z]{2,}$",
            message = "올바른 이메일 형식이 아닙니다.")
    @Column(unique = true)
    private String email;

    @Column(nullable = false)
    private LocalDateTime birthday;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @ManyToOne
    @JoinColumn(name = "address_id")
    private Address address;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "email_verification_id")
    private EmailVerification emailVerification;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "phone_verification_id")
    private PhoneVerification phoneVerification;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "image_id")
    private List<Image> image;
}
