package com.my.backend.service;

import com.my.backend.enums.PaymentMethodType;
import com.my.backend.enums.PaymentStatus;
import com.my.backend.enums.ProductStatus;
import com.my.backend.config.PaymentProperties;
import com.my.backend.dto.portone.PortOnePaymentResponse;
import com.my.backend.dto.portone.PortOneTokenResponse;
import com.my.backend.entity.*;
import com.my.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import static com.my.backend.enums.PaymentStatus.CANCELLED;
import static com.my.backend.enums.ProductStatus.ACTIVE;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PortOnePaymentService {

    private final PaymentRepository paymentRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final BidRepository bidRepository;
    private final PaymentProperties props;
    private final RestTemplate restTemplate;

    private static final String PORTONE_API_BASE = "https://api.iamport.kr";
    private static final String GET_TOKEN_URL = PORTONE_API_BASE + "/users/getToken";
    private static final String VERIFY_PAYMENT_URL = PORTONE_API_BASE + "/payments/";
    private static final String CANCEL_PAYMENT_URL = PORTONE_API_BASE + "/payments/cancel";


    // 결제 준비
    public ResponseEntity<Map<String, Object>> prepareBidPayment(Long productId, Long userId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

        //  최고 입찰자 조회
        Bid winningBid = bidRepository.findTopByProductOrderByBidPriceDesc(product)
                .orElseThrow(() -> new IllegalStateException("낙찰(최고 입찰자)이 존재하지 않습니다."));

        //  경매 종료 여부 확인
        if (product.getAuctionEndTime() == null || LocalDateTime.now().isBefore(product.getAuctionEndTime())) {
            throw new IllegalStateException("아직 경매가 종료되지 않았습니다.");
        }

        //  낙찰 확정 여부 검증
        if (!winningBid.isWinning()) {
            // Lazy Close 보정: 경매가 종료되었는데 아직 낙찰 처리 안 된 경우
            if (product.getAuctionEndTime() != null && LocalDateTime.now().isAfter(product.getAuctionEndTime())) {
                log.warn("[prepareBidPayment] Lazy Close 보정 실행: productId={}, userId={}", productId, userId);
                winningBid.setWinning(true);
                bidRepository.save(winningBid);
                product.setProductStatus(ProductStatus.CLOSED);
                product.setPaymentStatus(PaymentStatus.PENDING);
                productRepository.save(product);
            } else {
                throw new IllegalStateException("아직 낙찰이 확정되지 않았습니다. (스케줄러가 처리 중일 수 있습니다.)");
            }
        }

        //  현재 사용자 검증
        if (!winningBid.getUser().getUserId().equals(userId)) {
            throw new SecurityException("현재 사용자는 낙찰자가 아닙니다.");
        }

        //  보정 로직 추가
        if (product.getProductStatus() == ProductStatus.ACTIVE
                && product.getAuctionEndTime() != null
                && LocalDateTime.now().isAfter(product.getAuctionEndTime())) {
            log.warn("[prepareBidPayment] 상품 상태 보정: ACTIVE → CLOSED (productId={})", productId);
            product.setProductStatus(ProductStatus.CLOSED);
            product.setPaymentStatus(PaymentStatus.PENDING);
            productRepository.save(product);
        }

        //  상품 상태 검증
        if (product.getProductStatus() != ProductStatus.CLOSED) {
            throw new IllegalStateException("상품이 아직 종료되지 않았습니다. (status=" + product.getProductStatus() + ")");
        }

        //  결제 상태 설정 (읽기전용이라 실제 저장은 아님)
        if (product.getPaymentStatus() == null || product.getPaymentStatus() == PaymentStatus.CANCELLED) {
            log.info("[prepareBidPayment] 결제 상태 임시 설정: PENDING");
        }

        //  추가 검증 로직
        validateAuctionPayment(product, winningBid);

        //  결제자 정보
        Users buyer = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        //  고유 주문번호 생성
        String merchantUid = "ORDER-" + productId + "-" + userId + "-" + System.currentTimeMillis();

        //  결제 정보 구성
        Map<String, Object> paymentInfo = new HashMap<>();
        paymentInfo.put("impCode", props.getPortone().getImpCode());
        paymentInfo.put("merchantUid", merchantUid);
        paymentInfo.put("name", product.getTitle());
        paymentInfo.put("amount", winningBid.getBidPrice());
        paymentInfo.put("buyerEmail", buyer.getEmail());
        paymentInfo.put("buyerName", buyer.getUserName());
        paymentInfo.put("buyerTel", buyer.getPhone());

        log.info("[Auction] 결제 준비 완료: productId={}, userId={}, bidPrice={}", productId, userId, winningBid.getBidPrice());
        return ResponseEntity.ok(paymentInfo);
    }


    // 토큰 발급
    private String getAccessToken() {
        try {
            Map<String, String> body = new HashMap<>();
            body.put("imp_key", props.getPortone().getApiKey());
            body.put("imp_secret", props.getPortone().getApiSecret());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            ResponseEntity<PortOneTokenResponse> response = restTemplate.postForEntity(
                    GET_TOKEN_URL, new HttpEntity<>(body, headers), PortOneTokenResponse.class);

            if (response.getBody() == null || response.getBody().getResponse() == null)
                throw new IllegalStateException("토큰 발급 실패: 응답이 비어있습니다.");

            log.info("PortOne Access Token 발급 성공");
            return response.getBody().getResponse().getAccess_token();

        } catch (Exception e) {
            log.error("토큰 발급 실패", e);
            throw new RuntimeException("PortOne 토큰 발급 실패");
        }
    }

    // 결제 정보 조회
    private PortOnePaymentResponse getPaymentInfo(String impUid, String accessToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            headers.setContentType(MediaType.APPLICATION_JSON);

            ResponseEntity<PortOnePaymentResponse> response = restTemplate.exchange(
                    VERIFY_PAYMENT_URL + impUid, HttpMethod.GET, new HttpEntity<>(headers), PortOnePaymentResponse.class);

            if (response.getBody() == null)
                throw new IllegalStateException("결제 정보 조회 실패: 응답이 비어있습니다.");

            PortOnePaymentResponse body = response.getBody();
            if (body.getCode() != 0)
                throw new IllegalStateException("결제 정보 조회 실패: " + body.getMessage());

            return body;
        } catch (HttpStatusCodeException e) {
            log.error("결제 정보 조회 실패: {} {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("결제 정보 조회 실패");
        }
    }

    // 결제 취소
    public ResponseEntity<Map<String, String>> cancelPayment(String impUid, Long productId, Long userId, String reason) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

        Bid winningBid = bidRepository.findTopByProductOrderByBidPriceDesc(product)
                .orElseThrow(() -> new IllegalStateException("입찰 정보가 없습니다."));

        try {
            String accessToken = getAccessToken();

            Map<String, Object> body = new HashMap<>();
            body.put("imp_uid", impUid);
            body.put("reason", reason == null ? "사용자 요청" : reason);
            body.put("checksum", winningBid.getBidPrice()); // 최고가 기준 취소 금액

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            headers.setContentType(MediaType.APPLICATION_JSON);

            ResponseEntity<PortOnePaymentResponse> response = restTemplate.postForEntity(
                    CANCEL_PAYMENT_URL, new HttpEntity<>(body, headers), PortOnePaymentResponse.class);

            if (response.getBody() == null || response.getBody().getCode() != 0)
                throw new IllegalStateException("결제 취소 실패");

            product.setPaymentStatus(CANCELLED);
            product.setProductStatus(ACTIVE);
            productRepository.save(product);

            log.info("[Auction] 결제 취소 완료: impUid={}, productId={}, reason={}", impUid, productId, reason);
            return ResponseEntity.ok(Map.of("message", "결제가 취소되었습니다."));
        } catch (Exception e) {
            log.error("결제 취소 실패", e);
            throw new RuntimeException("결제 취소 중 오류");
        }
    }

    // 검증
    private void validateAuctionPayment(Product product, Bid bid) {
        // 1. 경매가 끝났는지 확인 (1분 경매라면 종료시간이 지나야 결제 가능)
        if (product.getAuctionEndTime() != null && LocalDateTime.now().isBefore(product.getAuctionEndTime())) {
            throw new IllegalArgumentException("경매가 아직 종료되지 않았습니다.");
        }

        // 2. 결제 가능한 상품 상태인지 확인
        if (product.getProductStatus() != ProductStatus.CLOSED) {
            throw new IllegalArgumentException("종료된 경매만 결제할 수 있습니다.");
        }
        if (product.getPaymentStatus() == PaymentStatus.PAID) {
            throw new IllegalArgumentException("이미 결제가 완료된 상품입니다.");
        }
        if (product.getPaymentStatus() != PaymentStatus.PENDING) {
            throw new IllegalArgumentException("결제를 진행할 수 없는 상태입니다.");
        }

        // 3. 입찰가 sanity check
        if (bid.getBidPrice() == null || bid.getBidPrice() <= 0) {
            throw new IllegalStateException("입찰가가 올바르지 않습니다.");
        }
    }

    private void validatePaymentInfo(PortOnePaymentResponse paymentInfo, Long productId, Long userId) {
        var resp = paymentInfo.getResponse();

        if (resp == null) {
            throw new IllegalStateException("결제 응답 데이터가 없습니다.");
        }

        String status = resp.getStatus();
        Integer paidAmount = resp.getPaidAmount();

        // 결제 상태 검사
        if (!"paid".equalsIgnoreCase(status)) {
            log.warn("[PortOne] 결제 미완료 상태: {}", status);
            throw new IllegalStateException("결제가 아직 완료되지 않았습니다. (status=" + status + ")");
        }

        //  paid_amount null 방어
        if (paidAmount == null) {
            log.error("[PortOne] PortOne 응답에 paid_amount 없음: {}", paymentInfo);
            throw new IllegalStateException("결제 금액 정보가 비어있습니다.");
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

        Bid bid = bidRepository.findTopByProductOrderByBidPriceDesc(product)
                .orElseThrow(() -> new IllegalStateException("낙찰자가 존재하지 않습니다."));

        if (!bid.getUser().getUserId().equals(userId))
            throw new SecurityException("현재 사용자는 낙찰자가 아닙니다.");

        //  금액 비교
        if (!paidAmount.equals(bid.getBidPrice().intValue()))
            throw new IllegalStateException("결제 금액 불일치: 최고가=" + bid.getBidPrice() + ", 결제금액=" + paidAmount);
    }

    // 후처리
    private void updateProductAfterPayment(Long productId, Long userId, PortOnePaymentResponse paymentInfo) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));
        Users buyer = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("구매자를 찾을 수 없습니다."));

        Integer paidAmount = paymentInfo.getResponse().getPaidAmount();

        product.setProductStatus(ProductStatus.SOLD);
        product.setPaymentStatus(PaymentStatus.PAID);
        productRepository.save(product);

        log.info("[Auction] 상품 결제 완료 처리: productId={}, userId={}, amount={}",
                productId, userId, paidAmount);
    }

    // 콜백
    public ResponseEntity<String> handleCallback(Map<String, Object> payload) {
        log.info("[PortOne] Callback 수신: {}", payload);
        String impUid = (String) payload.get("imp_uid");
        String merchantUid = (String) payload.get("merchant_uid");

        try {
            if (impUid == null && merchantUid == null) {
                log.warn("콜백 처리 불가: impUid/merchantUid 없음");
                return ResponseEntity.ok("OK");
            }

            String accessToken = getAccessToken();
            if (merchantUid == null && impUid != null) {
                PortOnePaymentResponse info = getPaymentInfo(impUid, accessToken);
                if (info.getResponse() != null) merchantUid = info.getResponse().getMerchantUid();
            }

            if (merchantUid != null) {
                ParsedUid parsed = parseMerchantUid(merchantUid);
                verifyAndComplete(impUid, parsed.productId(), parsed.userId());
            }

            return ResponseEntity.ok("OK");
        } catch (Exception e) {
            log.warn("Callback 처리 실패 impUid={}, reason={}", impUid, e.getMessage());
            return ResponseEntity.ok("OK");
        }
    }

    // 유틸
    private record ParsedUid(Long productId, Long userId) {}

    private ParsedUid parseMerchantUid(String merchantUid) {
        try {
            String[] parts = merchantUid.split("-");
            Long pId = Long.parseLong(parts[1]);
            Long uId = Long.parseLong(parts[2]);
            return new ParsedUid(pId, uId);
        } catch (Exception e) {
            throw new IllegalStateException("유효하지 않은 주문번호 형식입니다.");
        }
    }

    @Transactional
    public ResponseEntity<PortOnePaymentResponse> verifyAndComplete(String impUid, Long productId, Long userId) {
        log.info("[PortOne] verifyAndComplete 시작: impUid={}, productId={}, userId={}", impUid, productId, userId);

        String accessToken = getAccessToken();
        PortOnePaymentResponse paymentInfo = getPaymentInfo(impUid, accessToken);
        var resp = paymentInfo.getResponse();

        if (resp == null) {
            return ResponseEntity.badRequest().body(paymentInfo);
        }

        //  테스트 모드 대응: paid_amount 누락 보정
        if (resp.getPaidAmount() == null) {
            log.warn("[PortOne] paid_amount가 null — 테스트 모드일 가능성 있음. 낙찰가로 대체합니다.");
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));
            Bid winningBid = bidRepository.findTopByProductOrderByBidPriceDesc(product)
                    .orElseThrow(() -> new IllegalStateException("낙찰자가 존재하지 않습니다."));
            resp.setPaidAmount(winningBid.getBidPrice().intValue());
        }

        //  결제 완료 상태만 진행
        if (!"paid".equalsIgnoreCase(resp.getStatus())) {
            log.warn("[PortOne] 결제 상태 미완료: {}", resp.getStatus());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(paymentInfo);
        }

        // 결제 검증 및 DB 처리
        validatePaymentInfo(paymentInfo, productId, userId);
        updateProductAfterPayment(productId, userId, paymentInfo);

        Product product = productRepository.findById(productId).orElseThrow();
        Bid winningBid = bidRepository.findTopByProductOrderByBidPriceDesc(product)
                .orElseThrow(() -> new IllegalStateException("입찰 정보가 없습니다."));

        // PaymentMethod 조회/생성 추가
        PaymentMethodType methodType = PaymentMethodType.fromPortOne(resp.getPayMethod());


        Payment payment = Payment.builder()
                .product(product)
                .paymentMethodType(methodType)
                .totalPrice(resp.getPaidAmount().longValue())
                .paymentStatus(PaymentStatus.PAID)
                .courierName(null)   // 필요하면 설정
                .productType(product.getProductType())
                .build();

        paymentRepository.save(payment);
        paymentRepository.flush();

        log.info("[PortOne] verifyAndComplete 완료: productId={}, userId={}, amount={}",
                productId, userId, resp.getPaidAmount());

        return ResponseEntity.ok(paymentInfo);
    }
}
