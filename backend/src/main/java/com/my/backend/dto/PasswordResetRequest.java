package com.my.backend.dto;

import lombok.Data;

@Data
public class PasswordResetRequest {
    private String email;
    private String phone;
    private String userName;    // 실명
    private String newPassword;
}