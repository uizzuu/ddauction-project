package com.my.backend.controller;

import com.my.backend.dto.ProductDto;
import com.my.backend.service.BookMarkService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookmarks")
@RequiredArgsConstructor
public class BookMarkController {

    private final BookMarkService bookMarkService;

    // 🔹 찜 토글 (세션 기반)
    @PostMapping("/toggle")
    public ResponseEntity<String> toggleBookMark(
            HttpSession session,
            @RequestParam Long productId
    ) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).body("로그인이 필요합니다.");
        }

        boolean isBookMarked = bookMarkService.toggleBookMark(userId, productId);
        return ResponseEntity.ok(isBookMarked ? "찜 완료" : "찜 해제");
    }

    // 🔹 상품의 찜 수 조회
    @GetMapping("/count")
    public ResponseEntity<Long> getBookMarkCount(@RequestParam Long productId) {
        return ResponseEntity.ok(bookMarkService.getBookMarkCount(productId));
    }

    // 🔹 로그인 유저 기준 찜 여부 확인
    @GetMapping("/check")
    public ResponseEntity<Boolean> isBookMarked(
            HttpSession session,
            @RequestParam Long productId
    ) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).body(false);
        }

        boolean bookmarked = bookMarkService.isBookMarked(userId, productId);
        return ResponseEntity.ok(bookmarked);
    }

    // 🔹 로그인 유저 기준 찜한 상품 목록 조회 (마이페이지)
    @GetMapping("/mypage")
    public ResponseEntity<List<ProductDto>> getMyBookMarks(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        List<ProductDto> bookmarks = bookMarkService.getBookMarkedProducts(userId);
        return ResponseEntity.ok(bookmarks);
    }
}
