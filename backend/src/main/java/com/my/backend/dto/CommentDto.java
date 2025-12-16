package com.my.backend.dto;

import com.my.backend.entity.Article;
import com.my.backend.entity.Comment;
import com.my.backend.entity.Users;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CommentDto {
    private Long commentId;
    private Long articleId;
    private Long userId;
    private String nickName;      // 읽기용 닉네임
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String articleTitle; // 게시글 제목 추가

    // Entity → DTO
    public static CommentDto fromEntity(Comment comment) {
        if (comment == null) return null;

        return CommentDto.builder()
                .commentId(comment.getCommentId())
                .articleId(comment.getArticle() != null ? comment.getArticle().getArticleId() : null)
                .userId(comment.getUser() != null ? comment.getUser().getUserId() : null)
                .nickName(comment.getUser() != null ? comment.getUser().getNickName() : null)
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .articleTitle(comment.getArticle() != null ? comment.getArticle().getTitle() : null)
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
