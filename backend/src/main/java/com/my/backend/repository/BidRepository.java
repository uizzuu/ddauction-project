package com.my.backend.repository;

import com.my.backend.entity.Bid;
import com.my.backend.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BidRepository extends JpaRepository<Bid, Long> {
    // 특정 상품의 최고 입찰자 금액 가져오기
    Optional<Bid> findTopByProductOrderByBidPriceDesc(Product product);

    List<Bid> findByProductProductIdOrderByCreatedAtDesc(Long productId);

    // 최고가 1건 (동가 시 먼저 들어온 것 우선) — 파생메서드 대신 JPQL + Pageable
    Bid findTopByProductProductIdOrderByCreatedAtDesc(Long productId);

    List<Bid> findByProductProductIdOrderByCreatedAtAsc(@Param("productId") Long productId);

    Bid findTopByProductProductIdOrderByBidPriceDescCreatedAtAsc(Long productId);

    //  추가
    List<Bid> findByProduct_ProductIdAndUser_UserId(Long productId, Long userId);

    }

