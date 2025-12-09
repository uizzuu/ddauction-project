package com.my.backend.repository;

import com.my.backend.entity.ProductViewLog;
import com.my.backend.entity.Product;
import com.my.backend.entity.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductViewLogRepository extends JpaRepository<ProductViewLog, Long> {
    // 유저와 상품으로 로그 조회
    Optional<ProductViewLog> findByUserAndProduct(Users user, Product product);
}