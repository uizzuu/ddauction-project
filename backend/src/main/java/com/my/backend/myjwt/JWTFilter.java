package com.my.backend.myjwt;

import com.my.backend.dto.auth.CustomUserDetails;
import com.my.backend.entity.Users;
import com.my.backend.enums.Role;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.util.List;

public class JWTFilter extends OncePerRequestFilter {
    private final JWTUtil jwtUtil;

    public JWTFilter(JWTUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, java.io.IOException {

        String path = request.getRequestURI();

        System.out.println("🔹 JWTFilter request: " + request.getMethod() + " " + request.getRequestURI() +
                " Authorization: " + request.getHeader("Authorization"));

        // JWT 검사 제외 경로
        if (path.startsWith("/api/auth/login") ||
                path.equals("/api/auth/signup") ||
                path.startsWith("/oauth2/") ||
                path.startsWith("/login/oauth2/") ||
                "OPTIONS".equalsIgnoreCase(request.getMethod()) ||
                path.startsWith("/uploads/")||
                path.startsWith("/api/qrcode/")||
                path.startsWith("/api/autocomplete?") ||
                path.startsWith("/api/chats/") ||
                path.equals("/api/autocomplete") ||
                path.startsWith("/ai/") ||
                path.equals("/api/auth/verify-email") ||
                path.equals("/api/auth/register")

        ){
            System.out.println("✅ JWT 필터 스킵: " + path);
            filterChain.doFilter(request, response);
            return;
        }

        String authorization = request.getHeader("Authorization");

        // ❌ Authorization 헤더가 없거나 Bearer가 없으면 그냥 통과 (SecurityConfig에서 처리)
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            System.out.println("⚠️ Authorization 헤더 없음 또는 Bearer 없음");
            filterChain.doFilter(request, response);
            return;
        }

        String token = authorization.substring(7);
        if (jwtUtil.isExpired(token)) {
            filterChain.doFilter(request, response);
            return;
        }

        // 예외 처리 추가
        try {
            if (jwtUtil.isExpired(token)) {
                System.out.println("⚠️ 토큰 만료됨");
                filterChain.doFilter(request, response);
                return;
            }

            Long userId = jwtUtil.getUserId(token);
            String userEmail = jwtUtil.getEmail(token);
            String role = jwtUtil.getRole(token);

            System.out.println("✅ JWT 토큰 검증 성공: userId=" + userId + ", role=" + role);

            Users user = new Users();
            user.setUserId(userId);
            user.setEmail(userEmail);
            user.setRole(Role.valueOf(role));

            CustomUserDetails customUserDetails = new CustomUserDetails(user);

            // 권한 강제 세팅
            List<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));

            Authentication authToken = new UsernamePasswordAuthenticationToken(customUserDetails, null, authorities);
            SecurityContextHolder.getContext().setAuthentication(authToken);

            System.out.println("✅ Authentication 설정 완료: " + authToken.getPrincipal());

        } catch (Exception e) {
            System.err.println("❌ JWT 검증 중 예외 발생: " + e.getMessage());
            e.printStackTrace();
            // 예외 발생해도 계속 진행 (SecurityConfig에서 401 처리)
        }

        filterChain.doFilter(request, response);
    }
}