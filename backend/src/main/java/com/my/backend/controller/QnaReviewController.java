package com.my.backend.controller;

import com.my.backend.dto.QnaReviewDto;
import com.my.backend.service.QnaReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/qna-reviews")
public class QnaReviewController {

    private final QnaReviewService qnaReviewService;

    // 전체 답변 조회
    @GetMapping
    public ResponseEntity<List<QnaReviewDto>> getAllQnaReviews() {
        List<QnaReviewDto> reviews = qnaReviewService.getAllQnaReviews();
        return ResponseEntity.ok(reviews);
    }

    // 단건 조회
    @GetMapping("/{id}")
    public ResponseEntity<QnaReviewDto> getQnaReview(@PathVariable Long id) {
        QnaReviewDto review = qnaReviewService.getOneQnaReview(id);
        return ResponseEntity.ok(review);
    }

    // 특정 ProductQna에 대한 모든 답변 조회
    @GetMapping("/product-qna/{productQnaId}")
    public ResponseEntity<List<QnaReviewDto>> getQnaReviewsByProductQna(@PathVariable Long productQnaId) {
        List<QnaReviewDto> reviews = qnaReviewService.getQnaReviewsByProductQnaId(productQnaId);
        return ResponseEntity.ok(reviews);
    }

    // 특정 사용자(판매자)가 작성한 모든 답변 조회
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<QnaReviewDto>> getQnaReviewsByUser(@PathVariable Long userId) {
        List<QnaReviewDto> reviews = qnaReviewService.getQnaReviewsByUserId(userId);
        return ResponseEntity.ok(reviews);
    }

    // 답변 등록
    @PostMapping
    public ResponseEntity<?> createQnaReview(@RequestBody QnaReviewDto qnaReviewDto) {
        QnaReviewDto created = qnaReviewService.insertQnaReview(qnaReviewDto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "답변 등록 성공", "data", created));
    }

    // 답변 수정
    @PutMapping("/{id}")
    public ResponseEntity<?> updateQnaReview(
            @PathVariable Long id,
            @RequestBody QnaReviewDto qnaReviewDto
    ) {
        QnaReviewDto updated = qnaReviewService.updateQnaReview(id, qnaReviewDto);
        return ResponseEntity.ok(Map.of("message", "답변 수정 성강", "data", updated));
    }

    // 답변 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteQnaReview(@PathVariable Long id) {
        qnaReviewService.deleteQnaReview(id);
        return ResponseEntity.ok(Map.of("message", "답변 삭제 성공"));
    }
}