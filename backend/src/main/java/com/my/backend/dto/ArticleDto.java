package com.my.backend.dto;

import com.my.backend.entity.Article;
import com.my.backend.entity.Users;
import com.my.backend.enums.ArticleType;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ArticleDto {
    private Long articleId;
    private Long userId;
    private String nickName;
    private String title;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private ArticleType articleType;

    // Entity → DTO
    public static ArticleDto fromEntity(Article article) {
        if (article == null) return null;

        return ArticleDto.builder()
                .articleId(article.getArticleId())
                .userId(article.getUser() != null ? article.getUser().getUserId() : null)
                .nickName(article.getUser() != null ? article.getUser().getNickName() : null)
                .title(article.getTitle())
                .content(article.getContent())
                .createdAt(article.getCreatedAt())
                .updatedAt(article.getUpdatedAt())
                .articleType(article.getArticleType())
                .build();
    }

    // DTO → Entity
    public Article toEntity(Users user) {
        return Article.builder()
                .articleId(this.articleId)
                .user(user)
                .title(this.title)
                .content(this.content)
                .articleType(this.articleType)
                .build();
    }
}
