package com.my.backend.config;

import com.my.backend.myjwt.JWTFilter;
import com.my.backend.myjwt.JWTUtil;
import com.my.backend.myjwt.LoginFilter;
//import com.my.backend.oauth2.OAuth2SuccessHandler;
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
//    private final OAuth2SuccessHandler oAuth2SuccessHandler;

    public SecurityConfig(AuthenticationConfiguration authenticationConfiguration,
                          JWTUtil jwtUtil) {
        this.authenticationConfiguration = authenticationConfiguration;
        this.jwtUtil = jwtUtil;
//        this.oAuth2SuccessHandler = oAuth2SuccessHandler;
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
        http
                // CSRF 비활성화
                .csrf(csrf -> csrf.disable())
                // 기본 로그인 폼 비활성화
                .formLogin(form -> form.disable())
                // HTTP Basic 비활성화
                .httpBasic(httpBasic -> httpBasic.disable())
                // CORS는 필요시 CorsConfigurationSource 빈을 사용
                .cors(cors -> {})

                // 경로별 접근 제어
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/login", "/signup", "/", "/join",
                                "/products", "articles", "categories",
                                "/api/auth/login", "/api/auth/signup", "/api/users/me",
                                "/api/categories", "/api/products", "/api/articles",
                                "/api/categories/**", "/api/products/**", "/api/articles/**").permitAll()
                        .requestMatchers("/admin").hasRole("ADMIN")
                        .anyRequest().authenticated()
                )
                // JWT 필터
                .addFilterBefore(new JWTFilter(jwtUtil), UsernamePasswordAuthenticationFilter.class)
                // LoginFilter 등록
                .addFilterAt(loginFilter, UsernamePasswordAuthenticationFilter.class)
                // 세션 설정
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
        // OAuth2 로그인 성공 핸들러
//                .oauth2Login(oauth2 -> oauth2.successHandler(oAuth2SuccessHandler));

        return http.build();
    }
}