package com.my.backend.dto;

import com.my.backend.entity.Article;
import com.my.backend.entity.Comment;
import com.my.backend.entity.Users;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentDto {
    private Long commentId;
    private Long articleId;
    private Long userId;
    private String nickName;      // 닉네임 필드 추가
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
                .nickName(comment.getUser() != null ? comment.getUser().getNickName() : null) // 닉네임 세팅
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }

    // DTO → Entity
    public Comment toEntity(Article article, Users user) {
        return Comment.builder()
                .commentId(this.commentId)
                .article(article)
                .user(user)
                .content(this.content)
                .build();
    }
}
