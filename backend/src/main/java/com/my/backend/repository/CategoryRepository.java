package com.my.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    // 카테고리 이름으로 조회
    Optional<Category> findByName(String name);
}
