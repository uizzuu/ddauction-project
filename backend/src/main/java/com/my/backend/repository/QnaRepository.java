package com.my.backend.repository;

import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Map;

public interface QnaRepository extends JpaRepository<Qna, Long> {
    List<Qna> findByProductProductId(Long productId); // 상품별 질문 조회
    List<Qna> findByUserUserId(Long userId);          // 유저별 질문 조회

    @Query("""
        SELECT new map(
            q.qnaId as qnaId,
            q.title as title,
            q.question as question,
            q.createdAt as createdAt,
            q.updatedAt as updatedAt,
            q.product.productId as productId,
            u.nickName as nickName
        )
        FROM Qna q
        JOIN q.user u
        WHERE q.product.productId = :productId
        ORDER BY q.createdAt DESC
    """)
    List<Map<String, Object>> findQnaWithUserByProductId(@Param("productId") Long productId);
}
