package com.my.backend.repository;

import com.my.backend.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByUser(User user);

    boolean existsByUserAndComments(User user, String comments); // 간단한 중복 체크
}
