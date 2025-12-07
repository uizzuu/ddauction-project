package com.my.backend.service;

import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.my.backend.dto.auth.LoginRequest;
import com.my.backend.dto.auth.RegisterRequest;
import com.my.backend.dto.auth.TokenResponse;
import com.my.backend.entity.Address;
import com.my.backend.entity.EmailVerification;
import com.my.backend.entity.Users;
import com.my.backend.enums.Role;
import com.my.backend.myjwt.JWTUtil;
import com.my.backend.repository.AddressRepository;
import com.my.backend.repository.EmailVerificationRepository;
import com.my.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AuthService {
    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final PasswordEncoder passwordEncoder;
    private final JWTUtil jwtUtil;
    private final EmailVerificationRepository emailVerificationRepository;
    private final EmailService emailService;
    // 검증 메서드
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
        return password.matches("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!*@#]).{8,}$");
    }

    // 이메일 인증 전용 (회원가입 없이 이메일+코드만 확인)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public ResponseEntity<?> verifyEmailCode(String email, String code) {
        EmailVerification verification = emailVerificationRepository
                .findByUserEmailAndEmailVerificationToken(email, code)
                .orElseThrow(() -> new IllegalArgumentException("인증 코드가 올바르지 않거나 만료되었습니다."));

        if (verification.getExpiredAt().isBefore(LocalDateTime.now()))
            throw new IllegalArgumentException("인증 코드가 만료되었습니다.");

        verification.setVerified(true);   // 인증 상태 true
        emailVerificationRepository.save(verification);
        emailVerificationRepository.flush();

        return ResponseEntity.ok(Map.of("message", "이메일 인증 완료"));
    }

    // 1️⃣ 인증 이메일 발송
    public ResponseEntity<?> sendVerificationEmail(String email) {
        String trimmedEmail = email.trim().toLowerCase();
        if (!isValidEmail(trimmedEmail))
            return ResponseEntity.badRequest().body("올바른 이메일 형식이 아닙니다.");
        if (userRepository.existsByEmail(trimmedEmail))
            return ResponseEntity.badRequest().body("이미 사용 중인 이메일입니다.");

        String code = generateRandomCode();

        // 기존 인증 코드 갱신 또는 새로 생성
        EmailVerification verification = emailVerificationRepository
                .findByUserEmail(trimmedEmail)
                .orElse(EmailVerification.builder().userEmail(trimmedEmail).build());
        verification.setEmailVerificationToken(code);
        verification.setExpiredAt(LocalDateTime.now().plusMinutes(10));
        emailVerificationRepository.save(verification);

        emailService.sendVerificationEmail(trimmedEmail, code);

        return ResponseEntity.ok("인증 이메일이 발송되었습니다.");
    }

    // 2️⃣ 이메일 인증 + 회원가입
    public ResponseEntity<?> verifyEmail(String email, String code, RegisterRequest request) {
        EmailVerification verification = emailVerificationRepository
                .findByUserEmailAndEmailVerificationToken(email, code)
                .orElseThrow(() -> new IllegalArgumentException("인증 코드가 올바르지 않거나 만료되었습니다."));

        if (verification.getExpiredAt().isBefore(LocalDateTime.now()))
            throw new IllegalArgumentException("인증 코드가 만료되었습니다.");

        // RegisterRequest 전체 유효성 검증
        if (!isValidName(request.getUserName()))
            throw new IllegalArgumentException("이름은 한글 또는 영문만 입력 가능합니다.");
        if (!isValidNickName(request.getNickName()))
            throw new IllegalArgumentException("닉네임은 3~12자, 한글/영문/숫자만 가능");
        if (!isValidPhone(request.getPhone()))
            throw new IllegalArgumentException("전화번호는 10~11자리 숫자여야 합니다.");
        if (!isValidPassword(request.getPassword()))
            throw new IllegalArgumentException("비밀번호는 8자리 이상, 대소문자+숫자+특수문자 !*@# 1개 이상 포함해야 합니다.");

        // 중복 체크
        if (userRepository.existsByNickName(request.getNickName()))
            throw new IllegalArgumentException("이미 사용중인 닉네임입니다.");

        emailVerificationRepository.delete(verification); // 사용 후 삭제
        return ResponseEntity.ok("회원가입이 완료되었습니다.");
    }

    // 🔥 회원가입 전용 메서드
    @Transactional
    public ResponseEntity<?> register(RegisterRequest request) {

        log.info("회원가입 시작 - email: {}", request.getEmail());

        // 이메일 인증되었는지 확인 - 존재하면 아직 미인증
        EmailVerification verification = emailVerificationRepository
                .findByUserEmailAndVerifiedTrue(request.getEmail()) // request.getEmail() 사용
                .orElseThrow(() -> new IllegalArgumentException("이메일 인증을 먼저 완료해주세요."));


        log.info("EmailVerification 상태: verified={}", verification.isVerified());

        if (!verification.isVerified()) {
            return ResponseEntity.badRequest().body("이메일 인증을 먼저 완료해주세요.");
        }

        log.info("유효성 검사 통과 - name={}, nickName={}", request.getUserName(), request.getNickName());

        // 중복 체크
        if (userRepository.existsByEmail(request.getEmail()))
            return ResponseEntity.badRequest().body("이미 가입된 이메일입니다.");
        if (userRepository.existsByNickName(request.getNickName()))
            return ResponseEntity.badRequest().body("이미 사용중인 닉네임입니다.");

        // 유효성 검사
        if (!isValidName(request.getUserName()))
            throw new IllegalArgumentException("이름 형식이 올바르지 않습니다.");

        if (!isValidNickName(request.getNickName()))
            throw new IllegalArgumentException("닉네임 형식이 올바르지 않습니다.");

        if (!isValidPassword(request.getPassword()))
            throw new IllegalArgumentException("비밀번호 형식이 올바르지 않습니다.");

        if (!isValidPhone(request.getPhone()))
            throw new IllegalArgumentException("전화번호 형식이 올바르지 않습니다.");

        // 주소 저장
        Address address = Address.builder()
                .address(request.getAddress())
                .zipCode(request.getZipCode())
                .detailAddress(request.getDetailAddress())
                .build();
        addressRepository.save(address);

        // 🔹 바로 flush + 로그
        addressRepository.flush();
        log.info("Address 저장 완료: {}", address);

        // 회원 저장
        Users user = Users.builder()
                .userName(request.getUserName())
                .nickName(request.getNickName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .birthday(request.getBirthday())
                .address(address)
                .role(Role.USER)
                .createdAt(LocalDateTime.now())
                .build();

        userRepository.save(user);

        // 🔹 flush + 로그
        userRepository.flush();
        log.info("Users 저장 완료: {}", user);

        emailVerificationRepository.delete(verification);
        return ResponseEntity.ok("회원가입이 완료되었습니다.");

    }


    private String generateRandomCode() {
        int code = (int)(Math.random() * 900000) + 100000;
        return String.valueOf(code);
    }


    // 로그인
    @Transactional(readOnly = true)
    public ResponseEntity<?> login(LoginRequest request) {
        try {
            String email = request.getEmail().trim().toLowerCase();
            Users user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

            if (!passwordEncoder.matches(request.getPassword(), user.getPassword()))
                throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");

            String token = jwtUtil.createJwt(
                    user.getUserId(),
                    user.getEmail(),
                    user.getRole(),
                    user.getNickName(),
                    24 * 60 * 60 * 1000L  // 24시간
            );
            TokenResponse tokenResponse = new TokenResponse(token, null);
            log.info("로그인 성공: {}", request.getEmail());
            return ResponseEntity.ok(tokenResponse);
        } catch (IllegalArgumentException e) {
            log.warn("로그인 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 토큰 갱신
    public ResponseEntity<?> refreshToken(String token) {
        try {
            if (!jwtUtil.validateToken(token) || jwtUtil.isExpired(token))
                throw new IllegalArgumentException("유효하지 않은 리프레시 토큰입니다.");

            String email = jwtUtil.getEmail(token);
            log.info("토큰 검증 성공: {}", email);

            Users user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

            String newAccessToken = jwtUtil.createJwt(
                    user.getUserId(),
                    user.getEmail(),
                    user.getRole(),
                    user.getNickName(),
                    24 * 60 * 60 * 1000L  // 24시간
            );
            String newRefreshToken = jwtUtil.createJwt(
                    user.getUserId(),
                    user.getEmail(),
                    user.getRole(),
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

    public ResponseEntity<?> findEmail(String phone, String userName) {
        Users user = userRepository.findByPhoneAndUserName(phone, userName)
                .orElseThrow(() -> new IllegalArgumentException("입력 정보와 일치하는 사용자가 없습니다."));
        return ResponseEntity.ok(Map.of("email", user.getEmail()));
    }

    // 비밀번호 재설정
    public ResponseEntity<?> resetPassword(String email, String phone, String userName, String newPassword) {
        try {
            if (!isValidEmail(email)) throw new IllegalArgumentException("올바른 이메일 형식이 아닙니다.");
            if (!isValidPhone(phone)) throw new IllegalArgumentException("전화번호는 10~11자리 숫자여야 합니다.");
            if (!isValidName(userName)) throw new IllegalArgumentException("이름은 한글 또는 영문만 입력 가능합니다.");
            if (!isValidPassword(newPassword))
                throw new IllegalArgumentException("비밀번호는 8자리 이상, 대소문자+숫자+특수문자 !*@# 1개 이상 포함해야 합니다.");

            Users user = userRepository.findByEmailAndPhoneAndUserName(email, phone, userName)
                    .orElseThrow(() -> new IllegalArgumentException("입력 정보와 일치하는 사용자가 없습니다."));

            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);

            log.info("비밀번호 재설정 성공: {}", email);
            return ResponseEntity.ok("비밀번호가 성공적으로 변경되었습니다.");
        } catch (IllegalArgumentException e) {
            log.warn("비밀번호 재설정 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
