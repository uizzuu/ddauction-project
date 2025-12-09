package com.my.backend.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.my.backend.dto.auth.CustomUserDetails;
import com.my.backend.dto.portone.PortOnePaymentResponse;
import com.my.backend.entity.Product;
import com.my.backend.entity.Users;
import com.my.backend.enums.ProductType;
import com.my.backend.repository.ProductRepository;
import com.my.backend.repository.UserRepository;
import com.my.backend.service.PortOnePaymentService;
import com.my.backend.util.AuthUtil;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/payments/portone")
@RequiredArgsConstructor
public class PortOnePaymentController {

    private final PortOnePaymentService portonePaymentService;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final AuthUtil authUtil;

    private Long resolveUserId(Authentication authentication) {
        if (authentication == null) return null;


        Long userId = authUtil.extractUser(authentication);
        log.info("[PortOne] resolveUserId(auth) - AuthUtil userId = {}", userId);
        if (userId != null) return userId;

        Object principal = authentication.getPrincipal();
        log.info("[PortOne] resolveUserId(auth) - principal class = {}",
                principal != null ? principal.getClass().getName() : "null");

        String username = null;


        if (principal instanceof CustomUserDetails cud) {
            userId = cud.getUser().getUserId();
            username = cud.getUsername();
        }
        // 혹시라도 principal 을 Users 로 넣은 경우
        else if (principal instanceof Users u) {
            userId = u.getUserId();
            username = u.getEmail();
        }
        else if (principal instanceof UserDetails ud) {
            username = ud.getUsername();
        }
        else if (principal instanceof String s) {
            username = s;
        } else {
            username = authentication.getName();
        }

        log.info("[PortOne] resolveUserId(auth) - fallback username = {}", username);

        if (userId == null && username != null && !username.isBlank()) {
            userId = userRepository.findByEmail(username)
                    .map(Users::getUserId)
                    .orElse(null);
        }

        log.info("[PortOne] resolveUserId(auth) - 최종 userId = {}", userId);
        return userId;
    }

    private Long resolveUserId(UserDetails userDetails) {
        if (userDetails == null) return null;

        Long userId = authUtil.extractUser(userDetails);
        log.info("[PortOne] resolveUserId(userDetails) - AuthUtil userId = {}", userId);
        if (userId != null) return userId;

        String username = null;

        if (userDetails instanceof CustomUserDetails cud) {
            userId = cud.getUser().getUserId();
            username = cud.getUsername();
        } else if (userDetails instanceof Users u) {
            userId = u.getUserId();
            username = u.getEmail();
        } else {
            username = userDetails.getUsername();
        }

        log.info("[PortOne] resolveUserId(userDetails) - fallback username = {}", username);

        if (userId == null && username != null && !username.isBlank()) {
            userId = userRepository.findByEmail(username)
                    .map(Users::getUserId)
                    .orElse(null);
        }

        log.info("[PortOne] resolveUserId(userDetails) - 최종 userId = {}", userId);
        return userId;
    }

    //     결제 준비
    @PostMapping("/prepare")
    public ResponseEntity<Map<String, Object>> preparePayment(
            @RequestBody PrepareReq req,
            Authentication authentication
    ) {

        if (req == null || req.getProductId() == null) {
            log.error("[PortOne] preparePayment - productId 누락, req={}", req);
            throw new IllegalArgumentException("productId가 필요합니다.");
        }

        final Long productId = req.getProductId();
        log.info("[PortOne] 결제 준비 요청 - productId={}", productId);

        Long userId = resolveUserId(authentication);
        if (userId == null) {
            throw new IllegalStateException("인증 정보에서 사용자 ID를 찾을 수 없습니다. (로그인 필요)");
        }

        final Long finalUserId = userId;

        Users user = userRepository.findById(finalUserId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다. userId=" + finalUserId));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다. productId=" + productId));

        Map<String, Object> paymentInfo;

