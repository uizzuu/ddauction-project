package com.my.backend.service;

import com.my.backend.entity.Bid;
import com.my.backend.entity.Product;
import com.my.backend.enums.PaymentStatus;
import com.my.backend.enums.ProductStatus;
import com.my.backend.repository.BidRepository;
import com.my.backend.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuctionSchedulerService {

    private final ProductRepository productRepository;
    private final BidRepository bidRepository;
    private final NotificationService notificationService;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void finalizeOneAuctionSafely(Product product) {
        final Long productId = product.getProductId();

        try {
            Optional<Product> opt = productRepository.findById(productId);
            if (opt.isEmpty()) {
                log.warn("[Auction] productId={} 를 찾을 수 없어 스킵", productId);
                return;
            }

            Product p = opt.get();

            if (p.getProductStatus() != ProductStatus.ACTIVE) {
                log.debug("[Auction] 이미 처리된 경매 스킵: productId={}, status={}", productId, p.getProductStatus());
                return;
            }

            if (p.getAuctionEndTime() == null || p.getAuctionEndTime().isAfter(LocalDateTime.now())) {
                log.debug("[Auction] 아직 종료 시각이 아님 스킵: productId={}, end={}", productId, p.getAuctionEndTime());
                return;
            }

            Bid highest = bidRepository.findTopByProductOrderByBidPriceDesc(p).orElse(null);

            if (highest != null) {
                // 낙찰 처리
                highest.setWinning(true);
                bidRepository.saveAndFlush(highest);

                p.setProductStatus(ProductStatus.CLOSED);
                p.setPaymentStatus(PaymentStatus.PENDING);
                p.setSeller(highest.getUser());
                productRepository.saveAndFlush(p);

                log.info("[Auction] 경매 종료(낙찰): productId={}, winnerId={}, finalPrice={}",
                        productId, highest.getUser().getUserId(), highest.getBidPrice());

                // ✅ userId만 넘김
                notificationService.sendBidWinNotification(
                        highest.getUser().getUserId(),
                        p.getTitle()
                );

            } else {
                // 유찰 처리
                p.setProductStatus(ProductStatus.CLOSED);
                productRepository.saveAndFlush(p);

                log.info("[Auction] 경매 종료(유찰): productId={}", productId);

                List<Bid> allBids = bidRepository.findByProduct(p);
                for (Bid bid : allBids) {
                    // ✅ userId만 넘김
                    notificationService.sendAuctionEndNotification(
                            bid.getUser().getUserId(),
                            p.getTitle()
                    );
                }
            }

        } catch (Exception e) {
            log.error("[Auction] 경매 종료 처리 실패: productId={}", productId, e);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleNewBid(Bid bid) {
        Bid savedBid = bidRepository.saveAndFlush(bid);
        Product product = savedBid.getProduct();

        // ✅ 판매자 알림 - userId만 넘김
        notificationService.sendNewBidToSeller(
                product.getSeller().getUserId(),
                product.getTitle(),
                savedBid.getBidPrice()
        );

        // ✅ 다른 입찰자 알림 - userId만 넘김
        List<Bid> otherBidders = bidRepository.findByProduct(product);
        for (Bid b : otherBidders) {
            if (!b.getUser().getUserId().equals(savedBid.getUser().getUserId())) {
                notificationService.sendNewBidToOtherBidder(
                        b.getUser().getUserId(),
                        product.getTitle(),
                        savedBid.getBidPrice()
                );
            }
        }
    }
}