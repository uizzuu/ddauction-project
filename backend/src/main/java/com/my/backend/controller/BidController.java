package com.my.backend.controller;
//
//import com.my.backend.entity.Bid;
//import com.my.backend.service.BidService;
//import lombok.RequiredArgsConstructor;
//import org.springframework.web.bind.annotation.*;
//
//import java.util.List;
//
//@RestController
//@RequestMapping("/api/bids")
//@RequiredArgsConstructor
//public class BidController {
//
//    private final BidService bidService;
//
//    // 특정 상품의 모든 입찰 조회
//    @GetMapping("/product/{productId}")
//    public List<Bid> getBidsByProduct(@PathVariable Long productId) {
//        return bidService.getBidsByProductId(productId);
//    }
//
//    // 특정 입찰 조회
//    @GetMapping("/{id}")
//    public Bid getBid(@PathVariable Long id) {
//        return bidService.getBid(id);
//    }
//
//    // 새 입찰 생성 (검증 로직 포함)
//    @PostMapping
//    public Bid createBid(@RequestBody Bid bid) {
//        return bidService.createBid(bid);
//    }
//
//    // 입찰 수정
//    @PutMapping("/{id}")
//    public Bid updateBid(@PathVariable Long id, @RequestBody Bid bid) {
//        return bidService.updateBid(id, bid);
//    }
//
//    // 입찰 삭제
//    @DeleteMapping("/{id}")
//    public void deleteBid(@PathVariable Long id) {
//        bidService.deleteBid(id);
//    }
//}


import com.my.backend.dto.BidChartData;
import com.my.backend.dto.auth.BidRequest;
import com.my.backend.dto.auth.CustomUserDetails;
import com.my.backend.service.BidService;
import com.my.backend.util.AuthUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/bid")
@RequiredArgsConstructor
public class BidController {

    private final BidService bidService;
    private final AuthUtil authUtil;

    /**
     * 입찰하기 (인증 필요)
     * - 요청 DTO: BidRequest { BigDecimal bidPrice }
     * - 응답: BidResponse DTO (엔티티 직접 반환 금지)
     */

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

        return bidService.placeBid(userId, productId, bidPrice);
    }

    /**
     * 상품별 입찰 내역 조회 (공개/권한 정책은 SecurityConfig에 따름)
     * - 응답: BidHistoryItem DTO 리스트
     */
    @GetMapping("/{productId}/bids")
    public ResponseEntity<?> getBidHistory(@PathVariable Long productId) {
        return bidService.getBidHistory(productId);
    }

    /**
     * 입찰 금액 그래프 데이터 조회
     */
    @GetMapping("/{productId}/chart")
    public ResponseEntity<?> getBidChartData(@PathVariable Long productId) {
        return bidService.getBidHistoryForChart(productId);
    }

    /** 단건 응답 DTO */
    public record BidResponse(
            Long bidId,
            Long productId,
            Long userId,
            Long bidPrice,
            String createdAt
    ) {}

    /** 목록 응답 DTO */
    public record BidHistoryItem(
            Long bidId,
            Long productId,
            Long userId,
            Long bidPrice,
            String createdAt
    ) {}

    /** 입찰 그래프 응답 DTO */
    public record BidChartResponse(
            Long productId,
            String productTitle,
            List<BidChartData> bidChartData
    ) {}
}