package com.my.backend.controller;

import com.my.backend.entity.Qna;
import com.my.backend.entity.QnaReview;
import com.my.backend.service.QnaService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/qna")
@RequiredArgsConstructor
public class QnaController {

    private final QnaService qnaService;

    // 질문 작성
    @PostMapping
    public ResponseEntity<?> createQuestion(@RequestBody Map<String, String> body, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(401).body("로그인이 필요합니다.");

        Long productId = Long.parseLong(body.get("productId"));
        String title = body.get("title");
        String question = body.get("question");

        return ResponseEntity.ok(qnaService.createQuestion(userId, productId, title, question));
    }

    // 답변 작성
    @PostMapping("/{qnaId}/review")
    public ResponseEntity<?> answerQuestion(@PathVariable Long qnaId, @RequestBody Map<String, String> body, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(401).body("로그인이 필요합니다.");

        String answer = body.get("answer");
        return ResponseEntity.ok(qnaService.answerQuestion(qnaId, userId, answer));
    }

    // 상품별 QnA 조회 (답변 포함)
    @GetMapping("/product/{productId}")
    public ResponseEntity<?> getQnaByProduct(@PathVariable Long productId) {
        List<Map<String, Object>> qnaListWithReviews = qnaService.getQnaWithReviewsByProduct(productId);
        return ResponseEntity.ok(qnaListWithReviews);
    }

    // 질문별 답변 조회 (선택적)
    @GetMapping("/{qnaId}/reviews")
    public ResponseEntity<?> getReviewsByQna(@PathVariable Long qnaId) {
        List<QnaReview> reviews = qnaService.getReviewsByQna(qnaId);
        return ResponseEntity.ok(reviews);
    }
}
