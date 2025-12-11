package com.my.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.ObjectUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.my.backend.dto.CommentDto;
import com.my.backend.service.CommentService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class CommentController {

    private final CommentService commentService;

    // 1️⃣ 댓글 조회
    @GetMapping("/comments/{commentId}")
    public ResponseEntity<?> commentSearch(@PathVariable Long commentId) {
        CommentDto dto = commentService.findComment(commentId);

        if (ObjectUtils.isEmpty(dto)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "댓글 조회 실패");
        }

        return ResponseEntity.ok(dto);
    }

    @GetMapping("/articles/{articleId}/comments")
    public ResponseEntity<List<CommentDto>> getCommentsByArticleId(@PathVariable Long articleId) {
        List<CommentDto> comments = commentService.findCommentsByArticleId(articleId);
        return ResponseEntity.ok(comments);
    }

    // 2️⃣ 댓글 생성
    @PostMapping("/articles/{articleId}/comments")
    public ResponseEntity<?> commentCreate(
            @PathVariable Long articleId,
            @RequestBody CommentDto dto
    ) {
        commentService.insertComment(articleId, dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "댓글 생성 성공"));
    }

    // 3️⃣ 댓글 수정
    @PatchMapping("/comments/{commentId}")
    public ResponseEntity<?> commentUpdate(
            @PathVariable Long commentId,
            @RequestBody CommentDto dto
    ) {
        CommentDto findDto = commentService.findComment(commentId);

        if (ObjectUtils.isEmpty(findDto)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "댓글 수정 실패");
        }

        dto.setCommentId(commentId);
        commentService.updateComment(dto);

        return ResponseEntity.ok(Map.of("message", "댓글 수정 성공"));
    }

    // 4️⃣ 댓글 삭제
    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<?> commentDelete(@PathVariable Long commentId) {
        CommentDto findDto = commentService.findComment(commentId);

        if (ObjectUtils.isEmpty(findDto)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "댓글 삭제 실패");
        }

        commentService.deleteComment(commentId);
        return ResponseEntity.ok(Map.of("message", "댓글 삭제 성공"));
    }
}