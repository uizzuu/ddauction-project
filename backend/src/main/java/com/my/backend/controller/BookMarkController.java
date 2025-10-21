package com.my.backend.controller;

import com.my.backend.service.BookMarkService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookmarks")
@RequiredArgsConstructor
public class BookMarkController {

    private final BookMarkService bookMarkService;

    /**
     * 찜 토글 (로그인 유저 기준)
     */
    @PostMapping("/toggle")
    public ResponseEntity<String> toggleBookMark(
            @AuthenticationPrincipal(expression = "userId") Long userId,
            @RequestParam Long productId
    ) {
        boolean isBookMarked = bookMarkService.toggleBookMark(userId, productId);
        return ResponseEntity.ok(isBookMarked ? "찜 완료" : "찜 해제");
    }

    /**
     * 상품의 찜 수 조회
     */
    @GetMapping("/count")
    public ResponseEntity<Long> getBookMarkCount(@RequestParam Long productId) {
        return ResponseEntity.ok(bookMarkService.getBookMarkCount(productId));
    }

    /**
     * 로그인 유저 기준 찜 여부 확인
     */
    @GetMapping("/check")
    public ResponseEntity<Boolean> isBookMarked(
            @AuthenticationPrincipal(expression = "userId") Long userId,
            @RequestParam Long productId
    ) {
        boolean bookmarked = bookMarkService.isBookMarked(userId, productId);
        return ResponseEntity.ok(bookmarked);
    }
}