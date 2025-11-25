package com.my.backend.dto;

import com.my.backend.entity.Review;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ReviewDto {
    private Long reviewId;
    private Long userId;
    private String comments;
    private Integer rating;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ReviewDto fromEntity(Review review) {
        return ReviewDto.builder()
                .reviewId(review.getReviewId())
                .userId(review.getUser().getUserId())
                .comments(review.getComments())
                .rating(review.getRating())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }

    public Review toEntity(User user) {
        return Review.builder()
                .reviewId(this.reviewId)
                .user(user)
                .comments(this.comments)
                .rating(this.rating)
                .build();
    }
}
