package com.my.backend.repository;

import com.my.backend.entity.Qna;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QnaRepository extends JpaRepository<Qna, Long> {
    List<Qna> findByProductProductId(Long productId); // 상품별 질문 조회
    List<Qna> findByUserUserId(Long userId);          // 유저별 질문 조회
}
