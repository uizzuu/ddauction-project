package com.my.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BusinessVerifyDto {
    private String businessNumber;   // 요청용
    private boolean valid;           // 응답용
    private String newToken;
}
