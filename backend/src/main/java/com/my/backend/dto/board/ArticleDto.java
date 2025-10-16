package com.my.backend.dto.board;

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
    private String nickName;     // 사용자 닉네임
    private Long boardId;
    private String boardName;    // 게시판 이름(엔티티랑 이름 달라도됨)
    private String title;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    //  JPA 쿼리 결과용 생성자 추가
    public ArticleDto(Long articleId, Long userId, String nickName,
                      Long boardId, String boardName,
                      String title, String content,
                      LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.articleId = articleId;
        this.userId = userId;
        this.nickName = nickName;
        this.boardId = boardId;
        this.boardName = boardName;
        this.title = title;
        this.content = content;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Entity → DTO
    public static ArticleDto fromEntity(Article article) {
        if (article == null) return null;

        return ArticleDto.builder()
                .articleId(article.getArticleId())
                .userId(article.getUser() != null ? article.getUser().getUserId() : null)
                .nickName(article.getUser() != null ? article.getUser().getNickName() : null)
                .boardId(article.getBoard() != null ? article.getBoard().getBoardId() : null)
                .boardName(article.getBoard() != null ? article.getBoard().getBoardName() : null)
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
