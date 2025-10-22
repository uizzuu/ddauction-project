package com.my.backend.repository;

import com.my.backend.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

// 상품 관리 CRUD repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByUserUserId(Long userId);

    List<Product> findByTitleContaining(String keyword);
    List<Product> findByCategory_CategoryId(Long categoryId);
    List<Product> findByTitleContainingAndCategory_CategoryId(String keyword, Long categoryId);

}