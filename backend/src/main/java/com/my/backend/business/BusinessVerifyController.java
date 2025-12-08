package com.my.backend.business;

import com.my.backend.dto.auth.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/business")
@RequiredArgsConstructor
public class BusinessVerifyController {

    private final BusinessVerifyService verificationService;

    @PostMapping("/verify")
    public BusinessVerifyDto verify(@RequestBody BusinessVerifyDto dto, Authentication authentication) {
        Long userId;

        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails) {
            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            userId = userDetails.getUserId();
        } else {
            // JWT 없으면 Postman 테스트용 기본 userId
            userId = 1L; // DB에 존재하는 유저 ID
        }

        return verificationService.verifyAndSave(userId, dto);
    }
}