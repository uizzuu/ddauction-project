package com.my.backend.dto;

import com.my.backend.entity.Review;
import com.my.backend.entity.Product;
import com.my.backend.enums.ProductType;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ReviewDto {

    private Long reviewId;
    private Long refId;          // 실제 참조 대상 ID (상품ID 등)
    private String content;
    private String nickName;
    private Integer rating;
    private ProductType productType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Builder.Default
    private List<ImageDto> images = new ArrayList<>();

    // Entity → DTO
    public static ReviewDto fromEntity(Review review) {
        if (review == null) return null;

        return ReviewDto.builder()
                .reviewId(review.getReviewId())
                .refId(review.getRefId())   // refId 포함
                .content(review.getContent())
                .rating(review.getRating())
                .productType(review.getProductType())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }

    // DTO → Entity
    public Review toEntity() {
        return Review.builder()
                .reviewId(this.reviewId)
                .refId(this.refId)           // refId 세팅
                .content(this.content)
                .rating(this.rating)
                .productType(this.productType)
                .build();
    }
}
