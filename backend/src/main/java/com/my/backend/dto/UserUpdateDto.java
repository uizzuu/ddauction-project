package com.my.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserUpdateDto {
    private String nickName;
    private String password;
    private String phone;
}
