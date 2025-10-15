//package com.my.auction.controller;
//
//import com.my.auction.entity.Bid;
//import com.my.auction.service.BidService;
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
