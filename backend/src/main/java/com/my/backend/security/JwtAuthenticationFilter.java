package com.my.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final UserDetailsService userDetailsService;

    private static final AntPathMatcher PATH_MATCHER = new AntPathMatcher();

    /** 공개 경로는 아예 필터를 타지 않게 */
    private static final String[] SKIP_PATHS = {
            "/api/auth/**", "/ws/**", "/error", "/favicon.ico"
//            "/api/products", "/api/products/**"
    };

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String uri = request.getRequestURI();
        for (String p : SKIP_PATHS) {
            if (PATH_MATCHER.match(p, uri)) return true;
        }
        return false;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        String token = resolveToken(request);

        // 토큰이 없거나 형식이 아니면: 그대로 통과 (permitAll은 200, 보호된 곳은 뒤에서 401)
        if (!StringUtils.hasText(token)) {
            chain.doFilter(request, response);
            return;
        }

        try {
            if (tokenProvider.validateToken(token)) {
                Long userId = tokenProvider.getUserIdFromToken(token);

                // 주의: CustomUserDetailsService가 userId 문자열을 username처럼 받아들이도록 구현되어 있어야 함
                UserDetails userDetails = userDetailsService.loadUserByUsername(String.valueOf(userId));

                Authentication auth = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                ((UsernamePasswordAuthenticationToken) auth)
                        .setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(auth);
            } else {
                // 유효하지 않은 토큰이어도 여기서 401 만들지 않음
                log.debug("Invalid JWT token");
            }
        } catch (Exception ex) {
            // 파싱/조회 오류가 있어도 공개 경로를 막지 않도록 필터에서 예외로 응답하지 않음
            log.warn("JWT processing skipped: {}", ex.getMessage());
        }

        chain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (StringUtils.hasText(bearer) && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }
}
