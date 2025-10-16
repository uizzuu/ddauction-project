package com.my.backend.dto.board;

import com.my.backend.entity.board.Board;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BoardDto {
    private Long boardId;
    private String boardName;

    // Entity → DTO
    public static BoardDto fromEntity(Board board) {
        if (board == null) {
            return null;
        }
        return BoardDto.builder()
                .boardId(board.getBoardId())
                .boardName(board.getBoardName())
                .build();
    }

    // DTO → Entity
    public Board toEntity() {
        return Board.builder()
                .boardId(this.boardId)
                .boardName(this.boardName)
                .build();
    }
}
