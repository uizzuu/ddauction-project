package com.my.backend.repository;

import com.my.backend.entity.ProductQna;
import com.my.backend.enums.ProductType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductQnaRepository extends JpaRepository<ProductQna, Long> {

    // 사용자별 문의 조회
    List<ProductQna> findByUserUserId(Long userId);

    // 상품 타입별 문의 조회
    List<ProductQna> findByProductType(ProductType productType);

    // refId로 문의 조회 (특정 상품에 대한 문의들)
    List<ProductQna> findByRefId(Long refId);

    // refId + ProductType으로 문의 조회
    List<ProductQna> findByRefIdAndProductType(Long refId, ProductType productType);
}