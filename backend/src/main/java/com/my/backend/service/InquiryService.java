package com.my.backend.service;

import com.my.backend.entity.Qna;
import com.my.backend.entity.QnaReview;
import com.my.backend.entity.User;
import com.my.backend.entity.board.Article;
import com.my.backend.entity.board.Board;
import com.my.backend.repository.QnaReviewRepository;
import com.my.backend.repository.UserRepository;
import com.my.backend.repository.board.ArticleRepository;
import com.my.backend.repository.board.BoardRepository;
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
    private final QnaReviewRepository qnaReviewRepository; // 답변 연결용

    // -----------------------------
    // 유저 1:1 문의 작성
    // -----------------------------
    @Transactional
    public Article createInquiry(Long userId, String title, String question) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자가 없습니다."));

        // 1:1 문의 게시판 가져오기 (없으면 생성)
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
    // 관리자 답변 작성
    // -----------------------------
    @Transactional
    public QnaReview answerInquiry(Long articleId, Long adminId, String answer) {
        Article article = articleRepository.findById(articleId)
                .orElseThrow(() -> new IllegalArgumentException("문의글이 없습니다."));
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new IllegalArgumentException("관리자가 없습니다."));

        if (!admin.getRole().equals(User.Role.ADMIN)) {
            throw new IllegalArgumentException("관리자만 답변 가능");
        }

        QnaReview review = QnaReview.builder()
                .qnaUser(admin)
                .qna(Qna.builder()
                        .title(article.getTitle())
                        .question(article.getContent())
                        .build())
                .answer(answer)
                .build();

        return qnaReviewRepository.save(review);
    }

    // -----------------------------
    // 유저가 자신의 문의글 + 답변 조회
    // -----------------------------
    public List<Article> getMyInquiries(Long userId) {
        // 1:1 문의 게시판 가져오기
        Board board = boardRepository.findByBoardName("1:1 문의")
                .orElseThrow(() -> new IllegalArgumentException("1:1 문의 게시판 없음"));

        // 유저 + 1:1 문의 게시판 기준 조회
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


}
