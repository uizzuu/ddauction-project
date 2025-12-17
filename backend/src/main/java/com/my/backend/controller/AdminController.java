package com.my.backend.controller;

import com.my.backend.dto.BanRequestDto;
import com.my.backend.dto.BanResponseDto;
import com.my.backend.dto.BanStatusDto;
import com.my.backend.service.AdminService;
import com.my.backend.service.UserService;
import com.my.backend.service.UserBanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class AdminController {
    private final AdminService adminService;
    private final UserService userService;
    private final UserBanService userBanService;

    @GetMapping("/admin/stats")
    public Map<String, Long> getStats() {
        return adminService.getStats();
    }

    // ----------------- 밴 -----------------
    // 공개채팅 유저 밴
    @PostMapping("/ban/{userId}")
    public ResponseEntity<String> banUser(@PathVariable Long userId, @RequestParam Long adminId) {
        userService.banUser(userId, adminId);
        return ResponseEntity.ok("유저가 밴 처리되었습니다.");
    }
    // ----------------- 경고 -----------------
    // 공개채팅 유저 경고 (POST /api/warn)
    @PostMapping("/warn")
    public ResponseEntity<BanResponseDto> warnUser(
            @RequestBody BanRequestDto request,
            Authentication auth) {

        Long adminId = getAdminIdFromAuth(auth); // 실제 auth에서 추출
        BanResponseDto response = userBanService.banUser(request, adminId); // 서비스 이름 그대로 사용
        return ResponseEntity.ok(response);
    }

    // 경고 해제 (DELETE /api/warn/{warnId})
    @DeleteMapping("/warn/{warnId}")
    public ResponseEntity<Void> liftWarn(
            @PathVariable Long warnId,
            Authentication auth) {

        Long adminId = getAdminIdFromAuth(auth);
        userBanService.liftBan(warnId, adminId); // 서비스 이름 그대로 사용
        return ResponseEntity.ok().build();
    }

    // 특정 유저 경고 이력 조회 (GET /api/user/{userId})
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<BanResponseDto>> getWarnHistory(@PathVariable Long userId) {
        List<BanResponseDto> history = userBanService.getBanHistory(userId);
        return ResponseEntity.ok(history);
    }

    // 모든 활성 경고 조회 (GET /api/active)
    @GetMapping("/active")
    public ResponseEntity<List<BanResponseDto>> getAllActiveWarns() {
        List<BanResponseDto> warns = userBanService.getAllActiveBans();
        return ResponseEntity.ok(warns);
    }

    // 유저 경고 상태 확인 (GET /api/warn/status/{userId})
    @GetMapping("/warn/status/{userId}")
    public ResponseEntity<BanStatusDto> checkWarnStatus(@PathVariable Long userId) {
        BanStatusDto status = userBanService.checkBanStatus(userId);
        return ResponseEntity.ok(status);
    }

    // Authentication에서 관리자 ID 추출
    private Long getAdminIdFromAuth(Authentication auth) {
        // TODO: 실제 구현에서는 CustomUserDetails 등에서 추출
        return 25L; // 임시
    }
}

