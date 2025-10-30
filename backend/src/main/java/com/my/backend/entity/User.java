package com.my.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "user")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Data
@EntityListeners(AuditingEntityListener.class)
public class User {
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

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @ManyToOne
    @JoinColumn(name = "address_id")
    private Address address;

    public enum Role {
        USER, ADMIN, BANNED
    }
}
