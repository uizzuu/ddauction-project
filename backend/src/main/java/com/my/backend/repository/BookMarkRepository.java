package com.my.backend.repository;

import com.my.backend.entity.BookMark;
import com.my.backend.entity.Product;
import com.my.backend.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface BookMarkRepository extends JpaRepository<BookMark, Long> {
    Optional<BookMark> findByUserAndProduct(User user, Product product);
    List<BookMark> findAllByUser(User user);
    Long countByProduct(Product product);

    // 북마크 수 기준으로 인기 상품 조회 (상위 N개), 판매중 상품만
    @Query("SELECT b.product " +
            "FROM BookMark b " +
            "WHERE b.product.productStatus = 'ACTIVE' " +  // 추가
            "GROUP BY b.product " +
            "ORDER BY COUNT(b) DESC")
    List<Product> findTopBookmarkedProducts(Pageable pageable);
}
