package com.my.backend.service;

import com.my.backend.dto.NotificationMessage;
import com.my.backend.entity.Bid;
import com.my.backend.entity.Product;
import com.my.backend.enums.PaymentStatus;
import com.my.backend.enums.ProductStatus;
import com.my.backend.repository.BidRepository;
import com.my.backend.repository.ProductRepository;
import com.my.backend.websocket.NotificationWebSocketHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuctionSchedulerService {

    private final ProductRepository productRepository;
    private final BidRepository bidRepository;
    private final NotificationWebSocketHandler notificationWebSocketHandler; // 추가


    // 경매 한 건에 대한 종료 처리 (멱등)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void finalizeOneAuctionSafely(Product product) {
        final Long productId = product.getProductId(); // // productId 헷갈림 방지

        try {
            Optional<Product> opt = productRepository.findById(productId);
            if (opt.isEmpty()) {
                log.warn("[Auction] productId={} 를 찾을 수 없어 스킵", productId);
                return;
            }

            Product p = opt.get();

            // // 이미 종료 처리된 상품은 스킵
            if (p.getProductStatus() != ProductStatus.ACTIVE) {
                log.debug("[Auction] 이미 처리된 경매 스킵: productId={}, status={}", productId, p.getProductStatus());
                return;
            }

            // // 아직 종료시간이 안 되었으면 스킵
            if (p.getAuctionEndTime() == null || p.getAuctionEndTime().isAfter(LocalDateTime.now())) {
                log.debug("[Auction] 아직 종료 시각이 아님 스킵: productId={}, end={}", productId, p.getAuctionEndTime());
                return;
            }

            // // 최고 입찰 조회
            Bid highest = bidRepository.findTopByProductOrderByBidPriceDesc(p).orElse(null);

            if (highest != null) {
                // // 낙찰자 표시
                highest.setWinning(true);
                bidRepository.saveAndFlush(highest);

                // // 상품 상태 업데이트
                p.setProductStatus(ProductStatus.CLOSED);
                p.setPaymentStatus(PaymentStatus.PENDING);
                p.setSeller(highest.getUser());
                productRepository.saveAndFlush(p);

                log.info("[Auction] 경매 종료(낙찰): productId={}, winnerId={}, finalPrice={}",
                        productId,
                        highest.getUser().getUserId(),
                        highest.getBidPrice());
                // ✅ 낙찰자에게 알림
                NotificationMessage noti = new NotificationMessage(
                        productId,
                        "입찰 성공",
                        String.format("참여하신 '%s' 경매가 낙찰되었습니다! 결제를 진행해주세요.", p.getTitle()),
                        "방금 전",
                        false
                );
                notificationWebSocketHandler.sendNotification(noti);
            } else {
                // // 유찰 처리
                p.setProductStatus(ProductStatus.CLOSED);
                productRepository.saveAndFlush(p);

                log.info("[Auction] 경매 종료(유찰): productId={}", productId);
                List<Bid> allBids = bidRepository.findByProduct(p);
                for (Bid bid : allBids) {
                    NotificationMessage noti = new NotificationMessage(
                            productId,
                            "경매 종료",
                            String.format("참여하신 '%s' 경매가 유찰되었습니다.", p.getTitle()),
                            "방금 전",
                            false
                    );
                    notificationWebSocketHandler.sendNotificationToUser(bid.getUser().getUserId(), noti);
                }
            }

        } catch (Exception e) {
            log.error("[Auction] 경매 종료 처리 실패: productId={}", productId, e);
        }
    }
}