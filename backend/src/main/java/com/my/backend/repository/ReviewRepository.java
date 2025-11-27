package com.my.backend.repository;

import com.my.backend.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    // refId = 리뷰 대상 유저의 userId
    List<Review> findByRefId(Long refId);

}
