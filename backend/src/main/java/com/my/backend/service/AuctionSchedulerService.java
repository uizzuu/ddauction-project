package com.my.backend.service;

import com.my.backend.common.enums.PaymentStatus;
import com.my.backend.common.enums.ProductStatus;
import com.my.backend.entity.Bid;
import com.my.backend.entity.Product;
import com.my.backend.repository.BidRepository;
import com.my.backend.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 경매 종료 스케줄러
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuctionSchedulerService {

    private final ProductRepository productRepository;
    private final BidRepository bidRepository;

    /**
     * 매 10초마다 종료된 1분 경매 확인 및 처리
     */
    @Scheduled(fixedDelay = 10_000)
    public void closeExpiredAuctions() {
        final LocalDateTime now = LocalDateTime.now();

        // 종료 시간이 지났고 아직 ACTIVE 인 1분 경매만 조회
        List<Product> expiredActives = productRepository
                .findByOneMinuteAuctionTrueAndProductStatusAndAuctionEndTimeBefore(
                        ProductStatus.ACTIVE, now
                );

        if (expiredActives.isEmpty()) {
            return;
        }

        log.info("[Auction] 종료대상 경매 처리 시작: {}건", expiredActives.size());

        // 각 경매건은 별도 트랜잭션(REQUIRES_NEW)으로 처리하여 일부 실패가 전체에 영향 주지 않게 함
        for (Product p : expiredActives) {
            finalizeOneAuctionSafely(p.getProductId());
        }

        log.info("[Auction] 종료대상 경매 처리 끝");
    }

    /**
     * 경매 한 건에 대한 종료 처리 (멱등)
     * - REQUIRES_NEW: 스케줄러 루프와 분리된 트랜잭션
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void finalizeOneAuctionSafely(Long productId) {
        try {
            // 최신 상태 재조회 (동시에 다른 스레드가 상태를 바꿨을 수 있으므로)
            Optional<Product> opt = productRepository.findById(productId);
            if (opt.isEmpty()) {
                log.warn("[Auction] productId={} 를 찾을 수 없어 스킵", productId);
                return;
            }

            Product product = opt.get();

            // 멱등 가드: 이미 CLOSED 처리돼 있으면 스킵
            if (product.getProductStatus() != ProductStatus.ACTIVE) {
                log.debug("[Auction] 이미 처리된 경매 스킵: productId={}, status={}", productId, product.getProductStatus());
                return;
            }

            // 시간 가드
            if (product.getAuctionEndTime() == null || product.getAuctionEndTime().isAfter(LocalDateTime.now())) {
                log.debug("[Auction] 아직 종료 시각이 아님 스킵: productId={}, end={}", productId, product.getAuctionEndTime());
                return;
            }

            // 최고가 입찰자 1명만 조회 (동일가일 때 먼저 입찰한 사람 우선)
            Bid highest = bidRepository.findTopByProductProductIdOrderByCreatedAtDesc(productId);


            if (highest != null) {
                // 상품 상태 전이
                product.setProductStatus(ProductStatus.CLOSED);
                product.setPaymentStatus(PaymentStatus.PENDING); // 결제 대기
                product.setPaymentUserId(highest.getUser().getUserId());

                // 최종가 반영 (price가 현재가라면 그대로 업데이트)
                if (highest.getBidPrice() != null) {
                    product.setAmount(highest.getBidPrice().longValue());
                }

                productRepository.saveAndFlush(product);

                log.info("[Auction] 경매 종료(낙찰): productId={}, winnerId={}, finalPrice={}",
                        product.getProductId(),
                        highest.getUser().getUserId(),
                        highest.getBidPrice());

                // TODO: 낙찰 알림/브로드캐스트 필요 시 여기서 호출

            } else {
                // 유찰: 입찰자가 없음
                product.setProductStatus(ProductStatus.CLOSED);
                productRepository.saveAndFlush(product);

                log.info("[Auction] 경매 종료(유찰): productId={}", product.getProductId());
            }

        } catch (Exception e) {
            log.error("[Auction] 경매 종료 처리 실패: productId={}", productId, e);
            // 트랜잭션은 롤백되고, 다른 경매건 처리에는 영향 없음
        }
    }
}
