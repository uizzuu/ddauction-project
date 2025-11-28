package com.my.backend.dto.auth;

import com.my.backend.enums.Role;
import jakarta.validation.constraints.*;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;

@Getter
@Setter
@Builder
public class RegisterRequest {

    @NotBlank(message = "이름은 필수입니다")
    @Size(min = 2, max = 10, message = "이름은 2~10자여야 합니다")
    @Pattern(regexp = "^[가-힣a-zA-Z]+$",
            message = "이름은 한글 또는 영어만 입력 가능합니다")
    private String userName;

    @NotBlank(message = "닉네임은 필수입니다")
    @Size(min = 3, max = 12, message = "닉네임은 3~12자여야 합니다")
    @Pattern(regexp = "^[가-힣a-zA-Z0-9]+$",
            message = "닉네임은 한글, 영어, 숫자만 입력 가능합니다")
    private String nickName;

    @NotBlank(message = "비밀번호는 필수입니다")
    @Size(min = 8, max = 100, message = "비밀번호는 8자 이상이어야 합니다")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+$",
            message = "비밀번호는 대소문자, 숫자, 특수문자(@$!%*?&)를 포함해야 합니다")
    private String password;

    @NotBlank(message = "전화번호는 필수입니다")
    @Pattern(regexp = "^\\d{10,11}$",
            message = "올바른 전화번호 형식이 아닙니다 (예: 01012345678)")
    private String phone;

    @NotBlank(message = "이메일은 필수입니다")
    @Email(message = "올바른 이메일 형식이 아닙니다")
    private String email;

    @NotNull
    @Past(message = "생년월일은 과거 날짜여야 합니다.")
    private LocalDate birthday;

    @NotBlank(message = "주소는 필수입니다")
    private String address;

    // 회원가입 시 기본 ROLE 지정 가능 (보통 USER)
    private Role role = Role.USER;

    // 주소 관련 필드 추가
    private String zipCode;       // 우편번호
    private String detailAddress; // 상세 주소
}