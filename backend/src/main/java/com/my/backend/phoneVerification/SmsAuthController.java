package com.my.backend.phoneVerification;


import com.my.backend.phoneVerification.SmsAuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sms")
@RequiredArgsConstructor
public class SmsAuthController {

    private final SmsAuthService smsAuthService;

    /**
     * 인증번호 발송 API
     * POST /api/sms/send
     */
    @PostMapping("/send")
    public ResponseEntity<SmsVerificationResponse> sendVerificationCode(
            @Valid @RequestBody SmsVerificationRequest.Send request) {

        try {
            SmsVerificationResponse response = smsAuthService.sendVerificationCode(request.getPhone());
            return ResponseEntity.ok(response);

        } catch (IllegalStateException e) {
            // 이미 인증된 번호, 너무 많은 요청 등
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(SmsVerificationResponse.failure(e.getMessage()));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(SmsVerificationResponse.failure("서버 오류가 발생했습니다."));
        }
    }

    /**
     * 비밀번호 재설정 인증번호 발송 API
     * POST /api/sms/reset/send
     */
    @PostMapping("/reset/send")
    public ResponseEntity<SmsVerificationResponse> sendPasswordResetCode(
            @Valid @RequestBody SmsVerificationRequest.Send request) {
        try {
            SmsVerificationResponse response = smsAuthService.sendPasswordResetCode(request.getPhone());
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(SmsVerificationResponse.failure(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(SmsVerificationResponse.failure("서버 오류가 발생했습니다."));
        }
    }

    /**
     * 인증번호 검증 API
     * POST /api/sms/verify
     */
    @PostMapping("/verify")
    public ResponseEntity<SmsVerificationResponse> verifyCode(
            @Valid @RequestBody SmsVerificationRequest.Verify request) {

        try {
            SmsVerificationResponse response = smsAuthService.verifyCode(
                    request.getPhone(),
                    request.getCode()
            );

            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(SmsVerificationResponse.failure("서버 오류가 발생했습니다."));
        }
    }

    /**
     * 인증번호 재발송 API (선택사항)
     * POST /api/sms/resend
     */
    @PostMapping("/resend")
    public ResponseEntity<SmsVerificationResponse> resendVerificationCode(
            @Valid @RequestBody SmsVerificationRequest.Send request) {

        try {
            SmsVerificationResponse response = smsAuthService.resendVerificationCode(request.getPhone());
            return ResponseEntity.ok(response);

        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(SmsVerificationResponse.failure(e.getMessage()));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(SmsVerificationResponse.failure("서버 오류가 발생했습니다."));
        }
    }
}