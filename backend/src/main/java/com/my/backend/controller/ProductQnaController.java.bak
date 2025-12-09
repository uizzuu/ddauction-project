package com.my.backend.controller;

import com.my.backend.dto.ProductQnaDto;
import com.my.backend.enums.ProductType;
import com.my.backend.service.ProductQnaService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/product-qnas")
public class ProductQnaController {

    private final ProductQnaService productQnaService;

    // 전체 문의 조회
    @GetMapping
    public ResponseEntity<List<ProductQnaDto>> getAllProductQnas() {
        List<ProductQnaDto> qnas = productQnaService.getAllProductQnas();
        return ResponseEntity.ok(qnas);
    }

    // 페이징 조회
    @GetMapping("/page")
    public ResponseEntity<Page<ProductQnaDto>> getProductQnaPage(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<ProductQnaDto> qnaPage = productQnaService.getProductQnaPage(pageable);
        return ResponseEntity.ok(qnaPage);
    }

    // 단건 조회
    @GetMapping("/{id}")
    public ResponseEntity<ProductQnaDto> getProductQna(@PathVariable Long id) {
        ProductQnaDto qna = productQnaService.getOneProductQna(id);
        return ResponseEntity.ok(qna);
    }

    // 사용자별 문의 조회
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ProductQnaDto>> getProductQnasByUser(@PathVariable Long userId) {
        List<ProductQnaDto> qnas = productQnaService.getProductQnasByUserId(userId);
        return ResponseEntity.ok(qnas);
    }

    // 상품 타입별 문의 조회
    @GetMapping("/type/{productType}")
    public ResponseEntity<List<ProductQnaDto>> getProductQnasByType(@PathVariable ProductType productType) {
        List<ProductQnaDto> qnas = productQnaService.getProductQnasByType(productType);
        return ResponseEntity.ok(qnas);
    }

    // refId로 문의 조회 (특정 상품에 대한 모든 문의)
    @GetMapping("/product/{refId}")
    public ResponseEntity<List<ProductQnaDto>> getProductQnasByRefId(@PathVariable Long refId) {
        List<ProductQnaDto> qnas = productQnaService.getProductQnasByRefId(refId);
        return ResponseEntity.ok(qnas);
    }

    // refId + ProductType으로 문의 조회
    @GetMapping("/product/{refId}/type/{productType}")
    public ResponseEntity<List<ProductQnaDto>> getProductQnasByRefIdAndType(
            @PathVariable Long refId,
            @PathVariable ProductType productType
    ) {
        List<ProductQnaDto> qnas = productQnaService.getProductQnasByRefIdAndType(refId, productType);
        return ResponseEntity.ok(qnas);
    }

    // 문의 등록
    @PostMapping
    public ResponseEntity<?> createProductQna(@RequestBody ProductQnaDto productQnaDto) {
        ProductQnaDto created = productQnaService.insertProductQna(productQnaDto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "문의 등록 성공", "data", created));
    }

    // 문의 수정
    @PutMapping("/{id}")
    public ResponseEntity<?> updateProductQna(
            @PathVariable Long id,
            @RequestBody ProductQnaDto productQnaDto
    ) {
        ProductQnaDto updated = productQnaService.updateProductQna(id, productQnaDto);
        return ResponseEntity.ok(Map.of("message", "문의 수정 성공", "data", updated));
    }

    // 문의 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProductQna(@PathVariable Long id) {
        productQnaService.deleteProductQna(id);
        return ResponseEntity.ok(Map.of("message", "문의 삭제 성공"));
    }
}