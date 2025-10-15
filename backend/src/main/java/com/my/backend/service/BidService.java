//package com.my.auction.service;
//
//import com.my.auction.entity.Bid;
//import com.my.auction.entity.Product;
//import com.my.auction.repository.BidRepository;
//import com.my.auction.repository.ProductRepository;
//import lombok.RequiredArgsConstructor;
//import org.springframework.stereotype.Service;
//
//import java.util.List;
//
//@Service
//@RequiredArgsConstructor
//public class BidService {
//
//    private final BidRepository bidRepository;       // Bid 테이블 접근
//    private final ProductRepository productRepository; // Product 테이블 접근
//
//    // 특정 상품의 모든 입찰 조회
//    public List<Bid> getBidsByProductId(Long productId) {
//        return bidRepository.findByProductId(productId);
//    }
//
//    // 특정 입찰 조회
//    public Bid getBid(Long id) {
//        return bidRepository.findById(id)
//                .orElseThrow(() -> new RuntimeException("입찰이 존재하지 않습니다."));
//    }
//
//    // 새 입찰 생성 (검증 + currentPrice 갱신)
//    public Bid createBid(Bid bid) {
//        Product product = bid.getProduct(); // 입찰 대상 상품
//
//        // 1. 경매 종료 여부 확인
//        if (!product.isAuctionActive()) {
//            throw new RuntimeException("경매가 종료된 상품입니다.");
//        }
//
//        // 2. 현재 최고 입찰가보다 낮으면 예외
//        if (bid.getBidPrice() <= product.getCurrentPrice()) {
//            throw new RuntimeException("입찰가는 현재 최고가보다 높아야 합니다.");
//        }
//
//        // 3. 입찰 저장
//        Bid savedBid = bidRepository.save(bid);
//
//        // 4. 상품 현재 가격 갱신
//        product.setCurrentPrice(bid.getBidPrice());
//        productRepository.save(product);
//
//        return savedBid;
//    }
//
//    // 입찰 수정
//    public Bid updateBid(Long id, Bid updatedBid) {
//        Bid bid = getBid(id);
//        bid.setBidPrice(updatedBid.getBidPrice());
//        bid.setUser(updatedBid.getUser());
//        bid.setProduct(updatedBid.getProduct());
//        return bidRepository.save(bid);
//    }
//
//    // 입찰 삭제
//    public void deleteBid(Long id) {
//        bidRepository.deleteById(id);
//    }
//}
