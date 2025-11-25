package com.my.backend.repository;

import com.my.backend.enums.PaymentStatus;
import com.my.backend.enums.ProductStatus;
import com.my.backend.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDateTime;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    @EntityGraph(attributePaths = "images")
    Product findTopByProductStatusOrderByCreatedAtDesc(ProductStatus productStatus);

    @EntityGraph(attributePaths = "images")
    Product findTopByProductStatusAndAuctionEndTimeAfterOrderByAuctionEndTimeAsc(
            ProductStatus productStatus, LocalDateTime now);

    // 판매자 기준 조회
    List<Product> findByUserUserId(Long userId);

    // 기본 검색
    List<Product> findByTitleContaining(String keyword);
    List<Product> findByCategory_CategoryId(Long categoryId);
    List<Product> findByProductStatus(ProductStatus productStatus);

    // 조합 검색
    List<Product> findByTitleContainingAndCategory_CategoryId(String keyword, Long categoryId);
    List<Product> findByTitleContainingAndProductStatus(String keyword, ProductStatus productStatus);
    List<Product> findByCategory_CategoryIdAndProductStatus(Long categoryId, ProductStatus productStatus);
    List<Product> findByTitleContainingAndCategory_CategoryIdAndProductStatus(String keyword, Long categoryId, ProductStatus productStatus);

    // 1분 경매 자동 종료용
    List<Product> findByOneMinuteAuctionTrueAndProductStatusAndAuctionEndTimeBefore(
            ProductStatus status,
            LocalDateTime endTime
    );

    Page<Product> findByTitleContaining(String keyword, Pageable pageable);
    Page<Product> findByCategory_CategoryId(Long categoryId, Pageable pageable);
    Page<Product> findByProductStatus(ProductStatus productStatus, Pageable pageable);

    // 조합 검색 - Pageable 버전
    Page<Product> findByTitleContainingAndCategory_CategoryId(String keyword, Long categoryId, Pageable pageable);
    Page<Product> findByTitleContainingAndProductStatus(String keyword, ProductStatus productStatus, Pageable pageable);
    Page<Product> findByCategory_CategoryIdAndProductStatus(Long categoryId, ProductStatus productStatus, Pageable pageable);
    Page<Product> findByTitleContainingAndCategory_CategoryIdAndProductStatus(
            String keyword, Long categoryId, ProductStatus productStatus, Pageable pageable);

    List<Product> findByPaymentUserIdAndPaymentStatus(Long paymentUserId, PaymentStatus paymentStatus);
}