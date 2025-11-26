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

    @EntityGraph(attributePaths = "images")
    Product findTopByProductStatusOrderByCreatedAtDesc(ProductStatus productStatus);

    @EntityGraph(attributePaths = "images")
    Product findTopByProductStatusAndAuctionEndTimeAfterOrderByAuctionEndTimeAsc(
            ProductStatus productStatus, LocalDateTime now);

    // 판매자 기준 조회
    List<Product> findByUserUserId(Long userId);

    // 기본 검색
    List<Product> findByTitleContaining(String keyword);
    List<Product> findByProductStatus(ProductStatus productStatus);
    List<Product> findByProductCategoryType(ProductCategoryType categoryType);

    // 조합 검색
    List<Product> findByTitleContainingAndProductStatus(String keyword, ProductStatus productStatus);
    List<Product> findByTitleContainingAndProductCategoryType(String keyword, ProductCategoryType categoryType);
    List<Product> findByProductCategoryTypeAndProductStatus(ProductCategoryType categoryType, ProductStatus productStatus);
    List<Product> findByTitleContainingAndProductCategoryTypeAndProductStatus(String keyword, ProductCategoryType categoryType, ProductStatus productStatus);

    // Pageable 버전
    Page<Product> findByTitleContaining(String keyword, Pageable pageable);
    Page<Product> findByProductStatus(ProductStatus productStatus, Pageable pageable);
    Page<Product> findByProductCategoryType(ProductCategoryType categoryType, Pageable pageable);

    // 조합 검색 - Pageable
    Page<Product> findByTitleContainingAndProductStatus(String keyword, ProductStatus productStatus, Pageable pageable);
    Page<Product> findByTitleContainingAndProductCategoryType(String keyword, ProductCategoryType categoryType, Pageable pageable);
    Page<Product> findByProductCategoryTypeAndProductStatus(ProductCategoryType categoryType, ProductStatus productStatus, Pageable pageable);
    Page<Product> findByTitleContainingAndProductCategoryTypeAndProductStatus(String keyword, ProductCategoryType categoryType, ProductStatus productStatus, Pageable pageable);

    // 구매 완료 상품 조회
    List<Product> findByPaymentUserIdAndPaymentStatus(Long paymentUserId, PaymentStatus paymentStatus);
}