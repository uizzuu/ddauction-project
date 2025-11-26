package com.my.backend.repository;

import com.my.backend.entity.QnaReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QnaReviewRepository extends JpaRepository<QnaReview, Long> {

    // 특정 ProductQna에 대한 모든 리뷰 조회
    List<QnaReview> findByQnaProductQnaId(Long productQnaId);

    // 특정 사용자가 작성한 모든 리뷰 조회
    List<QnaReview> findByQnaUserUserId(Long userId);
}