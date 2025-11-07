package com.my.backend.config;

import com.my.backend.myjwt.JWTFilter;
import com.my.backend.myjwt.JWTUtil;
import com.my.backend.myjwt.LoginFilter;
import com.my.backend.oauth2.OAuth2SuccessHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
//import com.my.backend.oauth2.OAuth2SuccessHandler;
import org.springframework.http.HttpMethod;
import org.springframework.beans.factory.annotation.Value;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final AuthenticationConfiguration authenticationConfiguration;
    private final JWTUtil jwtUtil;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;

    @Value("${spring.profiles.active:local}")
    private String activeProfile;


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
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        LoginFilter loginFilter = new LoginFilter(jwtUtil, authenticationManager());
        loginFilter.setFilterProcessesUrl("/api/auth/login");

        // 운영 환경에서는 HTTPS 강제
        if ("prod".equals(activeProfile)) {
            http.requiresChannel(channel -> channel.anyRequest().requiresSecure());
        }

        http
                .csrf(csrf -> csrf.disable())
                .formLogin(form -> form.disable())
                .httpBasic(httpBasic -> httpBasic.disable())
                .cors(cors -> {})
                //추가함73-75
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
                )

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll() // 🔹 preflight 허용
                        // 🔹 정적 리소스 업로드 폴더 허용

                        // OAuth2 관련 경로
                        .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()
                        .requestMatchers("/ws/**").permitAll()

                        // 회원가입, 로그인, 공개 POST API
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/auth/signup",
                                "/api/auth/login",
                                "/api/auth/email-find",
                                "/api/auth/password-reset"
                        ).permitAll()

                        // GET 공개 API
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/products/**",
                                "/api/categories/**",
                                "/api/articles/**",
                                "/api/qna/**",
                                "/api/bookmarks/**"
                        ).permitAll()

                        // S3 업로드는 인증 필요 (JWT 토큰 필수)
                        .requestMatchers(HttpMethod.POST, "/api/files/s3-upload").authenticated()

                        // 이미지 등록도 인증 필요
                        .requestMatchers(HttpMethod.POST, "/api/images").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/images/**").authenticated()

                        // 인증 필요
                        .requestMatchers(HttpMethod.POST, "/api/products").authenticated()  // ✅ 추가
                        .requestMatchers(HttpMethod.PUT, "/api/products/**").authenticated()  // ✅ 추가
                        .requestMatchers(HttpMethod.DELETE, "/api/products/**").authenticated()  // ✅ 추가
                        .requestMatchers(HttpMethod.GET, "/api/products/purchases").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/products/with-images").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/products").authenticated()
                        .requestMatchers("/admin").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/qna/**").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/qna/**").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/api/qna/**").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/qna/**").authenticated()

                        .anyRequest().authenticated()
                )


                // JWT 필터는 OAuth2 경로 제외
                // JWT 필터를 UsernamePasswordAuthenticationFilter 앞에 배치
                .addFilterBefore(new JWTFilter(jwtUtil), UsernamePasswordAuthenticationFilter.class)
                // LoginFilter를 UsernamePasswordAuthenticationFilter 위치에 배치
                .addFilterAt(loginFilter, UsernamePasswordAuthenticationFilter.class)

                // OAuth2 로그인 성공 핸들러
                .oauth2Login(oauth2 -> oauth2.successHandler(oAuth2SuccessHandler))

                // 세션 Stateless
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        return http.build();
    }
        @Bean
        public WebSecurityCustomizer webSecurityCustomizer() {
            return (web) -> web.ignoring()
                    .requestMatchers("/uploads/**"); // 🔸 완전 무시 — SecurityFilter 거치지 않음
        }
}