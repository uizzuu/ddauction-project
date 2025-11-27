package com.my.backend.myjwt;

import com.my.backend.enums.Role;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

@Component
public class JWTUtil {
    private final SecretKey secretKey;

    public JWTUtil(@Value("${jwt.secret}")String secret) {
        this.secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8),
                Jwts.SIG.HS256.key().build().getAlgorithm());
    }

    public Long getUserId(String token) {
        return Jwts.parser().verifyWith(secretKey).build().
            parseSignedClaims(token).getPayload().get("userId", Long.class);
    }

    public String getEmail(String token) {
        return Jwts.parser().verifyWith(secretKey).build().
                parseSignedClaims(token).getPayload().get("email", String.class);
    }

    public String getRole(String token) {
        return Jwts.parser().verifyWith(secretKey).build().
                parseSignedClaims(token).getPayload().get("role", String.class);
    }

    public Boolean isExpired(String token) {
        return Jwts.parser().verifyWith(secretKey).build().
                parseSignedClaims(token).getPayload().getExpiration().before(new Date());
    }

    public String createJwt(Long userId, String email, Role role, String nickName, Long expiredMs) {
        Map<String, Object> claims = Map.of(
                "userId",userId,
                "email", email,
                "role", role,
                "nickName", nickName
        );
        return createJwt(claims, expiredMs); // 이미 Map 기반 메서드로 처리
    }
    public String createJwt(Map<String, Object> claims, Long expiredMs) {
        return Jwts.builder()
                .setClaims(claims)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expiredMs))
                .signWith(secretKey)
                .compact();
    }


    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            System.out.println("Invalid JWT token: " + e.getMessage());
            return false;
        }
    }
}
