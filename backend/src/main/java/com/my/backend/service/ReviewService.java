package com.my.backend.service;

import com.my.backend.dto.ReviewDto;
import com.my.backend.entity.Review;
import com.my.backend.entity.User;
import com.my.backend.repository.ReviewRepository;
import com.my.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;

    // 리뷰 작성
    public ReviewDto createReview(Long targetUserId, ReviewDto dto) {
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("대상 유저 없음"));

        Review review = dto.toEntity(targetUser);
        Review saved = reviewRepository.save(review);

        return ReviewDto.fromEntity(saved);
    }

    // 특정 유저 리뷰 조회
    public List<ReviewDto> getReviewsForUser(Long userId) {
        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("대상 유저 없음"));

        return reviewRepository.findByUser(targetUser)
                .stream()
                .map(ReviewDto::fromEntity)
                .collect(Collectors.toList());
    }

    // 특정 유저 평균 평점
    public double getAverageRating(Long userId) {
        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("대상 유저 없음"));

        return reviewRepository.findByUser(targetUser)
                .stream()
                .mapToInt(Review::getRating)
                .average()
                .orElse(0.0);
    }
}
