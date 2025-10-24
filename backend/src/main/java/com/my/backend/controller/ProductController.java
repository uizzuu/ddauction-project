package com.my.backend.controller;

import com.my.backend.dto.BidDto;
import com.my.backend.dto.ProductDto;
import com.my.backend.entity.User;
import com.my.backend.service.ProductService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    // 전체 상품 조회
    @GetMapping
    public List<ProductDto> getAllProducts() {
        return productService.getAllProducts();
    }

    // 특정 상품 조회
    @GetMapping("/{id}")
    public ResponseEntity<ProductDto> getProduct(@PathVariable Long id) {
        ProductDto product = productService.getProduct(id);
        if (product == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        return ResponseEntity.ok(product);
    }

    // 최고 입찰가 조회
    @GetMapping("/{id}/highest-bid")
    public ResponseEntity<Long> getHighestBid(@PathVariable Long id) {
        Long highestBid = productService.getHighestBidPrice(id);
        return ResponseEntity.ok(highestBid);
    }

    // 입찰 처리
    @PostMapping("/{id}/bid")
    public ResponseEntity<?> placeBid(@PathVariable Long id,
                                      @RequestBody @Valid BidDto dto,
                                      HttpSession session) {
    // 세션 키 수정
    Long userId = (Long) session.getAttribute("userId");
    if (userId == null) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
    }
    try {
        BidDto newBid = productService.placeBid(id, userId, dto.getBidPrice());
        return ResponseEntity.ok(newBid);
    } catch (IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("입찰 처리 중 오류");
    }
}
//                                      {
//        User loginUser = (User) session.getAttribute("loginUser");
//        if (loginUser == null) {
//            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
//        }
//        try {
//            BidDto newBid = productService.placeBid(id, loginUser.getUserId(), dto.getBidPrice());
//            return ResponseEntity.ok(newBid);
//        } catch (Exception e) {
//            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
//        }
//    }

    // 새 상품 생성
// @PostMapping
//    public ResponseEntity<ProductDto> createProduct(@Valid @RequestBody ProductDto dto) {
//        ProductDto created = productService.createProduct(dto);
//        return ResponseEntity.status(HttpStatus.CREATED).body(created);
//    }

    // 새 상품 생성 (세션 로그인 사용자로 등록)
    @PostMapping
    public ResponseEntity<?> createProduct(@Valid @RequestBody ProductDto dto,
                                           HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
        }
        try {
            ProductDto created = productService.createProduct(userId, dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {          // 예: 카테고리 없음 등
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("상품 생성 중 오류");
        }
    }

    // 상품 수정
    @PutMapping("/{id}")
    public ResponseEntity<ProductDto> updateProduct(@PathVariable Long id, @RequestBody ProductDto dto) {
        ProductDto updated = productService.updateProduct(id, dto);
        return ResponseEntity.ok(updated);
    }

    // 상품 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    // 특정 사용자 판매 상품 조회
    @GetMapping("/seller/{userId}")
    public ResponseEntity<List<ProductDto>> getProductsBySeller(@PathVariable Long userId) {
        List<ProductDto> products = productService.getProductsBySeller(userId);
        return ResponseEntity.ok(products);
    }

    @GetMapping("/search")
    public ResponseEntity<List<ProductDto>> searchProducts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long category) {

        List<ProductDto> result = productService.searchProducts(keyword, category);
        return ResponseEntity.ok(result);
    }

    /** 낙찰자(최고가 입찰자)만 간단히 확인 */
    @GetMapping("/{id}/winner")
    public ResponseEntity<?> getWinner(@PathVariable Long id) {
        return productService.getWinnerView(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }
}
