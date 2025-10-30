package com.my.backend.repository;

import com.my.backend.entity.Image;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ImageRepository extends JpaRepository<Image, Long> {

    // 특정 Product에 속한 이미지 전체 조회
    List<Image> findByProduct_ProductId(Long productId);
}
