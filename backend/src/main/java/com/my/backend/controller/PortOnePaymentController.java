//package com.my.auction.controller;
//
//import com.my.auction.dto.portone.PortOnePaymentResponse;
//import com.my.auction.service.PortOnePaymentService;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.http.ResponseEntity;
//import org.springframework.security.core.annotation.AuthenticationPrincipal;
//import org.springframework.security.core.userdetails.UserDetails;
//import org.springframework.web.bind.annotation.*;
//
//import java.util.Map;
//
//@Slf4j
//@RestController
//@RequestMapping("/api/payments/portone")
//@RequiredArgsConstructor
//public class PortOnePaymentController {
//
//    private final PortOnePaymentService portonePaymentService;
//
//    /**
//     * 결제 준비 - 클라이언트에서 결제창 띄우기 전에 호출
//     * GET /api/payments/portone/prepare?productId=1
//     */
//    @GetMapping("/prepare")
//    public ResponseEntity<Map<String, Object>> preparePayment(
//            @RequestParam Long productId,
//            @AuthenticationPrincipal UserDetails userDetails) {
//
//        Long userId = Long.parseLong(userDetails.getUsername());
//        Map<String, Object> paymentInfo = portonePaymentService.preparePayment(productId, userId);
//
//        return ResponseEntity.ok(paymentInfo);
//    }
//
//    /**
//     * 결제 완료 후 검증 및 처리
//     */
//    @PostMapping("/complete")
//    public ResponseEntity<PortOnePaymentResponse> completePayment(
//            @RequestBody Map<String, Object> payload,
//            @AuthenticationPrincipal UserDetails userDetails) {
//
//        String impUid = (String) payload.get("imp_uid");
//        Long productId = Long.parseLong(payload.get("productId").toString());
//        Long userId = Long.parseLong(userDetails.getUsername());
//
//        PortOnePaymentResponse result = portonePaymentService.verifyAndComplete(impUid, productId, userId);
//
//        return ResponseEntity.ok(result);
//    }
//
//    /**
//     * 결제 취소
//     * POST /api/payments/portone/cancel
//     * {
//     *   "imp_uid": "imp_123456789",
//     *   "productId": 1,
//     *   "reason": "단순 변심"
//     * }
//     */
//    @PostMapping("/cancel")
//    public ResponseEntity<Map<String, String>> cancelPayment(
//            @RequestBody Map<String, Object> payload,
//            @AuthenticationPrincipal UserDetails userDetails) {
//
//        String impUid = (String) payload.get("imp_uid");
//        Long productId = Long.parseLong(payload.get("productId").toString());
//        String reason = (String) payload.getOrDefault("reason", "사용자 요청");
//        Long userId = Long.parseLong(userDetails.getUsername());
//
//        portonePaymentService.cancelPayment(impUid, productId, userId, reason);
//
//        return ResponseEntity.ok(Map.of("message", "결제가 취소되었습니다."));
//    }
//
//    /**
//     * 웹훅 수신 (PortOne에서 결제 완료 시 자동 호출)
//     * POST /api/payments/portone/webhook
//     */
//    @PostMapping("/webhook")
//    public ResponseEntity<String> webhook(@RequestBody Map<String, Object> payload) {
//        log.info("PortOne Webhook 수신: {}", payload);
//
//        String impUid = (String) payload.get("imp_uid");
//        String status = (String) payload.get("status");
//
//        // 웹훅 처리 로직 (선택사항)
//        // 예: 결제 상태 변경 시 추가 처리
//
//        return ResponseEntity.ok("OK");
//    }
//}
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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Slf4j
@Validated
@RestController
@RequestMapping("/api/payments/portone")
@RequiredArgsConstructor
public class PortOnePaymentController {

    private final PortOnePaymentService portonePaymentService;

    private final AuthUtil authUtil;

    // ============= 1) 결제 준비 (사전등록/주문생성) =============
    // POST /api/payments/portone/prepare
    @PostMapping("/prepare")
    public ResponseEntity<Map<String, Object>> preparePayment(@Valid @RequestBody PrepareReq req,
                                                              @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = authUtil.extractUserId(userDetails);
        return portonePaymentService.preparePayment(req.productId(), userId);
    }

    public record PrepareReq(
            @NotNull Long productId
    ) {}

    // ============= 2) 결제 완료 후 프런트에서 호출(검증) =============
    // POST /api/payments/portone/complete
    @PostMapping("/complete")
    public ResponseEntity<PortOnePaymentResponse> completePayment(@Valid @RequestBody CompleteReq payload,
                                                                  @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = authUtil.extractUserId(userDetails);
        return portonePaymentService.verifyAndComplete(payload.impUid(), payload.productId(), userId);
    }

    public record CompleteReq(
            @NotNull @JsonProperty("imp_uid") String impUid,
            @NotNull Long productId,
            @JsonProperty("merchant_uid") String merchantUid // 선택: 서비스에서 일치 여부 교차검증에 사용 가능
    ) {}

    // ============= 3) 결제 취소(관리/사용자 요청) =============
    // POST /api/payments/portone/cancel
    @PostMapping("/cancel")
    public ResponseEntity<Map<String, String>> cancelPayment(@Valid @RequestBody CancelReq payload,
                                                             @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = authUtil.extractUserId(userDetails);
        return portonePaymentService.cancelPayment(payload.impUid(), payload.productId(), userId,
                payload.reason() == null ? "사용자 요청" : payload.reason());
    }

    public record CancelReq(
            @NotNull @JsonProperty("imp_uid") String impUid,
            @NotNull Long productId,
            String reason
    ) {}

    // ============= 4) PortOne 서버 콜백(Webhook) =============
    // application.yml 의 callback-url 과 동일하게 매핑 필요:
    // payment.portone.callback-url: http://localhost:8080/api/payments/portone/callback
    // (yml에 맞춰 /callback 추가. /webhook 유지 원하면 yml도 /webhook 으로 바꾸세요)
    @PostMapping("/callback")
    public ResponseEntity<String> callback(@RequestBody Map<String, Object> payload) {
        return portonePaymentService.handleCallback(payload);
    }

    // (선택) 기존 /webhook 엔드포인트도 유지하고 싶다면 아래처럼 /callback 위임
    @PostMapping("/webhook")
    public ResponseEntity<String> webhook(@RequestBody Map<String, Object> payload) {
        return callback(payload);
    }

}
