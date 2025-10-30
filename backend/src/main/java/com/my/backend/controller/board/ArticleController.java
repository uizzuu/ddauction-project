package com.my.backend.controller.board;

import com.my.backend.dto.board.ArticleDto;
import com.my.backend.service.board.ArticleService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/articles")
@RequiredArgsConstructor
public class ArticleController {

    private final ArticleService articleService;

    // 1. 전체 게시글 목록 조회
    @GetMapping
    public ResponseEntity<List<ArticleDto>> getAllArticles(@RequestParam Long boardId) {
        // boardId에 해당하는 글만 조회
        List<ArticleDto> articles = articleService.getArticlesByBoardId(boardId);
        return ResponseEntity.ok(articles);
    }

    // 2. 페이징된 게시글 목록 조회 (예: /api/articles?page=0&size=10)
    @GetMapping("/page")
    public ResponseEntity<Page<ArticleDto>> getArticlePage(Pageable pageable) {
        Page<ArticleDto> articlePage = articleService.getArticlePage(pageable);
        return ResponseEntity.ok(articlePage);
    }

    // 3. 특정 게시글 조회
    @GetMapping("/{id}")
    public ResponseEntity<ArticleDto> getArticle(@PathVariable Long id) {
        ArticleDto articleDto = articleService.getOneArticle(id);
        if (articleDto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(articleDto);
    }

    // 4. 게시글 생성
    @PostMapping
    public ResponseEntity<ArticleDto> createArticle(@RequestBody ArticleDto articleDto) {
        ArticleDto created = articleService.insertArticle(articleDto);
        return ResponseEntity.ok(created);
    }

    // 5. 게시글 수정
    @PutMapping("/{id}")
    public ResponseEntity<ArticleDto> updateArticle(@PathVariable Long id, @RequestBody ArticleDto articleDto) {
        ArticleDto updated = articleService.updateArticle(id, articleDto);
        return ResponseEntity.ok(updated);
    }

    // 6. 게시글 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteArticle(@PathVariable Long id) {
        articleService.deleteArticle(id);
        return ResponseEntity.noContent().build();
    }
}
