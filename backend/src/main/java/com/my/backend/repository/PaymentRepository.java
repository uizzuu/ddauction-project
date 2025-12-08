package com.my.backend.repository;

import com.my.backend.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    // 구매 내역 조회
    java.util.List<Payment> findByUser_UserId(Long userId);

    // 판매 내역 조회 (상품 판매자 ID 기준)
    java.util.List<Payment> findByProduct_Seller_UserId(Long sellerId);

    java.util.Optional<Payment> findByProduct_ProductId(Long productId);
}
