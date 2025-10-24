package com.my.backend.security;

import com.my.backend.config.JwtProperties;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Collections;
import java.util.Date;

/**
 * JWT 토큰 생성 및 검증 (JJWT 0.12.x 이상)
 */
@Slf4j
@Component
@RequiredArgsConstructor
@EnableConfigurationProperties(JwtProperties.class)
public class JwtTokenProvider {

    private final JwtProperties jwtProperties;

    /**
     * SecretKey 생성
     */
//    private SecretKey getSigningKey() {
//        byte[] keyBytes = jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8);
//        return Keys.hmacShaKeyFor(keyBytes);
//    }
    private SecretKey getSigningKey() {
        byte[] keyBytes = Base64.getDecoder().decode(jwtProperties.getSecret());
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Access Token 생성
     */
    public String createAccessToken(Long userId, String role) {
        Date now = new Date();
        Date expiration = new Date(now.getTime() + jwtProperties.getAccessTokenExpiration());

        return Jwts.builder()
                .subject(String.valueOf(userId))       // setSubject() → subject()
                .claim("role", role)
                .issuedAt(now)                         // setIssuedAt() → issuedAt()
                .expiration(expiration)                // setExpiration() → expiration()
                .signWith(getSigningKey(), Jwts.SIG.HS256) // SignatureAlgorithm.HS256 → Jwts.SIG.HS256
                .compact();
    }

    /**
     * Refresh Token 생성
     */
    public String createRefreshToken(Long userId) {
        Date now = new Date();
        Date expiration = new Date(now.getTime() + jwtProperties.getRefreshTokenExpiration());

        return Jwts.builder()
                .subject(String.valueOf(userId))
                .issuedAt(now)
                .expiration(expiration)
                .signWith(getSigningKey(), Jwts.SIG.HS256)
                .compact();
    }

    /**
     *  토큰 검증 (JJWT 0.12.x 스타일)
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()                     // parserBuilder() → parser()
                    .verifyWith(getSigningKey()) // setSigningKey() → verifyWith()
                    .build()
                    .parseSignedClaims(token);   // parseClaimsJws() → parseSignedClaims()
            return true;
        } catch (SecurityException | MalformedJwtException e) {
            log.warn("잘못된 JWT 서명입니다.");
        } catch (ExpiredJwtException e) {
            log.warn("만료된 JWT 토큰입니다.");
        } catch (UnsupportedJwtException e) {
            log.warn("지원되지 않는 JWT 토큰입니다.");
        } catch (IllegalArgumentException e) {
            log.warn("JWT 토큰이 잘못되었습니다.");
        }
        return false;
    }

    /**
     * 토큰에서 userId 추출
     */
    public Long getUserIdFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload(); // getBody() → getPayload()

        return Long.parseLong(claims.getSubject());
    }

    /**
     * 토큰에서 role 추출
     */
    public String getRoleFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return claims.get("role", String.class);
    }

    /**
     * 토큰에서 Authentication 객체 생성
     */
    public Authentication getAuthentication(String token) {
        Long userId = getUserIdFromToken(token);
        String role = getRoleFromToken(token);

        SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + role);

        return new UsernamePasswordAuthenticationToken(
                userId.toString(),
                null,
                Collections.singletonList(authority)
        );
    }
}
