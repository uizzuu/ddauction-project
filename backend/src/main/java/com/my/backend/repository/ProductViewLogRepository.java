package com.my.backend.repository;

import com.my.backend.entity.ProductViewLog;
import com.my.backend.entity.Product;
import com.my.backend.entity.Users;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductViewLogRepository extends JpaRepository<ProductViewLog, Long> {

    // 유저와 상품으로 로그 조회
    Optional<ProductViewLog> findByUserAndProduct(Users user, Product product);

    // 특정 상품을 조회한 유저들 가져오기
    List<ProductViewLog> findByProduct_ProductId(Long productId);

    // 상위 10개 추천 상품 조회
    @Query("SELECT pvl.product FROM ProductViewLog pvl " +
            "WHERE pvl.user.userId IN " +
            "   (SELECT pvl2.user.userId FROM ProductViewLog pvl2 WHERE pvl2.product.productId = :productId) " +
            "AND pvl.product.productId <> :productId " +
            "GROUP BY pvl.product.productId " +
            "ORDER BY COUNT(pvl) DESC")
    List<Product> findAlsoViewedProducts(@Param("productId") Long productId, Pageable pageable);
}