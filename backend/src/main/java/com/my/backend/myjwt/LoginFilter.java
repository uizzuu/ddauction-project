package com.my.backend.myjwt;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.my.backend.dto.auth.CustomUserDetails;
import com.my.backend.dto.auth.LoginRequest;
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

        //클라이언트 요청에서 username, password 추출 -> username을 사용할 경우
        // String username = obtainUsername(request);
        // String password = obtainPassword(request);

        System.out.println("==== LoginFilter: attemptAuthentication START ====");
        System.out.println("[DEBUG] 요청 URI: " + request.getRequestURI());
        System.out.println("[DEBUG] 요청 Method: " + request.getMethod());
        System.out.println("[DEBUG] Content-Type: " + request.getContentType());
        System.out.println("[DEBUG] 요청 헤더 Authorization: " + request.getHeader("Authorization"));

        try {
            ObjectMapper objectMapper = new ObjectMapper();
            LoginRequest loginRequest = objectMapper.readValue(
                    request.getInputStream(), LoginRequest.class);

            String email = loginRequest.getEmail();
            String password = loginRequest.getPassword();

            System.out.println("[DEBUG] 파싱된 email: " + email);
            System.out.println("[DEBUG] 파싱된 password: " + (password != null ? "******" : null));

            UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(email, password, null);

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
                                            Authentication authentication) {
        System.out.println("==== successfulAuthentication START ====");
        System.out.println("[INFO] 로그인 성공");

        CustomUserDetails customUserDetails = (CustomUserDetails) authentication.getPrincipal();
        System.out.println("[DEBUG] customUserDetails = " + customUserDetails);
        System.out.println("[DEBUG] userEmail = " + customUserDetails.getEmail());

        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
        System.out.println("[DEBUG] authorities = " + authorities);
        String role = authorities.stream().findFirst().map(GrantedAuthority::getAuthority).orElse("ROLE_NONE");
        System.out.println("[DEBUG] role = " + role);

        String token = jwtUtil.createJwt(customUserDetails.getEmail(), role, 60 * 60 * 24L);
        System.out.println("[DEBUG] token = " + token);

        if (token != null) {
            response.addHeader("Authorization", "Bearer " + token);
            response.setStatus(200); // ✅ 명시적으로 200 설정
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