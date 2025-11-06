package com.my.backend.myjwt;

import com.my.backend.dto.auth.CustomUserDetails;
import com.my.backend.entity.User;
import io.jsonwebtoken.io.IOException;
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
        if (path.startsWith("/api/auth/") ||
                path.startsWith("/oauth2/") ||
                "OPTIONS".equalsIgnoreCase(request.getMethod()) ||
                path.startsWith("/uploads/") ||
                path.startsWith("/api/categories")) {
            filterChain.doFilter(request, response);
            return;
        }

        String authorization = request.getHeader("Authorization");

// 🔹 JWT 없으면 401 반환
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"error\":\"Missing or invalid Authorization header\"}");
            return;
        }

        String token = authorization.substring(7);

// 🔹 토큰 만료 시 401 반환
        if (jwtUtil.isExpired(token)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"error\":\"Token expired\"}");
            return;
        }

        Long userId = jwtUtil.getUserId(token);
        String userEmail = jwtUtil.getEmail(token);
        String role = jwtUtil.getRole(token);

        User user = new User();
        user.setUserId(userId);
        user.setEmail(userEmail);
        user.setRole(User.Role.valueOf(role));

        CustomUserDetails customUserDetails = new CustomUserDetails(user);

        // 권한 강제 세팅
        List<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));

        Authentication authToken = new UsernamePasswordAuthenticationToken(customUserDetails, null, authorities);
        SecurityContextHolder.getContext().setAuthentication(authToken);

        System.out.println("Authentication set: " + SecurityContextHolder.getContext().getAuthentication());

        filterChain.doFilter(request, response);
    }
}