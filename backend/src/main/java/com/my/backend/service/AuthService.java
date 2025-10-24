package com.my.backend.service;

import com.my.backend.dto.auth.LoginRequest;
import com.my.backend.dto.auth.RegisterRequest;
import com.my.backend.dto.auth.TokenResponse;
import com.my.backend.entity.User;
import com.my.backend.myjwt.JWTUtil;
import com.my.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JWTUtil jwtUtil;

    public ResponseEntity<?> register(RegisterRequest request) {
        try {
            // 입력 정규화 (선택 권장)
            String username = request.getUserName().trim();
            String nickname = request.getNickName().trim();
            String email = request.getEmail().trim().toLowerCase();

            if (userRepository.existsByNickName(nickname))
                throw new IllegalArgumentException("이미 사용중인 닉네임입니다.");
            if (userRepository.existsByEmail(email))
                throw new IllegalArgumentException("이미 사용중인 이메일입니다.");

            User user = User.builder()
                    .userName(username)
                    .nickName(nickname)
                    .password(passwordEncoder.encode(request.getPassword()))
                    .phone(request.getPhone())
                    .email(email)
                    .role(User.Role.USER)
                    .build();

            userRepository.save(user);
            log.info("회원가입 성공: {}", request.getUserName());
            return ResponseEntity.ok().body("회원가입이 완료되었습니다.");
        } catch (IllegalArgumentException e) {
            log.warn("회원가입 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // AuthService.java의 login 메서드만 교체하세요
// (파일 전체가 아니라 이 메서드만 교체!)

    @Transactional(readOnly = true)
    public ResponseEntity<?> login(LoginRequest request) {
        try {
            String email = request.getEmail().trim().toLowerCase();

            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

            if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
            }

            String token = jwtUtil.createJwt(user.getEmail(), user.getRole().name(), 3600000L);
            TokenResponse tokenResponse = new TokenResponse(token, null);
            log.info("로그인 성공: {}", request.getEmail());
            return ResponseEntity.ok(tokenResponse);
        } catch (IllegalArgumentException e) {
            log.warn("로그인 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    public ResponseEntity<?> refreshToken(String token) {
        try {
            if (!jwtUtil.validateToken(token) || jwtUtil.isExpired(token)) {
                throw new IllegalArgumentException("유효하지 않은 리프레시 토큰입니다.");
            }

            String email = jwtUtil.getEmail(token);
            log.info("토큰 검증 성공: {}", email);

            // 이메일로 사용자 조회
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

            // 새로운 토큰 발급 (예: 1시간 유효)
            String newAccessToken = jwtUtil.createJwt(user.getEmail(), user.getRole().name(), 3600000L); // 1시간
            String newRefreshToken = jwtUtil.createJwt(user.getEmail(), user.getRole().name(), 604800000L); // 7일

            TokenResponse tokenResponse = new TokenResponse(newAccessToken, newRefreshToken);
            log.info("토큰 갱신 성공");
            return ResponseEntity.ok(tokenResponse);
        } catch (IllegalArgumentException e) {
            log.warn("토큰 갱신 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }

    }
}