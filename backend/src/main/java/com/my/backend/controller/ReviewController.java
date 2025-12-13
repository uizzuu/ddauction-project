package com.my.backend.controller;

import com.my.backend.dto.ReviewDto;
import com.my.backend.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    // 리뷰 작성
    @PostMapping
    public ResponseEntity<?> createReview(@Valid @RequestBody ReviewDto dto) {
        ReviewDto saved = reviewService.createReview(dto);
        return ResponseEntity.ok(Map.of("message", "리뷰 작성 성공", "review", saved));
    }

    // 특정 유저 리뷰 리스트 조회
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ReviewDto>> getReviews(@PathVariable Long userId) {
        List<ReviewDto> reviews = reviewService.getReviewsForUser(userId);
        return ResponseEntity.ok(reviews);
    }

    // 특정 유저 평균 평점
    @GetMapping("/user/{userId}/average")
    public ResponseEntity<Map<String, Double>> getAverageRating(@PathVariable Long userId) {
        double avg = reviewService.getAverageRating(userId);
        return ResponseEntity.ok(Map.of("averageRating", avg));
    }
}
