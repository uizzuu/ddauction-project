package com.my.backend.oauth2;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class OAuth2FailureHandler implements AuthenticationFailureHandler {

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationFailure(HttpServletRequest request,
                                        HttpServletResponse response,
                                        AuthenticationException exception) throws IOException {

        System.out.println("🔴 OAuth2FailureHandler 실행됨!");

        String message;

        if (exception instanceof OAuth2AuthenticationException oauth2Ex) {
            OAuth2Error error = oauth2Ex.getError();
            String desc = error.getDescription();

            System.out.println("🔴 에러코드: " + error.getErrorCode());
            System.out.println("🔴 설명: " + desc);

            if (desc != null && desc.startsWith("SOCIAL_CONFLICT:")) {
                String provider = desc.split(":")[1];
                String providerName = getProviderDisplayName(provider);
                message = "이미 " + providerName + "(으)로 가입된 이메일입니다. " + providerName + " 로그인을 이용해주세요.";

            } else if (desc != null && desc.startsWith("EMAIL_SIGNUP:")) {
                message = "이미 이메일로 가입된 계정입니다. 이메일 로그인을 이용해주세요.";

            } else if (desc != null && desc.contains("탈퇴한 회원")) {
                message = "탈퇴한 회원입니다.";

            } else {
                message = "소셜 로그인에 실패했습니다.";
            }
        } else {
            message = "소셜 로그인에 실패했습니다.";
        }

        String redirectUrl = frontendUrl + "/oauth2/redirect?error=" + URLEncoder.encode(message, StandardCharsets.UTF_8);
        System.out.println("🔄 리다이렉트: " + redirectUrl);
        response.sendRedirect(redirectUrl);
    }

    private String getProviderDisplayName(String provider) {
        return switch (provider.toLowerCase()) {
            case "naver" -> "네이버";
            case "kakao" -> "카카오";
            case "google" -> "구글";
            default -> provider;
        };
    }
}