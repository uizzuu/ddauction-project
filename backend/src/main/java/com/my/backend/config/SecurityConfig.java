package com.my.backend.config;

import com.my.backend.myjwt.JWTFilter;
import com.my.backend.myjwt.JWTUtil;
import com.my.backend.myjwt.LoginFilter;
import com.my.backend.oauth2.OAuth2SuccessHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final AuthenticationConfiguration authenticationConfiguration;
    private final JWTUtil jwtUtil;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;

    @Value("${spring.profiles.active:local}")
    private String activeProfile;

    public SecurityConfig(AuthenticationConfiguration authenticationConfiguration,
                          JWTUtil jwtUtil,
                          OAuth2SuccessHandler oAuth2SuccessHandler) {
        this.authenticationConfiguration = authenticationConfiguration;
        this.jwtUtil = jwtUtil;
        this.oAuth2SuccessHandler = oAuth2SuccessHandler;
    }

    @Bean
    public AuthenticationManager authenticationManager() throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // 커스텀 로그인 필터 설정
        LoginFilter loginFilter = new LoginFilter(jwtUtil, authenticationManager());
        loginFilter.setFilterProcessesUrl("/api/auth/login");

        // 운영 환경에서는 HTTPS 강제
        if ("prod".equals(activeProfile)) {
            http.requiresChannel(channel -> channel.anyRequest().requiresSecure());
        }

        http
                // 기본 로그인 관련 기능 비활성화
                .csrf(csrf -> csrf.disable())
                .formLogin(form -> form.disable())
                .httpBasic(httpBasic -> httpBasic.disable())
                .cors(cors -> {}) // CORS 설정은 별도 Config에서 관리 가능

                // 권한 설정
                .authorizeHttpRequests(auth -> auth
                        // OAuth2 관련 경로 및 로그인 관련 경로 허용
                        .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()
                        // 웹소켓, 인증, 회원가입 등 공개 API
                        .requestMatchers("/ws/**").permitAll()
                        // 일반 로그인, 회원가입, 공개 API
                        .requestMatchers("/login", "/signup", "/", "/join",
                                "/products", "/articles", "/categories",
                                "/api/auth/login", "/api/auth/signup", "/api/users/me",
                                "/api/categories", "/api/products", "/api/articles", "/api/qna",
                                "/api/bookmarks/**", "/api/categories/**", "/api/products/**",
                                "/api/articles/**", "/api/qna/**"
                        ).permitAll()
                        // 관리자 권한
                        .requestMatchers("/admin/**").hasRole("ADMIN")
                        // 그 외 모든 요청은 인증 필요
                        .anyRequest().authenticated()
                )

                // JWT 필터 추가 (UsernamePasswordAuthenticationFilter 이전)
                .addFilterBefore(new JWTFilter(jwtUtil), UsernamePasswordAuthenticationFilter.class)
                // 커스텀 로그인 필터 적용
                .addFilterAt(loginFilter, UsernamePasswordAuthenticationFilter.class)

                // OAuth2 로그인 성공 핸들러 설정
                .oauth2Login(oauth2 -> oauth2.successHandler(oAuth2SuccessHandler))

                // 세션을 Stateless로 설정 (JWT 기반 인증)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        return http.build();
    }
}