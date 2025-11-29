package com.my.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * AI 상품 설명 생성 요청 DTO
 * Python FastAPI의 ProductRequest 모델과 매핑됨
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiDescriptionRequest {

    /**
     * 상품명 (필수)
     */
    @JsonProperty("product_name")
    private String productName;

    /**
     * 키워드 리스트 (예: ["고급스러운", "내구성", "친환경"])
     */
    @JsonProperty("keywords")
    private List<String> keywords;

    /**
     * 타겟 고객 (예: "20-30대 여성", "직장인")
     */
    @JsonProperty("target_audience")
    private String targetAudience;

    /**
     * 톤앤매너 (예: "전문적인", "친근한")
     */
    @JsonProperty("tone")
    private String tone;
}