package com.my.backend.business;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/business")
@RequiredArgsConstructor
public class BusinessVerifyController {  // ← 컨트롤러는 클래스여야 함

    private final BusinessVerifyService verificationService;

    @PostMapping("/verify")
    public BusinessVerifyDto verify(@RequestBody BusinessVerifyDto dto) {
        return verificationService.verify(dto);
        // ← verify 결과 DTO 그대로 반환
    }
}
