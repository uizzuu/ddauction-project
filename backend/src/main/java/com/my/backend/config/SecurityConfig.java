package com.my.backend.config;

import com.my.backend.myjwt.JWTFilter;
import com.my.backend.myjwt.JWTUtil;
import com.my.backend.myjwt.LoginFilter;
import com.my.backend.oauth2.OAuth2SuccessHandler;
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

                .authorizeHttpRequests(auth -> auth
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

                        // 🔹 정적 리소스 업로드 폴더 허용
//                        .requestMatchers("/uploads/**").permitAll()

                        // 인증 필요
                        .requestMatchers(HttpMethod.POST, "/api/products/with-images").authenticated()
                        .requestMatchers("/admin").hasRole("ADMIN")
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