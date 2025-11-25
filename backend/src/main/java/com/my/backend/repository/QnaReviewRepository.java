package com.my.backend.repository;

import com.my.backend.entity.QnaReview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QnaReviewRepository extends JpaRepository<QnaReview, Long> {
    List<QnaReview> findByQna(Qna qna); // 특정 질문의 답변 조회
}
