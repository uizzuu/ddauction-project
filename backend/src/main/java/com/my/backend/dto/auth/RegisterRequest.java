package com.my.backend.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    // [필수] 로그인 아이디 (username)
    private String username;

    // [필수] 닉네임 (nickName)
    private String nickname;

    // [필수] 비밀번호 (password)
    private String password;

    // 💡 [필수] 비밀번호 확인 (passwordConfirm)
    private String passwordConfirm;

    // [필수] 이메일 (email)
    private String email;

    // [선택] 전화번호 (phone)
    private String phone;
}