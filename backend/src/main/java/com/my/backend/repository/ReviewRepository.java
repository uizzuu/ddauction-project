package com.my.backend.repository;

import com.my.backend.entity.Review;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    // refId = 리뷰 대상 유저의 userId
    List<Review> findByRefId(Long refId);

    // ★ 평균 평점이 rating 기준 이상인 productId 리스트 조회
    @Query("SELECT r.refId FROM Review r " +
            "GROUP BY r.refId " +
            "HAVING AVG(r.rating) >= :minRating")
    List<Long> findProductIdsByAverageRating(@Param("minRating") double minRating);
}
