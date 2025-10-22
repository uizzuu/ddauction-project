package com.my.backend.service.board;

import com.my.backend.dto.board.CommentDto;
import com.my.backend.entity.User;
import com.my.backend.entity.board.Article;
import com.my.backend.entity.board.Comment;
import com.my.backend.repository.board.CommentRepository;
import com.my.backend.repository.board.ArticleRepository;
import com.my.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.ObjectUtils;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final ArticleRepository articleRepository;
    private final UserRepository userRepository; // User 조회용

    // 1 댓글 조회 (한 개)
    public Map<String, Object> findComment(Long commentId) {
        Comment comment = commentRepository.findById(commentId).orElse(null);

        if (comment == null) {
            return Map.of("dto", null, "articleId", null);
        }

        CommentDto dto = CommentDto.fromEntity(comment); // Entity → DTO
        return Map.of(
                "dto", dto,
                "articleId", comment.getArticle().getArticleId()
        );
    }

    // 2 특정 게시글 댓글 전체 조회
    public List<CommentDto> findCommentsByArticle(Long articleId) {
        Article article = articleRepository.findById(articleId).orElse(null);
        if (article == null) return List.of();

        return commentRepository.findByArticle(article)
                .stream()
                .map(CommentDto::fromEntity)
                .collect(Collectors.toList());
    }

    // 3️ 댓글 생성
    public void insertComment(Long articleId, CommentDto dto) {
        Article article = articleRepository.findById(articleId)
                .orElseThrow(() -> new IllegalArgumentException("게시글 없음"));

        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("사용자 없음"));

        Comment comment = new Comment();
        comment.setArticle(article);
        comment.setUser(user);
        comment.setContent(dto.getContent());

        commentRepository.save(comment);
    }


    // 4️ 댓글 수정
    public void updateComment(CommentDto dto) {
        Comment comment = commentRepository.findById(dto.getCommentId())
                .orElseThrow(() -> new IllegalArgumentException("댓글 없음"));

        if (!ObjectUtils.isEmpty(dto.getContent())) {
            comment.setContent(dto.getContent());
        }

        commentRepository.save(comment); // JPA 변경 감지로도 가능
    }

    // 5️ 댓글 삭제
    public void deleteComment(Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글 없음"));

        commentRepository.delete(comment);
    }
}
