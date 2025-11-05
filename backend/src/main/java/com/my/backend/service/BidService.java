package com.my.backend.service;
//
//import com.my.backend.entity.Bid;
//import com.my.backend.entity.Product;
//import com.my.backend.repository.BidRepository;
//import com.my.backend.repository.ProductRepository;
//import lombok.RequiredArgsConstructor;
//import org.springframework.stereotype.Service;
//
//import java.util.List;
//
//@Service
//@RequiredArgsConstructor
//public class BidService {
//
//    private final BidRepository bidRepository;       // Bid 테이블 접근
//    private final ProductRepository productRepository; // Product 테이블 접근
//
//    // 특정 상품의 모든 입찰 조회
//    public List<Bid> getBidsByProductId(Long productId) {
//        return bidRepository.findByProductId(productId);
//    }
//
//    // 특정 입찰 조회
//    public Bid getBid(Long id) {
//        return bidRepository.findById(id)
//                .orElseThrow(() -> new RuntimeException("입찰이 존재하지 않습니다."));
//    }
//
//    // 새 입찰 생성 (검증 + currentPrice 갱신)
//    public Bid createBid(Bid bid) {
//        Product product = bid.getProduct(); // 입찰 대상 상품
//
//        // 1. 경매 종료 여부 확인
//        if (!product.isAuctionActive()) {
//            throw new RuntimeException("경매가 종료된 상품입니다.");
//        }
//
//        // 2. 현재 최고 입찰가보다 낮으면 예외
//        if (bid.getBidPrice() <= product.getCurrentPrice()) {
//            throw new RuntimeException("입찰가는 현재 최고가보다 높아야 합니다.");
//        }
//
//        // 3. 입찰 저장
//        Bid savedBid = bidRepository.save(bid);
//
//        // 4. 상품 현재 가격 갱신
//        product.setCurrentPrice(bid.getBidPrice());
//        productRepository.save(product);
//
//        return savedBid;
//    }
//
//    // 입찰 수정
//    public Bid updateBid(Long id, Bid updatedBid) {
//        Bid bid = getBid(id);
//        bid.setBidPrice(updatedBid.getBidPrice());
//        bid.setUser(updatedBid.getUser());
//        bid.setProduct(updatedBid.getProduct());
//        return bidRepository.save(bid);
//    }
//
//    // 입찰 삭제
//    public void deleteBid(Long id) {
//        bidRepository.deleteById(id);
//    }
//}


<<<<<<< HEAD
import com.my.backend.common.enums.ProductStatus;
import com.my.backend.dto.BidChartData;
import com.my.backend.dto.BidResponse;
=======
import com.my.backend.dto.BidChartData;
import com.my.backend.dto.board.BidResponse;
>>>>>>> 38e217f1fd6bb40ed328539545fddb13d58d817a
import com.my.backend.entity.Bid;
import com.my.backend.entity.Product;
import com.my.backend.entity.User;
import com.my.backend.repository.BidRepository;
import com.my.backend.repository.ProductRepository;
<<<<<<< HEAD
import com.my.backend.repository.UserRepository;
=======
import com.my.backend.repository.user.UserRepository;
>>>>>>> 38e217f1fd6bb40ed328539545fddb13d58d817a
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

