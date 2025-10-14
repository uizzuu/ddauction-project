package com.my.backend.dto;

import lombok.Data;

@Data
public class DocumentDto {
    private String place_name; // 약국명
    private String distance;
    private String x; // 경도
    private String y; // 위도
}