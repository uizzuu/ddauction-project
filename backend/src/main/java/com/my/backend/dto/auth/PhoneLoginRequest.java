package com.my.backend.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PhoneLoginRequest {
    @NotBlank(message = "전화번호는 필수입니다")
    private String phone;
    @NotBlank(message = "비밀번호는 필수입니다")
    private String password;
}