package com.my.backend.service;

import com.my.backend.dto.ReviewDto;
import com.my.backend.entity.Product;
import com.my.backend.entity.Review;
import com.my.backend.entity.Users;
import com.my.backend.enums.ProductType;
import com.my.backend.repository.ProductRepository;
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
    private final ProductRepository productRepository;

    // 리뷰 작성
    public ReviewDto createReview(ReviewDto dto) {
        // 전달된 refId와 productType 검증
        Long refId = dto.getRefId();
        ProductType productType = dto.getProductType();
        if (refId == null || productType == null) {
            throw new RuntimeException("productType과 refId가 필요합니다.");
        }
        // refId -> 대상 유저 아이디(resolve)
        Long targetUserId = resolveTargetUserId(productType, refId);
        // 대상 유저 존재 확인(안전성)
        userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("리뷰 대상 유저가 존재하지 않습니다."));
        Review review = dto.toEntity();
        // 리뷰 대상(유저)의 userId 저장
        review.setRefId(targetUserId);
        // 원래 어떤 타입의 ref에서 왔는지 기록
        review.setProductType(productType);
        // optional: product FK를 남기고 싶으면 productRepository로 product를 찾아서 set
        Product product = productRepository.findById(refId).orElse(null);

        Review saved = reviewRepository.save(review);
        return ReviewDto.fromEntity(saved);
    }

    // 특정 유저 리뷰 조회
    public List<ReviewDto> getReviewsForUser(Long userId) {
        // 대상 유저 존재 확인
        userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("대상 유저 없음"));

        return reviewRepository.findByRefId(userId)
                .stream()
                .map(ReviewDto::fromEntity)
                .collect(Collectors.toList());
    }

    // 특정 유저 평균 평점
    public double getAverageRating(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("대상 유저 없음"));

        return reviewRepository.findByRefId(userId)
                .stream()
                .mapToInt(Review::getRating)
                .average()
                .orElse(0.0);
    }

    // productType 별 대상 유저 찾기
    private Long resolveTargetUserId(ProductType productType, Long refId) {
        return switch (productType) {
            case AUCTION, USED, SALE -> {
                // 공통적으로 Product 테이블에서 refId로 조회
                Product product = productRepository.findById(refId)
                        .orElseThrow(() -> new RuntimeException(
                                "해당 상품이 없습니다. productType=" + productType + ", refId=" + refId));

                if (product.getSeller() == null) {
                    throw new RuntimeException("상품의 판매자 정보가 없습니다. productId=" + refId);
                }
                yield product.getSeller().getUserId();
            }
            default -> throw new UnsupportedOperationException("지원하지 않는 productType: " + productType);
        };
    }
}
