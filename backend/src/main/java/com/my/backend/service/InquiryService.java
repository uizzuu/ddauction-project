package com.my.backend.service;

import com.my.backend.dto.board.CommentDto;
import com.my.backend.entity.board.Article;
import com.my.backend.entity.board.Board;
import com.my.backend.entity.board.Comment;
import com.my.backend.repository.UserRepository;
import com.my.backend.repository.board.ArticleRepository;
import com.my.backend.repository.board.BoardRepository;
import com.my.backend.repository.board.CommentRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InquiryService {

    private final ArticleRepository articleRepository;
    private final BoardRepository boardRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;

    // -----------------------------
    // 유저 1:1 문의 작성
    // -----------------------------
    @Transactional
    public Article createInquiry(Long userId, String title, String question) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자가 없습니다."));

        Board board = boardRepository.findByBoardName("1:1 문의")
                .orElseGet(() -> boardRepository.save(Board.builder().boardName("1:1 문의").build()));

        Article article = Article.builder()
                .user(user)
                .board(board)
                .title(title)
                .content(question)
                .build();

        return articleRepository.save(article);
    }

    // -----------------------------
    // 관리자 답변 작성 (Comment 사용)
    // -----------------------------
    @Transactional
    public Comment answerInquiry(Long articleId, Long adminId, String answer) {
        Article article = articleRepository.findById(articleId)
                .orElseThrow(() -> new IllegalArgumentException("문의글이 없습니다."));
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new IllegalArgumentException("관리자가 없습니다."));

        if (!admin.getRole().equals(User.Role.ADMIN)) {
            throw new IllegalArgumentException("관리자만 답변 가능");
        }

        Comment comment = Comment.builder()
                .article(article)
                .user(admin)
                .content(answer)
                .build();

        return commentRepository.save(comment);
    }

    // -----------------------------
    // 유저가 자신의 문의글 조회
    // -----------------------------
    public List<Article> getMyInquiries(Long userId) {
        Board board = boardRepository.findByBoardName("1:1 문의")
                .orElseThrow(() -> new IllegalArgumentException("1:1 문의 게시판 없음"));

        return articleRepository.findByUserUserIdAndBoard(userId, board);
    }

    // -----------------------------
    // 관리자용 전체 문의글 조회
    // -----------------------------
    public List<Article> getAllInquiries() {
        Board board = boardRepository.findByBoardName("1:1 문의")
                .orElseThrow(() -> new IllegalArgumentException("1:1 문의 게시판 없음"));

        return articleRepository.findByBoard(board);
    }

    // -----------------------------
    // 특정 Article의 답변(Comment) 조회
    // -----------------------------
    public List<CommentDto> getCommentsByArticle(Long articleId) {
        return commentRepository.findByArticleArticleId(articleId).stream()
                .map(CommentDto::fromEntity)
                .toList();
    }
}
