package com.my.backend.oauth2;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.my.backend.dto.auth.CustomOAuth2User;
import com.my.backend.enums.Role;
import com.my.backend.myjwt.JWTUtil;
import org.springframework.beans.factory.annotation.Value;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final JWTUtil jwtUtil;
    private final ObjectMapper objectMapper;
    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        System.out.println("🟢 OAuth2SuccessHandler 실행됨!");  // ✅ 추가
        System.out.println("Authentication Principal: " + authentication.getPrincipal());  // ✅ 추가

        try {
            CustomOAuth2User oauthUser = (CustomOAuth2User) authentication.getPrincipal();

            Long userId = oauthUser.getUserId();
            String email = oauthUser.getEmail() != null ? oauthUser.getEmail() : "kakao@noemail.com";
            String nickName = oauthUser.getNickName() != null ? oauthUser.getNickName() : "KakaoUser";

            // String role을 Role enum으로 변환
            String roleStr = oauthUser.getRole();
            Role roleEnum;
            try {
                roleEnum = Role.valueOf(roleStr.replace("ROLE_", ""));
            } catch (IllegalArgumentException e) {
                roleEnum = Role.USER; // 안전하게 기본값
            }
            System.out.println("✅ OAuth2 사용자 정보: email=" + email + ", roleEnum=" + roleEnum);
            // JWT 생성
            String jwtToken = jwtUtil.createJwt(userId, email, roleEnum, nickName, 60 * 60 * 1000L);
            System.out.println("✅ JWT 토큰 생성 완료");
            // React 앱 URL로 리다이렉트 + 토큰 전달
            String redirectUrl = frontendUrl + "/oauth2/redirect?token=" + jwtToken;
            System.out.println("🔄 리다이렉트 URL: " + redirectUrl);
            response.sendRedirect(redirectUrl);
            System.out.println("✅ 리다이렉트 완료");

        } catch (Exception e) {
            System.err.println("❌ OAuth2SuccessHandler 에러: " + e.getMessage());  // ✅ 추가
            e.printStackTrace();
            throw e;
        }
    }

}
