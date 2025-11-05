package com.my.backend.service;

import com.my.backend.common.enums.ProductStatus;
import com.my.backend.dto.BidChartData;
import com.my.backend.dto.BidResponse;
import com.my.backend.entity.Bid;
import com.my.backend.entity.Product;
import com.my.backend.entity.User;
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

    /**
     * 입찰하기
     */
    public ResponseEntity<?> placeBid(Long userId, Long productId, Long bidPrice) {
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "로그인이 필요합니다."));
        }
        try {
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));
            if (product.getUser().getUserId().equals(userId))
                throw new IllegalArgumentException("판매자는 자신의 상품에 입찰할 수 없습니다.");
            if (product.isOneMinuteAuction() && product.getAuctionEndTime() != null &&
                    LocalDateTime.now().isAfter(product.getAuctionEndTime()))
                throw new IllegalArgumentException("경매가 이미 종료되었습니다.");
            if (product.getProductStatus() != ProductStatus.ACTIVE)
                throw new IllegalArgumentException("입찰이 가능한 상태의 상품이 아닙니다.");

            User user = userRepository.findById(userId)
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
            //  최고가 조회
            Optional<Bid> topOpt = bidRepository.findTopByProductOrderByBidPriceDesc(product);
            Long current = topOpt.map(Bid::getBidPrice).orElse(product.getStartingPrice());
            Long minNext = current + MIN_BID_INCREMENT;

            if (bidPrice < minNext) {
                throw new IllegalArgumentException(
                        String.format("입찰가는 현재가보다 최소 %,d원 이상 높아야 합니다.", MIN_BID_INCREMENT)
                );
            }
            //  새로운 입찰 저장
            Bid bid = Bid.builder()
                    .product(product)
                    .user(user)
                    .bidPrice(bidPrice)
                    .isWinning(true)
                    .build();

            bidRepository.save(bid);

            //  다른 낙찰자 isWinning 해제
            List<Bid> previousWinningBids = bidRepository.findByProductAndIsWinning(product, true);
            previousWinningBids.forEach(prev -> {
                if (!prev.getBidId().equals(bid.getBidId())) {
                    prev.setWinning(false);
                    bidRepository.save(prev);
                }
            });

            //  응답 구성
            BidResponse resp = new BidResponse(
                    bid.getBidId(),
                    productId,
                    userId,
                    bid.getBidPrice(),
                    bid.getCreatedAt() == null
                            ? null
                            : bid.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
            );

            // 웹소켓 브로드캐스트
            webSocketHandler.broadcastBidList(productId, bid);

            return ResponseEntity.ok(resp);

        } catch (IllegalArgumentException e) {
            log.warn("입찰 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("입찰 처리 중 서버 오류", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "입찰 처리 중 오류가 발생했습니다."));
        }
    }

    /**
     * 상품별 입찰 내역 조회
     */
    @Transactional(readOnly = true)
    public ResponseEntity<?> getBidHistory(Long productId) {
        try {
            productRepository.findById(productId).orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));
            List<Bid> bids = bidRepository.findByProductProductIdOrderByCreatedAtDesc(productId);

            List<BidController.BidHistoryItem> resp = bids.stream()
                    .map(b -> {
                        User user = b.getUser();
                        Long userId = (user != null) ? user.getUserId() : null;

                        return new BidController.BidHistoryItem(
                                b.getBidId(),
                                b.getProduct().getProductId(),
                                userId,
                                b.getBidPrice(),
                                b.getCreatedAt() == null
                                        ? null
                                        : b.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                        );
                    })
                    .toList();

            return ResponseEntity.ok(resp);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("입찰 내역 조회 중 서버 오류", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "입찰 내역 조회 중 오류가 발생했습니다."));
        }
    }

    /**
     * 최고 입찰자 조회
     */
    @Transactional(readOnly = true)
    public Bid getHighestBid(Long productId) {
        return bidRepository
                .findTopByProductProductIdOrderByBidPriceDescCreatedAtAsc(productId);
    }


    /**
     * 입찰 차트 데이터 조회
     */
    @Transactional(readOnly = true)
    public ResponseEntity<?> getBidHistoryForChart(Long productId) {
        try {
            productRepository.findById(productId).orElseThrow();
            List<Bid> bidHistory = bidRepository.findByProductProductIdOrderByCreatedAtAsc(productId);

            if (bidHistory.isEmpty()) {
                return ResponseEntity.ok().body(new BidController.BidChartResponse(
                        productId,
                        "상품명 미확인",
                        List.of()
                ));
            }

            List<BidChartData> chartData = IntStream
                    .range(0, bidHistory.size())
                    .mapToObj(i -> new BidChartData(
                            i + 1,
                            bidHistory.get(i).getBidPrice(),
                            bidHistory.get(i).getUser().getNickName()
                    ))
                    .collect(Collectors.toList());

            String productTitle = bidHistory.get(0).getProduct().getTitle();

            BidController.BidChartResponse response = new BidController.BidChartResponse(
                    productId,
                    productTitle,
                    chartData
            );

            log.info("입찰 차트 데이터 조회: productId={}, 입찰수={}", productId, chartData.size());
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("입찰 차트 조회 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("입찰 차트 조회 중 오류", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "입찰 차트 데이터 조회 중 오류가 발생했습니다."));
        }
    }

    // 낙찰자 확인 API

    /**
     * 낙찰자 확인 API
     */
    @Transactional
    public ResponseEntity<?> checkWinner(Long productId, Long userId) {
        try {
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

            // 1. 경매 진행 중이면 false 반환
            if (product.getAuctionEndTime() != null &&
                    LocalDateTime.now().isBefore(product.getAuctionEndTime())) {
                return ResponseEntity.ok(Map.of(
                        "isWinner", false,
                        "message", "경매가 아직 진행중입니다."
                ));
            }

            // 2. 최고 입찰자 조회
            Optional<Bid> winningBidOpt = bidRepository.findTopByProductOrderByBidPriceDesc(product);

            if (winningBidOpt.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                        "isWinner", false,
                        "message", "입찰 내역이 없습니다."
                ));
            }

            Bid winningBid = winningBidOpt.get();

            //  3. Lazy Close: 경매 종료됐는데 isWinning이 false면 즉시 설정
            if (!winningBid.isWinning()) {
                log.info("[checkWinner]  Lazy close 시작 - productId={}, winnerId={}",
                        productId, winningBid.getUser().getUserId());

                // 3-1. 기존 낙찰자들 해제 (혹시 모를 중복 방지)
                List<Bid> previousWinners = bidRepository.findByProductAndIsWinning(product, true);
                if (!previousWinners.isEmpty()) {
                    log.info("[checkWinner] 기존 낙찰자 {}명 해제", previousWinners.size());
                    previousWinners.forEach(bid -> {
                        bid.setWinning(false);
                        bidRepository.save(bid);
                    });
                }

                // 3-2. 최고 입찰자를 낙찰자로 확정
                winningBid.setWinning(true);
                bidRepository.save(winningBid);
                log.info("[checkWinner]  낙찰자 확정: winnerId={}, bidPrice={}",
                        winningBid.getUser().getUserId(), winningBid.getBidPrice());

                // 3-3. 상품 상태도 업데이트
                if (product.getProductStatus() == ProductStatus.ACTIVE) {
                    product.setProductStatus(ProductStatus.CLOSED);
                    product.setPaymentStatus(com.my.backend.common.enums.PaymentStatus.PENDING);
                    product.setPaymentUserId(winningBid.getUser().getUserId());
                    productRepository.save(product);

                    log.info("[checkWinner]  상품 상태 변경: ACTIVE → CLOSED, PENDING 설정");
                }

                log.info("[checkWinner]  Lazy close 완료!");
            }

            // 4. 이제 isWinning으로 안전하게 체크 (이미 설정됨)
            boolean isWinner = winningBid.isWinning() &&
                    winningBid.getUser().getUserId().equals(userId);

            Long winningUserId = winningBid.getUser().getUserId();

            log.info("[checkWinner] 최종 결과: productId={}, winnerId={}, currentUserId={}, isWinner={}",
                    productId, winningUserId, userId, isWinner);

            return ResponseEntity.ok(Map.of(
                    "isWinner", isWinner,
                    "bidPrice", winningBid.getBidPrice()
            ));

        } catch (Exception e) {
            log.error("낙찰자 확인 실패", e);
            return ResponseEntity.status(500)
                    .body(Map.of("error", "낙찰자 확인 중 오류가 발생했습니다."));
        }
    }

    /**
     * 낙찰 정보 조회 (결제 페이지용) -
     */
    @Transactional
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

            //  경매 종료됐는데 isWinning이 false면 즉시 설정
            if (!winningBid.isWinning()) {
                // 경매 종료 확인
                if (product.getAuctionEndTime() != null &&
                        LocalDateTime.now().isAfter(product.getAuctionEndTime())) {

                    log.info("[getWinningInfo] Lazy close: 낙찰자 확정 - productId={}, winnerId={}",
                            productId, winningBid.getUser().getUserId());

                    // 기존 낙찰자들 해제
                    List<Bid> previousWinners = bidRepository.findByProductAndIsWinning(product, true);
                    if (!previousWinners.isEmpty()) {
                        log.info("[getWinningInfo] 기존 낙찰자 {}명 해제", previousWinners.size());
                        previousWinners.forEach(bid -> {
                            bid.setWinning(false);
                            bidRepository.save(bid);
                        });
                    }

                    // 최고 입찰자를 낙찰자로 확정
                    winningBid.setWinning(true);
                    bidRepository.save(winningBid);
                    log.info("[getWinningInfo] 낙찰자 확정 완료: winnerId={}, bidPrice={}",
                            winningBid.getUser().getUserId(), winningBid.getBidPrice());

                    // 상품 상태도 업데이트
                    if (product.getProductStatus() == ProductStatus.ACTIVE) {
                        product.setProductStatus(ProductStatus.CLOSED);
                        product.setPaymentStatus(com.my.backend.common.enums.PaymentStatus.PENDING);
                        product.setPaymentUserId(winningBid.getUser().getUserId());
                        productRepository.save(product);

                        log.info("[getWinningInfo] 상품 상태 변경: ACTIVE → CLOSED, PENDING 설정");
                    }

                    log.info("[getWinningInfo] Lazy close 완료");
                }
            }

            // 이제 isWinning으로 체크 (이미 설정됨)
            if (!winningBid.isWinning()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "낙찰 정보가 없습니다."));
            }

            // 낙찰자 확인
            if (!winningBid.getUser().getUserId().equals(userId)) {
                return ResponseEntity.status(403)
                        .body(Map.of("error", "낙찰자만 접근 가능합니다."));
            }

            // Product.image (단일 이미지) 사용
            String imagePath = "";
            if (product.getImage() != null && product.getImage().getImagePath() != null) {
                imagePath = product.getImage().getImagePath();
            }

            return ResponseEntity.ok(Map.of(
                    "productId", product.getProductId(),
                    "productTitle", product.getTitle(),
                    "productImage", imagePath,
                    "bidPrice", winningBid.getBidPrice(),
                    "sellerName", product.getUser().getNickName()
            ));

        } catch (Exception e) {
            log.error("낙찰 정보 조회 실패", e);
            return ResponseEntity.status(500)
                    .body(Map.of("error", "낙찰 정보 조회 중 오류가 발생했습니다."));
        }
    }
}
