package com.my.backend.service;

import com.my.backend.dto.auth.LoginRequest;
import com.my.backend.dto.auth.RegisterRequest;
import com.my.backend.dto.auth.TokenResponse;
import com.my.backend.entity.User;
import com.my.backend.repository.UserRepository;
import com.my.backend.security.JwtTokenProvider;
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
    private final UserService userService; // UserService 의존성 주입
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    /**
     * 회원가입: 중복 체크 및 User 객체 저장
     */
    public ResponseEntity<?> register(RegisterRequest request) {
        try {
            // 1. 입력값 전처리
            String username = request.getUsername().trim();
            String nickname = request.getNickname().trim();
            String email = request.getEmail().trim().toLowerCase();

            // 2. AuthService 고유의 역할: 중복 체크
            if (userRepository.existsByUserName(username)) {
                throw new IllegalArgumentException("이미 사용중인 아이디입니다.");
            }
            if (userRepository.existsByNickName(nickname)) {
                throw new IllegalArgumentException("이미 사용중인 닉네임입니다.");
            }
            if (userRepository.existsByEmail(email)) {
                throw new IllegalArgumentException("이미 사용중인 이메일입니다.");
            }

            // 3. UserService에 위임: 비밀번호 일치 및 복잡도 검사, 암호화된 User 객체 생성
            User user = userService.createAuthUser(request);

            // 4. 저장
            userRepository.save(user);
            log.info("회원가입 성공: {}", request.getUsername());
            return ResponseEntity.ok().body("회원가입이 완료되었습니다.");

        } catch (IllegalArgumentException e) {
            log.warn("회원가입 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * 로그인: 인증 및 토큰 발행 전담
     */
    @Transactional(readOnly = true)
    public ResponseEntity<?> login(LoginRequest request) {
        try {
            String email = request.getEmail().trim();

            // 1. 사용자 존재 확인
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

            // 2. 비밀번호 일치 확인
            if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
            }

            // 3. 토큰 발행
            String accessToken = tokenProvider.createAccessToken(user.getUserId(), user.getRole().name());
            String refreshToken = tokenProvider.createRefreshToken(user.getUserId());
            TokenResponse tokenResponse = new TokenResponse(accessToken, refreshToken);

            log.info("로그인 성공: {}", request.getEmail());
            return ResponseEntity.ok(tokenResponse);

        } catch (IllegalArgumentException e) {
            log.warn("로그인 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * 토큰 갱신
     */
    public ResponseEntity<?> refreshToken(String refreshToken) {
        try {
            if (!tokenProvider.validateToken(refreshToken)) {
                throw new IllegalArgumentException("유효하지 않은 리프레시 토큰입니다.");
            }

            Long userId = tokenProvider.getUserIdFromToken(refreshToken);
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

            String newAccessToken = tokenProvider.createAccessToken(user.getUserId(), user.getRole().name());
            String newRefreshToken = tokenProvider.createRefreshToken(user.getUserId());
            TokenResponse tokenResponse = new TokenResponse(newAccessToken, newRefreshToken);

            log.info("토큰 갱신 성공");
            return ResponseEntity.ok(tokenResponse);

        } catch (IllegalArgumentException e) {
            log.warn("토큰 갱신 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}