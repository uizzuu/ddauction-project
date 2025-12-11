package com.my.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.my.backend.dto.ArticleDto;
import com.my.backend.enums.ArticleType;
import com.my.backend.service.ArticleService;
import com.my.backend.service.NotificationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/articles")
public class ArticleController {

    private final ArticleService articleService;
    private final NotificationService notificationService;

    // 전체 게시글 조회
    @GetMapping
    public ResponseEntity<List<ArticleDto>> getAllArticles() {
        List<ArticleDto> articles = articleService.getAllArticles();
        return ResponseEntity.ok(articles);
    }

    // 페이징 조회
    @GetMapping("/page")
    public ResponseEntity<Page<ArticleDto>> getArticlePage(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<ArticleDto> articlePage = articleService.getArticlePage(pageable);
        return ResponseEntity.ok(articlePage);
    }

    // 단건 조회
    @GetMapping("/{id}")
    public ResponseEntity<ArticleDto> getArticle(@PathVariable Long id) {
        ArticleDto article = articleService.getOneArticle(id);
        return ResponseEntity.ok(article);
    }

    // 사용자별 게시글 조회
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ArticleDto>> getArticlesByUser(@PathVariable Long userId) {
        List<ArticleDto> articles = articleService.getArticlesByUserId(userId);
        return ResponseEntity.ok(articles);
    }

    // ArticleType별 게시글 조회
    @GetMapping("/type/{articleType}")
    public ResponseEntity<List<ArticleDto>> getArticlesByType(@PathVariable ArticleType articleType) {
        List<ArticleDto> articles = articleService.getArticlesByType(articleType);
        return ResponseEntity.ok(articles);
    }

    // 게시글 등록
    @PostMapping
    public ResponseEntity<?> createArticle(@RequestBody ArticleDto articleDto) {
        ArticleDto created = articleService.insertArticle(articleDto);

        // ✅ 공지사항(NOTICE) 등록 시 전체 알림 전송
        if (created.getArticleType() == ArticleType.NOTICE) {
            // 주의: DTO의 userId가 null이 아닌지 확인 필요
            Long adminId = created.getUserId();
            if (adminId != null) {
                notificationService.sendAnnouncementNotification(adminId, "새로운 공지사항이 등록되었습니다: " + created.getTitle());
            }
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "게시글 등록 성공", "data", created));
    }

    // 게시글 수정
    @PutMapping("/{id}")
    public ResponseEntity<?> updateArticle(
            @PathVariable Long id,
            @RequestBody ArticleDto articleDto
    ) {
        ArticleDto updated = articleService.updateArticle(id, articleDto);
        return ResponseEntity.ok(Map.of("message", "게시글 수정 성공", "data", updated));
    }

    // 게시글 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteArticle(@PathVariable Long id) {
        articleService.deleteArticle(id);
        return ResponseEntity.ok(Map.of("message", "게시글 삭제 성공"));
    }
}