package com.my.backend.controller;


<<<<<<< HEAD
import com.my.backend.dto.PasswordResetRequest;
=======
>>>>>>> 38e217f1fd6bb40ed328539545fddb13d58d817a
import com.my.backend.dto.auth.LoginRequest;
import com.my.backend.dto.auth.RegisterRequest;
import com.my.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

<<<<<<< HEAD
import java.util.Map;

=======
>>>>>>> 38e217f1fd6bb40ed328539545fddb13d58d817a
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
<<<<<<< HEAD
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
=======
        return authService.register(request);
>>>>>>> 38e217f1fd6bb40ed328539545fddb13d58d817a
    }

    /**
     * 로그인
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
<<<<<<< HEAD
        System.out.println("Received email: " + request.getEmail()); // 디버깅 로그
        System.out.println("Email type: " + request.getEmail().getClass().getName());
=======
>>>>>>> 38e217f1fd6bb40ed328539545fddb13d58d817a
        return authService.login(request);
    }

    /**
     * 토큰 갱신
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestHeader("Refresh-Token") String refreshToken) {
        return authService.refreshToken(refreshToken);
    }

<<<<<<< HEAD
    // 이메일 찾기
    @PostMapping("/email-find")
    public ResponseEntity<?> findEmail(@RequestBody Map<String, String> request) {
        return authService.findEmail(request.get("phone"), request.get("userName"));
    }


    @PostMapping("/password-reset")
    public ResponseEntity<?> resetPassword(@RequestBody PasswordResetRequest request) {
        return authService.resetPassword(
                request.getEmail().trim().toLowerCase(),
                request.getPhone().trim(),
                request.getUserName().trim(),
                request.getNewPassword()
        );
=======
    /**
     * 헬스체크용 엔드포인트
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Auth API is running");
>>>>>>> 38e217f1fd6bb40ed328539545fddb13d58d817a
    }
}