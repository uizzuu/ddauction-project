package com.my.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {
    // Security 설정
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())   // CSRF 비활성화 (POST 테스트 가능)
                .cors(cors -> {})               // 외부 CorsConfig 적용
                .authorizeHttpRequests(auth -> auth
                        .anyRequest().permitAll()   // 모든 요청 허용
                )
                .formLogin(form -> form.disable()); // 기본 로그인 폼 비활성화

        return http.build();
    }

    // PasswordEncoder 빈
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}