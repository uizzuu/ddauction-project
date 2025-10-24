package com.my.backend.controller;

import com.my.backend.dto.BidDto;
import com.my.backend.dto.ProductDto;
import com.my.backend.entity.User;
import com.my.backend.entity.Product.ProductStatus;
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

    // 전체 상품 조회 (로그인 불필요)
    @GetMapping
    public ResponseEntity<List<ProductDto>> getAllProducts() {
        List<ProductDto> products = productService.getAllProducts();
        return ResponseEntity.ok(products);
    }

    // 특정 상품 조회 (로그인 불필요)
    @GetMapping("/{id}")
    public ResponseEntity<ProductDto> getProduct(@PathVariable Long id) {
        ProductDto product = productService.getProduct(id);
        return ResponseEntity.ok(product);
    }

    // 최고 입찰가 조회 (로그인 불필요)
    @GetMapping("/{id}/highest-bid")
    public ResponseEntity<Long> getHighestBid(@PathVariable Long id) {
        Long highestBid = productService.getHighestBidPrice(id);
        return ResponseEntity.ok(highestBid);
    }

    // 입찰 처리 (로그인 필수)
    @PostMapping("/{id}/bid")
    public ResponseEntity<?> placeBid(@PathVariable Long id,
                                      @RequestBody @Valid BidDto dto,
                                      HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");
        if (loginUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
        }
        try {
            BidDto newBid = productService.placeBid(id, loginUser.getUserId(), dto.getBidPrice());
            return ResponseEntity.ok(newBid);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    // 새 상품 생성 (로그인 체크 필요하면 session 확인 후 수정 가능)
    @PostMapping
    public ResponseEntity<ProductDto> createProduct(@Valid @RequestBody ProductDto dto) {
        ProductDto created = productService.createProduct(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
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

    // 특정 사용자 판매 상품 조회 (로그인 불필요)
    @GetMapping("/seller/{userId}")
    public ResponseEntity<List<ProductDto>> getProductsBySeller(@PathVariable Long userId) {
        List<ProductDto> products = productService.getProductsBySeller(userId);
        return ResponseEntity.ok(products);
    }

    // 상품 검색 (로그인 불필요)
    @GetMapping("/search")
    public ResponseEntity<List<ProductDto>> searchProducts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long category,
            @RequestParam(required = false) ProductStatus productStatus) {

        List<ProductDto> result = productService.searchProducts(keyword, category, productStatus);
        return ResponseEntity.ok(result);
    }
}