package com.my.backend.service;

import com.my.backend.entity.Qna;
import com.my.backend.entity.QnaReview;
import com.my.backend.entity.User;
import com.my.backend.entity.User.Role;
import com.my.backend.entity.Product;
import com.my.backend.entity.board.Board;
import com.my.backend.repository.QnaRepository;
import com.my.backend.repository.QnaReviewRepository;
import com.my.backend.repository.UserRepository;
import com.my.backend.repository.ProductRepository;
import com.my.backend.repository.board.BoardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class QnaService {

    private final QnaRepository qnaRepository;
    private final QnaReviewRepository qnaReviewRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final BoardRepository boardRepository;

    // 질문 작성
    @Transactional
    public Qna createQuestion(Long userId, Long productId, String title, String question) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자가 존재하지 않습니다."));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품이 존재하지 않습니다."));

        Board board = Board.builder()
                .boardName(title)
                .build();
        boardRepository.save(board);

        Qna qna = Qna.builder()
                .user(user)
                .product(product)
                .board(board)
                .title(title)
                .question(question)
                .build();

        return qnaRepository.save(qna);
    }

    // 답변 작성 (관리자 또는 판매자만 가능)
    @Transactional
    public QnaReview answerQuestion(Long qnaId, Long userId, String answer) {
        Qna qna = qnaRepository.findById(qnaId)
                .orElseThrow(() -> new IllegalArgumentException("질문이 존재하지 않습니다."));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자가 존재하지 않습니다."));
        Product product = qna.getProduct();

        boolean isAdmin = user.getRole() == Role.ADMIN;
        boolean isSeller = product != null && product.getUser() != null &&
                Objects.equals(product.getUser().getUserId(), userId);

        if (!isAdmin && !isSeller) {
            throw new IllegalArgumentException("답변 권한이 없습니다.");
        }

        QnaReview review = QnaReview.builder()
                .qna(qna)
                .qnaUser(user)
                .answer(answer)
                .build();

        return qnaReviewRepository.save(review);
    }

    // 상품별 질문 + 답변 조회
    public List<Map<String, Object>> getQnaWithReviewsByProduct(Long productId) {
        List<Qna> qnaList = qnaRepository.findByProductProductId(productId);
        List<Map<String, Object>> result = new ArrayList<>();

        for (Qna qna : qnaList) {
            List<QnaReview> reviews = qnaReviewRepository.findByQna(qna);

            List<Map<String, Object>> answerList = new ArrayList<>();
            for (QnaReview r : reviews) {
                Map<String, Object> answerMap = new HashMap<>();
                answerMap.put("qnaReviewId", r.getQnaReviewId());
                answerMap.put("answer", r.getAnswer());
                answerMap.put("nickName", r.getQnaUser().getNickName());
                answerMap.put("createdAt", r.getCreatedAt());
                answerList.add(answerMap);
            }

            Map<String, Object> qnaMap = new HashMap<>();
            qnaMap.put("qnaId", qna.getQnaId());
            qnaMap.put("title", qna.getTitle());
            qnaMap.put("question", qna.getQuestion());
            qnaMap.put("createdAt", qna.getCreatedAt());
            qnaMap.put("nickName", qna.getUser().getNickName());
            qnaMap.put("answers", answerList);

            result.add(qnaMap);
        }

        return result;
    }

    // 질문별 답변 조회
    public List<QnaReview> getReviewsByQna(Long qnaId) {
        Qna qna = qnaRepository.findById(qnaId)
                .orElseThrow(() -> new IllegalArgumentException("질문이 존재하지 않습니다."));
        return qnaReviewRepository.findByQna(qna);
    }

    // 내 질문 + 답변 조회 (마이페이지용)
    public List<Map<String, Object>> getMyQnas(Long userId) {
        List<Qna> qnaList = qnaRepository.findByUserUserId(userId);
        List<Map<String, Object>> result = new ArrayList<>();

        for (Qna qna : qnaList) {
            List<QnaReview> reviews = qnaReviewRepository.findByQna(qna);

            List<Map<String, Object>> answerList = new ArrayList<>();
            for (QnaReview r : reviews) {
                Map<String, Object> answerMap = new HashMap<>();
                answerMap.put("qnaReviewId", r.getQnaReviewId());
                answerMap.put("answer", r.getAnswer());
                answerMap.put("nickName", r.getQnaUser().getNickName());
                answerMap.put("createdAt", r.getCreatedAt());
                answerList.add(answerMap);
            }

            Map<String, Object> qnaMap = new HashMap<>();
            qnaMap.put("qnaId", qna.getQnaId());
            qnaMap.put("title", qna.getTitle());
            qnaMap.put("question", qna.getQuestion());
            qnaMap.put("createdAt", qna.getCreatedAt());
            qnaMap.put("answers", answerList);

            result.add(qnaMap);
        }

        return result;
    }
}
