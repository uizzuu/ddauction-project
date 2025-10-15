package com.my.backend.dto;

import lombok.Data;

@Data
public class SignupRequest {
    private String userName;
    private String nickName;
    private String email;
    private String password;
    private String phone;
}