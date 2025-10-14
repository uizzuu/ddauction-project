package com.my.backend.dto;

import lombok.Data;

import java.util.List;

@Data
public class KakaoApiResponseDto {
    private List<DocumentDto> documents;
}