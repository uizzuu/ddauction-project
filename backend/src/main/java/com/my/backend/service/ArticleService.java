package com.my.backend.service;

import com.my.backend.dto.ArticleDto;
import com.my.backend.entity.Article;
import com.my.backend.entity.Users;
import com.my.backend.enums.ArticleType;
import com.my.backend.repository.ArticleRepository;
import com.my.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityNotFoundException;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ArticleService {

    private final ArticleRepository articleRepository;
    private final UserRepository userRepository;

    // 전체 글 조회
    public List<ArticleDto> getAllArticles() {
        return articleRepository.findAll().stream()
                .map(ArticleDto::fromEntity)
                .toList();
    }

    // 페이징 조회
    public Page<ArticleDto> getArticlePage(Pageable pageable) {
        return articleRepository.findAll(pageable)
                .map(ArticleDto::fromEntity);
    }

    // 단건 조회
    public ArticleDto getOneArticle(Long id) {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("게시글을 찾을 수 없습니다. id=" + id));
        return ArticleDto.fromEntity(article);
    }

    // 유저별 글 조회
    public List<ArticleDto> getArticlesByUserId(Long userId) {
        return articleRepository.findByUserUserId(userId).stream()
                .map(ArticleDto::fromEntity)
                .toList();
    }

    // ArticleType별 글 조회
    public List<ArticleDto> getArticlesByType(ArticleType articleType) {
        return articleRepository.findByArticleType(articleType).stream()
                .map(ArticleDto::fromEntity)
                .toList();
    }

    // 글 등록
    @Transactional
    public ArticleDto insertArticle(ArticleDto articleDto) {
        if (articleDto.getArticleType() == null) {
            throw new IllegalArgumentException("게시글 타입은 필수입니다.");
        }

        Users user = userRepository.findById(articleDto.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다. id=" + articleDto.getUserId()));

        Article article = articleDto.toEntity(user);
        Article saved = articleRepository.save(article);
        return ArticleDto.fromEntity(saved);
    }

    // 글 수정
    @Transactional
    public ArticleDto updateArticle(Long id, ArticleDto articleDto) {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("게시글을 찾을 수 없습니다. id=" + id));

        article.setTitle(articleDto.getTitle());
        article.setContent(articleDto.getContent());

        if (articleDto.getArticleType() != null) {
            article.setArticleType(articleDto.getArticleType());
        }

        Article updated = articleRepository.save(article);
        return ArticleDto.fromEntity(updated);
    }

    // 글 삭제
    @Transactional
    public void deleteArticle(Long id) {
        if (!articleRepository.existsById(id)) {
            throw new EntityNotFoundException("게시글을 찾을 수 없습니다. id=" + id);
        }
        articleRepository.deleteById(id);
    }
}