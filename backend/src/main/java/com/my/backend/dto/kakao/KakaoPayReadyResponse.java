package com.my.backend.dto.kakao;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class KakaoPayReadyResponse {
    
    @JsonProperty("tid")
    private String tid;
    
    @JsonProperty("next_redirect_pc_url")
    private String nextRedirectPcUrl;
    
    @JsonProperty("next_redirect_mobile_url")
    private String nextRedirectMobileUrl;
    
    @JsonProperty("created_at")
    private String createdAt;
}
