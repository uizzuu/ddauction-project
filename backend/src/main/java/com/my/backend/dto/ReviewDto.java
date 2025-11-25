package com.my.backend.dto;

import com.my.backend.entity.Review;
import com.my.backend.entity.Product;
import com.my.backend.entity.Image;
import com.my.backend.enums.ProductType;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ReviewDto {

    private Long reviewId;
    private Long productId;
    private Long imageId;
    private String content;
    private Integer rating;
    private ProductType productType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Entity → DTO
    public static ReviewDto fromEntity(Review review) {
        if (review == null) return null;

        return ReviewDto.builder()
                .reviewId(review.getReviewId())
                .productId(review.getProduct() != null ? review.getProduct().getProductId() : null)
                .imageId(review.getImage() != null ? review.getImage().getImageId() : null)
                .content(review.getContent())
                .rating(review.getRating())
                .productType(review.getProductType())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }

    // DTO → Entity
    public Review toEntity(Product product, Image image) {
        return Review.builder()
                .reviewId(this.reviewId)
                .product(product)
                .image(image)
                .content(this.content)
                .rating(this.rating)
                .productType(this.productType)
                .build();
    }
}
