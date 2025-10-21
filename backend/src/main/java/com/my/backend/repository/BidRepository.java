package com.my.backend.repository;

import com.my.backend.entity.Bid;
import com.my.backend.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BidRepository extends JpaRepository<Bid, Long> {
    // 특정 상품의 최고 입찰자 금액 가져오기
    Optional<Bid> findTopByProductOrderByBidPriceDesc(Product product);
}
