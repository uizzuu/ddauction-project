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

    //  1) 결제 준비
    @PostMapping("/prepare")
    public ResponseEntity<Map<String, Object>> preparePayment(@Valid @RequestBody PrepareReq req) {
        Long userId = authUtil.extractUserId(); //  context에서 직접 가져옴
        return portonePaymentService.preparePayment(req.productId(), userId);
    }

    public record PrepareReq(@NotNull Long productId) {}

    //  2) 결제 완료 후 검증
    @PostMapping("/complete")
    public ResponseEntity<PortOnePaymentResponse> completePayment(@Valid @RequestBody CompleteReq payload) {
        Long userId = authUtil.extractUserId();
        return portonePaymentService.verifyAndComplete(payload.impUid(), payload.productId(), userId);
    }

    public record CompleteReq(
            @NotNull @JsonProperty("imp_uid") String impUid,
            @NotNull Long productId,
            @JsonProperty("merchant_uid") String merchantUid
    ) {}

    //  3) 결제 취소
    @PostMapping("/cancel")
    public ResponseEntity<Map<String, String>> cancelPayment(@Valid @RequestBody CancelReq payload) {
        Long userId = authUtil.extractUserId();
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

    //  4) PortOne 콜백
    @PostMapping("/callback")
    public ResponseEntity<String> callback(@RequestBody Map<String, Object> payload) {
        return portonePaymentService.handleCallback(payload);
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> webhook(@RequestBody Map<String, Object> payload) {
        return callback(payload);
    }
}