        if (product.getProductType() == ProductType.AUCTION) {
            // 경매 결제 준비
            log.info("[PortOne] 경매 결제 준비 - productId={}, userId={}",
                    product.getProductId(), user.getUserId());
            paymentInfo = portonePaymentService.prepareBidPayment(product, user);
        } else {
            // 일반 판매 + 중고 거래 결제 준비
            log.info("[PortOne] 일반/중고 결제 준비 - productId={}, userId={}, productType={}",
                    product.getProductId(), user.getUserId(), product.getProductType());
            paymentInfo = portonePaymentService.prepareDirectPayment(product, user);
        }

        return ResponseEntity.ok(paymentInfo);
    }

    @Getter
    @Setter
    public static class PrepareReq {
        @NotNull
        private Long productId;
    }

    //     결제 완료 검증
    @PostMapping("/complete")
    public ResponseEntity<Map<String, Object>> completePayment(
            @RequestBody CompleteReq req,
            Authentication authentication
    ) {

        if (req == null || req.getProductId() == null) {
            log.error("[PortOne] completePayment - productId 누락, req={}", req);
            throw new IllegalArgumentException("productId가 필요합니다.");
        }
        if (req.getImpUid() == null) {
            log.error("[PortOne] completePayment - imp_uid 누락, req={}", req);
            throw new IllegalArgumentException("imp_uid가 필요합니다.");
        }

        final Long productId = req.getProductId();
        final String impUid = req.getImpUid();

        log.info("[PortOne] 결제 완료 검증 요청 - imp_uid={}, productId={}", impUid, productId);

        Long userId = resolveUserId(authentication);
        if (userId == null) {
            throw new IllegalStateException("인증 정보에서 사용자 ID를 찾을 수 없습니다. (로그인 필요)");
        }

        final Long finalUserId = userId;

        Users user = userRepository.findById(finalUserId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다. userId=" + finalUserId));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다. productId=" + productId));

        PortOnePaymentResponse result;

        if (product.getProductType() == ProductType.AUCTION) {

            log.info("[PortOne] 경매 결제 완료 검증 - imp_uid={}, productId={}, userId={}",
                    impUid, product.getProductId(), user.getUserId());
            result = portonePaymentService.verifyAndComplete(impUid, product, user);
        } else {

            log.info("[PortOne] 일반/중고 결제 완료 검증 - imp_uid={}, productId={}, userId={}, productType={}",
                    impUid, product.getProductId(), user.getUserId(), product.getProductType());
            result = portonePaymentService.verifyAndCompleteDirect(impUid, product, user);
        }

        Map<String, Object> resp = new HashMap<>();
        resp.put("success", true);
        resp.put("message", "결제가 완료되었습니다.");
        resp.put("paymentInfo", result);

        return ResponseEntity.ok(resp);
    }

    @Getter
    @Setter
    public static class CompleteReq {
        @JsonProperty("imp_uid")
        private String impUid;
        @NotNull
        private Long productId;
        @JsonProperty("merchant_uid")
        private String merchantUid;
    }

    //     결제 취소
    @PostMapping("/cancel")
    public ResponseEntity<Map<String, String>> cancelPayment(
            @RequestBody CancelReq req,
            @AuthenticationPrincipal UserDetails userDetails
    ) {

        if (req == null || req.getProductId() == null) {
            log.error("[PortOne] cancelPayment - productId 누락, req={}", req);
            throw new IllegalArgumentException("productId가 필요합니다.");
        }
        if (req.getImpUid() == null) {
            log.error("[PortOne] cancelPayment - imp_uid 누락, req={}", req);
            throw new IllegalArgumentException("imp_uid가 필요합니다.");
        }

        final Long productId = req.getProductId();
        final String impUid = req.getImpUid();
        final String reason = (req.getReason() != null) ? req.getReason() : "사용자 요청";

        Long userId = resolveUserId(userDetails);
        if (userId == null) {
            throw new IllegalStateException("인증 정보에서 사용자 ID를 찾을 수 없습니다. (로그인 필요)");
        }

        final Long finalUserId = userId;

        Users user = userRepository.findById(finalUserId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다. userId=" + finalUserId));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다. productId=" + productId));

        if (product.getProductType() == ProductType.AUCTION) {
            //  경매 결제 취소
            log.info("[PortOne] 경매 결제 취소 - imp_uid={}, productId={}, userId={}",
                    impUid, product.getProductId(), user.getUserId());
            portonePaymentService.cancelPayment(impUid, product, user, reason);
        } else {
            //  일반/중고 결제 취소
            log.info("[PortOne] 일반/중고 결제 취소 - imp_uid={}, productId={}, userId={}, productType={}",
                    impUid, product.getProductId(), user.getUserId(), product.getProductType());
            portonePaymentService.cancelDirectPayment(impUid, product, user, reason);
        }

        return ResponseEntity.ok(Map.of("message", "결제가 취소되었습니다."));
    }

    @Getter
    @Setter
    public static class CancelReq {
        @JsonProperty("imp_uid")
        private String impUid;      // 프론트: imp_uid
        @NotNull
        private Long productId;     // 프론트: productId
        private String reason;      // 프론트: reason (옵션)
    }

    //     콜백 / 웹훅
    @PostMapping("/callback")
    public ResponseEntity<String> callback(@RequestBody Map<String, Object> payload) {
        log.info("[PortOne] 콜백 수신: {}", payload);
        return portonePaymentService.handleCallback(payload);
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> webhook(@RequestBody Map<String, Object> payload) {
        return callback(payload);
    }

    // ============================
    //  구매/판매 내역 조회
    // ============================
    @GetMapping("/history/buy")
    public ResponseEntity<java.util.List<com.my.backend.dto.PaymentHistoryResponse>> getBuyingHistory(
            Authentication authentication
    ) {
        Long userId = resolveUserId(authentication);
        if (userId == null) {
            throw new IllegalStateException("로그인이 필요합니다.");
        }
        return ResponseEntity.ok(portonePaymentService.getBuyingHistory(userId));
    }

    @GetMapping("/history/sell")
    public ResponseEntity<java.util.List<com.my.backend.dto.PaymentHistoryResponse>> getSellingHistory(
            Authentication authentication
    ) {
        Long userId = resolveUserId(authentication);
        if (userId == null) {
            throw new IllegalStateException("로그인이 필요합니다.");
        }
        return ResponseEntity.ok(portonePaymentService.getSellingHistory(userId));
    }

    // ============================
    //  배송 정보 입력
    // ============================
    @PostMapping("/shipping")
    public ResponseEntity<String> updateShippingInfo(
            @RequestBody ShippingReq req,
            Authentication authentication
    ) {
        Long userId = resolveUserId(authentication);
        if (userId == null) {
            throw new IllegalStateException("로그인이 필요합니다.");
        }

        portonePaymentService.updateShippingInfo(req.getPaymentId(), userId, req.getCourier(), req.getTrackingNumber());
        return ResponseEntity.ok("배송 정보가 등록되었습니다.");
    }

    @Getter
    @Setter
    public static class ShippingReq {
        private Long paymentId;
        private String courier;
        private String trackingNumber;
    }

    // ============================
    //  구매 확정
    // ============================
    @PostMapping("/confirm")
    public ResponseEntity<String> confirmPurchase(
            @RequestBody ConfirmReq req,
            Authentication authentication
    ) {
        Long userId = resolveUserId(authentication);
        if (userId == null) {
            throw new IllegalStateException("로그인이 필요합니다.");
        }

        portonePaymentService.confirmPurchase(req.getPaymentId(), userId);
        return ResponseEntity.ok("구매 확정되었습니다.");
    }

    @Getter
    @Setter
    public static class ConfirmReq {
        private Long paymentId;
    }
}
