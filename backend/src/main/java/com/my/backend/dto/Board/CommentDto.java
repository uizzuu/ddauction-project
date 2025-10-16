package com.my.backend.dto;

import com.my.backend.entity.board.Article;
import com.my.backend.entity.board.Comment;
import com.my.backend.entity.User;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class CommentDto {
    private Long commentId;
    private Long articleId;
    private Long userId;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Entity → DTO
    public static CommentDto fromEntity(Comment comment) {
        if (comment == null) {
            return null;
        }

        return CommentDto.builder()
                .commentId(comment.getCommentId())
                .articleId(comment.getArticle() != null ? comment.getArticle().getArticleId() : null)
                .userId(comment.getUser() != null ? comment.getUser().getUserId() : null)
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }

    // DTO → Entity
    public Comment toEntity(Article article, User user) {
        return Comment.builder()
                .commentId(this.commentId)
                .article(article)
                .user(user)
                .content(this.content)
                .build();
    }
}
