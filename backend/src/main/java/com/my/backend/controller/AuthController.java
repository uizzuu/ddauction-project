package com.my.backend.controller;


import com.my.backend.dto.auth.LoginRequest;
import com.my.backend.dto.auth.RegisterRequest;
import com.my.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * 회원가입
     */
    @PostMapping("/signup")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            var result = authService.register(request);
            return ResponseEntity.status(201).body(
                    Map.of("message", "회원가입 성공", "user", result)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    Map.of("message", e.getMessage())
            );
        }
    }

    /**
     * 로그인
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        System.out.println("Received email: " + request.getEmail()); // 디버깅 로그
        System.out.println("Email type: " + request.getEmail().getClass().getName());
        return authService.login(request);
    }

    /**
     * 토큰 갱신
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestHeader("Refresh-Token") String refreshToken) {
        return authService.refreshToken(refreshToken);
    }
}