package com.my.backend.dto.board;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.gson.annotations.SerializedName;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Builder
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class BidResponse {

    @SerializedName("bidId")
    @JsonProperty(value = "bidId")
    @NotNull
    private Long bidId;

    @SerializedName("productId")
    @JsonProperty(value = "productId")
    @NotNull
    private Long productId;

    @SerializedName("userId")
    @JsonProperty(value = "userId")
    @NotNull
    private Long userId;

    @SerializedName("bidPrice")
    @JsonProperty(value = "bidPrice")
    @NotNull
    private Long bidPrice;

    @SerializedName("createdAt")
    @JsonProperty(value = "createdAt")
    @NotNull
    private String createdAt;

}
