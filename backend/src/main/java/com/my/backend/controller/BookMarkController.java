package com.my.backend.controller;

import com.my.backend.service.BookMarkService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookmarks")
@RequiredArgsConstructor
public class BookMarkController {

    private final BookMarkService bookMarkService;

    @PostMapping("/toggle")
    public ResponseEntity<?> toggleBookMark(@RequestParam Long userId, @RequestParam Long productId) {
        boolean isBookMarked = bookMarkService.toggleBookMark(userId, productId);
        return ResponseEntity.ok().body(isBookMarked ? "찜 완료" : "찜 해제");
    }

    @GetMapping("/count")
    public ResponseEntity<Long> getBookMarkCount(@RequestParam Long productId) {
        return ResponseEntity.ok(bookMarkService.getBookMarkCount(productId));
    }
}
