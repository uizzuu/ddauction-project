package com.my.backend.dto.kakao;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class KakaoPayApproveResponse {
    
    @JsonProperty("aid")
    private String aid;
    
    @JsonProperty("tid")
    private String tid;
    
    @JsonProperty("item_name")
    private String itemName;
    
    @JsonProperty("amount")
    private Amount amount;
    
    @JsonProperty("approved_at")
    private String approvedAt;
    
    @Data
    public static class Amount {
        @JsonProperty("total")
        private Integer total;
    }
}
