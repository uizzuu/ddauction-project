package com.my.backend.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.my.backend.dto.PaymentHistoryResponse;
import com.my.backend.enums.ImageType;
import com.my.backend.repository.*;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import com.my.backend.config.PaymentProperties;
import com.my.backend.dto.portone.PortOnePaymentResponse;
import com.my.backend.dto.portone.PortOneTokenResponse;
import com.my.backend.entity.Bid;
import com.my.backend.entity.Payment;
import com.my.backend.entity.Product;
import com.my.backend.entity.Users;
import com.my.backend.enums.PaymentMethodType;
import com.my.backend.enums.PaymentStatus;
import com.my.backend.enums.ProductStatus;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

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
    private final ImageRepository imageRepository;

    private static final String PORTONE_API_BASE = "https://api.iamport.kr";
    private static final String GET_TOKEN_URL = PORTONE_API_BASE + "/users/getToken";
    private static final String VERIFY_PAYMENT_URL = PORTONE_API_BASE + "/payments/";
    private static final String CANCEL_PAYMENT_URL = PORTONE_API_BASE + "/payments/cancel";


    //  토큰 & 결제 정보 조회
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

    //  경매 결제 준비
    public Map<String, Object> prepareBidPayment(Product product, Users user) {
        Product p = productRepository.findById(product.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

        // 경매 종료 전 결제 시도 방지
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


    //  경매 결제 취소
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


    //  경매 결제 완료 검증
    public PortOnePaymentResponse verifyAndComplete(String impUid, Product product, Users user) {
        Product p = productRepository.findById(product.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

        String accessToken = getAccessToken();
        PortOnePaymentResponse paymentInfo = getPaymentInfo(impUid, accessToken);
        var resp = paymentInfo.getResponse();

        if (resp == null) {
            throw new IllegalStateException("포트원 결제 응답이 비어 있습니다.");
        }

        // 1) 포트원 결제 상태 체크
        if (!"paid".equalsIgnoreCase(resp.getStatus())) {
            throw new IllegalStateException("결제가 완료되지 않았습니다.");
        }

        // 2) 낙찰 입찰 & 사용자 검증
        Bid winningBid = bidRepository.findTopByProductOrderByBidPriceDesc(p)
                .orElseThrow(() -> new IllegalStateException("낙찰자가 존재하지 않습니다."));

        if (!winningBid.getUser().getUserId().equals(user.getUserId())) {
            throw new SecurityException("현재 사용자는 낙찰자가 아닙니다.");
        }

        // 3) 우리 시스템 기준 기대 금액 (최종 낙찰가)
        Long expectedAmountLong = winningBid.getBidPrice();
        if (expectedAmountLong == null || expectedAmountLong <= 0) {
            throw new IllegalStateException("낙찰 금액이 존재하지 않습니다.");
        }
        int expectedAmount = expectedAmountLong.intValue();

        // 4) PortOne 금액 검증 (null 방어)
        Integer paidAmount = resp.getPaidAmount();
        if (paidAmount == null) {
            log.warn("[PortOne] paidAmount가 null 입니다. impUid={}, expectedAmount={}",
                    impUid, expectedAmount);
            // 포트원에서 금액을 안 내려줘도, 우리 금액 기준으로 진행
            paidAmount = expectedAmount;
        } else if (!paidAmount.equals(expectedAmount)) {
            throw new IllegalStateException("결제 금액 불일치");
        }

        // 5) PortOne 결제 수단 → 내부 enum으로 매핑
        PaymentMethodType methodType = PaymentMethodType.fromPortOne(resp.getPayMethod());

        // 6) Payment 엔티티 생성 및 사용자/상품 연결
        Payment payment = Payment.builder()
                .product(p)
                .user(user)
                .paymentMethodType(methodType)
                .totalPrice(expectedAmountLong)   // ⭐ 최종 낙찰가 그대로 저장
                .paymentStatus(PaymentStatus.PAID)
                .productType(p.getProductType())
                .build();

        paymentRepository.save(payment);

        // 7) 상품 상태 갱신
        p.setBid(winningBid);
        p.setPayment(payment);
        p.setProductStatus(ProductStatus.SOLD);
        p.setPaymentStatus(PaymentStatus.PAID);
        productRepository.save(p);

        log.info("[Auction] 결제 완료 처리: productId={}, userId={}, amount={}",
                p.getProductId(), user.getUserId(), expectedAmount);

        return paymentInfo;
    }

    // ============================
    //  콜백 / 웹훅
    // ============================

    public ResponseEntity<String> handleCallback(Map<String, Object> payload) {
        log.info("[PortOne] handleCallback 호출: {}", payload);
        return ResponseEntity.ok("Callback received");
    }

    // ============================
    //  일반/중고 결제 준비 (가격 계산 로직 수정)
    // ============================

    public Map<String, Object> prepareDirectPayment(Product product, Users buyer) {
        Product p = productRepository.findById(product.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

        if (p.getSeller() != null && p.getSeller().getUserId().equals(buyer.getUserId())) {
            throw new IllegalArgumentException("판매자는 자신의 상품을 구매할 수 없습니다.");
        }

        if (p.getProductStatus() != ProductStatus.ACTIVE) {
            throw new IllegalStateException("결제가 가능한 상태의 상품이 아닙니다.");
        }

        // 결제 금액 계산 (상품 타입별 분기)
        Long amount;

        if (p.getProductType() == com.my.backend.enums.ProductType.STORE) {
            // ⭐ STORE: salePrice (정상가) - 할인 + 배송비
            Long basePrice = p.getSalePrice(); // 프론트 인터페이스에 따라 salePrice를 기준 가격으로 사용
            if (basePrice == null || basePrice <= 0) {
                throw new IllegalStateException("스토어 상품의 판매가(salePrice)가 설정되지 않았습니다.");
            }

            Long discountRate = p.getDiscountRate() != null ? p.getDiscountRate() : 0L;

            // 할인 적용 금액
            Long discountedSalePrice = basePrice * (100 - discountRate) / 100;

            Long shippingFee = p.isDeliveryIncluded() ? 0L :
                    (p.getDeliveryPrice() != null ? p.getDeliveryPrice() : 0L);

            amount = discountedSalePrice + shippingFee;

            log.info("[STORE] 기준가={}, 할인={}%, 할인적용가={}, 배송비={}, 최종={}",
                    basePrice, discountRate, discountedSalePrice, shippingFee, amount);

        } else if (p.getProductType() == com.my.backend.enums.ProductType.USED) {
            // ⭐ USED: originalPrice (판매가) + 배송비
            Long usedPrice = p.getOriginalPrice(); // 프론트 인터페이스에 따라 originalPrice를 중고 판매가로 사용
            if (usedPrice == null || usedPrice <= 0) {
                // used 상품은 salePrice를 사용하지 않는다는 가정을 따름
                throw new IllegalStateException("중고상품의 가격(originalPrice)이 설정되지 않았습니다.");
            }
            Long shippingFee = p.isDeliveryIncluded() ? 0L :
                    (p.getDeliveryPrice() != null ? p.getDeliveryPrice() : 0L);
            amount = usedPrice + shippingFee;
            log.info("[USED] 판매가={}, 배송비={}, 최종={}", usedPrice, shippingFee, amount);
        } else {
            // 기타 타입 (예: AUCTION): 낙찰가 등을 사용해야 하지만, 여기서는 일반 결제 시도 방지.
            throw new IllegalStateException("해당 상품 유형(" + p.getProductType() + ")은 직접 결제를 지원하지 않습니다.");
        }

        if (amount == null || amount <= 0) {
            throw new IllegalStateException("결제 금액이 유효하지 않습니다.");
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

    // ============================
    //  일반/중고 결제 취소
    // ============================

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

    // ============================
    //  일반/중고 결제 완료 검증 (가격 계산 로직 수정)
    // ============================

    public PortOnePaymentResponse verifyAndCompleteDirect(String impUid, Product product, Users buyer) {
        Product p = productRepository.findById(product.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

        String accessToken = getAccessToken();
        PortOnePaymentResponse paymentInfo = getPaymentInfo(impUid, accessToken);
        var resp = paymentInfo.getResponse();

        if (resp == null) {
            throw new IllegalStateException("포트원 결제 응답이 비어 있습니다.");
        }

        // 1) 결제 상태 검증
        if (!"paid".equalsIgnoreCase(resp.getStatus())) {
            throw new IllegalStateException("결제가 완료되지 않았습니다.");
        }

        // 2) 판매 상태 검증 (이미 SOLD면 중복 결제 방지)
        if (p.getProductStatus() == ProductStatus.SOLD) {
            throw new IllegalStateException("이미 판매 완료된 상품입니다.");
        }

        //  3) 우리 시스템 기준 기대 금액 계산 (수정된 로직)
        Long expectedAmountLong;
        if (p.getProductType() == com.my.backend.enums.ProductType.STORE) {
            // ⭐ STORE: salePrice (정상가) - 할인 + 배송비
            Long basePrice = p.getSalePrice();
            if (basePrice == null || basePrice <= 0) {
                throw new IllegalStateException("스토어 상품의 판매가(salePrice)가 설정되지 않았습니다.");
            }
            Long discountRate = p.getDiscountRate() != null ? p.getDiscountRate() : 0L;

            // 할인 적용 금액
            Long discountedSalePrice = basePrice * (100 - discountRate) / 100;

            Long shippingFee = p.isDeliveryIncluded() ? 0L :
                    (p.getDeliveryPrice() != null ? p.getDeliveryPrice() : 0L);
            expectedAmountLong = discountedSalePrice + shippingFee;

        } else if (p.getProductType() == com.my.backend.enums.ProductType.USED) {
            // ⭐ USED: originalPrice (판매가) + 배송비
            Long usedPrice = p.getOriginalPrice();
            if (usedPrice == null || usedPrice <= 0) {
                throw new IllegalStateException("중고상품의 가격(originalPrice)이 설정되지 않았습니다.");
            }
            Long shippingFee = p.isDeliveryIncluded() ? 0L :
                    (p.getDeliveryPrice() != null ? p.getDeliveryPrice() : 0L);
            expectedAmountLong = usedPrice + shippingFee;
        } else {
            // AUCTION 등은 이 로직으로 들어오면 안 됨
            throw new IllegalStateException("지원하지 않는 상품 유형입니다.");
        }

        if (expectedAmountLong == null || expectedAmountLong <= 0) {
            throw new IllegalStateException("상품 결제 금액이 설정되어 있지 않습니다.");
        }
        int expectedAmount = expectedAmountLong.intValue();

        // 4) PortOne 금액 검증 (변경 없음)
        Integer paidAmount = resp.getPaidAmount();
        if (paidAmount == null) {
            log.warn("[PortOne] paidAmount가 null 입니다. impUid={}, expectedAmount={}",
                    impUid, expectedAmount);
            paidAmount = expectedAmount;
        } else if (!paidAmount.equals(expectedAmount)) {
            throw new IllegalStateException("결제 금액 불일치");
        }

        // 5) PortOne 결제 수단 (변경 없음)
        PaymentMethodType methodType = PaymentMethodType.fromPortOne(resp.getPayMethod());

        // 6) Payment 엔티티 생성 (변경 없음)
        Payment payment = Payment.builder()
                .product(p)
                .user(buyer)
                .paymentMethodType(methodType)
                .totalPrice(expectedAmountLong)
                .paymentStatus(PaymentStatus.PAID)
                .productType(p.getProductType())
                .build();

        paymentRepository.save(payment);

        // 7) Product <-> Payment 양방향 연결 (변경 없음)
        p.setPayment(payment);

// ⭐ 상품 타입별로 상태 처리
        if (p.getProductType() == com.my.backend.enums.ProductType.USED) {
            // 중고 거래: 1개만 있으므로 판매 완료 처리
            p.setProductStatus(ProductStatus.SOLD);
            log.info("[USED] 상품 판매완료 처리: productId={}", p.getProductId());
        } else if (p.getProductType() == com.my.backend.enums.ProductType.STORE) {
            // 스토어: 재고가 여러 개일 수 있으므로 상태 유지
            // p.setProductStatus는 변경하지 않음 (ACTIVE 유지)
            log.info("[STORE] 상품 상태 유지 (ACTIVE): productId={}", p.getProductId());
        } else if (p.getProductType() == com.my.backend.enums.ProductType.AUCTION) {
            // 경매: 낙찰자 1명만 구매 가능하므로 판매 완료 처리
            p.setProductStatus(ProductStatus.SOLD);
            log.info("[AUCTION] 경매 낙찰완료 처리: productId={}", p.getProductId());
        }

        p.setPaymentStatus(PaymentStatus.PAID);
        productRepository.save(p);

        log.info("[Direct] 결제 완료 처리: productId={}, userId={}, amount={}",
                p.getProductId(), buyer.getUserId(), expectedAmount);

        return paymentInfo;
    }

    // ============================
    //  배송 정보 입력 (판매자)
    // ============================
    public void updateShippingInfo(Long paymentId, Long sellerId, String courier, String trackingNumber) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("결제 정보를 찾을 수 없습니다."));

        // 판매자 본인 검증
        if (payment.getProduct() == null ||
                payment.getProduct().getSeller() == null ||
                !payment.getProduct().getSeller().getUserId().equals(sellerId)) {
            throw new SecurityException("판매자 본인만 배송 정보를 입력할 수 있습니다.");
        }

        try {
            payment.setCourierName(com.my.backend.enums.CourierType.valueOf(courier));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("유효하지 않은 택배사입니다.");
        }
        payment.setTrackingNumber(trackingNumber);
        paymentRepository.save(payment);
    }

    // ============================
    //  구매/판매 내역 조회
    // ============================
    @Transactional(readOnly = true)
    public List<PaymentHistoryResponse> getBuyingHistory(Long userId) {
        // N+1 문제 방지를 위해 paymentRepository.findByUser_UserId(userId) 호출 시
        // Product, User, Seller 엔티티를 Fetch Join하는 쿼리를 사용하는 것이 좋습니다.

        List<Payment> payments = paymentRepository.findByUser_UserId(userId);

        return payments.stream()
                .map(payment -> {
                    Long productId = payment.getProduct().getProductId();

                    // 1. Image 엔티티 조회 (상품 ID와 타입 이용)
                    String mainImageUrl = imageRepository
                            // ImageType.PRODUCT는 이미지 엔티티에서 정의된 Enum이어야 합니다.
                            .findTopByRefIdAndImageTypeOrderByCreatedAtAsc(productId, ImageType.PRODUCT)
                            .map(com.my.backend.entity.Image::getImagePath)
                            .orElse(null); // 이미지가 없을 경우 null

                    // 2. DTO 변환 시 조회한 이미지 URL을 함께 전달
                    //    (PaymentHistoryResponse.fromEntityWithImage 메서드가 필요합니다. 이전 답변 참고)
                    return PaymentHistoryResponse.fromEntityWithImage(payment, mainImageUrl);
                })
                .collect(Collectors.toList());
    }

    /**
     * 판매 내역을 조회합니다.
     */
    @Transactional(readOnly = true)
    public List<PaymentHistoryResponse> getSellingHistory(Long userId) {
        // N+1 문제 방지를 위해 Fetch Join 권장

        List<Payment> payments = paymentRepository.findByProduct_Seller_UserId(userId);

        return payments.stream()
                .map(payment -> {
                    Long productId = payment.getProduct().getProductId();

                    // 1. Image 엔티티 조회
                    String mainImageUrl = imageRepository
                            .findTopByRefIdAndImageTypeOrderByCreatedAtAsc(productId, ImageType.PRODUCT)
                            .map(com.my.backend.entity.Image::getImagePath)
                            .orElse(null);

                    // 2. DTO 변환 시 조회한 이미지 URL을 함께 전달
                    return PaymentHistoryResponse.fromEntityWithImage(payment, mainImageUrl);
                })
                .collect(Collectors.toList());
    }

    // ============================
    //  구매 확정 (구매자)
    // ============================
    @Transactional
    public void confirmPurchase(Long paymentId, Long buyerId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("결제 정보를 찾을 수 없습니다."));

        // 구매자 본인 검증
        if (!payment.getUser().getUserId().equals(buyerId)) {
            throw new SecurityException("구매자만 구매 확정을 할 수 있습니다.");
        }

        // 상태 검증 (PAID 상태에서만 확정 가능)
        if (payment.getPaymentStatus() != PaymentStatus.PAID) {
            throw new IllegalStateException("결제 완료 상태의 상품만 구매 확정할 수 있습니다.");
        }

        payment.setPaymentStatus(PaymentStatus.CONFIRMED);
        paymentRepository.save(payment);

        log.info("[Confirm] 구매 확정 완료: paymentId={}, userId={}", paymentId, buyerId);
    }
}
