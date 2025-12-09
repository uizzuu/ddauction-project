package com.my.backend.controller;

import com.my.backend.dto.auth.CustomUserDetails;
import com.my.backend.service.BidService;
import com.my.backend.util.AuthUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.my.backend.repository.BidRepository;
import com.my.backend.repository.ProductRepository;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/bid")
@RequiredArgsConstructor
public class BidController {

    private final BidService bidService;
    private final AuthUtil authUtil;

    // 입찰하기
    @PostMapping("/{productId}/bid")
    public ResponseEntity<?> placeBid(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long productId,
            @RequestBody Map<String, Long> body) {

        if (principal == null || principal.getUser() == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "인증이 필요합니다.",
                    "details", "JWT 인증 정보가 없습니다."
            ));
        }

        Long userId = principal.getUser().getUserId();
        Long bidPrice = body.get("bidPrice");

        return bidService.placeBid(productId, userId, bidPrice);
    }

    // 상품별 입찰 내역 조회 (공개/권한 정책은 SecurityConfig에 따름)
    // 응답: BidHistoryItem DTO 리스트
    @GetMapping("/{productId}/bids")
    public ResponseEntity<?> getBidHistory(@PathVariable Long productId) {
        return bidService.getBidHistory(productId);
    }

    // 입찰 금액 그래프 데이터 조회
    @GetMapping("/{productId}/chart")
    public ResponseEntity<?> getBidChartData(@PathVariable Long productId) {
        return bidService.getBidHistoryForChart(productId);
    }

    // 낙찰자 확인 API
    @GetMapping("/{productId}/winner")
    public ResponseEntity<?> checkWinner(
            @PathVariable Long productId,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        if (principal == null || principal.getUser() == null) {
            return ResponseEntity.status(401)
                    .body(Map.of("error", "로그인이 필요합니다."));
        }

        Long userId = principal.getUser().getUserId();
        return bidService.checkWinner(productId, userId);
    }

    // 낙찰 정보 조회 (결제 페이지용)
    @GetMapping("/{productId}/winning-info")
    public ResponseEntity<?> getWinningInfo(
            @PathVariable Long productId,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        if (principal == null || principal.getUser() == null) {
            return ResponseEntity.status(403)
                    .body(Map.of("error", "로그인이 필요합니다."));
        }

        Long userId = principal.getUser().getUserId();
        return bidService.getWinningInfo(productId, userId);
    }

    // 유저별 입찰 내역 조회 (마이페이지용)
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserBids(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long userId
    ) {
        if (principal == null || principal.getUser() == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "인증이 필요합니다.",
                    "details", "JWT 인증 정보가 없습니다."
            ));
        }
        Long loginUserId = principal.getUser().getUserId();
        // 내 것만 보게 하고 싶으면 이 체크 유지
        if (!loginUserId.equals(userId)) {
            return ResponseEntity.status(403).body(Map.of(
                    "error", "본인의 입찰 내역만 조회할 수 있습니다."
            ));
        }
        return bidService.getUserBidHistory(userId);
    }
}