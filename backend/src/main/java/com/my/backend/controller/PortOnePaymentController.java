package com.my.backend.controller;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.my.backend.dto.portone.PortOnePaymentResponse;
import com.my.backend.service.PortOnePaymentService;
import com.my.backend.util.AuthUtil;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@Validated
@RestController
@RequestMapping("/api/payments/portone")
@RequiredArgsConstructor
public class PortOnePaymentController {

    private final PortOnePaymentService portonePaymentService;
    private final AuthUtil authUtil;

    // =====================================================
    // 1) 결제 준비 (경매 낙찰자만 결제 가능)
    // =====================================================
    @PostMapping("/prepare")
    public ResponseEntity<Map<String, Object>> preparePayment(
            @Valid @RequestBody PrepareReq req,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        Long userId = authUtil.extractUserId(userDetails);
        log.info("[PortOne] 결제 준비 요청 - productId: {}, userId: {}", req.productId(), userId);

        // PortOnePaymentService 내부에서
        // - productId로 상품 조회
        // - 최고입찰자(isWinning=1) 검증
        // - bidPrice(최고가) 조회
        // - PortOne 결제 사전등록 처리
        return portonePaymentService.prepareBidPayment(req.productId(), userId);
    }

    public record PrepareReq(
            @NotNull Long productId
    ) {}

    // =====================================================
    // 2) 결제 완료 후 PortOne 검증 및 확정
    // =====================================================
    @PostMapping("/complete")
    public ResponseEntity<PortOnePaymentResponse> completePayment(
            @Valid @RequestBody CompleteReq payload,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        Long userId = authUtil.extractUserId(userDetails);
        log.info("[PortOne] 결제 완료 검증 - imp_uid: {}, productId: {}, userId: {}",
                payload.impUid(), payload.productId(), userId);

        // verifyAndComplete 내부에서:
        // - PortOne API로 실제 결제 금액 검증
        // - DB의 최고가(bidPrice)와 일치 확인
        // - Payment 엔티티 저장 및 상태 업데이트
        return portonePaymentService.verifyAndComplete(payload.impUid(), payload.productId(), userId);
    }

    public record CompleteReq(
            @NotNull @JsonProperty("imp_uid") String impUid,
            @NotNull Long productId,
            @JsonProperty("merchant_uid") String merchantUid
    ) {}

    // =====================================================
    // 3) 결제 취소
    // =====================================================
    @PostMapping("/cancel")
    public ResponseEntity<Map<String, String>> cancelPayment(
            @Valid @RequestBody CancelReq payload,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        Long userId = authUtil.extractUserId(userDetails);
        log.info("[PortOne] 결제 취소 요청 - imp_uid: {}, productId: {}, userId: {}", payload.impUid(), payload.productId(), userId);

        return portonePaymentService.cancelPayment(
                payload.impUid(),
                payload.productId(),
                userId,
                payload.reason() == null ? "사용자 요청" : payload.reason()
        );
    }

    public record CancelReq(
            @NotNull @JsonProperty("imp_uid") String impUid,
            @NotNull Long productId,
            String reason
    ) {}

    // =====================================================
    // 4) PortOne 서버 콜백(Webhook)
    // =====================================================
    @PostMapping("/callback")
    public ResponseEntity<String> callback(@RequestBody Map<String, Object> payload) {
        log.info("[PortOne] 콜백 수신: {}", payload);
        return portonePaymentService.handleCallback(payload);
    }

    // (선택) 기존 /webhook 엔드포인트도 유지
    @PostMapping("/webhook")
    public ResponseEntity<String> webhook(@RequestBody Map<String, Object> payload) {
        return callback(payload);
    }

}
