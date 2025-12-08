package com.my.backend.myjwt;

import java.io.IOException;
import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import com.my.backend.dto.auth.CustomUserDetails;
import com.my.backend.entity.Users;
import com.my.backend.enums.Role;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class JWTFilter extends OncePerRequestFilter {
    private final JWTUtil jwtUtil;

    public JWTFilter(JWTUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();

        // 1. JWT 검사 제외 경로 (필요 시 수정)
        // 여기에 "/api/qna/" 등을 굳이 넣지 않아도 아래 로직이 안전하면 괜찮습니다.
        if (path.startsWith("/api/auth/login") ||
                path.equals("/api/auth/signup") ||
                path.startsWith("/oauth2/") ||
                path.startsWith("/login/oauth2/") ||
                "OPTIONS".equalsIgnoreCase(request.getMethod()) ||
                path.startsWith("/uploads/") ||
                path.startsWith("/api/qrcode/") ||
                path.startsWith("/api/autocomplete") ||
                path.startsWith("/api/search/log") ||
                path.startsWith("/ai/") ||
                path.startsWith("/api/autocomplete?") ||
                path.equals("/api/auth/verify-email") ||
                path.equals("/api/auth/register")

        ){
            System.out.println("✅ JWT 필터 스킵: " + path);
            filterChain.doFilter(request, response);
            return;
        }

        // 2. 헤더가 없으면 통과 (비로그인 요청 허용)
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 3. 토큰 검증 (전체를 try-catch로 감싸서 안전하게 처리)
        try {
            String token = authorization.substring(7);

            // 토큰 만료 여부 확인
            if (jwtUtil.isExpired(token)) {
                System.out.println("⚠️ 토큰 만료됨");
                // 만료된 경우 명시적 401 응답
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"error\": \"Token Expired\", \"message\": \"Access token has expired.\"}");
                return;
            }

            Long userId = jwtUtil.getUserId(token);
            String userEmail = jwtUtil.getEmail(token);
            String role = jwtUtil.getRole(token);

            System.out.println("✅ JWT 토큰 검증 성공: [" + request.getMethod() + " " + request.getRequestURI() + "] userId=" + userId);
            Users user = new Users();
            user.setUserId(userId);
            user.setEmail(userEmail);
            user.setRole(Role.valueOf(role));

            CustomUserDetails customUserDetails = new CustomUserDetails(user);

            List<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));
            Authentication authToken = new UsernamePasswordAuthenticationToken(customUserDetails, null, authorities);

            // 인증 정보 저장
            SecurityContextHolder.getContext().setAuthentication(authToken);

        } catch (Exception e) {
            // 🚨 토큰 파싱 에러 시 401 응답에 메시지 포함
            System.out.println("❌ JWT 검증 실패: " + e.getMessage());
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"error\": \"JWT Error\", \"message\": \"" + e.getMessage() + "\"}");
            return; // 필터 체인 중단
        }

        // 4. 다음 필터로 진행
        filterChain.doFilter(request, response);
    }
}