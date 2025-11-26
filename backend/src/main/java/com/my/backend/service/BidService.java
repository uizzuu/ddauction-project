package com.my.backend.service;

import com.my.backend.dto.BidChartData;
import com.my.backend.entity.*;
import com.my.backend.enums.PaymentStatus;
import com.my.backend.enums.ProductStatus;
import com.my.backend.repository.BidRepository;
import com.my.backend.repository.ProductRepository;
import com.my.backend.repository.UserRepository;
import com.my.backend.websocket.AuctionWebSocketHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.my.backend.controller.BidController;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;
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

    private static final long MIN_BID_INCREMENT = 1000; // 최소 입찰 단위

    public boolean isUserWinner(Long productId, Long userId) {
        return bidRepository.existsByProductProductIdAndUserUserIdAndIsWinningTrue(productId, userId);
    }

    // 입찰하기
    public ResponseEntity<?> placeBid(Long userId, Long productId, Long bidPrice) {
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "로그인이 필요합니다."));
        }
        try {
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));
            if (product.getSeller().getUserId().equals(userId))
                throw new IllegalArgumentException("판매자는 자신의 상품에 입찰할 수 없습니다.");
            if (product.getProductStatus() != ProductStatus.ACTIVE)
                throw new IllegalArgumentException("입찰이 가능한 상태의 상품이 아닙니다.");

            Users user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

            //  입찰 요청 로그로 실제 호출 횟수 확인
            log.info("입찰 요청: userId={}, productId={}, bidPrice={}", userId, productId, bidPrice);

            //  같은 사용자+상품+금액의 중복 입찰을 2초 이내 차단
            LocalDateTime twoSecondsAgo = LocalDateTime.now().minusSeconds(2);
            boolean duplicate = !bidRepository
                    .findByProductAndUserAndBidPriceAndCreatedAtAfter(product, user, bidPrice, twoSecondsAgo)
                    .isEmpty();
            if (duplicate) {
                log.warn("중복 입찰 감지 (userId={}, productId={}, bidPrice={})", userId, productId, bidPrice);
                throw new IllegalArgumentException("이미 동일 금액으로 입찰이 처리되었습니다.");
            }

            // 기존 최고가 조회
            Long current = bidRepository.findTopByProductOrderByBidPriceDesc(product)
                    .map(Bid::getBidPrice)
                    .orElse(product.getStartingPrice());
            if (bidPrice < current + MIN_BID_INCREMENT)
                throw new IllegalArgumentException(String.format("입찰가는 현재가보다 최소 %,d원 이상 높아야 합니다.", MIN_BID_INCREMENT));

            //  새로운 입찰 저장
            Bid bid = Bid.builder()
                    .user(user)
                    .bidPrice(bidPrice)
                    .isWinning(true)
                    .build();

            bidRepository.save(bid);

            // 이전 최고 입찰자 isWinning 해제
            bidRepository.findByProductAndIsWinning(product, true).forEach(prev -> {
                if (!prev.getBidId().equals(bid.getBidId())) {
                    prev.setWinning(false);
                    bidRepository.save(prev);
                }
            });

            // 웹소켓 브로드캐스트
            webSocketHandler.broadcastBidList(productId, bid);

            // Map으로 응답
            Map<String, Object> resp = Map.of(
                    "bidId", bid.getBidId(),
                    "productId", productId,
                    "userId", userId,
                    "bidPrice", bid.getBidPrice(),
                    "createdAt", bid.getCreatedAt() == null
                            ? null
                            : bid.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
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

    // 상품별 입찰 내역 조회
    @Transactional(readOnly = true)
    public ResponseEntity<?> getBidHistory(Long productId) {
        try {
            productRepository.findById(productId).orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));
            List<Bid> bids = bidRepository.findByProductProductIdOrderByCreatedAtDesc(productId);

            List<Map<String, Object>> resp = bids.stream().map(b -> {
                Map<String, Object> map = new java.util.HashMap<>();
                map.put("bidId", b.getBidId());
                map.put("userId", b.getUser() != null ? b.getUser().getUserId() : 0L); // null 대신 기본값
                map.put("bidPrice", b.getBidPrice());
                map.put("isWinning", b.isWinning());
                map.put("createdAt", b.getCreatedAt() != null ? b.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : "");
                return map;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("입찰 내역 조회 중 서버 오류", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "입찰 내역 조회 중 오류가 발생했습니다."));
        }
    }

    // 최고 입찰자 조회
    @Transactional(readOnly = true)
    public Bid getHighestBid(Long productId) {
        return bidRepository
                .findTopByProductProductIdOrderByBidPriceDescCreatedAtAsc(productId);
    }


    // 입찰 차트 데이터 조회
    @Transactional(readOnly = true)
    public ResponseEntity<?> getBidHistoryForChart(Long productId) {
        try {
            Product product = productRepository.findById(productId).orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));
            List<Bid> bidHistory = bidRepository.findByProductProductIdOrderByCreatedAtAsc(productId);

            List<BidChartData> chartData = IntStream.range(0, bidHistory.size())
                    .mapToObj(i -> new BidChartData(
                            i + 1,
                            bidHistory.get(i).getBidPrice(),
                            bidHistory.get(i).getUser().getNickName()
                    ))
                    .collect(Collectors.toList());

            Map<String, Object> resp = Map.of(
                    "productId", productId,
                    "productTitle", product.getTitle(),
                    "chartData", chartData
            );

            return ResponseEntity.ok(resp);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("입찰 차트 조회 중 오류", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "입찰 차트 데이터 조회 중 오류가 발생했습니다."));
        }
    }

    // 낙찰자 확인
    @Transactional(readOnly = true)
    public ResponseEntity<?> checkWinner(Long productId, Long userId) {
        try {
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

            if (product.getAuctionEndTime() != null && LocalDateTime.now().isBefore(product.getAuctionEndTime())) {
                return ResponseEntity.ok(Map.of("isWinner", false, "message", "경매가 아직 진행중입니다."));
            }

            Optional<Bid> winningBidOpt = bidRepository.findTopByProductOrderByBidPriceDesc(product);
            if (winningBidOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "입찰 내역이 없습니다."));
            }

            Bid winningBid = winningBidOpt.get();

            // Lazy close 호출
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

    // 낙찰 정보 조회 (결제 페이지용)
    @Transactional(readOnly = true)
    public ResponseEntity<?> getWinningInfo(Long productId, Long userId) {
        try {
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

            // 최고 입찰자 조회
            Optional<Bid> winningBidOpt = bidRepository.findTopByProductOrderByBidPriceDesc(product);
            if (winningBidOpt.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "입찰 내역이 없습니다."));
            }

            Bid winningBid = winningBidOpt.get();

            // Lazy close 호출
            if (!winningBid.isWinning() && product.getAuctionEndTime() != null
                    && LocalDateTime.now().isAfter(product.getAuctionEndTime())) {
                lazyCloseBid(product, winningBid);
            }

            // 낙찰자 확인
            if (!winningBid.getUser().getUserId().equals(userId)) {
                return ResponseEntity.status(403)
                        .body(Map.of("error", "낙찰자만 접근 가능합니다."));
            }

            // 상품 이미지
            String imagePath = "";
            if (product.getImages() != null && !product.getImages().isEmpty()) {
                Image firstImage = product.getImages().get(0);
                if (firstImage != null && firstImage.getImagePath() != null) {
                    imagePath = firstImage.getImagePath();
                }
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
            return ResponseEntity.status(500)
                    .body(Map.of("error", "낙찰 정보 조회 중 오류가 발생했습니다."));
        }
    }

    private void lazyCloseBid(Product product, Bid winningBid) {
        // 기존 낙찰자 해제
        bidRepository.findByProductAndIsWinning(product, true)
                .forEach(b -> {
                    b.setWinning(false);
                    bidRepository.save(b);
                });

        // 최고 입찰자 승자로 설정
        winningBid.setWinning(true);
        bidRepository.save(winningBid);

        // Payment 생성 후 Product에 연결
        Payment payment = Payment.builder()
                .product(product)
                .totalPrice(winningBid.getBidPrice())
                .paymentStatus(PaymentStatus.PENDING)
                .build();
        product.setPayment(payment);

        // 상품 상태 업데이트
        product.setProductStatus(ProductStatus.CLOSED);
        product.setPaymentStatus(PaymentStatus.PENDING);

        productRepository.save(product);
    }
}
