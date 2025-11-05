package com.my.backend.repository;

import com.my.backend.entity.Bid;
import com.my.backend.entity.Product;
import com.my.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BidRepository extends JpaRepository<Bid, Long> {
    // 특정 상품의 최고 입찰자 금액 가져오기
    Optional<Bid> findTopByProductOrderByBidPriceDesc(Product product);

    List<Bid> findByProductProductIdOrderByCreatedAtDesc(Long productId);

    Bid findTopByProductProductIdOrderByBidPriceDescCreatedAtAsc(Long productId);


    List<Bid> findByProductProductIdOrderByCreatedAtAsc(@Param("productId") Long productId);

    //  추가: 낙찰자 조회용 (isWinning = 1)
    Optional<Bid> findTopByProductProductIdAndIsWinningTrue(Long productId);

    // 추가 : 특정 상품의 모든 낙찰자 조회
    List<Bid> findByProductAndIsWinning(Product product, boolean isWinning);

    // 추가 : 특정 시간 이후 특정 사용자의 입찰 조회 (중복 방지용)
    List<Bid> findByProductAndUserAndCreatedAtAfter(
            Product product,
            User user,
            LocalDateTime createdAt);

    // 입찰 중복 방지
    List<Bid> findByProductAndUserAndBidPriceAndCreatedAtAfter(
            Product product, User user, Long bidPrice, LocalDateTime createdAt);

    boolean existsByProductProductIdAndUserUserIdAndIsWinningTrue(Long productId, Long userId);
}
