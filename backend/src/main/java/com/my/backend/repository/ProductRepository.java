package com.my.backend.repository;

import com.my.backend.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

// 상품 관리 CRUD repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    // 기본 CRUD는 JpaRepository에서 제공
}