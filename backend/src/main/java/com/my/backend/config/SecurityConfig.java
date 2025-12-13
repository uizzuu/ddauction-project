package com.my.backend.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.my.backend.myjwt.JWTFilter;
import com.my.backend.myjwt.JWTUtil;
import com.my.backend.myjwt.LoginFilter;
import com.my.backend.oauth2.OAuth2SuccessHandler;
import com.my.backend.service.CustomOAuth2UserService;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final AuthenticationConfiguration authenticationConfiguration;
    private final JWTUtil jwtUtil;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;
    private final CustomOAuth2UserService customOAuth2UserService;

    public SecurityConfig(
            AuthenticationConfiguration authenticationConfiguration,
            JWTUtil jwtUtil,
            OAuth2SuccessHandler oAuth2SuccessHandler,
            CustomOAuth2UserService customOAuth2UserService
    ) {
        this.authenticationConfiguration = authenticationConfiguration;
        this.jwtUtil = jwtUtil;
        this.oAuth2SuccessHandler = oAuth2SuccessHandler;
        this.customOAuth2UserService = customOAuth2UserService;
    }

    // AuthenticationManager
    @Bean
    public AuthenticationManager authenticationManager() throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    // BCrypt 암호화
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // ⭐ CORS 설정 통합 (SecurityConfig 안에서만 관리)
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOriginPatterns(
                List.of(
                        "http://localhost:3000",
                        "http://localhost:5173",
                        "https://ddauction.shop"
                )
        );

        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return source;
    }

    // Security Filter Chain
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        LoginFilter loginFilter = new LoginFilter(jwtUtil, authenticationManager());
        loginFilter.setFilterProcessesUrl("/api/auth/login");

        http
                .csrf(csrf -> csrf.disable())
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())

                // ⭐ 이걸 CorsConfig 대신 사용
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                .exceptionHandling(ex ->
                        ex.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
                )

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/articles/**").permitAll() // Moved to top
                        .requestMatchers("/ai/**").permitAll()
                        .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()
                        .requestMatchers("/ws/**").permitAll()
                        .requestMatchers("/api/autocomplete/**").permitAll()
                        .requestMatchers("/api/search/log").permitAll()
                        .requestMatchers("/api/chats/**").permitAll()
                        .requestMatchers("/api/business/verify").permitAll()
                        .requestMatchers("/api/sms/send", "/api/sms/verify").permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/qrcode/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                        .requestMatchers("/api/articles/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/product-qnas/product/*").permitAll()  // 상품별 QnA 목록만
                        .requestMatchers(HttpMethod.GET, "/api/qna-reviews/product-qna/*").permitAll()  // 특정 QnA의 답변 목록만
                        .requestMatchers(HttpMethod.GET, "/api/bookmarks/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/bid/*/bids").permitAll() // 입찰 내역 공개
                        .requestMatchers(HttpMethod.GET, "/api/bid/*/chart").permitAll() // 입찰 그래프 공개

                        .requestMatchers(HttpMethod.GET, "/api/users/*/public").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/signup").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/login/phone").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/email-find").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/password-reset").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/email/send").permitAll() // 이메일 인증 발송 허용
                        .requestMatchers(HttpMethod.POST, "/api/auth/verify-email").permitAll() // 이메일 인증
                        .requestMatchers(HttpMethod.POST, "/api/auth/register").permitAll()// 확인 허용

                        .requestMatchers(HttpMethod.POST, "/api/articles/*/comments").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/api/comments/*").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/comments/*").authenticated()
                        .requestMatchers("/uploads/**").permitAll()
                        .requestMatchers("/api/geo/**").permitAll() // 주소 변환 허용
                        .requestMatchers(HttpMethod.GET, "/api/reviews/**").permitAll() // 리뷰 조회 허용

                        .anyRequest().authenticated()
                )

                .addFilterBefore(new JWTFilter(jwtUtil),
                        UsernamePasswordAuthenticationFilter.class)
                .addFilterAt(loginFilter, UsernamePasswordAuthenticationFilter.class)

                .oauth2Login(oauth2 -> oauth2
                        .userInfoEndpoint(userInfo -> userInfo
                                .userService(customOAuth2UserService)
                        )
                        .successHandler(oAuth2SuccessHandler)
                )

                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                );

        return http.build();
    }
}
