package com.my.backend.controller;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.my.backend.dto.portone.PortOnePaymentResponse;
import com.my.backend.entity.Product;
import com.my.backend.entity.Users;
import com.my.backend.enums.ProductType;
import com.my.backend.repository.ProductRepository;
import com.my.backend.repository.UserRepository;
import com.my.backend.service.PortOnePaymentService;
import com.my.backend.util.AuthUtil;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Validated
@RestController
@RequestMapping("/api/payments/portone")
@RequiredArgsConstructor
public class PortOnePaymentController {

    private final PortOnePaymentService portonePaymentService;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final AuthUtil authUtil;

    // 결제 준비
    @PostMapping("/prepare")
    public ResponseEntity<Map<String, Object>> preparePayment(
            @Valid @RequestBody PrepareReq req,
            Authentication authentication) {

        Long userId = authUtil.extractUser(authentication);
        Users user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        Product product = productRepository.findById(req.productId())
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

        Map<String, Object> paymentInfo;

        if (product.getProductType() == ProductType.AUCTION) {
            log.info("[PortOne] 경매 결제 준비 - productId: {}, userId: {}", product.getProductId(), user.getUserId());
            paymentInfo = portonePaymentService.prepareBidPayment(product, user);
        } else {
            log.info("[PortOne] 일반 결제 준비 - productId: {}, userId: {}, productType: {}",
                    product.getProductId(), user.getUserId(), product.getProductType());
            paymentInfo = portonePaymentService.prepareDirectPayment(product, user);
        }

        return ResponseEntity.ok(paymentInfo);
    }

    public record PrepareReq(@NotNull Long productId) {}

    @PostMapping("/complete")
    public ResponseEntity<Map<String, Object>> completePayment(
            @Valid @RequestBody CompleteReq payload,
            Authentication authentication) {

        Long userId = authUtil.extractUser(authentication);
        Users user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        Product product = productRepository.findById(payload.productId())
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

        PortOnePaymentResponse result;

        if (product.getProductType() == ProductType.AUCTION) {
            log.info("[PortOne] 경매 결제 완료 검증 - imp_uid: {}, productId: {}, userId: {}",
                    payload.impUid(), product.getProductId(), user.getUserId());
            result = portonePaymentService.verifyAndComplete(payload.impUid(), product, user);
        } else {
            log.info("[PortOne] 일반 결제 완료 검증 - imp_uid: {}, productId: {}, userId: {}, productType: {}",
                    payload.impUid(), product.getProductId(), user.getUserId(), product.getProductType());
            result = portonePaymentService.verifyAndCompleteDirect(payload.impUid(), product, user);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "결제가 완료되었습니다.");
        response.put("paymentInfo", result);

        return ResponseEntity.ok(response);
    }

    public record CompleteReq(
            @NotNull @JsonProperty("imp_uid") String impUid,
            @NotNull Long productId,
            @JsonProperty("merchant_uid") String merchantUid
    ) {}

    @PostMapping("/cancel")
    public ResponseEntity<Map<String, String>> cancelPayment(
            @Valid @RequestBody CancelReq payload,
            @AuthenticationPrincipal UserDetails userDetails) {

        Long userId = authUtil.extractUser(userDetails);
        Users user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        Product product = productRepository.findById(payload.productId())
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

        if (product.getProductType() == ProductType.AUCTION) {
            log.info("[PortOne] 경매 결제 취소 - imp_uid: {}, productId: {}, userId: {}",
                    payload.impUid(), product.getProductId(), user.getUserId());
            portonePaymentService.cancelPayment(
                    payload.impUid(),
                    product,
                    user,
                    payload.reason() != null ? payload.reason() : "사용자 요청"
            );
        } else {
            log.info("[PortOne] 일반 결제 취소 - imp_uid: {}, productId: {}, userId: {}, productType: {}",
                    payload.impUid(), product.getProductId(), user.getUserId(), product.getProductType());
            portonePaymentService.cancelDirectPayment(
                    payload.impUid(),
                    product,
                    user,
                    payload.reason() != null ? payload.reason() : "사용자 요청"
            );
        }

        return ResponseEntity.ok(Map.of("message", "결제가 취소되었습니다."));
    }

    public record CancelReq(
            @NotNull @JsonProperty("imp_uid") String impUid,
            @NotNull Long productId,
            String reason
    ) {}

    @PostMapping("/callback")
    public ResponseEntity<String> callback(@RequestBody Map<String, Object> payload) {
        log.info("[PortOne] 콜백 수신: {}", payload);
        return portonePaymentService.handleCallback(payload);
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> webhook(@RequestBody Map<String, Object> payload) {
        return callback(payload);
    }
}