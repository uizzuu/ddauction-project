package com.my.backend.dto.portone;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PortOneTokenResponse {
    private Integer code;
    private String message;
    private Response response;

    @Getter
    @Setter
    public static class Response {
        private String access_token;
        private Long expired_at;
        private Long now;
    }
}