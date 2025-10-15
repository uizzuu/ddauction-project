package com.my.backend.dto;

import com.my.backend.entity.Board;
import com.my.backend.entity.User;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class BoardDto {
    private Long boardId;
    private Long userId;
    private String nickName;    // 유저 닉네임 (User 테이블에서 실시간 조회)
    private String title;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Entity -> DTO
    public static BoardDto fromEntity(Board board) {
        if (board == null || board.getUser() == null) return null;

        return BoardDto.builder()
                .boardId(board.getBoardId())
                .userId(board.getUser().getUserId())
                .nickName(board.getUser().getNickName()) // 실시간으로 User에서 가져옴
                .title(board.getTitle())
                .content(board.getContent())
                .createdAt(board.getCreatedAt())
                .updatedAt(board.getUpdatedAt())
                .build();
    }

    // DTO -> Entity
    public Board toEntity(User user) {
        return Board.builder()
                .boardId(this.boardId)
                .user(user)
                .title(this.title)
                .content(this.content)
                .build();
    }
}
