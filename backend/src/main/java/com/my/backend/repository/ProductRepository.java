package com.my.backend.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import com.my.backend.entity.Bid;
import com.my.backend.entity.Product;
import com.my.backend.entity.Users;
import com.my.backend.enums.PaymentStatus;
import com.my.backend.enums.ProductCategoryType;
import com.my.backend.enums.ProductStatus;

import io.lettuce.core.dynamic.annotation.Param;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;

public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

//    @EntityGraph(attributePaths = "images")
    Product findTopByProductStatusOrderByCreatedAtDesc(ProductStatus productStatus);

//    @EntityGraph(attributePaths = "images")
    Product findTopByProductStatusAndAuctionEndTimeAfterOrderByAuctionEndTimeAsc(
            ProductStatus productStatus, LocalDateTime now);

    // 판매자 기준 조회
    List<Product> findBySeller(Users seller);

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
    List<Product> findByPaymentUserUserIdAndPaymentStatus(Long userId, PaymentStatus paymentStatus);

    @Modifying
    @Query("UPDATE Product p SET p.viewCount = p.viewCount + 1 WHERE p.productId = :id")
    void incrementViewCount(@Param("id") Long id);

    // ========================================
    //  자동완성용 메서드 추가
    // ========================================

    /**
     * 자동완성용 연관 검색어 추출
     *
     * 동작 방식:
     * - 사용자가 "니" 입력 → title이나 tag가 "니"로 시작하는 상품들의 제목 반환
     * - AVAILABLE 상태 상품만
     * - 조회수 높은 순으로 정렬
     * - DISTINCT로 중복 제거
     *
     * 예시:
     * keyword = "니" → ["블랙 니트", "화이트 니트", "니트 원피스"]
     */
    @Query("""
    SELECT p.title
    FROM Product p
    WHERE LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
       OR LOWER(p.tag)   LIKE LOWER(CONCAT('%', :keyword, '%'))
    ORDER BY p.viewCount DESC
    """)
    List<String> findSuggestionsForAutocomplete(
            @Param("keyword") String keyword,
            Pageable pageable
    );


    /**
     * 인기 검색어 (조회수 높은 상품 제목 TOP N)
     *
     * 사용자가 검색창을 클릭했는데 아무것도 입력 안 했을 때
     * "인기 검색어" 형태로 보여줄 수 있음
     */
    @Query("""
    SELECT p.title
    FROM Product p
    WHERE p.productStatus = com.my.backend.enums.ProductStatus.ACTIVE
    ORDER BY p.viewCount DESC
""")
    List<String> findTopKeywordsByViewCount(Pageable pageable);


    static Specification<Product> createSpecification(
            String keyword,
            ProductCategoryType categoryType,
            ProductStatus status,
            Long minPrice, Long maxPrice,
            Long minStartPrice, Long maxStartPrice
    ) {
        return (root, query, criteriaBuilder) -> {
            Predicate predicate = criteriaBuilder.conjunction();

            // 1. Keyword (Title or Tag)
            if (keyword != null && !keyword.isEmpty()) {
                String likePattern = "%" + keyword + "%";
                Predicate titleLike = criteriaBuilder.like(root.get("title"), likePattern);
                Predicate tagLike = criteriaBuilder.like(root.get("tag"), likePattern);
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.or(titleLike, tagLike));
            }

            // 2. Category
            if (categoryType != null) {
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.equal(root.get("productCategoryType"), categoryType));
            }

            // 3. Status
            if (status != null) {
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.equal(root.get("productStatus"), status));
            }

            // 4. Start Price Range
            if (minStartPrice != null) {
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.greaterThanOrEqualTo(root.get("startingPrice"), minStartPrice));
            }
            if (maxStartPrice != null) {
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.lessThanOrEqualTo(root.get("startingPrice"), maxStartPrice));
            }

            // 5. Current Price Range (Complex)
            // Current Price = MAX(Bid Price) OR Starting Price if no bids
            if (minPrice != null || maxPrice != null) {
                // Subquery for Max Bid Price
                Subquery<Long> maxBidSubquery = query.subquery(Long.class);
                Root<Bid> bidRoot = maxBidSubquery.from(Bid.class);
                maxBidSubquery.select(criteriaBuilder.max(bidRoot.get("bidPrice")));
                maxBidSubquery.where(criteriaBuilder.equal(bidRoot.get("product"), root));

                // Effective Price: COALESCE(MaxBid, StartingPrice)
                Expression<Long> currentPrice = criteriaBuilder.coalesce(maxBidSubquery, root.get("startingPrice"));

                if (minPrice != null) {
                    predicate = criteriaBuilder.and(predicate, criteriaBuilder.greaterThanOrEqualTo(currentPrice, minPrice));
                }
                if (maxPrice != null) {
                    predicate = criteriaBuilder.and(predicate, criteriaBuilder.lessThanOrEqualTo(currentPrice, maxPrice));
                }
            }

            return predicate;
        };
    }
}