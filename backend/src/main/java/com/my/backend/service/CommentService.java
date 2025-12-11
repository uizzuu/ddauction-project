package com.my.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.my.backend.dto.CommentDto;
import com.my.backend.entity.Article;
import com.my.backend.entity.Comment;
import com.my.backend.entity.Users;
import com.my.backend.repository.ArticleRepository;
import com.my.backend.repository.CommentRepository;
import com.my.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommentService {

    private final CommentRepository commentRepository;
    private final ArticleRepository articleRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    // 댓글 단건 조회
    public CommentDto findComment(Long commentId) {
        Comment comment = commentRepository.findById(commentId).orElse(null);
        if (comment == null) {
            return null;
        }
        return CommentDto.fromEntity(comment);
    }

    // 특정 게시글의 댓글 전체 조회
    public List<CommentDto> findCommentsByArticleId(Long articleId) {
        return commentRepository.findByArticleArticleId(articleId).stream()
                .map(CommentDto::fromEntity)
                .toList();
    }

    // 댓글 생성
    @Transactional
    public void insertComment(Long articleId, CommentDto dto) {
        Article article = articleRepository.findById(articleId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

        Users user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        Comment comment = dto.toEntity(article, user);
        commentRepository.save(comment);

        // ✅ 댓글 작성 시 게시글 작성자에게 알림 전송 (본인 댓글 제외)
        if (!article.getUser().getUserId().equals(user.getUserId())) {
            notificationService.sendCommentReplyNotification(
                    article.getUser().getUserId(),
                    article.getTitle()
            );
        }
    }

    // 댓글 수정
    @Transactional
    public void updateComment(CommentDto dto) {
        Comment comment = commentRepository.findById(dto.getCommentId())
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));

        if (dto.getContent() != null && !dto.getContent().isBlank()) {
            comment.setContent(dto.getContent());
        }

        commentRepository.save(comment);
    }

    // 댓글 삭제
    @Transactional
    public void deleteComment(Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));

        commentRepository.delete(comment);
    }
}