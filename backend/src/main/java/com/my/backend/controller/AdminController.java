package com.my.backend.controller;

import com.my.backend.service.AdminService;
import com.my.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class AdminController {
    private final AdminService adminService;
    private final UserService userService;

    @GetMapping("/admin/stats")
    public Map<String, Long> getStats() {
        return adminService.getStats();
    }



    @PostMapping("/ban/{userId}")
    public ResponseEntity<String> banUser(@PathVariable Long userId, @RequestParam Long adminId) {
        userService.banUser(userId, adminId);
        return ResponseEntity.ok("유저가 밴 처리되었습니다.");
    }
}
