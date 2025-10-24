package com.my.backend.dto.portone;

import lombok.Data;

@Data
public class PortOneTokenResponse {
    private Integer code;
    private String message;
    private Response response;

    @Data
    public static class Response {
        private String access_token;
        private Long expired_at;
        private Long now;
    }
}