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

    // -------------------- 검증 메서드 --------------------
    private boolean isValidName(String name) {
        return name != null && name.matches("^[가-힣a-zA-Z]+$");
    }

    private boolean isValidNickName(String nickName) {
        return nickName != null && nickName.matches("^[가-힣a-zA-Z0-9]{3,12}$");
    }

    private boolean isValidEmail(String email) {
        return email != null && email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    }

    private boolean isValidPhone(String phone) {
        return phone != null && phone.matches("^\\d{10,11}$");
    }

    private boolean isValidPassword(String password) {
        if (password == null) return false;
        // 최소 8자 이상, 대문자 1개 이상, 소문자 1개 이상, 숫자 1개 이상, 특수문자 !*@# 1개 이상
        return password.matches("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!*@#]).{8,}$");
    }


    // -------------------- 회원가입 --------------------
    public ResponseEntity<?> register(RegisterRequest request) {
        try {
            String username = request.getUserName().trim();
            String nickname = request.getNickName().trim();
            String email = request.getEmail().trim().toLowerCase();
            String password = request.getPassword();
            String phone = request.getPhone();

            // 입력 검증
            if (!isValidName(username))
                throw new IllegalArgumentException("이름은 한글 또는 영문만 입력 가능합니다.");
            if (!isValidNickName(nickname))
                throw new IllegalArgumentException("닉네임은 3~12자, 한글/영문/숫자만 가능");
            if (!isValidEmail(email))
                throw new IllegalArgumentException("올바른 이메일 형식이 아닙니다.");
            if (!isValidPhone(phone))
                throw new IllegalArgumentException("전화번호는 10~11자리 숫자여야 합니다.");
            if (!isValidPassword(password))
                throw new IllegalArgumentException("비밀번호는 8자리 이상, 대소문자+숫자+특수문자 !*@# 1개 이상 포함해야 합니다.");

            // 중복 체크
            if (userRepository.existsByNickName(nickname))
                throw new IllegalArgumentException("이미 사용중인 닉네임입니다.");
            if (userRepository.existsByEmail(email))
                throw new IllegalArgumentException("이미 사용중인 이메일입니다.");

            User user = User.builder()
                    .userName(username)
                    .nickName(nickname)
                    .password(passwordEncoder.encode(password))
                    .phone(phone)
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

    // -------------------- 로그인 --------------------
    @Transactional(readOnly = true)
    public ResponseEntity<?> login(LoginRequest request) {
        try {
            String email = request.getEmail().trim().toLowerCase();

            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

            if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
            }

            String token = jwtUtil.createJwt(
                    user.getUserId(),
                    user.getEmail(),
                    user.getRole().name(),
                    user.getNickName(),
                    3600000L
            );
            TokenResponse tokenResponse = new TokenResponse(token, null);
            log.info("로그인 성공: {}", request.getEmail());
            return ResponseEntity.ok(tokenResponse);
        } catch (IllegalArgumentException e) {
            log.warn("로그인 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // -------------------- 토큰 갱신 --------------------
    public ResponseEntity<?> refreshToken(String token) {
        try {
            if (!jwtUtil.validateToken(token) || jwtUtil.isExpired(token)) {
                throw new IllegalArgumentException("유효하지 않은 리프레시 토큰입니다.");
            }

            String email = jwtUtil.getEmail(token);
            log.info("토큰 검증 성공: {}", email);

            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

            String newAccessToken = jwtUtil.createJwt(
                    user.getUserId(),
                    user.getEmail(),
                    user.getRole().name(),
                    user.getNickName(),
                    3600000L
            );
            String newRefreshToken = jwtUtil.createJwt(
                    user.getUserId(),
                    user.getEmail(),
                    user.getRole().name(),
                    user.getNickName(),
                    604800000L
            );

            TokenResponse tokenResponse = new TokenResponse(newAccessToken, newRefreshToken);
            log.info("토큰 갱신 성공");
            return ResponseEntity.ok(tokenResponse);
        } catch (IllegalArgumentException e) {
            log.warn("토큰 갱신 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
