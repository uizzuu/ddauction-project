package com.my.backend.oauth2;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import com.my.backend.dto.auth.CustomOAuth2User;
import com.my.backend.enums.Role;
import com.my.backend.myjwt.JWTUtil;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final JWTUtil jwtUtil;
    private final com.my.backend.repository.UserBanRepository userBanRepository;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        System.out.println("🟢 OAuth2SuccessHandler 실행됨!");
        System.out.println("Authentication Principal: " + authentication.getPrincipal());

        try {
            CustomOAuth2User oauthUser = (CustomOAuth2User) authentication.getPrincipal();

            Long userId = oauthUser.getUserId();
            String email = oauthUser.getEmail() != null ? oauthUser.getEmail() : "kakao@noemail.com";
            String nickName = oauthUser.getNickName() != null ? oauthUser.getNickName() : "KakaoUser";
            String businessNumber = oauthUser.getBusinessNumber();

            // String role을 Role enum으로 변환
            String roleStr = oauthUser.getRole();
            Role roleEnum;
            try {
                roleEnum = Role.valueOf(roleStr.replace("ROLE_", ""));
            } catch (IllegalArgumentException e) {
                roleEnum = Role.USER; // 안전하게 기본값
            }

            // 영구 정지(Role) 확인
            if (roleEnum == Role.BANNED) {
                redirectWithError(response, "영구 정지된 계정입니다. 고객센터에 문의해주세요.");
                return;
            }

            // 기간 정지(UserBan) 확인
            if (userBanRepository.existsByUser_UserIdAndActiveTrue(userId)) {
                userBanRepository.findActiveByUserId(userId).ifPresent(ban -> {
                   if (ban.isExpired()) {
                       if (!ban.isExpired()) {
                           String msg = "서비스 이용이 정지된 계정입니다.";
                           if (ban.getBanUntil() != null) {
                               msg += " (해제일: " + ban.getBanUntil().toLocalDate() + ")";
                           }
                           try {
                               redirectWithError(response, msg);
                           } catch (IOException e) {
                               throw new RuntimeException(e);
                           }
                       }
                   }
                });
            }
            var activeBan = userBanRepository.findActiveByUserId(userId).orElse(null);
            if (activeBan != null) {
                if (activeBan.isExpired()) {
                    // 만료되었으면 해제 (DB 업데이트)
                    activeBan.setActive(false);
                    userBanRepository.save(activeBan); 
                } else {
                    String msg = "서비스 이용이 정지된 계정입니다.";
                    if (activeBan.getBanUntil() != null) {
                        msg += " (해제일: " + activeBan.getBanUntil().toLocalDate() + ")";
                    }
                    redirectWithError(response, msg);
                    return;
                }
            }


            System.out.println("✅ OAuth2 사용자 정보: email=" + email + ", roleEnum=" + roleEnum + ", businessNumber=" + businessNumber);
            // JWT 생성
            String jwtToken = jwtUtil.createJwt(userId, email, roleEnum, nickName, businessNumber, 24 * 60 * 60 * 1000L);
            System.out.println("✅ JWT 토큰 생성 완료: " + jwtToken); // 토큰 로그 출력

            // URL 인코딩 (안전하게 전달하기 위함)
            String encodedToken = java.net.URLEncoder.encode(jwtToken, java.nio.charset.StandardCharsets.UTF_8);

            // React 앱 URL로 리다이렉트 + 토큰 전달
            String redirectUrl = frontendUrl + "/oauth2/redirect?token=" + encodedToken;

            System.out.println("🔄 리다이렉트 URL: " + redirectUrl);

            response.setContentType("text/html;charset=UTF-8"); // 컨텐츠 타입 명시
            response.sendRedirect(redirectUrl);
            System.out.println("✅ 리다이렉트 완료");

        } catch (Exception e) {
            System.err.println("❌ OAuth2SuccessHandler 에러: " + e.getMessage());
            throw new RuntimeException(e);
        }

    }

    private void redirectWithError(HttpServletResponse response, String message) throws IOException {
        String encodedMessage = java.net.URLEncoder.encode(message, java.nio.charset.StandardCharsets.UTF_8);
        String redirectUrl = frontendUrl + "/oauth2/redirect?error=banned&message=" + encodedMessage;
        
        System.out.println("⛔ 정지된 계정 리다이렉트: " + redirectUrl);
        response.setContentType("text/html;charset=UTF-8");
        response.sendRedirect(redirectUrl);
    }
}
