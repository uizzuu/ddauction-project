package com.my.backend.service;

import com.my.backend.config.PaymentProperties;
import com.my.backend.dto.portone.PortOnePaymentResponse;
import com.my.backend.dto.portone.PortOneTokenResponse;
import com.my.backend.entity.*;
import com.my.backend.enums.PaymentMethodType;
import com.my.backend.enums.PaymentStatus;
import com.my.backend.enums.ProductStatus;
import com.my.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

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

    // 결제 준비 (경매 전용)
    public Map<String, Object> prepareBidPayment(Product product, Users user) {
        Product p = productRepository.findById(product.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

        // 경매 종료 전 결제시도 시 막아줌
        if (p.getAuctionEndTime() != null && LocalDateTime.now().isBefore(p.getAuctionEndTime())) {
            throw new IllegalStateException("경매가 아직 진행 중입니다. 경매 종료 후에만 결제할 수 있습니다.");
        }

        Bid winningBid = bidRepository.findTopByProductOrderByBidPriceDesc(p)
                .orElseThrow(() -> new IllegalStateException("낙찰자가 존재하지 않습니다."));

        // 경매 종료 후 낙찰 확정이 안 되어 있다면 확정
        if (!winningBid.isWinning()) {
            if (p.getAuctionEndTime() != null && LocalDateTime.now().isAfter(p.getAuctionEndTime())) {
                winningBid.setWinning(true);
                bidRepository.save(winningBid);

                // 상품에 낙찰 입찰 연결 + 상태 결제 대기로 전환
                p.setBid(winningBid);
                p.setProductStatus(ProductStatus.CLOSED);
                p.setPaymentStatus(PaymentStatus.PENDING);
                productRepository.save(p);
            } else {
                throw new IllegalStateException("낙찰이 아직 확정되지 않았습니다.");
            }
        }

        // 낙찰자 ID 검증 (최종 낙찰자만 결제 가능)
        if (!winningBid.getUser().getUserId().equals(user.getUserId())) {
            throw new SecurityException("현재 사용자는 낙찰자가 아닙니다.");
        }

        String merchantUid = "ORDER-" + p.getProductId() + "-" + user.getUserId() + "-" + System.currentTimeMillis();

        Map<String, Object> paymentInfo = new HashMap<>();
        paymentInfo.put("impCode", props.getPortone().getImpCode());
        paymentInfo.put("merchantUid", merchantUid);
        paymentInfo.put("name", p.getTitle());
        paymentInfo.put("amount", winningBid.getBidPrice());
        paymentInfo.put("buyerEmail", user.getEmail());
        paymentInfo.put("buyerName", user.getUserName());
        paymentInfo.put("buyerTel", user.getPhone());

        log.info("[Auction] 결제 준비 완료: productId={}, userId={}, bidPrice={}",
                p.getProductId(), user.getUserId(), winningBid.getBidPrice());
        return paymentInfo;
    }

    private String getAccessToken() {
        Map<String, String> body = new HashMap<>();
        body.put("imp_key", props.getPortone().getApiKey());
        body.put("imp_secret", props.getPortone().getApiSecret());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        ResponseEntity<PortOneTokenResponse> response = restTemplate.postForEntity(
                GET_TOKEN_URL, new HttpEntity<>(body, headers), PortOneTokenResponse.class);

        if (response.getBody() == null || response.getBody().getResponse() == null) {
            throw new IllegalStateException("토큰 발급 실패");
        }

        return response.getBody().getResponse().getAccess_token();
    }

    private PortOnePaymentResponse getPaymentInfo(String impUid, String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        ResponseEntity<PortOnePaymentResponse> response = restTemplate.exchange(
                VERIFY_PAYMENT_URL + impUid,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                PortOnePaymentResponse.class
        );

        if (response.getBody() == null || response.getBody().getCode() != 0) {
            throw new IllegalStateException("결제 정보 조회 실패");
        }
        return response.getBody();
    }

    // 결제 취소
    public void cancelPayment(String impUid, Product product, Users user, String reason) {
        Product p = productRepository.findById(product.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

        Bid winningBid = bidRepository.findTopByProductOrderByBidPriceDesc(p)
                .orElseThrow(() -> new IllegalStateException("입찰 정보가 없습니다."));

        String accessToken = getAccessToken();

        Map<String, Object> body = new HashMap<>();
        body.put("imp_uid", impUid);
        body.put("reason", reason != null ? reason : "사용자 요청");
        body.put("checksum", winningBid.getBidPrice());

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        restTemplate.postForEntity(
                CANCEL_PAYMENT_URL,
                new HttpEntity<>(body, headers),
                PortOnePaymentResponse.class
        );

        Payment payment = p.getPayment();
        if (payment != null) {
            payment.setPaymentStatus(PaymentStatus.CANCELLED);
            paymentRepository.save(payment);
        }

        // 상품 상태 롤백
        p.setPaymentStatus(PaymentStatus.CANCELLED);
        p.setProductStatus(ProductStatus.ACTIVE);
        productRepository.save(p);

        log.info("[Auction] 결제 취소 완료: productId={}, userId={}, reason={}",
                p.getProductId(), user.getUserId(), reason);
    }

    // 결제 검증 후 완료 처리 (경매 전용)
    public PortOnePaymentResponse verifyAndComplete(String impUid, Product product, Users user) {
        Product p = productRepository.findById(product.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

        String accessToken = getAccessToken();
        PortOnePaymentResponse paymentInfo = getPaymentInfo(impUid, accessToken);
        var resp = paymentInfo.getResponse();

        // PortOne 결제 상태 체크
        if (!"paid".equalsIgnoreCase(resp.getStatus())) {
            throw new IllegalStateException("결제가 완료되지 않았습니다.");
        }

        Bid winningBid = bidRepository.findTopByProductOrderByBidPriceDesc(p)
                .orElseThrow(() -> new IllegalStateException("낙찰자가 존재하지 않습니다."));

        // 낙찰자 검증 (엔티티 equals 대신 ID 기준 비교)
        if (!winningBid.getUser().getUserId().equals(user.getUserId())) {
            throw new SecurityException("현재 사용자는 낙찰자가 아닙니다.");
        }

        // 금액 검증
        if (!resp.getPaidAmount().equals(winningBid.getBidPrice().intValue())) {
            throw new IllegalStateException("결제 금액 불일치");
        }

        // PortOne 결제 수단 → 내부 enum으로 매핑
        PaymentMethodType methodType = PaymentMethodType.fromPortOne(resp.getPayMethod());

        // Payment 엔티티 생성 및 사용자/상품 연결
        Payment payment = Payment.builder()
                .product(p)
                .user(user)
                .paymentMethodType(methodType)
                .totalPrice(resp.getPaidAmount().longValue())
                .paymentStatus(PaymentStatus.PAID)
                .productType(p.getProductType())
                .build();

        paymentRepository.save(payment);

        p.setBid(winningBid);
        p.setPayment(payment);
        p.setProductStatus(ProductStatus.SOLD);
        p.setPaymentStatus(PaymentStatus.PAID);
        productRepository.save(p);

        log.info("[Auction] 결제 완료 처리: productId={}, userId={}, amount={}",
                p.getProductId(), user.getUserId(), resp.getPaidAmount());

        return paymentInfo;
    }

    public ResponseEntity<String> handleCallback(Map<String, Object> payload) {
        log.info("[PortOne] handleCallback 호출: {}", payload);
        return ResponseEntity.ok("Callback received");
    }

    // ------------------------------------------------------------
    // 일반, 중고 결제 관련 메서드

    public Map<String, Object> prepareDirectPayment(Product product, Users buyer) {
        // 상품 다시 조회 (항상 영속 상태 보장)
        Product p = productRepository.findById(product.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

        // 판매자 본인 결제 방지
        if (p.getSeller() != null && p.getSeller().getUserId().equals(buyer.getUserId())) {
            throw new IllegalArgumentException("판매자는 자신의 상품을 구매할 수 없습니다.");
        }

        // 판매 상태 검증
        if (p.getProductStatus() != ProductStatus.ACTIVE) {
            throw new IllegalStateException("결제가 가능한 상태의 상품이 아닙니다.");
        }

        // 결제 금액 결정 (일반 판매 기준)
        Long amount = p.getSalePrice() != null ? p.getSalePrice() : p.getOriginalPrice();
        if (amount == null || amount <= 0) {
            throw new IllegalStateException("상품 결제 금액이 설정되어 있지 않습니다.");
        }

        String merchantUid = "ORDER-DIRECT-" + p.getProductId() + "-" + buyer.getUserId() + "-" + System.currentTimeMillis();

        Map<String, Object> paymentInfo = new HashMap<>();
        paymentInfo.put("impCode", props.getPortone().getImpCode());
        paymentInfo.put("merchantUid", merchantUid);
        paymentInfo.put("name", p.getTitle());
        paymentInfo.put("amount", amount);
        paymentInfo.put("buyerEmail", buyer.getEmail());
        paymentInfo.put("buyerName", buyer.getUserName());
        paymentInfo.put("buyerTel", buyer.getPhone());

        log.info("[Direct] 결제 준비 완료: productId={}, userId={}, amount={}",
                p.getProductId(), buyer.getUserId(), amount);

        return paymentInfo;
    }

    public void cancelDirectPayment(String impUid, Product product, Users buyer, String reason) {
        Product p = productRepository.findById(product.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

        // 실제 취소 금액은 Payment 기준으로 체크
        Payment payment = p.getPayment();
        if (payment == null) {
            throw new IllegalStateException("결제 정보가 존재하지 않습니다.");
        }

        String accessToken = getAccessToken();

        Map<String, Object> body = new HashMap<>();
        body.put("imp_uid", impUid);
        body.put("reason", reason != null ? reason : "사용자 요청");
        body.put("checksum", payment.getTotalPrice());

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        restTemplate.postForEntity(
                CANCEL_PAYMENT_URL,
                new HttpEntity<>(body, headers),
                PortOnePaymentResponse.class
        );

        // Payment 엔티티 상태 변경
        payment.setPaymentStatus(PaymentStatus.CANCELLED);
        paymentRepository.save(payment);

        // 상품 상태 롤백
        p.setPaymentStatus(PaymentStatus.CANCELLED);
        p.setProductStatus(ProductStatus.ACTIVE);
        productRepository.save(p);

        log.info("[Direct] 결제 취소 완료: productId={}, userId={}, reason={}",
                p.getProductId(), buyer.getUserId(), reason);
    }

    public PortOnePaymentResponse verifyAndCompleteDirect(String impUid, Product product, Users buyer) {
        Product p = productRepository.findById(product.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

        String accessToken = getAccessToken();
        PortOnePaymentResponse paymentInfo = getPaymentInfo(impUid, accessToken);
        var resp = paymentInfo.getResponse();

        // 결제 상태 검증
        if (!"paid".equalsIgnoreCase(resp.getStatus())) {
            throw new IllegalStateException("결제가 완료되지 않았습니다.");
        }

        // 판매 상태 검증 (이미 SOLD면 중복 결제 방지)
        if (p.getProductStatus() == ProductStatus.SOLD) {
            throw new IllegalStateException("이미 판매 완료된 상품입니다.");
        }

        // 결제 금액 재계산 (준비 단계와 동일 로직)
        Long expectedAmount = p.getSalePrice() != null ? p.getSalePrice() : p.getOriginalPrice();
        if (expectedAmount == null || expectedAmount <= 0) {
            throw new IllegalStateException("상품 결제 금액이 설정되어 있지 않습니다.");
        }

        if (!resp.getPaidAmount().equals(expectedAmount.intValue())) {
            throw new IllegalStateException("결제 금액 불일치");
        }

        // PortOne 결제 수단
        PaymentMethodType methodType = PaymentMethodType.fromPortOne(resp.getPayMethod());

        // Payment 엔티티 생성
        Payment payment = Payment.builder()
                .product(p)
                .user(buyer)
                .paymentMethodType(methodType)
                .totalPrice(resp.getPaidAmount().longValue())
                .paymentStatus(PaymentStatus.PAID)
                .productType(p.getProductType())
                .build();

        paymentRepository.save(payment);

        // Product <-> Payment 양방향 연결
        p.setPayment(payment);
        p.setProductStatus(ProductStatus.SOLD);
        p.setPaymentStatus(PaymentStatus.PAID);
        productRepository.save(p);

        log.info("[Direct] 결제 완료 처리: productId={}, userId={}, amount={}",
                p.getProductId(), buyer.getUserId(), resp.getPaidAmount());

        return paymentInfo;
    }
}
