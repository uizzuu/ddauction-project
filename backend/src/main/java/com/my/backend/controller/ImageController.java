package com.my.backend.controller;

import com.my.backend.dto.ImageDto;
import com.my.backend.enums.ImageType;
import com.my.backend.service.ImageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/images")
@RequiredArgsConstructor
public class ImageController {

    private final ImageService imageService;

    // 여러 이미지 등록
    @PostMapping("/batch")
    public ResponseEntity<?> createImages(@Valid @RequestBody List<ImageDto> dtoList) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(imageService.saveImages(dtoList));
    }

    // 이미지 삭제
    @DeleteMapping("/{imageId}")
    public ResponseEntity<Void> deleteImage(@PathVariable Long imageId) {
        imageService.deleteImage(imageId);
        return ResponseEntity.noContent().build();
    }

    // refId 기반 조회 (상품/유저/리뷰 모두 가능)
    @GetMapping("/ref/{refId}")
    public ResponseEntity<?> getImagesByRefId(@PathVariable Long refId) {
        return ResponseEntity.ok(imageService.getImagesByRefId(refId));
    }

    // refId + imageType 조회
    @GetMapping("/ref/{refId}/{imageType}")
    public ResponseEntity<?> getImagesByRefIdAndType(
            @PathVariable Long refId,
            @PathVariable ImageType imageType
    ) {
        return ResponseEntity.ok(imageService.getImagesByRefIdAndType(refId, imageType));
    }
}
