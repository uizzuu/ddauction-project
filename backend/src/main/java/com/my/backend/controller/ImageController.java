package com.my.backend.controller;

import com.my.backend.dto.ImageDto;
import com.my.backend.service.ImageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/images")
@RequiredArgsConstructor
public class ImageController {

    private final ImageService imageService;

    // 이미지 등록 (S3 URL을 받아서 DB에 저장)
    @PostMapping
    public ResponseEntity<ImageDto> createImage(@Valid @RequestBody ImageDto dto) {
        ImageDto created = imageService.saveImage(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // 이미지 삭제
    @DeleteMapping("/{imageId}")
    public ResponseEntity<Void> deleteImage(@PathVariable Long imageId) {
        imageService.deleteImage(imageId);
        return ResponseEntity.noContent().build();
    }

    // 특정 상품의 이미지 조회
    @GetMapping("/product/{productId}")
    public ResponseEntity<?> getImagesByProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(imageService.getImagesByProductId(productId));
    }
}