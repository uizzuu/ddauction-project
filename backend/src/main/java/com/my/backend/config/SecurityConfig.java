package com.my.backend.config;

import com.my.backend.myjwt.JWTFilter;
import com.my.backend.myjwt.JWTUtil;
import com.my.backend.myjwt.LoginFilter;
//import com.my.backend.oauth2.OAuth2SuccessHandler;
import com.my.backend.oauth2.OAuth2SuccessHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
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

    public SecurityConfig(AuthenticationConfiguration authenticationConfiguration,
                          JWTUtil jwtUtil,OAuth2SuccessHandler oAuth2SuccessHandler) {
        this.authenticationConfiguration = authenticationConfiguration;
        this.jwtUtil = jwtUtil;
        this.oAuth2SuccessHandler = oAuth2SuccessHandler;
    }

    // AuthenticationManager Bean
    @Bean
    public AuthenticationManager authenticationManager() throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    // PasswordEncoder Bean
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Security Filter Chain
    // Security Filter Chain
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        LoginFilter loginFilter = new LoginFilter(jwtUtil, authenticationManager());
        loginFilter.setFilterProcessesUrl("/api/auth/login");

        http
                .csrf(csrf -> csrf.disable())
                .formLogin(form -> form.disable())
                .httpBasic(httpBasic -> httpBasic.disable())
                .cors(cors -> {})

                .authorizeHttpRequests(auth -> auth
//                        // OAuth2 관련 경로는 JWT 필터에서 제외
//                        .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()
//                        .requestMatchers("/ws/**").permitAll()
//                        // 일반 로그인, 회원가입, 공개 API
//                        .requestMatchers("/login", "/signup", "/", "/join",
//                                "/products", "/articles", "/categories",
//                                "/api/auth/login", "/api/auth/signup", "/api/users/me",
//                                "/api/categories", "/api/products", "/api/articles", "/api/qna",
//                                "/api/bookmarks/**", "/api/categories/**", "/api/products/**",
//                                "/api/articles/**", "/api/qna/**"
//                        ).permitAll()
//                        .requestMatchers("/admin").hasRole("ADMIN")
//                        .anyRequest().authenticated()
//                )
                        //  OAuth2 관련 경로는 공개
                        .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()
                        .requestMatchers("/ws/**").permitAll()

                        //  로그인/회원가입, 기본 공개 API
                        .requestMatchers(
                                "/login", "/signup", "/", "/join",
                                "/api/auth/**",
                                "/api/categories/**",
                                "/api/products",            // 상품 목록 (GET)
                                "/api/products/*",          // 상품 상세 (GET)
                                "/api/products/*/highest-bid", // 최고 입찰가 (공개)
                                "/api/bookmarks/count",     // 찜 개수 (공개)
                                "/api/bookmarks/check",     // 찜 여부 (공개)
                                "/api/articles/**",
                                "/api/qna/**"
                        ).permitAll()

                        //  인증 필요한 API
                        .requestMatchers(
                                "/api/payments/**",              // 결제
                                "/api/products/*/check-winner",  // 낙찰자 확인
                                "/api/bookmarks/toggle",         // 찜 등록/해제
                                "/api/bid/**"                    // 입찰
                        ).authenticated()

                        //  그 외 모든 요청은 인증 필요
                        .anyRequest().authenticated()
                )

                        // JWT 필터는 OAuth2 경로 제외
                .addFilterBefore(new JWTFilter(jwtUtil), UsernamePasswordAuthenticationFilter.class)
                .addFilterAt(loginFilter, UsernamePasswordAuthenticationFilter.class)

                // OAuth2 로그인 성공 핸들러
                .oauth2Login(oauth2 -> oauth2.successHandler(oAuth2SuccessHandler))

                // 세션 Stateless
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        return http.build();
    }

}