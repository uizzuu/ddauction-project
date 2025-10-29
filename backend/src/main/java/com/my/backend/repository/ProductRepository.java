package com.my.backend.repository;

import com.my.backend.common.enums.ProductStatus;
import com.my.backend.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDateTime;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

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
    // 활성화 상품 중 최신 등록 상품 하나 조회
    Product findTopByProductStatusOrderByCreatedAtDesc(ProductStatus productStatus);

    // 곧 종료되는 상품 1개 조회
    Product findTopByProductStatusOrderByAuctionEndTimeAsc(ProductStatus productStatus);

    Page<Product> findByTitleContaining(String keyword, Pageable pageable);
    Page<Product> findByCategory_CategoryId(Long categoryId, Pageable pageable);
    Page<Product> findByProductStatus(ProductStatus productStatus, Pageable pageable);

    // 조합 검색 - Pageable 버전
    Page<Product> findByTitleContainingAndCategory_CategoryId(String keyword, Long categoryId, Pageable pageable);
    Page<Product> findByTitleContainingAndProductStatus(String keyword, ProductStatus productStatus, Pageable pageable);
    Page<Product> findByCategory_CategoryIdAndProductStatus(Long categoryId, ProductStatus productStatus, Pageable pageable);
    Page<Product> findByTitleContainingAndCategory_CategoryIdAndProductStatus(
            String keyword, Long categoryId, ProductStatus productStatus, Pageable pageable);
}