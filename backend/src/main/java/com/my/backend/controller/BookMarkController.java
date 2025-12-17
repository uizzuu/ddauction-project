package com.my.backend.controller;

import com.my.backend.dto.ProductDto;
import com.my.backend.myjwt.JWTUtil;
import com.my.backend.service.BookMarkService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;

@RestController
@RequestMapping("/api/bookmarks")
@RequiredArgsConstructor
public class BookMarkController {

    private final BookMarkService bookMarkService;
    private final JWTUtil jwtUtil;

    /**
     * 🔹 찜 토글 (JWT 기반)
     */
    @PostMapping("/toggle")
    public ResponseEntity<String> toggleBookMark(
            HttpServletRequest request,
            @RequestParam Long productId
    ) {
        Long userId = getUserIdFromRequest(request);
        if (userId == null) {
            return ResponseEntity.status(401).body("로그인이 필요합니다.");
        }

        boolean isBookMarked = bookMarkService.toggleBookMark(userId, productId);
        return ResponseEntity.ok(isBookMarked ? "찜 완료" : "찜 해제");
    }

    /**
     * 🔹 상품의 찜 수 조회 (JWT 없이도 조회 가능)
     */
    @GetMapping("/count")
    public ResponseEntity<Long> getBookMarkCount(@RequestParam Long productId) {
        return ResponseEntity.ok(bookMarkService.getBookMarkCount(productId));
    }

    /**
     * 🔹 로그인 유저 기준 찜 여부 확인
     */
    @GetMapping("/check")
    public ResponseEntity<Boolean> isBookMarked(
            HttpServletRequest request,
            @RequestParam Long productId
    ) {
        Long userId = getUserIdFromRequest(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(false);
        }

        boolean bookmarked = bookMarkService.isBookMarked(userId, productId);
        return ResponseEntity.ok(bookmarked);
    }

    /**
     * 🔹 로그인 유저 기준 찜한 상품 목록 조회 (마이페이지)
     */
    @GetMapping("/mypage")
    public ResponseEntity<List<ProductDto>> getMyBookMarks(HttpServletRequest request) {
        Long userId = getUserIdFromRequest(request);
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        List<ProductDto> bookmarks = bookMarkService.getBookMarkedProducts(userId);
        return ResponseEntity.ok(bookmarks);
    }

    /**
     * 🔹 JWT 헤더에서 userId 추출
     */
    private Long getUserIdFromRequest(HttpServletRequest request) {
        try {
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;

            String token = authHeader.substring(7);
            return jwtUtil.getUserId(token); // JWTUtil에서 payload에서 userId 꺼내는 메서드
        } catch (Exception e) {
            return null;
        }
    }
}
