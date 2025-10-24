package com.my.backend.dto.product;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProductCreateRequest {

    @NotBlank(message = "상품명은 필수입니다.")
    @Size(min = 2, max = 100, message = "상품명은 2~100자여야 합니다.")
    private String title;

    @NotBlank(message = "상품 설명은 필수입니다.")
    @Size(min = 10, max = 5000, message = "상품 설명은 10~5000자여야 합니다.")
    private String content;

    @NotNull(message = "시작가는 필수입니다.")
    @Min(value = 1000, message = "시작가는 최소 1,000원 이상이어야 합니다.")
    private Long price;

    private String imageUrl;

    private Boolean oneMinuteAuction;
}