<<<<<<< HEAD
    /**
     * 입찰하기
     */
    public ResponseEntity<?> placeBid(Long userId, Long productId, Long bidPrice) {
        if (userId == null) {
            log.warn("입찰 시도 실패: userId가 null입니다. productId={}", productId);
            // 401 Unauthorized 대신, 인증이 필수인데 데이터가 누락된 상황으로 간주하여
            // IllegalArgumentException을 던져서 catch 블록에서 400 Bad Request를 반환하도록 처리
            return ResponseEntity.status(401).body(Map.of("error", "로그인 세션이 만료되었거나 유효하지 않습니다."));
=======
    /** 입찰하기 */
    public ResponseEntity<?> placeBid(Long userId, Long productId, Long bidPrice) {
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "인증이 필요합니다."));
>>>>>>> 38e217f1fd6bb40ed328539545fddb13d58d817a
        }

        try {
            log.info("입찰 시도: productId={}, userId={}, bidPrice={}", productId, userId, bidPrice);

            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

            // === 검증 로직 ===
            if (product.getUser().getUserId().equals(userId))
                throw new IllegalArgumentException("판매자는 자신의 상품에 입찰할 수 없습니다.");

            if (product.isOneMinuteAuction() && product.getAuctionEndTime() != null &&
                    LocalDateTime.now().isAfter(product.getAuctionEndTime()))
                throw new IllegalArgumentException("경매가 이미 종료되었습니다.");

<<<<<<< HEAD
            if (product.getProductStatus() != ProductStatus.ACTIVE)
=======
            if (product.getProductStatus() != Product.ProductStatus.ACTIVE)
>>>>>>> 38e217f1fd6bb40ed328539545fddb13d58d817a
                throw new IllegalArgumentException("입찰이 가능한 상태의 상품이 아닙니다.");

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

            // =-=-=-=-=-=-=-=-= 입찰 관련 비즈니스 로직 시작
<<<<<<< HEAD
            // 현재 최고 입찰 가격 조회 (첫 입찰도 안전하게 처리)
            Bid top = bidRepository.findTopByProductProductIdOrderByCreatedAtDesc(productId);
            Long current = (top != null) ? top.getBidPrice() : 0L;   // 첫 입찰이면 0원
            Long minNext = current + MIN_BID_INCREMENT;

            // 현재 최고 입찰가보다 1,000원 이상 높아야 입찰 가능
            if (bidPrice.compareTo(minNext) < 0) {
                throw new IllegalArgumentException(
                        String.format("입찰가는 현재가보다 최소 %,d원 이상 높아야 합니다.", MIN_BID_INCREMENT)
                );
            }
=======
            // 현재 최고 입찰 가격
            Bid top = bidRepository.findTopByProductProductIdOrderByCreatedAtDesc(productId);

            // 현재 최고 입찰가
            Long current = top.getBidPrice();
            Long minNext = current + MIN_BID_INCREMENT;

            // 현재 최고 입찰가 보다 1,000원 높아야 입찰 가능
            if (bidPrice.compareTo(minNext) < 0)
                throw new IllegalArgumentException(String.format("입찰가는 현재가보다 최소 %,d원 이상 높아야 합니다.", MIN_BID_INCREMENT));
>>>>>>> 38e217f1fd6bb40ed328539545fddb13d58d817a

            // =-=-=-=-=-=-=-=-= 입찰 관련 비즈니스 로직 끝

            // === 입찰 저장 ===
            Bid bid = Bid.builder()
                    .product(product)
                    .user(user)
                    .bidPrice(bidPrice)
                    .build();

            bidRepository.save(bid);


            // 최고가 갱신
//            product.setPrice(bidPrice.longValueExact());
//            productRepository.save(product);

            log.info("입찰 성공: bidId={}, productId={}, userId={}, bidPrice={}",
                    bid.getBidId(), productId, userId, bidPrice);

            BidResponse resp = new BidResponse(
                    bid.getBidId(),
                    productId,
                    userId,
                    bid.getBidPrice(),
                    bid.getCreatedAt() == null
                            ? null
                            : bid.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
            );

            log.info("입찰 성공: userId={}, productId={}, bidPrice={}", userId, productId, bidPrice);

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

<<<<<<< HEAD
    /**
     * 상품별 입찰 내역 조회
     */
=======
    /** 상품별 입찰 내역 조회 */
>>>>>>> 38e217f1fd6bb40ed328539545fddb13d58d817a
    @Transactional(readOnly = true)
    public ResponseEntity<?> getBidHistory(Long productId) {
        try {
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));
            List<Bid> bids = bidRepository.findByProductProductIdOrderByCreatedAtDesc(product.getProductId());

            List<BidController.BidHistoryItem> resp = bids.stream()
<<<<<<< HEAD
                    .map(b -> {
                        User user = b.getUser(); // User 객체 획득
                        Long userId = (user != null) ? user.getUserId() : null; // 널 체크
                        // 사용자 닉네임이 필요하다면 여기서 처리해야 합니다. BidHistoryItem에 닉네임 필드가 없으므로 생략.

                        return new BidController.BidHistoryItem(
                                b.getBidId(),
                                b.getProduct().getProductId(),
                                userId, // 널 가능성 처리
                                b.getBidPrice(),
                                b.getCreatedAt() == null
                                        ? null
                                        : b.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                        );
                    })
=======
                    .map(b -> new BidController.BidHistoryItem(
                            b.getBidId(),
                            b.getProduct().getProductId(),
                            b.getUser().getUserId(),
                            b.getBidPrice(),
                            b.getCreatedAt() == null
                                    ? null
                                    : b.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                    ))
>>>>>>> 38e217f1fd6bb40ed328539545fddb13d58d817a
                    .toList();

            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));

        } catch (Exception e) {
            log.error("입찰 내역 조회 중 서버 오류", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "입찰 내역 조회 중 오류가 발생했습니다."));
        }
    }

<<<<<<< HEAD
    /**
     * 최고 입찰자 조회
     */
=======
    /** 최고 입찰자 조회 */
>>>>>>> 38e217f1fd6bb40ed328539545fddb13d58d817a
    @Transactional(readOnly = true)
    public Bid getHighestBid(Long productId) {
        return bidRepository.findTopByProductProductIdOrderByCreatedAtDesc(productId);
    }

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

            //  이미 ASC 정렬된 리스트이므로, 단순히 번호만 매김
            List<BidChartData> chartData = IntStream
                    .range(0, bidHistory.size())
                    .mapToObj(i -> new BidChartData(
                            i + 1,                                      // bidNumber (1번부터 시작)
                            bidHistory.get(i).getBidPrice(),              // bidPrice
                            bidHistory.get(i).getUser().getNickName()   // bidNickname
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
            return ResponseEntity.badRequest().body(Map.of(
                    "error", e.getMessage()
            ));

        } catch (Exception e) {
            log.error("입찰 차트 조회 중 오류", e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "error", "입찰 차트 데이터 조회 중 오류가 발생했습니다."
            ));
        }
    }

}
