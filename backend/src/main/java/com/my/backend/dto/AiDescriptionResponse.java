package com.my.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * AI 상품 설명 생성 응답 DTO
 * Python FastAPI의 응답 형식과 매핑됨
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiDescriptionResponse {

    /**
     * AI가 생성한 상품 설명 텍스트
     */
    private String description;
}