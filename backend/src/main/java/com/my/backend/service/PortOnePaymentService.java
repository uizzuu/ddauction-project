//package com.my.backend.service;
//
//import com.my.backend.common.enums.PaymentStatus;
//import com.my.backend.common.enums.ProductStatus;
//import com.my.backend.config.PaymentProperties;
//import com.my.backend.dto.portone.PortOnePaymentResponse;
//import com.my.backend.dto.portone.PortOneTokenResponse;
//import com.my.backend.entity.Bid;
//import com.my.backend.entity.Payment;
//import com.my.backend.entity.Product;
//import com.my.backend.entity.User;
//import com.my.backend.repository.BidRepository;
//import com.my.backend.repository.ProductRepository;
//import com.my.backend.repository.UserRepository;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.http.*;
//import org.springframework.stereotype.Service;
//import org.springframework.transaction.annotation.Transactional;
//import org.springframework.web.client.HttpStatusCodeException;
//import org.springframework.web.client.RestTemplate;
//
//import java.time.LocalDateTime;
//import java.util.HashMap;
//import java.util.List;
//import java.util.Map;
//
//import static com.my.backend.common.enums.PaymentStatus.CANCELLED;
//import static com.my.backend.common.enums.PaymentStatus.PAID;
//import static com.my.backend.common.enums.ProductStatus.ACTIVE;
//
//@Slf4j
//@Service
//@RequiredArgsConstructor
//@Transactional
//public class PortOnePaymentService {
//
//    private final ProductRepository productRepository;
//    private final UserRepository userRepository;
//    private final PaymentProperties props;
//    private final RestTemplate restTemplate;
//    private final BidRepository bidRepository;
//
//    private static final String PORTONE_API_BASE = "https://api.iamport.kr";
//    private static final String GET_TOKEN_URL = PORTONE_API_BASE + "/users/getToken";
//    private static final String VERIFY_PAYMENT_URL = PORTONE_API_BASE + "/payments/";
//    private static final String CANCEL_PAYMENT_URL = PORTONE_API_BASE + "/payments/cancel";
//
//    // ========== 1) 결제 준비 ==========
//    /** 결제 준비 (클라이언트에서 필요한 정보 반환) */
//    public ResponseEntity<Map<String, Object>> preparePayment(Long productId, Long userId) {
//        Product product = productRepository.findById(productId)
//                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));
//
//        User buyer = userRepository.findById(userId)
//                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
//
//        validatePayment(product, userId);
//
//        //  최종 결제 금액 결정
//        Long finalAmount = product.getAmount(); // 기본값: 시작가
//
//        // 주문번호(merchant_uid) - 서버가 생성/관리
//        String merchantUid = "ORDER-" + productId + "-" + userId + "-" + System.currentTimeMillis();
//
//        Map<String, Object> paymentInfo = new HashMap<>();
//        paymentInfo.put("impCode", props.getPortone().getImpCode());
//        paymentInfo.put("merchantUid", merchantUid);
//        paymentInfo.put("name", product.getTitle());
//        paymentInfo.put("amount", finalAmount); // 최고 입찰가 사용
//        paymentInfo.put("buyerEmail", buyer.getEmail());
//        paymentInfo.put("buyerName", buyer.getUserName());
//        paymentInfo.put("buyerTel", buyer.getPhone());
//
//        log.info("결제 준비 완료: merchantUid={}, productId={}, userId={}", merchantUid, productId, userId);
//
//        return ResponseEntity.ok(paymentInfo);
//    }
//
//    // ========== 2) 결제 검증/완료 ==========
//    /** 결제 검증 및 완료 처리 (멱등) */
//    public ResponseEntity<PortOnePaymentResponse> verifyAndComplete(String impUid, Long productId, Long userId) {
//        // 멱등: 이미 결제 완료된 상품이면 그대로 성공 응답
//        Product current = productRepository.findById(productId)
//                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));
//        if (current.getPaymentStatus() == PAID) {
//            log.info("이미 결제 완료된 상품 요청 무시(멱등): productId={}, paidBy={}", productId, current.getPaymentUserId());
//            // PortOne에서 최신 내역을 한 번 조회해 결과를 그대로 반환(프런트 일관성)
//            String token = getAccessToken();
//            PortOnePaymentResponse last = getPaymentInfo(impUid, token);
//            return ResponseEntity.ok(last);
//        }
//
//        String accessToken = getAccessToken();
//        PortOnePaymentResponse paymentInfo = getPaymentInfo(impUid, accessToken);
//
//        validatePaymentInfo(paymentInfo, productId, userId);
//        updateProductAfterPayment(productId, userId, paymentInfo);
//
//        var resp = paymentInfo.getResponse();
//        log.info("결제 완료: impUid={}, merchantUid={}, amount={}",
//                impUid, resp.getMerchantUid(), resp.getPaidAmount());
//
//        return ResponseEntity.ok(paymentInfo); // 멱등: 이미 PAID여도 동일 결과 반환하도록 서비스에서 처리
//    }
//
//    // ========== 3) 토큰 ==========
//    private String getAccessToken() {
//        try {
//            Map<String, String> body = new HashMap<>();
//            body.put("imp_key", props.getPortone().getApiKey());
//            body.put("imp_secret", props.getPortone().getApiSecret());
//
//            HttpHeaders headers = new HttpHeaders();
//            headers.setContentType(MediaType.APPLICATION_JSON);
//
//            ResponseEntity<PortOneTokenResponse> response = restTemplate.postForEntity(
//                    GET_TOKEN_URL, new HttpEntity<>(body, headers), PortOneTokenResponse.class);
//
//            if (response.getBody() == null || response.getBody().getResponse() == null) {
//                throw new IllegalStateException("토큰 발급 실패: 응답이 비어있습니다.");
//            }
//            String token = response.getBody().getResponse().getAccess_token();
//            // 토큰 값 자체는 로깅하지 않음
//            log.info("PortOne Access Token 발급 성공");
//            return token;
//
//        } catch (HttpStatusCodeException e) {
//            log.error("토큰 발급 실패: {} {}", e.getStatusCode(), e.getResponseBodyAsString());
//            throw new RuntimeException("PortOne 토큰 발급 실패");
//        } catch (Exception e) {
//            log.error("토큰 발급 중 오류", e);
//            throw new RuntimeException("토큰 발급 중 오류");
//        }
//    }
//
//    // ========== 4) 결제 정보 조회 ==========
//    private PortOnePaymentResponse getPaymentInfo(String impUid, String accessToken) {
//        try {
//            HttpHeaders headers = new HttpHeaders();
//            headers.setBearerAuth(accessToken);
//            headers.setContentType(MediaType.APPLICATION_JSON);
//
//            ResponseEntity<PortOnePaymentResponse> response = restTemplate.exchange(
//                    VERIFY_PAYMENT_URL + impUid, HttpMethod.GET, new HttpEntity<>(headers), PortOnePaymentResponse.class);
//
//            if (response.getBody() == null) {
//                throw new IllegalStateException("결제 정보 조회 실패: 응답이 비어있습니다.");
//            }
//            PortOnePaymentResponse body = response.getBody();
//            if (body.getCode() != 0 || body.getResponse() == null) {
//                throw new IllegalStateException("결제 정보 조회 실패: " + body.getMessage());
//            }
//            return body;
//
//        } catch (HttpStatusCodeException e) {
//            log.error("결제 정보 조회 실패: {} {}", e.getStatusCode(), e.getResponseBodyAsString());
//            throw new RuntimeException("결제 정보 조회 실패");
//        }
//    }
//
//    // ========== 5) 결제 취소 ==========
//    public ResponseEntity<Map<String, String>> cancelPayment(String impUid, Long productId, Long userId, String reason) {
//        Product product = productRepository.findById(productId)
//                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));
//
//        Long paidBy = product.getPaymentUserId();
//        if (paidBy == null || !paidBy.equals(userId)) {
//            throw new IllegalArgumentException("결제 취소 권한이 없습니다.");
//        }
//        if (product.getAmount() == null || product.getAmount() <= 0) {
//            throw new IllegalStateException("취소 가능 금액이 없습니다.");
//        }
//
//        try {
//            String accessToken = getAccessToken();
//
//            Map<String, Object> body = new HashMap<>();
//            body.put("imp_uid", impUid);
//            body.put("reason", reason == null ? "사용자 요청" : reason);
//            body.put("checksum", product.getAmount()); // 전체 취소(또는 잔여 금액)
//
//            HttpHeaders headers = new HttpHeaders();
//            headers.setBearerAuth(accessToken);
//            headers.setContentType(MediaType.APPLICATION_JSON);
//
//            ResponseEntity<PortOnePaymentResponse> response = restTemplate.postForEntity(
//                    CANCEL_PAYMENT_URL, new HttpEntity<>(body, headers), PortOnePaymentResponse.class);
//
//            if (response.getBody() == null || response.getBody().getCode() != 0) {
//                throw new IllegalStateException("결제 취소 실패");
//            }
//
//            product.setPaymentStatus(CANCELLED);
//            product.setProductStatus(ACTIVE);
//            productRepository.save(product);
//
//            log.info("결제 취소 완료: impUid={}, productId={}, reason={}", impUid, productId, reason);
//
//            return ResponseEntity.ok(Map.of("message", "결제가 취소되었습니다."));
//        } catch (Exception e) {
//            log.error("결제 취소 실패", e);
//            throw new RuntimeException("결제 취소 중 오류");
//        }
//    }
//
//    // ========== 6) 유효성 검증 ==========
//    /** 결제 전 사전 검증 */
//    private void validatePayment(Product product, Long userId) {
//        if (product.getUser().getUserId().equals(userId)) {
//            throw new IllegalArgumentException("판매자는 자신의 상품을 구매할 수 없습니다.");
//        }
//        if (product.getProductStatus() != ACTIVE) {
//            throw new IllegalArgumentException("구매 가능한 상품이 아닙니다.");
//        }
//        if (product.getPaymentStatus() == PAID) {
//            throw new IllegalArgumentException("이미 결제가 완료된 상품입니다.");
//        }
//        if (product.isOneMinuteAuction() && product.getAuctionEndTime() != null) {
//            if (LocalDateTime.now().isBefore(product.getAuctionEndTime())) {
//                throw new IllegalArgumentException("경매가 아직 종료되지 않았습니다.");
//            }
//        }
//        if (product.getAmount() == null || product.getAmount() <= 0) {
//            throw new IllegalStateException("상품 가격이 올바르지 않습니다.");
//        }
//    }
//
//    /** PortOne 조회 결과 검증 */
//    private void validatePaymentInfo(PortOnePaymentResponse paymentInfo, Long productId, Long userId) {
//        var resp = paymentInfo.getResponse();
//
//        if (resp == null) {
//            throw new IllegalStateException("결제 정보가 비어있습니다.");
//        }
//        if (!"paid".equalsIgnoreCase(resp.getStatus())) {
//            throw new IllegalStateException("결제가 완료되지 않았습니다. 상태: " + resp.getStatus());
//        }
//
//        Product product = productRepository.findById(productId)
//                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));
//
//        Integer paidAmount = resp.getPaidAmount();
//
//        //  테스트 모드 대응: paidAmount가 null이면 검증 생략
//        if (paidAmount == null) {
//            log.warn("⚠ 테스트 모드: 결제 금액이 null입니다. 금액 검증을 스킵합니다.");
//        } else if (!product.getAmount().equals(paidAmount.longValue())) {
//            // 실제 결제일 때만 금액 검증
//            throw new IllegalStateException(
//                    String.format("결제 금액 불일치: 상품가격=%d, 결제금액=%s",
//                            product.getAmount(), String.valueOf(paidAmount)));
//        }
//
//        // merchant_uid 서버 생성 규칙과 일치 확인 (ORDER-{productId}-{userId}-{ts})
//        String merchantUid = resp.getMerchantUid();
//        if (merchantUid == null || !merchantUid.startsWith("ORDER-")) {
//            throw new IllegalStateException("유효하지 않은 주문번호입니다.");
//        }
//        ParsedUid parsed = parseMerchantUid(merchantUid);
//        if (!parsed.productId().equals(productId) || !parsed.userId().equals(userId)) {
//            throw new IllegalStateException("주문번호 검증 실패(상품/사용자 불일치).");
//        }
//    }
//
//    private void updateProductAfterPayment(Long productId, Long userId, PortOnePaymentResponse paymentInfo) {
//        Product product = productRepository.findById(productId)
//                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));
//        User buyer = userRepository.findById(userId)
//                .orElseThrow(() -> new IllegalArgumentException("구매자를 찾을 수 없습니다."));
//
//        Integer paidAmount = paymentInfo.getResponse().getPaidAmount();
//
//        product.setProductStatus(ProductStatus.SOLD);
//        product.setPaymentStatus(PaymentStatus.PAID);
//        product.setPaymentUserId(buyer.getUserId());
//        product.setAmount(paidAmount == null ? null : paidAmount.longValue());
//        productRepository.save(product);
//
//        //  1분 경매인 경우 낙찰자 bid 업데이트
//        if (product.isOneMinuteAuction()) {
//            updateWinningBid(productId, userId);
//        }
//
//        log.info("상품 결제 완료 처리: productId={}, userId={}, amount={}",
//                product.getProductId(), userId, paidAmount);
//    }
//
//    // 새로운 메서드 추가
//    private void updateWinningBid(Long productId, Long userId) {
//        try {
//            // BidRepository로 해당 사용자의 최고 입찰 조회
//            List<Bid> userBids = bidRepository.findByProduct_ProductIdAndUser_UserId(productId, userId);
//
//            if (userBids.isEmpty()) {
//                log.warn(" 낙찰자의 입찰 내역이 없습니다: productId={}, userId={}", productId, userId);
//                return;
//            }
//
//            // 최고가 입찰 찾기
//            Bid winningBid = userBids.stream()
//                    .max((b1, b2) -> Long.compare(b1.getBidPrice(), b2.getBidPrice()))
//                    .orElseThrow();
//
//            // isWinning 업데이트
//            winningBid.setWinning(true); // 또는 1 (Bid 엔티티의 타입에 따라)
//            bidRepository.save(winningBid);
//
//            log.info(" 낙찰자 업데이트 완료: bidId={}, userId={}, price={}",
//                    winningBid.getBidId(), userId, winningBid.getBidPrice());
//
//        } catch (Exception e) {
//            log.error(" 낙찰자 업데이트 실패: productId={}, userId={}", productId, userId, e);
//            // 결제는 완료되었으므로 에러를 던지지 않고 로깅만
//        }
//    }
//    // ========== 8) 콜백(Webhook/Callback) 처리 ==========
//    /** 컨트롤러의 /callback 이 호출될 때 사용. impUid 만 넘어와도 동작 */
//    // TODO
//    public ResponseEntity<String> handleCallback(Map<String, Object> payload) {
//        log.debug("PortOne Callback 수신(payload) = {}", payload); // 민감정보는 DEBUG로만
//        String impUid = (String) payload.get("imp_uid"); // TODO Nullable인가?
//        String merchantUid = (String) payload.get("merchant_uid"); // 있을 때만 TODO Nullable인가?
//
//        try {
//            if (impUid == null && merchantUid == null) {
//                log.warn("콜백 처리 불가: impUid/merchantUid 모두 없음");
////                return; // TODO 기존 코드에선 콜백 처리 불가이나 OK로 전달됨
//            }
//            String accessToken = getAccessToken();
//            // merchantUid 가 없으면 impUid 로 조회해서 확보
//            if (merchantUid == null && impUid != null) {
//                PortOnePaymentResponse info = getPaymentInfo(impUid, accessToken);
//                if (info.getResponse() != null) {
//                    merchantUid = info.getResponse().getMerchantUid();
//                }
//            }
//            if (merchantUid == null) {
//                log.warn("콜백 처리 불가: merchantUid 확보 실패");
////                return; // TODO 기존 코드에선 콜백 처리 불가이나 OK로 전달됨
//            }
//            ParsedUid parsed = parseMerchantUid(merchantUid);
//            // 멱등 처리: verifyAndComplete 내부에서 한 번 더 점검
//            verifyAndComplete(impUid, parsed.productId(), parsed.userId());
//            return ResponseEntity.ok("OK");
//        }  catch (Exception e) {
//            log.warn("Callback 처리 실패 impUid={}, reason={}", impUid, e.getMessage());
//            // 200을 돌려도 되지만, 모니터링 목적이면 202/400 등 선택 가능
//            return ResponseEntity.ok("OK"); // 재시도 루프 방지용
//        }
//    }
//
//    // ========== 9) 유틸 ==========
//    private record ParsedUid(Long productId, Long userId) {}
//
//    /** "ORDER-{productId}-{userId}-{timestamp}" 파싱 */
//    private ParsedUid parseMerchantUid(String merchantUid) {
//        try {
//            String[] parts = merchantUid.split("-");
//            Long pId = Long.parseLong(parts[1]);
//            Long uId = Long.parseLong(parts[2]);
//            return new ParsedUid(pId, uId);
//        } catch (Exception e) {
//            throw new IllegalStateException("유효하지 않은 주문번호 형식입니다.");
//        }
//    }
//}

