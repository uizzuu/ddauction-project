package com.my.backend.myjwt;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.my.backend.dto.auth.CustomUserDetails;
import com.my.backend.dto.auth.LoginRequest;
import com.my.backend.dto.auth.PhoneLoginRequest;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.io.IOException;
import java.util.Collection;

import com.my.backend.enums.Role;

public class LoginFilter extends UsernamePasswordAuthenticationFilter {

    private final JWTUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public LoginFilter(JWTUtil jwtUtil, AuthenticationManager authenticationManager) {
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
    }

    @Override
    public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response)
            throws AuthenticationException {

        System.out.println("==== LoginFilter: attemptAuthentication START ====");
        System.out.println("[DEBUG] 요청 URI: " + request.getRequestURI());
        System.out.println("[DEBUG] 요청 Method: " + request.getMethod());
        System.out.println("[DEBUG] Content-Type: " + request.getContentType());

        try {
            ObjectMapper objectMapper = new ObjectMapper();
            UsernamePasswordAuthenticationToken authToken;

            if (request.getRequestURI().contains("/phone")) {
                // 📱 핸드폰 로그인 처리
                PhoneLoginRequest loginRequest = objectMapper.readValue(
                        request.getInputStream(), PhoneLoginRequest.class);
                String phone = loginRequest.getPhone();
                String password = loginRequest.getPassword();
                System.out.println("[DEBUG] 파싱된 phone: " + phone);
                System.out.println("[DEBUG] 파싱된 password: " + (password != null ? "******" : null));

                authToken = new UsernamePasswordAuthenticationToken(phone, password, null);
            } else {
                // 📧 이메일 로그인 처리
                LoginRequest loginRequest = objectMapper.readValue(
                        request.getInputStream(), LoginRequest.class);
                String email = loginRequest.getEmail();
                String password = loginRequest.getPassword();
                System.out.println("[DEBUG] 파싱된 email: " + email);
                System.out.println("[DEBUG] 파싱된 password: " + (password != null ? "******" : null));

                authToken = new UsernamePasswordAuthenticationToken(email, password, null);
            }

            Authentication auth = authenticationManager.authenticate(authToken);
            System.out.println("[DEBUG] Authentication 객체 생성 성공: " + auth);
            System.out.println("==== LoginFilter: attemptAuthentication END ====");
            return auth;

        } catch (IOException e) {
            System.out.println("[ERROR] attemptAuthentication IOException: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException(e);
        } catch (AuthenticationException e) {
            System.out.println("[ERROR] attemptAuthentication AuthenticationException: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @Override
    protected void successfulAuthentication(HttpServletRequest request,
                                            HttpServletResponse response,
                                            FilterChain chain,
                                            Authentication authentication) throws IOException {
        System.out.println("==== successfulAuthentication START ====");
        System.out.println("[INFO] 로그인 성공");

        CustomUserDetails customUserDetails = (CustomUserDetails) authentication.getPrincipal();
        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();

        String roleStr = authorities.stream()
                .findFirst()
                .map(GrantedAuthority::getAuthority)
                .orElse("ROLE_USER");

        String normalizedRole = roleStr.replace("ROLE_", "").trim().toUpperCase();

        Role roleEnum;
        try {
            roleEnum = Role.valueOf(normalizedRole);
        } catch (IllegalArgumentException e) {
            roleEnum = Role.USER;
        }

        long expiredMs = 24 * 60 * 60 * 1000L; // 24시간
        String token = jwtUtil.createJwt(
                customUserDetails.getUser().getUserId(),
                customUserDetails.getEmail(),
                roleEnum,
                customUserDetails.getNickName(),
                customUserDetails.getUser().getBusinessNumber(),
                expiredMs
        );

        if (token != null) {
            response.setContentType("application/json;charset=UTF-8");
            response.setStatus(HttpServletResponse.SC_OK);
            response.addHeader("Authorization", "Bearer " + token);
            response.getWriter().write("{\"token\":\"" + token + "\"}");
            response.getWriter().flush();
            System.out.println("[INFO] JWT 토큰 헤더에 추가 완료");
        } else {
            System.out.println("[ERROR] JWT token 생성 실패");
        }

        System.out.println("==== successfulAuthentication END ====");
    }

    @Override
    protected void unsuccessfulAuthentication(HttpServletRequest request,
                                              HttpServletResponse response,
                                              AuthenticationException failed) {
        System.out.println("==== unsuccessfulAuthentication START ====");
        System.out.println("[WARN] 로그인 실패");
        System.out.println("[WARN] 실패 메시지: " + failed.getMessage());
        failed.printStackTrace();

        response.setStatus(401);
        System.out.println("==== unsuccessfulAuthentication END ====");
    }
}
