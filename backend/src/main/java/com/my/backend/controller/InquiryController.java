package com.my.backend.controller;

import com.my.backend.dto.board.ArticleDto;
import com.my.backend.dto.board.CommentDto;
import com.my.backend.entity.board.Article;
import com.my.backend.entity.board.Comment;
import com.my.backend.service.InquiryService;
import com.my.backend.myjwt.JWTUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inquiry")
@RequiredArgsConstructor
public class InquiryController {

    private final InquiryService inquiryService;
    private final JWTUtil jwtUtil;

    // -----------------------------
    // 유저 1:1 문의 작성
    // -----------------------------
    @PostMapping
    public ResponseEntity<?> createInquiry(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody Map<String, String> body
    ) {
        try {
            if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body("로그인이 필요합니다.");
            }
            String token = authorizationHeader.substring(7);
            Long userId = jwtUtil.getUserId(token);

            String title = body.get("title");
            String question = body.get("question");

            Article article = inquiryService.createInquiry(userId, title, question);
            return ResponseEntity.ok(ArticleDto.fromEntity(article));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // -----------------------------
    // 관리자 답변 작성 (Comment 사용)
    // -----------------------------
    @PostMapping("/{articleId}/answer")
    public ResponseEntity<?> answerInquiry(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable Long articleId,
            @RequestBody Map<String, String> body
    ) {
        try {
            if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body("로그인이 필요합니다.");
            }
            String token = authorizationHeader.substring(7);
            Long adminId = jwtUtil.getUserId(token);

            String answer = body.get("answer");
            Comment comment = inquiryService.answerInquiry(articleId, adminId, answer);

            return ResponseEntity.ok(CommentDto.fromEntity(comment));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // -----------------------------
    // 유저가 작성한 1:1 문의 조회 (답변 포함)
    // -----------------------------
    @GetMapping("/user")
    public ResponseEntity<?> getMyInquiries(@RequestHeader("Authorization") String authorizationHeader) {
        try {
            if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body("로그인이 필요합니다.");
            }
            String token = authorizationHeader.substring(7);
            Long userId = jwtUtil.getUserId(token);

            List<Article> articles = inquiryService.getMyInquiries(userId);

            // ArticleDto + 답변(CommentDto) 포함
            List<ArticleDto> dtos = articles.stream().map(article -> {
                ArticleDto dto = ArticleDto.fromEntity(article);
                List<CommentDto> comments = inquiryService.getCommentsByArticle(article.getArticleId());
                // comments를 ArticleDto 안에 넣으려면 ArticleDto 수정 필요
                // 일단 별도로 CommentDto 리스트 반환
                dto.setContent(dto.getContent() + "\n\n[답변]: " +
                        comments.stream().map(CommentDto::getContent).reduce("", (a, b) -> a + "\n" + b));
                return dto;
            }).toList();

            return ResponseEntity.ok(dtos);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // -----------------------------
    // 관리자 전체 문의 조회 (답변 포함)
    // -----------------------------
    @GetMapping("/admin")
    public ResponseEntity<?> getAllInquiries() {
        List<Article> articles = inquiryService.getAllInquiries();

        List<ArticleDto> dtos = articles.stream().map(article -> {
            ArticleDto dto = ArticleDto.fromEntity(article);
            List<CommentDto> comments = inquiryService.getCommentsByArticle(article.getArticleId());
            dto.setContent(dto.getContent() + "\n\n[답변]: " +
                    comments.stream().map(CommentDto::getContent).reduce("", (a, b) -> a + "\n" + b));
            return dto;
        }).toList();

        return ResponseEntity.ok(dtos);
    }
}
