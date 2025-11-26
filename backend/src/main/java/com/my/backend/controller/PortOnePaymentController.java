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
    private final AuthUtil authUtil;

    @PostMapping("/prepare")
    public ResponseEntity<Map<String, Object>> preparePayment(
            @Valid @RequestBody PrepareReq req,
            Authentication authentication) {
        Long userId = null;
        //  principal이 CustomUserDetails인 경우, 거기서 직접 userId 추출
        if (authentication != null && authentication.getPrincipal() instanceof com.my.backend.dto.auth.CustomUserDetails customUser) {
            userId = customUser.getUser().getUserId();
        }
        log.info("[PortOne] 결제 준비 요청 - productId: {}, userId: {}", req.productId(), userId);
        return portonePaymentService.prepareBidPayment(req.productId(), userId);
    }

    public record PrepareReq(
            @NotNull Long productId
    ) {}

    // 결제 완료 후 PortOne 검증 및 확정
    @PostMapping("/complete")
    public ResponseEntity<Map<String, Object>> completePayment(
            @Valid @RequestBody CompleteReq payload,
            Authentication authentication
    ) {
        Long userId = null;
        if (authentication != null &&
                authentication.getPrincipal() instanceof com.my.backend.dto.auth.CustomUserDetails customUser) {
            userId = customUser.getUser().getUserId();
        }

        if (userId == null) {
            log.warn("[PortOne] 인증 실패 - userId is null");
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "인증된 사용자가 아닙니다.");
            return ResponseEntity.status(401).body(error);
        }

        log.info("[PortOne] 결제 완료 검증 - imp_uid: {}, productId: {}, userId: {}",
                payload.impUid(), payload.productId(), userId);

        try {
            //  ResponseEntity<PortOnePaymentResponse> → PortOnePaymentResponse로 변환
            PortOnePaymentResponse result = portonePaymentService
                    .verifyAndComplete(payload.impUid(), payload.productId(), userId)
                    .getBody();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "결제가 완료되었습니다.");
            response.put("paymentInfo", result);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("[PortOne] 결제 검증 실패: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    public record CompleteReq(
            @NotNull @JsonProperty("imp_uid") String impUid,
            @NotNull Long productId,
            @JsonProperty("merchant_uid") String merchantUid
    ) {}

    // 결제 취소
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

    // PortOne 서버 콜백(Webhook)
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
