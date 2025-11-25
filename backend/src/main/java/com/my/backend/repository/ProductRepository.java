package com.my.backend.repository;

import com.my.backend.enums.PaymentStatus;
import com.my.backend.enums.ProductCategoryType;
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

    // 이미지 엔티티 함께 조회
    @EntityGraph(attributePaths = "images")
    Product findTopByProductStatusOrderByCreatedAtDesc(ProductStatus productStatus);

    @EntityGraph(attributePaths = "images")
    Product findTopByProductStatusAndAuctionEndTimeAfterOrderByAuctionEndTimeAsc(
            ProductStatus productStatus, LocalDateTime now);

    // 판매자 기준 조회
    List<Product> findBySellerUserId(Long userId);

    // 기본 검색 - List
    List<Product> findByTitleContaining(String keyword);
    List<Product> findByProductCategoryType(ProductCategoryType categoryType);
    List<Product> findByProductStatus(ProductStatus productStatus);
    List<Product> findByTitleContainingAndProductStatus(String keyword, ProductStatus productStatus); // 추가

    // 조합 검색 - List
    List<Product> findByTitleContainingAndProductCategoryType(String keyword, ProductCategoryType categoryType);
    List<Product> findByProductCategoryTypeAndProductStatus(ProductCategoryType categoryType, ProductStatus productStatus);
    List<Product> findByTitleContainingAndProductCategoryTypeAndProductStatus(
            String keyword, ProductCategoryType categoryType, ProductStatus productStatus);

    // 기본 검색 - Pageable
    Page<Product> findByTitleContaining(String keyword, Pageable pageable);
    Page<Product> findByProductCategoryType(ProductCategoryType categoryType, Pageable pageable);
    Page<Product> findByProductStatus(ProductStatus productStatus, Pageable pageable);
    Page<Product> findByTitleContainingAndProductStatus(String keyword, ProductStatus productStatus, Pageable pageable); // 추가

    // 조합 검색 - Pageable
    Page<Product> findByTitleContainingAndProductCategoryType(String keyword, ProductCategoryType categoryType, Pageable pageable);
    Page<Product> findByProductCategoryTypeAndProductStatus(ProductCategoryType categoryType, ProductStatus productStatus, Pageable pageable);
    Page<Product> findByTitleContainingAndProductCategoryTypeAndProductStatus(
            String keyword, ProductCategoryType categoryType, ProductStatus productStatus, Pageable pageable);

    // 결제 기준 조회
    List<Product> findByPaymentUserUserIdAndPaymentStatus(Long userId, PaymentStatus paymentStatus);

    // 1분 경매 자동 종료용
    List<Product> findByOneMinuteAuctionTrueAndProductStatusAndAuctionEndTimeBefore(
            ProductStatus status, LocalDateTime endTime
    );
}
