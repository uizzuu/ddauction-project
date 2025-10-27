package com.my.backend.controller;

import com.my.backend.dto.auth.CustomUserDetails;
import com.my.backend.entity.QnaReview;
import com.my.backend.repository.QnaRepository;
import com.my.backend.service.QnaService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/qna")
@RequiredArgsConstructor
public class QnaController {

    private final QnaService qnaService;
    private final QnaRepository qnaRepository;

    // ============================
    // 질문 작성
    // ============================
    @PostMapping
    public ResponseEntity<?> createQuestion(@RequestBody Map<String, String> body) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body("로그인이 필요합니다.");
        };

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        Long userId = userDetails.getUser().getUserId();

        Long productId = Long.parseLong(body.get("productId"));
        String title = body.get("title");        // 프론트에서 받은 제목
        String question = body.get("question");  // 프론트에서 받은 질문 내용

        return ResponseEntity.ok(qnaService.createQuestion(userId, productId, title, question));
    }

    // ============================
    // 답변 작성
    // ============================
    @PostMapping("/{qnaId}/review")
    public ResponseEntity<?> answerQuestion(@PathVariable Long qnaId, @RequestBody Map<String, String> body) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body("로그인이 필요합니다.");
        }

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        Long userId = userDetails.getUser().getUserId();

        String answer = body.get("answer");
        return ResponseEntity.ok(qnaService.answerQuestion(qnaId, userId, answer));
    }

    // ============================
    // 상품별 QnA 조회 (답변 포함)
    // ============================
    @GetMapping("/product/{productId}")
    public ResponseEntity<?> getQnaByProduct(@PathVariable Long productId) {
        List<Map<String, Object>> qnaListWithReviews = qnaService.getQnaWithReviewsByProduct(productId);
        // userId 포함 확인
        for (Map<String, Object> qnaMap : qnaListWithReviews) {
            if (!qnaMap.containsKey("userId") && qnaMap.get("nickName") != null) {
                // 이미 서비스에서 userId 포함되도록 수정했다면 필요 없음
            }
        }
        return ResponseEntity.ok(qnaListWithReviews);
    }

    // ============================
    // 질문별 답변 조회
    // ============================
    @GetMapping("/{qnaId}/reviews")
    public ResponseEntity<?> getReviewsByQna(@PathVariable Long qnaId) {
        List<QnaReview> reviews = qnaService.getReviewsByQna(qnaId);
        return ResponseEntity.ok(reviews);
    }

    // ============================
    // 마이페이지용 내 질문 + 답변 조회
    // ============================
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getMyQnas(@PathVariable Long userId) {
        List<Map<String, Object>> myQnas = qnaService.getMyQnas(userId);
        return ResponseEntity.ok(myQnas);
    }

    // 상품별 QnA 조회 (답변 + 닉네임 포함)
    public List<Map<String, Object>> getQnaWithReviewsByProduct(Long productId) {
        return qnaRepository.findQnaWithUserByProductId(productId);
    }
}