package com.my.backend.service;

import com.my.backend.common.enums.PaymentStatus;
import com.my.backend.common.enums.ProductStatus;
import com.my.backend.config.PaymentProperties;
import com.my.backend.dto.portone.PortOnePaymentResponse;
import com.my.backend.dto.portone.PortOneTokenResponse;
import com.my.backend.entity.Bid;
import com.my.backend.entity.Payment;
import com.my.backend.entity.Product;
import com.my.backend.entity.User;
import com.my.backend.repository.BidRepository;
import com.my.backend.repository.ProductRepository;
import com.my.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;

import static com.my.backend.common.enums.PaymentStatus.*;
import static com.my.backend.common.enums.ProductStatus.*;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PortOnePaymentService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final BidRepository bidRepository;
    private final PaymentProperties props;
    private final RestTemplate restTemplate;

    private static final String PORTONE_API_BASE = "https://api.iamport.kr";
    private static final String GET_TOKEN_URL = PORTONE_API_BASE + "/users/getToken";
    private static final String VERIFY_PAYMENT_URL = PORTONE_API_BASE + "/payments/";
    private static final String CANCEL_PAYMENT_URL = PORTONE_API_BASE + "/payments/cancel";

    // =========================================================
    // 1) 결제 준비
    // =========================================================
    public ResponseEntity<Map<String, Object>> preparePayment(Long productId, Long userId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));
        User buyer = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        validatePayment(product, userId);

        // 최고입찰가 기준 금액 사용
        if (product.getAmount() == null || product.getAmount() <= 0) {
            Bid highest = bidRepository.findTopByProductProductIdOrderByBidPriceDescCreatedAtAsc(productId);
            if (highest != null) {
                product.setAmount(highest.getBidPrice());
                productRepository.save(product);
            }
        }

        Long finalAmount = (product.getAmount() != null && product.getAmount() > 0)
                ? product.getAmount()
                : product.getStartingPrice();

        String merchantUid = "ORDER-" + productId + "-" + userId + "-" + System.currentTimeMillis();

        Map<String, Object> paymentInfo = new HashMap<>();
        paymentInfo.put("impCode", props.getPortone().getImpCode());
        paymentInfo.put("merchantUid", merchantUid);
        paymentInfo.put("name", product.getTitle());
        paymentInfo.put("amount", finalAmount);
        paymentInfo.put("buyerEmail", buyer.getEmail());
        paymentInfo.put("buyerName", buyer.getUserName());
        paymentInfo.put("buyerTel", buyer.getPhone());

        log.info("결제 준비 완료: merchantUid={}, amount={}, productId={}, userId={}", merchantUid, finalAmount, productId, userId);
        return ResponseEntity.ok(paymentInfo);
    }

    // =========================================================
    // 2) 결제 검증 및 완료
    // =========================================================
    public ResponseEntity<PortOnePaymentResponse> verifyAndComplete(String impUid, Long productId, Long userId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

        // 멱등 처리
        if (product.getPaymentStatus() == PAID) {
            log.info("이미 결제 완료된 상품: productId={}, paidBy={}", productId, product.getPaymentUserId());
            String token = getAccessToken();
            PortOnePaymentResponse last = getPaymentInfo(impUid, token);
            return ResponseEntity.ok(last);
        }

        String accessToken = getAccessToken();
        PortOnePaymentResponse paymentInfo = getPaymentInfo(impUid, accessToken);

        validatePaymentInfo(paymentInfo, productId, userId);
        updateProductAfterPayment(productId, userId, paymentInfo);

        log.info("결제 완료: impUid={}, productId={}, userId={}, amount={}",
                impUid, productId, userId, paymentInfo.getResponse().getPaidAmount());
        return ResponseEntity.ok(paymentInfo);
    }

    // =========================================================
    // 3) PortOne 토큰
    // =========================================================
    private String getAccessToken() {
        try {
            Map<String, String> body = Map.of(
                    "imp_key", props.getPortone().getApiKey(),
                    "imp_secret", props.getPortone().getApiSecret()
            );
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            ResponseEntity<PortOneTokenResponse> response = restTemplate.postForEntity(
                    GET_TOKEN_URL, new HttpEntity<>(body, headers), PortOneTokenResponse.class);

            String token = Optional.ofNullable(response.getBody())
                    .map(PortOneTokenResponse::getResponse)
                    .map(PortOneTokenResponse.Response::getAccess_token)
                    .orElseThrow(() -> new IllegalStateException("토큰 발급 실패"));

            log.info("PortOne AccessToken 발급 성공");
            return token;
        } catch (Exception e) {
            log.error("토큰 발급 실패", e);
            throw new RuntimeException("PortOne 토큰 발급 실패");
        }
    }

    // =========================================================
    // 4) 결제 정보 조회
    // =========================================================
    private PortOnePaymentResponse getPaymentInfo(String impUid, String token) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token);
            ResponseEntity<PortOnePaymentResponse> response = restTemplate.exchange(
                    VERIFY_PAYMENT_URL + impUid, HttpMethod.GET, new HttpEntity<>(headers), PortOnePaymentResponse.class);

            if (response.getBody() == null || response.getBody().getCode() != 0)
                throw new IllegalStateException("PortOne 결제 정보 조회 실패");

            return response.getBody();
        } catch (Exception e) {
            log.error("결제 정보 조회 실패", e);
            throw new RuntimeException("결제 정보 조회 실패");
        }
    }

    // =========================================================
    // 5) 결제 취소
    // =========================================================
    public ResponseEntity<Map<String, String>> cancelPayment(String impUid, Long productId, Long userId, String reason) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

        if (!Objects.equals(product.getPaymentUserId(), userId)) {
            throw new IllegalArgumentException("결제 취소 권한이 없습니다.");
        }

        Long cancelAmount = product.getAmount() != null ? product.getAmount() : product.getStartingPrice();

        try {
            String accessToken = getAccessToken();
            Map<String, Object> body = Map.of(
                    "imp_uid", impUid,
                    "reason", reason == null ? "사용자 요청" : reason,
                    "checksum", cancelAmount
            );
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

            log.info("결제 취소 완료: impUid={}, productId={}, reason={}", impUid, productId, reason);
            return ResponseEntity.ok(Map.of("message", "결제가 취소되었습니다."));
        } catch (Exception e) {
            log.error("결제 취소 실패", e);
            throw new RuntimeException("결제 취소 중 오류");
        }
    }

    // =========================================================
    // 6) 결제 검증
    // =========================================================
    private void validatePayment(Product product, Long userId) {
        if (product.getUser().getUserId().equals(userId))
            throw new IllegalArgumentException("판매자는 자신의 상품을 결제할 수 없습니다.");

        if (product.getProductStatus() != ACTIVE)
            throw new IllegalArgumentException("판매 중인 상품만 결제할 수 있습니다.");

        if (product.getPaymentStatus() == PAID)
            throw new IllegalArgumentException("이미 결제 완료된 상품입니다.");

        if (product.isOneMinuteAuction() && product.getAuctionEndTime() != null &&
                LocalDateTime.now().isBefore(product.getAuctionEndTime()))
            throw new IllegalArgumentException("경매가 아직 종료되지 않았습니다.");

        if (product.getAmount() == null || product.getAmount() <= 0)
            throw new IllegalStateException("상품 금액이 올바르지 않습니다.");
    }

    private void validatePaymentInfo(PortOnePaymentResponse paymentInfo, Long productId, Long userId) {
        var resp = paymentInfo.getResponse();
        if (resp == null || !"paid".equalsIgnoreCase(resp.getStatus()))
            throw new IllegalStateException("결제가 완료되지 않았습니다.");

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

        if (resp.getPaidAmount() != null && !product.getAmount().equals(resp.getPaidAmount().longValue()))
            throw new IllegalStateException("결제 금액 불일치 (DB=" + product.getAmount() + ", 실제=" + resp.getPaidAmount() + ")");
    }

    // =========================================================
    // 7) 결제 완료 후 상품 업데이트
    // =========================================================
    private void updateProductAfterPayment(Long productId, Long userId, PortOnePaymentResponse paymentInfo) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));
        User buyer = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("구매자를 찾을 수 없습니다."));

        Integer paidAmount = paymentInfo.getResponse().getPaidAmount();

        product.setProductStatus(ProductStatus.SOLD);
        product.setPaymentStatus(PaymentStatus.PAID);
        product.setPaymentUserId(userId);
        product.setAmount(paidAmount == null ? product.getAmount() : paidAmount.longValue());
        productRepository.save(product);

        //  낙찰자 입찰 기록 업데이트
        updateWinningBid(productId, userId);

        log.info("상품 결제 완료 DB 반영: productId={}, userId={}, amount={}",
                productId, userId, product.getAmount());
    }

    private void updateWinningBid(Long productId, Long userId) {
        List<Bid> userBids = bidRepository.findByProduct_ProductIdAndUser_UserId(productId, userId);
        if (userBids.isEmpty()) {
            log.warn("낙찰자의 입찰 내역 없음: productId={}, userId={}", productId, userId);
            return;
        }

        Bid winning = userBids.stream()
                .max(Comparator.comparingLong(Bid::getBidPrice))
                .orElseThrow();
        winning.setWinning(true);
        bidRepository.save(winning);

        log.info("낙찰자 입찰 업데이트 완료: bidId={}, price={}", winning.getBidId(), winning.getBidPrice());
    }

    // =========================================================
    // 8) PortOne 콜백 (Webhook)
    // =========================================================
    public ResponseEntity<String> handleCallback(Map<String, Object> payload) {
        log.debug("PortOne Callback 수신: {}", payload);
        String impUid = (String) payload.get("imp_uid");
        String merchantUid = (String) payload.get("merchant_uid");

        try {
            if (merchantUid == null && impUid != null) {
                String token = getAccessToken();
                PortOnePaymentResponse info = getPaymentInfo(impUid, token);
                if (info.getResponse() != null) {
                    merchantUid = info.getResponse().getMerchantUid();
                }
            }

            if (merchantUid != null) {
                ParsedUid parsed = parseMerchantUid(merchantUid);
                verifyAndComplete(impUid, parsed.productId(), parsed.userId());
            }
            return ResponseEntity.ok("OK");
        } catch (Exception e) {
            log.error("PortOne 콜백 처리 실패: {}", e.getMessage());
            return ResponseEntity.ok("OK");
        }
    }

    private record ParsedUid(Long productId, Long userId) {}

    private ParsedUid parseMerchantUid(String uid) {
        try {
            String[] parts = uid.split("-");
            return new ParsedUid(Long.parseLong(parts[1]), Long.parseLong(parts[2]));
        } catch (Exception e) {
            throw new IllegalStateException("유효하지 않은 주문번호 형식");
        }
    }
}
