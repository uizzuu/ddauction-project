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

    // 결제 준비
    public Map<String, Object> prepareBidPayment(Product product, Users user) {
        Product p = productRepository.findById(product.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

        Bid winningBid = bidRepository.findTopByProductOrderByBidPriceDesc(p)
                .orElseThrow(() -> new IllegalStateException("낙찰자가 존재하지 않습니다."));

        if (!winningBid.isWinning()) {
            if (p.getAuctionEndTime() != null && LocalDateTime.now().isAfter(p.getAuctionEndTime())) {
                winningBid.setWinning(true);
                bidRepository.save(winningBid);
                p.setProductStatus(ProductStatus.CLOSED);
                p.setPaymentStatus(PaymentStatus.PENDING);
                productRepository.save(p);
            } else {
                throw new IllegalStateException("낙찰이 아직 확정되지 않았습니다.");
            }
        }

        if (!winningBid.getUser().equals(user)) {
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
                VERIFY_PAYMENT_URL + impUid, HttpMethod.GET, new HttpEntity<>(headers), PortOnePaymentResponse.class);

        if (response.getBody() == null || response.getBody().getCode() != 0) {
            throw new IllegalStateException("결제 정보 조회 실패");
        }
        return response.getBody();
    }

    public void cancelPayment(String impUid, Product product, Users user, String reason) {
        Bid winningBid = bidRepository.findTopByProductOrderByBidPriceDesc(product)
                .orElseThrow(() -> new IllegalStateException("입찰 정보가 없습니다."));

        String accessToken = getAccessToken();

        Map<String, Object> body = new HashMap<>();
        body.put("imp_uid", impUid);
        body.put("reason", reason != null ? reason : "사용자 요청");
        body.put("checksum", winningBid.getBidPrice());

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        restTemplate.postForEntity(CANCEL_PAYMENT_URL, new HttpEntity<>(body, headers), PortOnePaymentResponse.class);

        product.setPaymentStatus(PaymentStatus.CANCELLED);
        product.setProductStatus(ProductStatus.ACTIVE);
        productRepository.save(product);

        log.info("[Auction] 결제 취소 완료: productId={}, userId={}, reason={}", product.getProductId(), user.getUserId(), reason);
    }

    // 결제 검증 후 완료 처리
    public PortOnePaymentResponse verifyAndComplete(String impUid, Product product, Users user) {
        String accessToken = getAccessToken();
        PortOnePaymentResponse paymentInfo = getPaymentInfo(impUid, accessToken);
        var resp = paymentInfo.getResponse();

        if (!"paid".equalsIgnoreCase(resp.getStatus())) {
            throw new IllegalStateException("결제가 완료되지 않았습니다.");
        }

        Bid winningBid = bidRepository.findTopByProductOrderByBidPriceDesc(product)
                .orElseThrow(() -> new IllegalStateException("낙찰자가 존재하지 않습니다."));

        if (!winningBid.getUser().equals(user)) {
            throw new SecurityException("현재 사용자는 낙찰자가 아닙니다.");
        }

        if (!resp.getPaidAmount().equals(winningBid.getBidPrice().intValue())) {
            throw new IllegalStateException("결제 금액 불일치");
        }

        product.setProductStatus(ProductStatus.SOLD);
        product.setPaymentStatus(PaymentStatus.PAID);
        productRepository.save(product);

        PaymentMethodType methodType = PaymentMethodType.fromPortOne(resp.getPayMethod());

        Payment payment = Payment.builder()
                .product(product)
                .paymentMethodType(methodType)
                .totalPrice(resp.getPaidAmount().longValue())
                .paymentStatus(PaymentStatus.PAID)
                .productType(product.getProductType())
                .build();

        paymentRepository.save(payment);
        paymentRepository.flush();

        log.info("[Auction] 결제 완료 처리: productId={}, userId={}, amount={}", product.getProductId(), user.getUserId(), resp.getPaidAmount());

        return paymentInfo;
    }

    // PortOne 콜백 처리
    public ResponseEntity<String> handleCallback(Map<String, Object> payload) {
        log.info("[PortOne] handleCallback 호출: {}", payload);
        // 실제 처리 로직 넣으세요 (예: 결제 상태 업데이트, DB 반영 등)
        return ResponseEntity.ok("Callback received");
    }
}