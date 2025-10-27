package com.my.backend.controller;

import com.my.backend.dto.board.ArticleDto;
import com.my.backend.entity.board.Article;
import com.my.backend.service.InquiryService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/inquiry")
@RequiredArgsConstructor
public class InquiryController {

    private final InquiryService inquiryService;

    // -----------------------------
    // 유저 1:1 문의 작성
    // -----------------------------
    @PostMapping
    public ResponseEntity<?> createInquiry(@RequestBody Map<String, String> body, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(401).body("로그인이 필요합니다.");

        String title = body.get("title");
        String question = body.get("question");

        Article article = inquiryService.createInquiry(userId, title, question);
        return ResponseEntity.ok(ArticleDto.fromEntity(article));
    }

    // -----------------------------
    // 관리자 답변 작성
    // -----------------------------
    @PostMapping("/{articleId}/answer")
    public ResponseEntity<?> answerInquiry(@PathVariable Long articleId,
                                           @RequestBody Map<String, String> body,
                                           HttpSession session) {
        Long adminId = (Long) session.getAttribute("userId");
        if (adminId == null) return ResponseEntity.status(401).body("로그인이 필요합니다.");

        String answer = body.get("answer");
        return ResponseEntity.ok(inquiryService.answerInquiry(articleId, adminId, answer));
    }

    // -----------------------------
    // 유저가 작성한 1:1 문의 조회
    // -----------------------------
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getMyInquiries(@PathVariable Long userId) {
        List<Article> articles = inquiryService.getMyInquiries(userId);
        List<ArticleDto> dtos = articles.stream()
                .map(ArticleDto::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // -----------------------------
    // 관리자 전체 문의 조회
    // -----------------------------
    @GetMapping("/admin")
    public ResponseEntity<?> getAllInquiries() {
        List<Article> articles = inquiryService.getAllInquiries();
        List<ArticleDto> dtos = articles.stream()
                .map(ArticleDto::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
}
