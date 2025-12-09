package com.my.backend.controller;


import com.my.backend.dto.EmailRequest;
import com.my.backend.dto.ImageDto;
import com.my.backend.dto.UsersDto;
import com.my.backend.dto.auth.LoginRequest;
import com.my.backend.dto.auth.PhoneLoginRequest;
import com.my.backend.dto.auth.RegisterRequest;
import com.my.backend.entity.Users;
import com.my.backend.enums.ImageType;
import com.my.backend.myjwt.JWTUtil;
import com.my.backend.repository.ImageRepository;
import com.my.backend.repository.UserRepository;
import com.my.backend.service.AuthService;
import com.my.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final JWTUtil jwtUtil;
    private final UserService userService;
    private final ImageRepository imageRepository;

    public List<ImageDto> getUserImages(Long userId) {
        return imageRepository.findByRefIdAndImageType(userId, ImageType.USER)
                .stream()
                .map(ImageDto::fromEntity)
                .collect(Collectors.toList());
    }

    // 회원가입
    @PostMapping("/signup")
    public ResponseEntity<?> sendVerificationEmail(@RequestBody EmailRequest request) {

        return authService.sendVerificationEmail(request.getEmail());
    }

    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam String email,
                                         @RequestParam String code) {
        return authService.verifyEmailCode(email, code); // 이제 RegisterRequest 필요 없음
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        log.info("RegisterRequest: {}", request); // request로 바꿔야 함

        return authService.register(request); // 주석: 새로운 register 메서드
    }

    // 이메일 로그인
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        System.out.println("Received email: " + request.getEmail()); // 디버깅 로그
        System.out.println("Email type: " + request.getEmail().getClass().getName());
        return authService.login(request);
    }
    // 전화번호 로그인
    @PostMapping("/login/phone")
    public ResponseEntity<?> loginByPhone(@RequestBody PhoneLoginRequest request) {
        return authService.loginByPhone(request);
    }


    // 로그아웃
    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.ok().build();
    }

    // 토큰 갱신
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestHeader("Refresh-Token") String refreshToken) {
        return authService.refreshToken(refreshToken);
    }

    // 로그인 상태 확인 (새로고침 후 유지용) (JWT 기반)
    @GetMapping("/me")
    public ResponseEntity<UsersDto> getCurrentUser(@RequestHeader("Authorization") String authHeader) {
        Users user = getUserFromToken(authHeader);

        // 프로필 이미지 URL 가져오기
        String profileImageUrl = userService.getProfileImageUrl(user.getUserId());

        // DTO 생성 시 profileImageUrl 전달
        return ResponseEntity.ok(UsersDto.fromEntity(user, profileImageUrl));
    }

    // 이메일 찾기
    @PostMapping("/email-find")
    public ResponseEntity<?> findEmail(@RequestBody Map<String, String> request) {
        return authService.findEmail(request.get("phone"), request.get("userName"));
    }

    // 비밀번호 초기화
    @PostMapping("/password-reset")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String phone = body.get("phone");
        String userName = body.get("userName");
        String newPassword = body.get("newPassword");

        // 서비스 호출
        authService.resetPassword(email, phone, userName, newPassword);
        return ResponseEntity.ok(Map.of("message", "비밀번호가 변경되었습니다."));
    }

    // 공통 메서드
    // JWT 검증 및 사용자 조회
    private Users getUserFromToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("로그인이 필요합니다.");
        }
        String token = authHeader.replace("Bearer ", "");
        if (!jwtUtil.validateToken(token)) {
            throw new RuntimeException("토큰이 유효하지 않습니다.");
        }
        return userRepository.findByEmail(jwtUtil.getEmail(token))
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
    }

}