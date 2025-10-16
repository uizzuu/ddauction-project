package com.my.backend.dto;

import com.my.backend.entity.board.Article;
import com.my.backend.entity.board.Board;
import com.my.backend.entity.User;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ArticleDto {
    private Long articleId;
    private Long userId;
    private Long boardId;
    private String title;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Entity → DTO
    public static ArticleDto fromEntity(Article article) {
        if (article == null) {
            return null;
        }

        return ArticleDto.builder()
                .articleId(article.getArticleId())
                .userId(article.getUser() != null ? article.getUser().getUserId() : null)
                .boardId(article.getBoard() != null ? article.getBoard().getBoardId() : null)
                .title(article.getTitle())
                .content(article.getContent())
                .createdAt(article.getCreatedAt())
                .updatedAt(article.getUpdatedAt())
                .build();
    }

    // DTO → Entity
    public Article toEntity(User user, Board board) {
        return Article.builder()
                .articleId(this.articleId)
                .user(user)
                .board(board)
                .title(this.title)
                .content(this.content)
                .build();
    }
}
