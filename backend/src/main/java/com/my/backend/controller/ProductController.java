package com.my.backend.controller;

import com.my.backend.dto.BidDto;
import com.my.backend.dto.ProductDto;
import com.my.backend.entity.User;
import com.my.backend.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

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
    public ProductDto getProduct(@PathVariable Long id) {
        return productService.getProduct(id);
    }

    // 새 상품 생성
    @PostMapping
    public ProductDto createProduct(@Valid @RequestBody ProductDto productDto) {
        return productService.createProduct(productDto);
    }

    // 상품 수정
    @PutMapping("/{id}")
    public ProductDto updateProduct(@PathVariable Long id,
                                    @RequestBody ProductDto productDto,
                                    @RequestParam(required = false) Long userId) {
        // 필요시 수정 권한 체크 가능
        return productService.updateProduct(id, productDto);
    }

    // 상품 삭제
    @DeleteMapping("/{id}")
    public void deleteProduct(@PathVariable Long id,
                              @RequestParam(required = false) Long userId) {
        productService.deleteProduct(id);
    }

    // 특정 사용자 판매 상품 조회
    @GetMapping("/seller/{userId}")
    public List<ProductDto> getProductsBySeller(@PathVariable Long userId) {
        return productService.getProductsBySeller(userId);
    }

    // 🔥 입찰 처리 (임시: 로그인 없이도 가능)
    @PostMapping("/{id}/bid")
    public ResponseEntity<?> placeBid(@PathVariable("id") Long productId,
                                      @RequestBody @Valid BidDto dto) {
        try {
            // 임시 유저 ID (로그인 없이 처리)
            Long tempUserId = 0L;
            BidDto bidderDto = productService.placeBid(productId, tempUserId, dto.getBidPrice());
            return ResponseEntity.ok(bidderDto);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}