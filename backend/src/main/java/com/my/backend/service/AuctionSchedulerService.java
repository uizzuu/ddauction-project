//package com.my.backend.service;
//
//import com.my.backend.entity.Bid;
//import com.my.backend.entity.Product;
//import com.my.backend.repository.BidRepository;
//import com.my.backend.repository.ProductRepository;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.scheduling.annotation.Scheduled;
//import org.springframework.stereotype.Service;
//import org.springframework.transaction.annotation.Propagation;
//import org.springframework.transaction.annotation.Transactional;
//
//import java.time.LocalDateTime;
//import java.util.List;
//import java.util.Optional;
//
///**
// * 경매 종료 스케줄러
// *
// * 매 10초마다 종료된 1분 경매를 확인하고 자동으로 종료 처리
// */
//@Slf4j
//@Service
//@RequiredArgsConstructor
//public class AuctionSchedulerService {
//
//    private final ProductRepository productRepository;
//    private final BidRepository bidRepository;
//
//    /**
//     * 매 10초마다 종료된 1분 경매 확인 및 처리
//     */
//    @Scheduled(fixedDelay = 10_000)
//    public void closeExpiredAuctions() {
//        final LocalDateTime now = LocalDateTime.now();
//
//        // 종료 시간이 지났고 아직 ACTIVE인 1분 경매만 조회
//        List<Product> expiredActives = productRepository
//                .findByOneMinuteAuctionTrueAndProductStatusAndAuctionEndTimeBefore(
//                        Product.ProductStatus.ACTIVE, now
//                );
//
//        if (expiredActives.isEmpty()) {
//            return;
//        }
//
//        log.info("[Auction] 종료대상 경매 처리 시작: {}건", expiredActives.size());
//
//        // 각 경매건은 별도 트랜잭션으로 처리
//        for (Product p : expiredActives) {
//            finalizeOneAuctionSafely(p.getProductId());
//        }
//
//        log.info("[Auction] 종료대상 경매 처리 끝");
//    }
//
//    /**
//     * 경매 한 건에 대한 종료 처리 (멱등)
//     */
//    @Transactional(propagation = Propagation.REQUIRES_NEW)
//    public void finalizeOneAuctionSafely(Long productId) {
//        try {
//            Optional<Product> opt = productRepository.findById(productId);
//            if (opt.isEmpty()) {
//                log.warn("[Auction] productId={} 를 찾을 수 없어 스킵", productId);
//                return;
//            }
//
//            Product product = opt.get();
//
//            // 멱등 가드: 이미 CLOSED 처리돼 있으면 스킵
//            if (product.getProductStatus() != Product.ProductStatus.ACTIVE) {
//                log.debug("[Auction] 이미 처리된 경매 스킵: productId={}, status={}",
//                        productId, product.getProductStatus());
//                return;
//            }
//
//            // 시간 가드
//            if (product.getAuctionEndTime() == null ||
//                    product.getAuctionEndTime().isAfter(LocalDateTime.now())) {
//                log.debug("[Auction] 아직 종료 시각이 아님 스킵: productId={}, end={}",
//                        productId, product.getAuctionEndTime());
//                return;
//            }
//
//            // 최고가 입찰자 1명만 조회
//            Bid highest = bidRepository.findTopByProductOrder(productId);
//
//            if (highest != null) {
//                // 낙찰 처리
//                product.setProductStatus(Product.ProductStatus.CLOSED);
//                product.setPaymentStatus(Product.PaymentStatus.PENDING);
//                product.setPaymentUserId(highest.getUser().getUserId());
//
//                if (highest.getBPrice() != null) {
//                    product.setPrice(highest.getBPrice().longValue());
//                }
//
//                productRepository.saveAndFlush(product);
//
//                log.info("[Auction] 경매 종료(낙찰): productId={}, winnerId={}, finalPrice={}",
//                        product.getProductId(),
//                        highest.getUser().getUserId(),
//                        highest.getBPrice());
//
//            } else {
//                // 유찰: 입찰자가 없음
//                product.setProductStatus(Product.ProductStatus.CLOSED);
//                productRepository.saveAndFlush(product);
//
//                log.info("[Auction] 경매 종료(유찰): productId={}", product.getProductId());
//            }
//
//        } catch (Exception e) {
//            log.error("[Auction] 경매 종료 처리 실패: productId={}", productId, e);
//        }
//    }
//}