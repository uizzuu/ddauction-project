package com.my.backend.repository;

import com.my.backend.entity.Bid;
import com.my.backend.entity.Product;
import com.my.backend.entity.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BidRepository extends JpaRepository<Bid, Long> {
    // refId로 입찰 찾기
    List<Bid> findByProduct(Product product);

    List<Bid> findByProductOrderByCreatedAtDesc(Product product);

    List<Bid> findByProductOrderByCreatedAtAsc(Product product);

    Optional<Bid> findTopByProductOrderByBidPriceDesc(Product product);

    // 특정 상품의 모든 낙찰자 조회
    List<Bid> findByProductAndIsWinning(Product product, boolean isWinning);

    // 입찰 중복 방지
    List<Bid> findByProductAndUserAndBidPriceAndCreatedAtAfter(
            Product product, Users user, Long bidPrice, LocalDateTime createdAt
    );
}
