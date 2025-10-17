package com.my.backend.controller.board;

import com.my.backend.dto.board.CommentDto;
import com.my.backend.service.board.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.ObjectUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class CommentController {

    private final CommentService commentService;

    // 1️ 댓글 조회
    @GetMapping("/comments/{commentId}")
    public ResponseEntity<?> commentSearch(@PathVariable Long commentId) {
        Map<String, Object> result = commentService.findComment(commentId);
        CommentDto dto = (CommentDto) result.get("dto");

        if (ObjectUtils.isEmpty(dto)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "댓글 조회 실패");
        }

        return ResponseEntity.ok(dto);
    }

    // 2️ 댓글 생성
    @PostMapping("/articles/{articleId}/comments")
    public ResponseEntity<?> commentCreate(
            @PathVariable Long articleId,
            @RequestBody CommentDto dto
    ) {
        commentService.insertComment(articleId, dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "댓글 생성 성공"));
    }

    // 3️ 댓글 수정
    @PatchMapping("/comments/{commentId}")
    public ResponseEntity<?> commentUpdate(
            @PathVariable Long commentId,
            @RequestBody CommentDto dto
    ) {
        Map<String, Object> result = commentService.findComment(commentId);
        CommentDto findDto = (CommentDto) result.get("dto");

        if (ObjectUtils.isEmpty(findDto)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "댓글 수정 실패");
        }

        dto.setCommentId(findDto.getCommentId());
        commentService.updateComment(dto);

        return ResponseEntity.ok(Map.of("message", "댓글 수정 성공"));
    }

    // 4️ 댓글 삭제
    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<?> commentDelete(@PathVariable Long commentId) {
        Map<String, Object> result = commentService.findComment(commentId);
        CommentDto findDto = (CommentDto) result.get("dto");

        if (ObjectUtils.isEmpty(findDto)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "댓글 삭제 실패");
        }

        commentService.deleteComment(commentId);
        return ResponseEntity.ok(Map.of("message", "댓글 삭제 성공"));
    }
}
