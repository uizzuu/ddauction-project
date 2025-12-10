package com.my.backend.service;

import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.my.backend.dto.auth.LoginRequest;
import com.my.backend.dto.auth.PhoneLoginRequest;
import com.my.backend.dto.auth.RegisterRequest;
import com.my.backend.dto.auth.TokenResponse;
import com.my.backend.entity.Address;
import com.my.backend.entity.EmailVerification;
import com.my.backend.entity.PhoneVerification;
import com.my.backend.entity.Users;
import com.my.backend.enums.Role;
import com.my.backend.myjwt.JWTUtil;
import com.my.backend.phoneVerification.PhoneVerificationRepository;
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
    private final PhoneVerificationRepository phoneVerificationRepository; // 추가
    private final EmailService emailService;

    // 검증 메서드 Check (Optional fields return true if null/empty)
    private boolean isValidName(String name) {
        if (name == null || name.trim().isEmpty()) return true;
        return name.matches("^[가-힣a-zA-Z]+$");
    }

    private boolean isValidNickName(String nickName) {
        if (nickName == null || nickName.trim().isEmpty()) return true;
        return nickName.matches("^[가-힣a-zA-Z0-9]{3,12}$");
    }

    private boolean isValidEmail(String email) {
        if (email == null || email.trim().isEmpty()) return true;
        return email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    }

    private boolean isValidPhone(String phone) {
        if (phone == null || phone.trim().isEmpty()) return true;
        return phone.matches("^\\d{10,11}$");
    }

    private boolean isValidPassword(String password) {
        if (password == null) return false; // Password is required
        return password.matches("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!*@#]).{8,}$");
    }

    // ========== 이메일 인증 ==========

    // 이메일 인증 코드 검증 전용 (회원가입 없이 이메일+코드만 확인)
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

    // 인증 이메일 발송
    public ResponseEntity<?> sendVerificationEmail(String email) {
        String trimmedEmail = email.trim().toLowerCase();
        if (!isValidEmail(trimmedEmail))
            return ResponseEntity.badRequest().body("올바른 이메일 형식이 아닙니다.");
        
        // 이메일이 입력된 경우 중복 체크
        if (userRepository.existsByEmail(trimmedEmail))
            return ResponseEntity.badRequest().body("이미 사용 중인 이메일입니다.");

        String code = generateRandomCode();

        // 기존 인증 코드 갱신 또는 새로 생성
        EmailVerification verification = emailVerificationRepository
                .findByUserEmail(trimmedEmail)
                .orElse(EmailVerification.builder().userEmail(trimmedEmail).build());
        verification.setEmailVerificationToken(code);
        verification.setExpiredAt(LocalDateTime.now().plusMinutes(10));
        verification.setVerified(false); // 초기화
        emailVerificationRepository.save(verification);

        emailService.sendVerificationEmail(trimmedEmail, code);

        return ResponseEntity.ok("인증 이메일이 발송되었습니다.");
    }

    // 비밀번호 재설정용 인증 이메일 발송 (가입된 사용자 확인)
    public ResponseEntity<?> sendPasswordResetCode(String email) {
        String trimmedEmail = email.trim().toLowerCase();
        if (!isValidEmail(trimmedEmail))
            return ResponseEntity.badRequest().body("올바른 이메일 형식이 아닙니다.");

        // 가입된 사용자인지 확인 (없으면 에러)
        if (!userRepository.existsByEmail(trimmedEmail))
            return ResponseEntity.badRequest().body("가입되지 않은 이메일입니다.");

        String code = generateRandomCode();

        EmailVerification verification = emailVerificationRepository
                .findByUserEmail(trimmedEmail)
                .orElse(EmailVerification.builder().userEmail(trimmedEmail).build());
        verification.setEmailVerificationToken(code);
        verification.setExpiredAt(LocalDateTime.now().plusMinutes(10));
        verification.setVerified(false);
        emailVerificationRepository.save(verification);

        emailService.sendVerificationEmail(trimmedEmail, code);

        return ResponseEntity.ok("인증 이메일이 발송되었습니다.");
    }

    // ========== 회원가입 (이메일 OR 핸드폰 인증 확인) ==========
    @Transactional
    public ResponseEntity<?> register(RegisterRequest request) {
        String email = request.getEmail() != null && !request.getEmail().trim().isEmpty() ? request.getEmail() : null;
        String phone = request.getPhone() != null && !request.getPhone().trim().isEmpty() ? request.getPhone() : null;
        String nickName = request.getNickName() != null && !request.getNickName().trim().isEmpty() ? request.getNickName() : null;
        String userName = request.getUserName() != null && !request.getUserName().trim().isEmpty() ? request.getUserName() : null;

        log.info("회원가입 시작 - email: {}, phone: {}", email, phone);

        // 🔥 이메일 또는 핸드폰 인증 중 하나라도 완료되어야 함
        EmailVerification emailVerification = null;
        if (email != null) {
            emailVerification = emailVerificationRepository
                    .findByUserEmailAndVerifiedTrue(email)
                    .orElse(null);
        }

        PhoneVerification phoneVerification = null;
        if (phone != null) {
            phoneVerification = phoneVerificationRepository
                    .findByUserPhoneAndVerifiedTrue(phone)
                    .orElse(null);
        }

        // 둘 다 인증 안됨
        if (emailVerification == null && phoneVerification == null) {
            return ResponseEntity.badRequest().body("이메일 또는 핸드폰 인증을 먼저 완료해주세요.");
        }

        log.info("인증 확인 완료 - 이메일 인증: {}, 핸드폰 인증: {}",
                emailVerification != null, phoneVerification != null);

        // 중복 체크
        if (email != null && userRepository.existsByEmail(email))
            return ResponseEntity.badRequest().body("이미 가입된 이메일입니다.");
        if (nickName != null && userRepository.existsByNickName(nickName))
            return ResponseEntity.badRequest().body("이미 사용중인 닉네임입니다.");
        if (phone != null && userRepository.existsByPhone(phone))
            return ResponseEntity.badRequest().body("이미 가입된 전화번호입니다.");

        // 유효성 검사 (Optional fields are validated inside isValid* only if present)
        if (!isValidName(userName))
            throw new IllegalArgumentException("이름 형식이 올바르지 않습니다.");
        if (!isValidNickName(nickName))
            throw new IllegalArgumentException("닉네임 형식이 올바르지 않습니다.");
        if (!isValidPassword(request.getPassword()))
            throw new IllegalArgumentException("비밀번호 형식이 올바르지 않습니다.");
        if (!isValidPhone(phone))
            throw new IllegalArgumentException("전화번호 형식이 올바르지 않습니다.");

        // 주소 저장
        Address address = Address.builder()
                .address(request.getAddress())
                .zipCode(request.getZipCode())
                .detailAddress(request.getDetailAddress())
                .build();
        addressRepository.save(address);
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
                .emailVerification(emailVerification)  // 인증된 것만 연결 (null 가능)
                .phoneVerification(phoneVerification)  // 인증된 것만 연결 (null 가능)
                .role(Role.USER)
                .verified(false)  // 초기값
                .build();

        // 🔥 인증 완료 처리 (completeVerification 메서드 호출)
        user.completeVerification();  // verified = true로 변경

        userRepository.save(user);
        userRepository.flush();
        log.info("Users 저장 완료: {}, verified: {}", user.getEmail(), user.isVerified());

        // 인증 레코드 삭제 (사용 완료)
        if (emailVerification != null) {
            emailVerificationRepository.delete(emailVerification);
        }
        if (phoneVerification != null) {
            phoneVerificationRepository.delete(phoneVerification);
        }

        return ResponseEntity.ok("회원가입이 완료되었습니다.");
    }

    private String generateRandomCode() {
        int code = (int)(Math.random() * 900000) + 100000;
        return String.valueOf(code);
    }

    // ========== 이메일 로그인 ==========
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

    // ========== 전화번호 로그인 ==========
    @Transactional(readOnly = true)
    public ResponseEntity<?> loginByPhone(PhoneLoginRequest request) {
        try {
            String phone = request.getPhone().trim();

            if (!phone.matches("^\\d{10,11}$"))
                throw new IllegalArgumentException("전화번호 형식이 올바르지 않습니다.");

            Users user = userRepository.findByPhone(phone)
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

            if (!passwordEncoder.matches(request.getPassword(), user.getPassword()))
                throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");

            String token = jwtUtil.createJwt(
                    user.getUserId(),
                    user.getEmail() != null ? user.getEmail() : "",
                    user.getRole(),
                    user.getNickName(),
                    24 * 60 * 60 * 1000L
            );

            return ResponseEntity.ok(new TokenResponse(token, null));

        } catch (IllegalArgumentException e) {
            log.warn("전화번호 로그인 실패: {}", e.getMessage());
            // 인증 실패는 401(Unauthorized)로 응답하는 것이 RESTful 원칙에 더 적합합니다.
            return ResponseEntity.status(401).body(Map.of("message", e.getMessage()));
        }
    }


    // ========== 토큰 갱신 ==========
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

    // ========== 이메일 찾기 ==========
    public ResponseEntity<?> findEmail(String phone, String userName) {
        Users user = userRepository.findByPhoneAndUserName(phone, userName)
                .orElseThrow(() -> new IllegalArgumentException("입력 정보와 일치하는 사용자가 없습니다."));
        return ResponseEntity.ok(Map.of("email", user.getEmail()));
    }

    // ========== 비밀번호 재설정 ==========
    // 비밀번호 재설정용 SMS 발송
    public ResponseEntity<?> sendPasswordResetSms(String phone) {
        String trimmedPhone = phone.trim();
        if (!isValidPhone(trimmedPhone))
            return ResponseEntity.badRequest().body("올바른 전화번호 형식이 아닙니다.");

        // 가입된 사용자인지 확인
        if (!userRepository.existsByPhone(trimmedPhone))
            return ResponseEntity.badRequest().body("가입되지 않은 전화번호입니다.");

        // SMS 발송 로직 (SmsService 가정 - 없으면 유사 로직 구현)
        // 여기서는 PhoneVerification 엔티티만 생성하고 메시지 리턴 (실제 SMS는 SmsService에서)
        // 하지만 SmsService 호출이 필요함. 기존 로직 참고.
        // 현재 AuthService에는 SmsService 의존성이 안보임.
        // 그러나 User Signup 로직에 phone 인증이 있음.
        // 아, Signup.tsx는 /api/sms/send를 호출하고, 그건 AuthController -> SmsService?
        // SmsService가 없다면? AuthController를 봐야함.

        // 일단 AuthService에는 SMS 발송 로직이 없으므로, Verification 엔티티만 처리하는 메서드 추가 불가능?
        // 사용자가 /api/sms/send 호출 시 AuthService를 안거치고 SmsService를 거칠 수도.
        // 확인 필요.
        return ResponseEntity.status(501).body("Not implemented yet");
    }

    // ========== 비밀번호 재설정 ==========
    public ResponseEntity<?> resetPassword(String email, String phone, String userName, String newPassword) {
        try {
            if (!isValidName(userName)) throw new IllegalArgumentException("이름은 한글 또는 영문만 입력 가능합니다.");
            if (!isValidPassword(newPassword))
                throw new IllegalArgumentException("비밀번호는 8자리 이상, 대소문자+숫자+특수문자 !*@# 1개 이상 포함해야 합니다.");

            Users user = null;

            // 1. 이메일 + 이름으로 찾기
            if (email != null && !email.isBlank()) {
                if (!isValidEmail(email)) throw new IllegalArgumentException("올바른 이메일 형식이 아닙니다.");
                
                // 🔥 이메일 인증 여부 확인 (보안 강화)
                EmailVerification ev = emailVerificationRepository.findByUserEmailAndVerifiedTrue(email)
                        .orElseThrow(() -> new IllegalArgumentException("이메일 인증이 완료되지 않았습니다."));
                
                user = userRepository.findByEmailAndUserName(email, userName)
                        .orElse(null);
                        
                // 사용 후 인증 정보 삭제 (재사용 방지)
                emailVerificationRepository.delete(ev);
            }

            // 2. 전화번호 + 이름으로 찾기 (이메일로 못 찾은 경우)
            if (user == null && phone != null && !phone.isBlank()) {
                if (!isValidPhone(phone)) throw new IllegalArgumentException("전화번호는 10~11자리 숫자여야 합니다.");
                
                // 🔥 전화번호 인증 여부 확인
                PhoneVerification pv = phoneVerificationRepository.findByUserPhoneAndVerifiedTrue(phone)
                        .orElseThrow(() -> new IllegalArgumentException("전화번호 인증이 완료되지 않았습니다."));

                user = userRepository.findByPhoneAndUserName(phone, userName)
                        .orElse(null);

                // 사용 후 인증 정보 삭제
                phoneVerificationRepository.delete(pv);
            }

            if (user == null) {
                throw new IllegalArgumentException("입력 정보와 일치하는 사용자가 없습니다.");
            }

            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);

            log.info("비밀번호 재설정 성공: {}", user.getEmail());
            return ResponseEntity.ok("비밀번호가 성공적으로 변경되었습니다.");
        } catch (IllegalArgumentException e) {
            log.warn("비밀번호 재설정 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}