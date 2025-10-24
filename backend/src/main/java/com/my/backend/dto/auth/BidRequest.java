// dto/auth/BidRequest.java
package com.my.backend.dto.auth;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class BidRequest {

    @NotNull(message = "상품 ID는 필수입니다.")
    @Positive(message = "올바른 상품 ID가 아닙니다.")
    private Long productId;

    @NotNull(message = "입찰가는 필수입니다.")
    @Min(value = 1000, message = "입찰가는 최소 1,000원 이상이어야 합니다.")
    private Long bidPrice;

    private Long userId;
}