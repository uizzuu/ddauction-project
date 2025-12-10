package com.my.backend.service;

import com.my.backend.dto.BidChartData;
import com.my.backend.entity.*;
import com.my.backend.enums.ImageType;
import com.my.backend.enums.PaymentStatus;
import com.my.backend.enums.ProductStatus;
import com.my.backend.repository.BidRepository;
import com.my.backend.repository.ImageRepository;
import com.my.backend.repository.ProductRepository;
import com.my.backend.repository.UserRepository;
import com.my.backend.websocket.AuctionWebSocketHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class BidService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final BidRepository bidRepository;
    private final AuctionWebSocketHandler webSocketHandler;
    private final ImageRepository imageRepository;
    private final NotificationService notificationService;

    private static final long MIN_BID_INCREMENT = 1000;

    private final ConcurrentHashMap<Long, Object> productLocks = new ConcurrentHashMap<>();

    public List<Bid> getBidsByProduct(Product product) {
        return bidRepository.findByProduct(product);
    }

    public Product getProductByBidId(Long bidId) {
        Bid bid = bidRepository.findById(bidId)
                .orElseThrow(() -> new RuntimeException("Bid not found"));
        return bid.getProduct();
    }

    public ResponseEntity<?> placeBid(Long productId, Long userId, Long bidPrice) {
        Object lock = productLocks.computeIfAbsent(productId, k -> new Object());
        synchronized (lock) {
            return placeBidInternal(productId, userId, bidPrice);
        }
    }

    //  실제 입찰 처리 로직
    private ResponseEntity<?> placeBidInternal(Long productId, Long userId, Long bidPrice) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "로그인이 필요합니다."));
        }

        try {
            if (product.getSeller().getUserId().equals(userId))
                throw new IllegalArgumentException("판매자는 자신의 상품에 입찰할 수 없습니다.");

            // 경매 종료 시간 체크
            if (product.getAuctionEndTime() != null
                    && LocalDateTime.now().isAfter(product.getAuctionEndTime())) {
                throw new IllegalArgumentException("이미 종료된 경매입니다.");
            }

            if (product.getProductStatus() != ProductStatus.ACTIVE)
                throw new IllegalArgumentException("입찰이 가능한 상태의 상품이 아닙니다.");

            Users user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

            log.info("입찰 요청: userId={}, productId={}, bidPrice={}", userId, product.getProductId(), bidPrice);

            LocalDateTime twoSecondsAgo = LocalDateTime.now().minusSeconds(2);
            List<Bid> duplicates = bidRepository
                    .findByProductAndUserAndBidPriceAndCreatedAtAfter(product, user, bidPrice, twoSecondsAgo);

            if (duplicates != null && !duplicates.isEmpty()) {
                log.warn("중복 입찰 감지 (userId={}, productId={}, bidPrice={})", userId, product.getProductId(), bidPrice);
                throw new IllegalArgumentException("이미 동일 금액으로 입찰이 처리되었습니다.");
            }

            // 기존 최고가 조회
            Long current = bidRepository.findTopByProductOrderByBidPriceDesc(product)
                    .map(Bid::getBidPrice)
                    .orElse(product.getStartingPrice());

            if (bidPrice < current + MIN_BID_INCREMENT)
                throw new IllegalArgumentException(String.format("입찰가는 현재가보다 최소 %,d원 이상 높아야 합니다.", MIN_BID_INCREMENT));

            // 새로운 입찰 저장
            Bid bid = Bid.builder()
                    .user(user)
                    .bidPrice(bidPrice)
                    .isWinning(true)  // 실시간 최고 입찰자 (금액 기준)
                    .product(product)
                    .build();
            bidRepository.save(bid);

            // 이전 최고 입찰자 isWinning 해제
            bidRepository.findByProductAndIsWinning(product, true).forEach(prev -> {
                if (!prev.getBidId().equals(bid.getBidId())) {
                    prev.setWinning(false);
                    bidRepository.save(prev);
                }
            });
            // ✅ 알림 추가 - 판매자에게 알림
            notificationService.sendNewBidToSeller(
                    product.getSeller().getUserId(),
                    product.getTitle(),
                    bidPrice
            );

            // ✅ 알림 추가 - 다른 입찰자들에게 알림
            List<Bid> allBids = bidRepository.findByProduct(product);
            for (Bid b : allBids) {
                // 현재 입찰자 제외, 판매자 제외
                if (!b.getUser().getUserId().equals(userId)
                        && !b.getUser().getUserId().equals(product.getSeller().getUserId())) {
                    notificationService.sendNewBidToOtherBidder(
                            b.getUser().getUserId(),
                            product.getTitle(),
                            bidPrice
                    );
                }
            }


            webSocketHandler.broadcastBidList(product.getProductId(), bid);

            Map<String, Object> resp = Map.of(
                    "bidId", bid.getBidId(),
                    "productId", product.getProductId(),
                    "userId", userId,
                    "bidPrice", bid.getBidPrice(),
                    "createdAt", bid.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
            );

            return ResponseEntity.ok(resp);

        } catch (IllegalArgumentException e) {
            log.warn("입찰 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("입찰 처리 중 서버 오류", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "입찰 처리 중 오류가 발생했습니다."));
        }
    }

    public ResponseEntity<?> getBidHistory(Long productId) {
        try {
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

            List<Bid> bidHistory = bidRepository.findByProductOrderByCreatedAtAsc(product);
            if (bidHistory == null) bidHistory = List.of();

            List<Map<String, Object>> resp = bidHistory.stream().map(b -> {
                Map<String, Object> map = new java.util.HashMap<>();
                map.put("bidId", b.getBidId());
                map.put("userId", b.getUser() != null ? b.getUser().getUserId() : 0L);
                map.put("bidPrice", b.getBidPrice());
                map.put("isWinning", b.isWinning());
                map.put("createdAt", b.getCreatedAt() != null ? b.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : "");
                return map;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            log.error("입찰 내역 조회 중 오류", e);
            return ResponseEntity.status(500).body(Map.of("error", "입찰 내역 조회 중 오류가 발생했습니다."));
        }
    }

    @Transactional(readOnly = true)
    public ResponseEntity<?> getBidHistoryForChart(Long productId) {
        try {
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

            List<Bid> bidHistory = bidRepository.findByProductOrderByCreatedAtAsc(product);

            List<BidChartData> chartData = IntStream.range(0, bidHistory.size())
                    .mapToObj(i -> new BidChartData(
                            i + 1,
                            bidHistory.get(i).getBidPrice(),
                            bidHistory.get(i).getUser().getNickName()
                    ))
                    .toList();

            Map<String, Object> resp = Map.of(
                    "productId", product.getProductId(),
                    "productTitle", product.getTitle(),
                    "chartData", chartData
            );

            return ResponseEntity.ok(resp);

        } catch (Exception e) {
            log.error("입찰 차트 조회 중 오류", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "입찰 차트 데이터 조회 중 오류가 발생했습니다."));
        }
    }

    public ResponseEntity<?> checkWinner(Long productId, Long userId) {
        try {
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

            if (product.getAuctionEndTime() != null && LocalDateTime.now().isBefore(product.getAuctionEndTime())) {
                return ResponseEntity.ok(Map.of("isWinner", false, "message", "경매가 아직 진행중입니다."));
            }

            // 최고 금액 기준으로 낙찰자 조회
            Bid winningBid = bidRepository.findTopByProductOrderByBidPriceDesc(product)
                    .orElseThrow(() -> new IllegalArgumentException("입찰 내역이 없습니다."));

            if (!winningBid.isWinning()) {
                lazyCloseBid(product, winningBid);
            }

            boolean isWinner = winningBid.getUser().getUserId().equals(userId);
            return ResponseEntity.ok(Map.of("isWinner", isWinner, "bidPrice", winningBid.getBidPrice()));
        } catch (Exception e) {
            log.error("낙찰자 확인 실패", e);
            return ResponseEntity.status(500).body(Map.of("error", "낙찰자 확인 중 오류가 발생했습니다."));
        }
    }

    public ResponseEntity<?> getWinningInfo(Long productId, Long userId) {
        try {
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

            //  최고 금액 기준으로 낙찰자 조회
            Bid winningBid = bidRepository.findTopByProductOrderByBidPriceDesc(product)
                    .orElseThrow(() -> new IllegalArgumentException("입찰 내역이 없습니다."));

            if (!winningBid.isWinning() && product.getAuctionEndTime() != null
                    && LocalDateTime.now().isAfter(product.getAuctionEndTime())) {
                lazyCloseBid(product, winningBid);
            }

            if (!winningBid.getUser().getUserId().equals(userId)) {
                return ResponseEntity.status(403).body(Map.of("error", "낙찰자만 접근 가능합니다."));
            }

            String imagePath = "";
            List<Image> images = imageRepository.findByRefIdAndImageType(product.getProductId(), ImageType.PRODUCT);
            if (!images.isEmpty() && images.get(0).getImagePath() != null) {
                imagePath = images.get(0).getImagePath();
            }

            return ResponseEntity.ok(Map.of(
                    "productId", product.getProductId(),
                    "productTitle", product.getTitle(),
                    "productImage", imagePath,
                    "bidPrice", winningBid.getBidPrice(),
                    "sellerName", product.getSeller().getNickName()
            ));

        } catch (Exception e) {
            log.error("낙찰 정보 조회 실패", e);
            return ResponseEntity.status(500).body(Map.of("error", "낙찰 정보 조회 중 오류가 발생했습니다."));
        }
    }

    private void lazyCloseBid(Product product, Bid winningBid) {
        List<Bid> prevWinningBids = bidRepository.findByProductAndIsWinning(product, true);
        prevWinningBids.forEach(b -> b.setWinning(false));
        bidRepository.saveAll(prevWinningBids);

        // 최고 금액 입찰자만 낙찰 처리
        winningBid.setWinning(true);
        bidRepository.save(winningBid);

        product.setBid(winningBid);
        product.setProductStatus(ProductStatus.CLOSED);
        product.setPaymentStatus(PaymentStatus.PENDING);
        productRepository.save(product);
    }

    public ResponseEntity<?> getUserBidHistory(Long userId) {
        try {
            Users user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

            // 유저 기준 입찰 내역 (최근순)
            List<Bid> bids = bidRepository.findByUserOrderByCreatedAtDesc(user);

            // 프론트에서 바로 써먹기 편한 형태로 가볍게 매핑
            List<Map<String, Object>> resp = bids.stream()
                    .map(b -> Map.<String, Object>of(
                            "bidId", b.getBidId(),
                            "userId", b.getUser() != null ? b.getUser().getUserId() : null,
                            "bidPrice", b.getBidPrice(),
                            "createdAt", b.getCreatedAt() != null
                                    ? b.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                                    : null,
                            "productId", b.getProduct() != null ? b.getProduct().getProductId() : null,
                            "productTitle", b.getProduct() != null ? b.getProduct().getTitle() : null,
                            "isWinning", b.isWinning()
                    ))
                    .toList();

            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            log.error("유저 입찰 내역 조회 중 오류", e);
            return ResponseEntity.status(500)
                    .body(Map.of("error", "입찰 내역 조회 중 오류가 발생했습니다."));
        }
    }


}