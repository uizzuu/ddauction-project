package com.my.backend.dto.auth;

import lombok.*;

@Getter
@Setter
@Builder
@AllArgsConstructor
public class TokenResponse {
    private String accessToken;
    private String refreshToken;
}
