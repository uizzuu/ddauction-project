package com.my.backend.service;

import com.my.backend.dto.SmsVerificationResponse;
import com.my.backend.entity.PhoneVerification;
import com.my.backend.repository.PhoneVerificationRepository;
import com.my.backend.repository.UserRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.*;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SmsAuthService {

    private final PhoneVerificationRepository phoneVerificationRepository;
    private final UserRepository usersRepository;

    @Value("${solapi.api-key}") 
    private String apiKey;

    @Value("${solapi.api-secret}") 
    private String apiSecret;

    @Value("${solapi.from-number}")
    private String fromNumber;

    // 인메모리 캐시 (실제 서비스에서는 Redis 권장)
    private Map<String, VerificationAttempt> attemptCache = new HashMap<>();

    static class VerificationAttempt {
        int count;
        LocalDateTime firstAttemptTime;

        VerificationAttempt() {
            this.count = 1;
            this.firstAttemptTime = LocalDateTime.now();
        }
    }

    /**
     * 6자리 랜덤 인증번호 생성
     */
    private String generateVerificationCode() {
        Random random = new Random();
        int code = 100000 + random.nextInt(900000);
        return String.valueOf(code);
    }

    /**
     * HMAC 서명 생성
     */
    private String generateSignature(String message) throws Exception {
        Mac hmac = Mac.getInstance("HmacSHA256");
        hmac.init(new SecretKeySpec(apiSecret.getBytes(), "HmacSHA256"));
        return bytesToHex(hmac.doFinal(message.getBytes()));
    }

    /**
     * 바이트 배열을 16진수 문자열로 변환
     */
    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    /**
     * SMS 인증번호 발송
     */
    public SmsVerificationResponse sendVerificationCode(String phone) {
        // 1. 이미 인증된 번호인지 확인
        Optional<PhoneVerification> existingVerification = phoneVerificationRepository
                .findByUserPhoneAndVerifiedTrue(phone);

        if (existingVerification.isPresent()) {
            throw new IllegalStateException("이미 인증된 전화번호입니다.");
        }

        return sendSmsInternal(phone);
    }
    
    /**
     * 비밀번호 재설정용 SMS 인증번호 발송
     */
    public SmsVerificationResponse sendPasswordResetCode(String phone) {
        // 1. 가입된 사용자인지 확인
        if (!usersRepository.existsByPhone(phone)) {
            throw new IllegalStateException("가입되지 않은 전화번호입니다.");
        }
        
        // 기존 인증 정보가 있다면 만료 처리 (새로 발송하기 위함)
        phoneVerificationRepository.findByUserPhoneAndVerifiedTrue(phone)
            .ifPresent(v -> {
                v.setExpiredAt(LocalDateTime.now());
                v.setVerified(false); 
                phoneVerificationRepository.save(v);
            });

        return sendSmsInternal(phone);
    }
    
    private SmsVerificationResponse sendSmsInternal(String phone) {
        // 2. 발송 제한 확인 (1시간에 5회)
        checkSendLimit(phone);

        // 3. 인증번호 생성
        String code = generateVerificationCode();

        // 4. SMS 발송
        boolean sendSuccess = sendSms(phone, code);

        if (!sendSuccess) {
            return SmsVerificationResponse.failure("SMS 발송에 실패했습니다. 잠시 후 다시 시도해주세요.");
        }

        // 5. DB에 인증 정보 저장
        PhoneVerification verification = PhoneVerification.builder()
                .userPhone(phone)
                .phoneVerificationToken(code)
                .createdAt(LocalDateTime.now())
                .expiredAt(LocalDateTime.now().plusMinutes(3))
                .verified(false)
                .build();

        phoneVerificationRepository.save(verification);

        return SmsVerificationResponse.success("인증번호가 발송되었습니다.", 3);
    }

    /**
     * 실제 SMS 발송 로직
     */
    private boolean sendSms(String phone, String code) {
        try {
            String date = Instant.now().toString();
            String salt = UUID.randomUUID().toString().replace("-", "");
            String message = date + salt;
            String signature = generateSignature(message);

            URL url = new URL("https://api.solapi.com/messages/v4/send");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("Authorization",
                    String.format("HMAC-SHA256 apiKey=%s, date=%s, salt=%s, signature=%s",
                            apiKey, date, salt, signature));
            conn.setDoOutput(true);

            String jsonBody = String.format(
                    "{\"message\":{\"to\":\"%s\",\"from\":\"%s\",\"text\":\"[인증번호] %s\\n인증번호를 입력해주세요. (유효시간 3분)\"}}",
                    phone, fromNumber, code
            );

            try (OutputStream os = conn.getOutputStream()) {
                os.write(jsonBody.getBytes("UTF-8"));
            }

            int responseCode = conn.getResponseCode();
            return responseCode == 200;

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * 인증번호 검증
     */
    public SmsVerificationResponse verifyCode(String phone, String code) {
        // 1. 해당 전화번호의 최신 인증 정보 조회
        PhoneVerification verification = phoneVerificationRepository
                .findTopByUserPhoneOrderByCreatedAtDesc(phone)
                .orElse(null);

        if (verification == null) {
            return SmsVerificationResponse.failure("인증번호가 발송되지 않았습니다. 먼저 인증번호를 요청해주세요.");
        }

        // 2. 이미 인증된 경우
        if (verification.isVerified()) {
            return SmsVerificationResponse.failure("이미 인증이 완료된 전화번호입니다.");
        }

        // 3. 만료 확인
        if (LocalDateTime.now().isAfter(verification.getExpiredAt())) {
            return SmsVerificationResponse.failure("인증번호가 만료되었습니다. 다시 요청해주세요.");
        }

        // 4. 인증번호 확인
        if (!verification.getPhoneVerificationToken().equals(code)) {
            return SmsVerificationResponse.failure("인증번호가 일치하지 않습니다.");
        }

        // 5. 인증 완료 처리
        verification.setVerified(true);
        phoneVerificationRepository.save(verification);

        // 6. Users 엔티티에 연결 (이미 가입된 사용자인 경우)
        usersRepository.findByPhone(phone).ifPresent(user -> {
            user.setPhoneVerification(verification);
            usersRepository.save(user);
        });

        return SmsVerificationResponse.success("인증이 완료되었습니다.", null);
    }

    /**
     * 인증번호 재발송
     */
    public SmsVerificationResponse resendVerificationCode(String phone) {
        // 기존 미인증 토큰 만료 처리
        phoneVerificationRepository.findByUserPhoneAndVerifiedFalse(phone)
                .forEach(v -> {
                    v.setExpiredAt(LocalDateTime.now());
                    phoneVerificationRepository.save(v);
                });

        return sendVerificationCode(phone);
    }

    /**
     * 발송 제한 확인 (1시간에 5회)
     */
    private void checkSendLimit(String phone) {
        VerificationAttempt attempt = attemptCache.get(phone);

        if (attempt == null) {
            attemptCache.put(phone, new VerificationAttempt());
            return;
        }

        // 1시간 경과 시 초기화
        if (attempt.firstAttemptTime.plusHours(1).isBefore(LocalDateTime.now())) {
            attemptCache.put(phone, new VerificationAttempt());
            return;
        }

        // 5회 초과 시 제한
        if (attempt.count >= 5) {
            throw new IllegalStateException("인증번호 발송 횟수를 초과했습니다. 1시간 후 다시 시도해주세요.");
        }

        attempt.count++;
    }
}